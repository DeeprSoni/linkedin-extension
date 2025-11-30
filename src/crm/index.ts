/**
 * LinkedIn Lead CRM - Main Export
 *
 * A strongly typed state-machine CRM for tracking LinkedIn leads.
 *
 * Usage:
 *   import * as CRM from './crm';
 *
 *   // Create a lead
 *   const lead = await CRM.createLead('John Doe', 'https://linkedin.com/in/johndoe');
 *
 *   // Apply events
 *   await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);
 *   await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
 *
 *   // Manage lead
 *   await CRM.setNextAction(lead.id, 'Follow up', '2025-11-01T10:00:00Z');
 *   await CRM.addNote(lead.id, 'Met at conference');
 *
 *   // Query leads
 *   const activeLeads = await CRM.listLeads({ stage: CRM.Stage.ACTIVE_CONVO });
 */

// Export all types
export * from './types';

// Export state machine utilities
export { applyTransition, isValidTransition, getValidEvents, getNextStage } from './stateMachine';

// Export main CRM API
export {
  // Lead Management
  createLead,
  getLeadById,
  getLeadByUrl,
  removeLeadById,
  mergeByProfileUrl,

  // Event System
  applyEvent,

  // Next Action
  setNextAction,
  clearNextAction,

  // Notes
  addNote,
  deleteNote,

  // Tags
  addTags,
  removeTags,

  // Queries
  listLeads,
  getLeadsByStageValue,
  getStats,

  // Utilities
  clearAll,
} from './crm';

// Export storage utilities (for advanced usage)
export { initDB } from './storage';

// Export utils
export { generateId, hashString, getCurrentTimestamp, normalizeProfileUrl } from './utils';
