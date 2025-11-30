/**
 * LinkedIn Lead CRM - Main API
 *
 * Provides a clean API for managing LinkedIn leads with state machine enforcement.
 */

import {
  Lead,
  Stage,
  Event,
  Note,
  NextAction,
  LeadFilters,
  InvalidTransitionError,
  LeadNotFoundError,
} from './types';
import { applyTransition } from './stateMachine';
import {
  saveLead,
  getLead,
  getLeadByProfileUrl,
  getAllLeads,
  getLeadsByStage,
  getLeadCountsByStage,
  deleteLead,
  clearAllLeads,
} from './storage';
import {
  hashString,
  generateId,
  getCurrentTimestamp,
  normalizeProfileUrl,
} from './utils';

// ============================================================================
// CRM API
// ============================================================================

/**
 * Applies an event to a lead, transitioning its stage according to state machine rules.
 *
 * @param leadId - ID of the lead
 * @param event - Event to apply
 * @throws LeadNotFoundError if lead doesn't exist
 * @throws InvalidTransitionError if transition is not allowed
 */
export async function applyEvent(leadId: string, event: Event): Promise<Lead> {
  const lead = await getLead(leadId);

  if (!lead) {
    throw new LeadNotFoundError(leadId);
  }

  const newStage = applyTransition(lead.stage, event, leadId);
  const now = getCurrentTimestamp();

  // Only update stageChangedAt if stage actually changed
  const stageChanged = newStage !== lead.stage;

  const updatedLead: Lead = {
    ...lead,
    stage: newStage,
    timestamps: {
      ...lead.timestamps,
      updatedAt: now,
      stageChangedAt: stageChanged ? now : lead.timestamps.stageChangedAt,
    },
  };

  await saveLead(updatedLead);
  return updatedLead;
}

/**
 * Sets or updates the next action for a lead.
 *
 * @param leadId - ID of the lead
 * @param action - Action description
 * @param dueAtISO - Due date in ISO 8601 format
 * @throws LeadNotFoundError if lead doesn't exist
 */
export async function setNextAction(
  leadId: string,
  action: string,
  dueAtISO: string
): Promise<Lead> {
  const lead = await getLead(leadId);

  if (!lead) {
    throw new LeadNotFoundError(leadId);
  }

  const now = getCurrentTimestamp();

  const nextAction: NextAction = {
    action,
    dueAt: dueAtISO,
    createdAt: now,
  };

  const updatedLead: Lead = {
    ...lead,
    nextAction,
    timestamps: {
      ...lead.timestamps,
      updatedAt: now,
    },
  };

  await saveLead(updatedLead);
  return updatedLead;
}

/**
 * Clears the next action for a lead.
 *
 * @param leadId - ID of the lead
 * @throws LeadNotFoundError if lead doesn't exist
 */
export async function clearNextAction(leadId: string): Promise<Lead> {
  const lead = await getLead(leadId);

  if (!lead) {
    throw new LeadNotFoundError(leadId);
  }

  const now = getCurrentTimestamp();

  const updatedLead: Lead = {
    ...lead,
    nextAction: null,
    timestamps: {
      ...lead.timestamps,
      updatedAt: now,
    },
  };

  await saveLead(updatedLead);
  return updatedLead;
}

/**
 * Adds a note to a lead.
 *
 * @param leadId - ID of the lead
 * @param noteContent - Note content
 * @throws LeadNotFoundError if lead doesn't exist
 */
export async function addNote(leadId: string, noteContent: string): Promise<Lead> {
  const lead = await getLead(leadId);

  if (!lead) {
    throw new LeadNotFoundError(leadId);
  }

  const now = getCurrentTimestamp();

  const note: Note = {
    id: generateId(),
    content: noteContent,
    createdAt: now,
  };

  const updatedLead: Lead = {
    ...lead,
    notes: [...lead.notes, note],
    timestamps: {
      ...lead.timestamps,
      updatedAt: now,
    },
  };

  await saveLead(updatedLead);
  return updatedLead;
}

/**
 * Deletes a note from a lead.
 *
 * @param leadId - ID of the lead
 * @param noteId - ID of the note to delete
 * @throws LeadNotFoundError if lead doesn't exist
 */
export async function deleteNote(leadId: string, noteId: string): Promise<Lead> {
  const lead = await getLead(leadId);

  if (!lead) {
    throw new LeadNotFoundError(leadId);
  }

  const now = getCurrentTimestamp();

  const updatedLead: Lead = {
    ...lead,
    notes: lead.notes.filter((note) => note.id !== noteId),
    timestamps: {
      ...lead.timestamps,
      updatedAt: now,
    },
  };

  await saveLead(updatedLead);
  return updatedLead;
}

/**
 * Adds tags to a lead.
 *
 * @param leadId - ID of the lead
 * @param tags - Tags to add
 * @throws LeadNotFoundError if lead doesn't exist
 */
