/**
 * LinkedIn Lead CRM - Core Types
 */

// ============================================================================
// Stages
// ============================================================================

export enum Stage {
  NEW = 'NEW',
  REQUEST_SENT = 'REQUEST_SENT',
  CONNECTED = 'CONNECTED',
  ACTIVE_CONVO = 'ACTIVE_CONVO',
  MEETING_BOOKED = 'MEETING_BOOKED',
  NURTURE = 'NURTURE',
  LOST = 'LOST',
}

// ============================================================================
// Events
// ============================================================================

export enum Event {
  SCRAPED = 'SCRAPED',
  CONNECTION_REQUEST_SENT = 'CONNECTION_REQUEST_SENT',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  DM_SENT = 'DM_SENT',
  DM_REPLY_RECEIVED = 'DM_REPLY_RECEIVED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  SET_NURTURE = 'SET_NURTURE',
  MARK_LOST = 'MARK_LOST',
}

// ============================================================================
// Lead Data Structure
// ============================================================================

export interface Lead {
  id: string; // hash of profileUrl
  name: string;
  profileUrl: string;
  meta?: Record<string, unknown>;
  stage: Stage;
  tags: string[];
  notes: Note[];
  nextAction: NextAction | null;
  timestamps: Timestamps;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string; // ISO 8601
}

export interface NextAction {
  action: string;
  dueAt: string; // ISO 8601
  createdAt: string; // ISO 8601
}

export interface Timestamps {
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  stageChangedAt: string; // ISO 8601
}

// ============================================================================
// Filters
// ============================================================================

export interface LeadFilters {
  stage?: Stage;
  tags?: string[];
  hasNextAction?: boolean;
  nextActionDueBefore?: string; // ISO 8601
}

// ============================================================================
// Errors
// ============================================================================

export class InvalidTransitionError extends Error {
  constructor(
    public readonly leadId: string,
    public readonly currentStage: Stage,
    public readonly event: Event
  ) {
    super(`ERR_INVALID_TRANSITION: Cannot apply ${event} to lead ${leadId} in stage ${currentStage}`);
    this.name = 'InvalidTransitionError';
  }
}

export class LeadNotFoundError extends Error {
  constructor(public readonly leadId: string) {
    super(`Lead not found: ${leadId}`);
    this.name = 'LeadNotFoundError';
  }
}
