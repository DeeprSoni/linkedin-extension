/**
 * CRM Sync - Bridges existing LinkedInProspect system with CRM
 *
 * Converts prospect statuses to CRM stages:
 * - new → NEW
 * - reviewed → REQUEST_SENT (assuming you sent request after review)
 * - connected → CONNECTED
 * - skipped → LOST
 */

import * as CRM from './index';
import { LinkedInProspect } from '../types';
import { StorageManager } from '../utils/storage';

/**
 * Converts a LinkedInProspect to a CRM Lead
 */
export async function prospectToLead(prospect: LinkedInProspect): Promise<CRM.Lead> {
  // Map prospect status to CRM stage
  let stage: CRM.Stage;
  switch (prospect.status) {
    case 'new':
      stage = CRM.Stage.NEW;
      break;
    case 'reviewed':
      stage = CRM.Stage.REQUEST_SENT; // Assuming reviewed means request sent
      break;
    case 'connected':
      stage = CRM.Stage.CONNECTED;
      break;
    case 'skipped':
      stage = CRM.Stage.LOST;
      break;
    default:
      stage = CRM.Stage.NEW;
  }

  // Create or merge lead
  const lead = await CRM.mergeByProfileUrl(prospect.profileUrl, {
    name: prospect.name,
    stage,
    tags: prospect.tags || [],
    notes: prospect.notes ? [
      {
        id: CRM.generateId(),
        content: prospect.notes,
        createdAt: new Date(prospect.scannedAt).toISOString(),
      }
    ] : [],
    meta: {
      headline: prospect.headline,
      currentCompany: prospect.currentCompany,
      location: prospect.location,
      mutualConnections: prospect.mutualConnections,
      scannedAt: prospect.scannedAt,
      priorityScore: prospect.priorityScore,
    },
  });

  return lead;
}

/**
 * Syncs all prospects to CRM
 */
export async function syncAllProspectsToCRM(): Promise<{
  synced: number;
  errors: string[];
}> {
  const prospects = await StorageManager.getProspects();
  const errors: string[] = [];
  let synced = 0;

  for (const prospect of prospects) {
    try {
      await prospectToLead(prospect);
      synced++;
    } catch (error) {
      errors.push(`Failed to sync ${prospect.name}: ${error}`);
    }
  }

  return { synced, errors };
}

/**
 * Syncs a single prospect to CRM and applies the appropriate event
 */
export async function syncProspectWithEvent(
  prospect: LinkedInProspect,
  previousStatus?: LinkedInProspect['status']
): Promise<CRM.Lead> {
  // First, ensure the lead exists in CRM
  let lead = await prospectToLead(prospect);

  // If status changed, apply appropriate event
  if (previousStatus && previousStatus !== prospect.status) {
    try {
      const event = getEventForStatusChange(previousStatus, prospect.status);
      if (event) {
        lead = await CRM.applyEvent(lead.id, event);
      }
    } catch (error) {
      if (error instanceof CRM.InvalidTransitionError) {
        // If transition is invalid, just update the meta data
        console.warn(`Invalid transition from ${previousStatus} to ${prospect.status}`, error);
      } else {
        throw error;
      }
    }
  }

  return lead;
}

/**
 * Determines which event to apply based on status change
 */
function getEventForStatusChange(
  oldStatus: LinkedInProspect['status'],
  newStatus: LinkedInProspect['status']
): CRM.Event | null {
  // new → reviewed = CONNECTION_REQUEST_SENT
  if (oldStatus === 'new' && newStatus === 'reviewed') {
    return CRM.Event.CONNECTION_REQUEST_SENT;
  }

  // reviewed → connected = CONNECTION_ACCEPTED
  if (oldStatus === 'reviewed' && newStatus === 'connected') {
    return CRM.Event.CONNECTION_ACCEPTED;
  }

  // new → connected = direct connection (skip REQUEST_SENT)
  // This shouldn't normally happen but we'll handle it
  if (oldStatus === 'new' && newStatus === 'connected') {
    return CRM.Event.CONNECTION_ACCEPTED;
  }

  // any → skipped = MARK_LOST
  if (newStatus === 'skipped') {
    return CRM.Event.MARK_LOST;
  }

  return null;
}

/**
 * Gets CRM lead from a prospect profile URL
 */
export async function getLeadByProspectUrl(profileUrl: string): Promise<CRM.Lead | null> {
  return CRM.getLeadByUrl(profileUrl);
}

/**
 * Updates prospect status when CRM stage changes
 */
export async function updateProspectFromLead(lead: CRM.Lead): Promise<void> {
  // Map CRM stage back to prospect status
  let status: LinkedInProspect['status'];
  switch (lead.stage) {
    case CRM.Stage.NEW:
      status = 'new';
      break;
    case CRM.Stage.REQUEST_SENT:
      status = 'reviewed';
      break;
    case CRM.Stage.CONNECTED:
    case CRM.Stage.ACTIVE_CONVO:
    case CRM.Stage.MEETING_BOOKED:
      status = 'connected';
      break;
    case CRM.Stage.NURTURE:
      status = 'reviewed'; // Keep in reviewed for nurture
      break;
    case CRM.Stage.LOST:
      status = 'skipped';
      break;
    default:
      status = 'new';
  }

  // Find prospect by profile URL
  const prospects = await StorageManager.getProspects();
  const prospect = prospects.find(p => p.profileUrl === lead.profileUrl);

  if (prospect) {
    await StorageManager.updateProspect(prospect.id, { status });
  }
}

// Export utilities
export { generateId } from './utils';
