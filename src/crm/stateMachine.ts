/**
 * LinkedIn Lead CRM - State Machine
 *
 * Enforces legal state transitions based on events.
 * Rejects illegal transitions with InvalidTransitionError.
 */

import { Stage, Event, InvalidTransitionError } from './types';

// ============================================================================
// Transition Map
// ============================================================================

type TransitionMap = {
  [key in Stage]: {
    [key in Event]?: Stage;
  };
};

/**
 * Valid state transitions.
 * If an event is not listed for a stage, it's an illegal transition.
 */
const TRANSITIONS: TransitionMap = {
  [Stage.NEW]: {
    [Event.SCRAPED]: Stage.NEW, // Idempotent - re-scraping keeps NEW
    [Event.CONNECTION_REQUEST_SENT]: Stage.REQUEST_SENT,
    [Event.SET_NURTURE]: Stage.NURTURE,
    [Event.MARK_LOST]: Stage.LOST,
  },

  [Stage.REQUEST_SENT]: {
    [Event.CONNECTION_REQUEST_SENT]: Stage.REQUEST_SENT, // Idempotent
    [Event.CONNECTION_ACCEPTED]: Stage.CONNECTED,
    [Event.SET_NURTURE]: Stage.NURTURE,
    [Event.MARK_LOST]: Stage.LOST,
  },

  [Stage.CONNECTED]: {
    [Event.DM_SENT]: Stage.ACTIVE_CONVO,
    [Event.MEETING_SCHEDULED]: Stage.MEETING_BOOKED,
    [Event.SET_NURTURE]: Stage.NURTURE,
    [Event.MARK_LOST]: Stage.LOST,
  },

  [Stage.ACTIVE_CONVO]: {
    [Event.DM_SENT]: Stage.ACTIVE_CONVO, // Idempotent - can send multiple DMs
    [Event.DM_REPLY_RECEIVED]: Stage.ACTIVE_CONVO, // Idempotent - stays in conversation
    [Event.MEETING_SCHEDULED]: Stage.MEETING_BOOKED,
    [Event.SET_NURTURE]: Stage.NURTURE,
    [Event.MARK_LOST]: Stage.LOST,
  },

  [Stage.MEETING_BOOKED]: {
    [Event.MEETING_SCHEDULED]: Stage.MEETING_BOOKED, // Idempotent - can reschedule
    [Event.DM_SENT]: Stage.MEETING_BOOKED, // Can still message
    [Event.DM_REPLY_RECEIVED]: Stage.MEETING_BOOKED, // Can still receive replies
    [Event.SET_NURTURE]: Stage.NURTURE,
    [Event.MARK_LOST]: Stage.LOST,
  },

  [Stage.NURTURE]: {
    [Event.SET_NURTURE]: Stage.NURTURE, // Idempotent
    [Event.DM_SENT]: Stage.ACTIVE_CONVO, // Can revive from nurture
    [Event.MEETING_SCHEDULED]: Stage.MEETING_BOOKED, // Can book meeting from nurture
    [Event.MARK_LOST]: Stage.LOST,
  },

  [Stage.LOST]: {
    [Event.MARK_LOST]: Stage.LOST, // Idempotent
    // Note: Can't transition out of LOST - it's a terminal state for now
    // If you want to revive lost leads, add transitions here
  },
};

// ============================================================================
// State Machine Logic
// ============================================================================

/**
 * Validates if a transition is legal and returns the new stage.
 *
 * @param currentStage - Current stage of the lead
 * @param event - Event being applied
 * @param leadId - Lead ID (for error reporting)
 * @returns New stage after transition
 * @throws InvalidTransitionError if transition is not allowed
 */
export function applyTransition(
  currentStage: Stage,
  event: Event,
  leadId: string
): Stage {
  const allowedTransitions = TRANSITIONS[currentStage];
  const newStage = allowedTransitions[event];

  if (newStage === undefined) {
    throw new InvalidTransitionError(leadId, currentStage, event);
  }

  return newStage;
}

/**
 * Checks if a transition is valid without throwing an error.
 *
 * @param currentStage - Current stage of the lead
 * @param event - Event to check
 * @returns true if transition is valid, false otherwise
 */
export function isValidTransition(currentStage: Stage, event: Event): boolean {
  const allowedTransitions = TRANSITIONS[currentStage];
  return allowedTransitions[event] !== undefined;
}

/**
 * Gets all valid events for a given stage.
 *
 * @param stage - Stage to get valid events for
 * @returns Array of valid events
 */
export function getValidEvents(stage: Stage): Event[] {
  return Object.keys(TRANSITIONS[stage]) as Event[];
}

/**
 * Gets the next stage for a given stage and event without validation.
 * Returns undefined if transition is invalid.
 *
 * @param currentStage - Current stage
 * @param event - Event to apply
 * @returns Next stage or undefined if invalid
 */
export function getNextStage(currentStage: Stage, event: Event): Stage | undefined {
  return TRANSITIONS[currentStage][event];
}