export async function addTags(leadId: string, tags: string[]): Promise<Lead> {
  const lead = await getLead(leadId);

  if (!lead) {
    throw new LeadNotFoundError(leadId);
  }

  const now = getCurrentTimestamp();

  // Add only unique tags
  const newTags = tags.filter((tag) => !lead.tags.includes(tag));

  const updatedLead: Lead = {
    ...lead,
    tags: [...lead.tags, ...newTags],
    timestamps: {
      ...lead.timestamps,
      updatedAt: now,
    },
  };

  await saveLead(updatedLead);
  return updatedLead;
}

/**
 * Removes tags from a lead.
 *
 * @param leadId - ID of the lead
 * @param tags - Tags to remove
 * @throws LeadNotFoundError if lead doesn't exist
 */
export async function removeTags(leadId: string, tags: string[]): Promise<Lead> {
  const lead = await getLead(leadId);

  if (!lead) {
    throw new LeadNotFoundError(leadId);
  }

  const now = getCurrentTimestamp();

  const updatedLead: Lead = {
    ...lead,
    tags: lead.tags.filter((tag) => !tags.includes(tag)),
    timestamps: {
      ...lead.timestamps,
      updatedAt: now,
    },
  };

  await saveLead(updatedLead);
  return updatedLead;
}

/**
 * Lists leads with optional filters.
 *
 * @param filters - Optional filters to apply
 * @returns Array of leads
 */
export async function listLeads(filters?: LeadFilters): Promise<Lead[]> {
  return getAllLeads(filters);
}

/**
 * Creates a new lead or merges with existing lead if profile URL already exists.
 *
 * @param profileUrl - LinkedIn profile URL
 * @param partial - Partial lead data to merge
 * @returns Created or updated lead
 */
export async function mergeByProfileUrl(
  profileUrl: string,
  partial: Partial<Omit<Lead, 'id' | 'profileUrl' | 'timestamps'>>
): Promise<Lead> {
  const normalizedUrl = normalizeProfileUrl(profileUrl);
  const existingLead = await getLeadByProfileUrl(normalizedUrl);

  if (existingLead) {
    // Merge with existing lead
    const now = getCurrentTimestamp();

    const updatedLead: Lead = {
      ...existingLead,
      ...partial,
      id: existingLead.id, // Keep existing ID
      profileUrl: normalizedUrl, // Keep normalized URL
      tags: partial.tags ? [...existingLead.tags, ...partial.tags] : existingLead.tags,
      notes: partial.notes ? [...existingLead.notes, ...partial.notes] : existingLead.notes,
      timestamps: {
        ...existingLead.timestamps,
        updatedAt: now,
      },
    };

    await saveLead(updatedLead);
    return updatedLead;
  } else {
    // Create new lead
    const id = await hashString(normalizedUrl);
    const now = getCurrentTimestamp();

    const newLead: Lead = {
      id,
      name: partial.name || 'Unknown',
      profileUrl: normalizedUrl,
      meta: partial.meta,
      stage: partial.stage || Stage.NEW,
      tags: partial.tags || [],
      notes: partial.notes || [],
      nextAction: partial.nextAction || null,
      timestamps: {
        createdAt: now,
        updatedAt: now,
        stageChangedAt: now,
      },
    };

    await saveLead(newLead);
    return newLead;
  }
}

/**
 * Creates a new lead with minimal data.
 *
 * @param name - Lead name
 * @param profileUrl - LinkedIn profile URL
 * @param meta - Optional metadata
 * @returns Created lead
 */
export async function createLead(
  name: string,
  profileUrl: string,
  meta?: Record<string, unknown>
): Promise<Lead> {
  return mergeByProfileUrl(profileUrl, { name, meta });
}

/**
 * Gets a lead by ID.
 *
 * @param leadId - Lead ID
 * @returns Lead or null if not found
 */
export async function getLeadById(leadId: string): Promise<Lead | null> {
  return getLead(leadId);
}

/**
 * Gets a lead by profile URL.
 *
 * @param profileUrl - Profile URL
 * @returns Lead or null if not found
 */
export async function getLeadByUrl(profileUrl: string): Promise<Lead | null> {
  const normalizedUrl = normalizeProfileUrl(profileUrl);
  return getLeadByProfileUrl(normalizedUrl);
}

/**
 * Deletes a lead by ID.
 *
 * @param leadId - Lead ID
 */
export async function removeLeadById(leadId: string): Promise<void> {
  return deleteLead(leadId);
}

/**
 * Gets leads by stage.
 *
 * @param stage - Stage to filter by
 * @returns Array of leads
 */
export async function getLeadsByStageValue(stage: Stage): Promise<Lead[]> {
  return getLeadsByStage(stage);
}

/**
 * Gets lead counts by stage.
 *
 * @returns Record of stage counts
 */
export async function getStats(): Promise<Record<Stage, number>> {
  return getLeadCountsByStage();
}

/**
 * Clears all leads (use with caution).
 */
export async function clearAll(): Promise<void> {
  return clearAllLeads();
}

// ============================================================================
// Export all for convenience
// ============================================================================

export * from './types';
export * from './stateMachine';
