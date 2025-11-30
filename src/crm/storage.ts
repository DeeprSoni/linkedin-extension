/**
 * LinkedIn Lead CRM - IndexedDB Storage Layer
 *
 * Handles persistent storage of leads using IndexedDB.
 */

import { Lead, LeadFilters, Stage } from './types';

const DB_NAME = 'LinkedInCRM';
const DB_VERSION = 1;
const STORE_NAME = 'leads';

// ============================================================================
// Database Initialization
// ============================================================================

let dbInstance: IDBDatabase | null = null;

/**
 * Opens and initializes the IndexedDB database.
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store with 'id' as key
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

        // Create indexes for efficient querying
        objectStore.createIndex('profileUrl', 'profileUrl', { unique: true });
        objectStore.createIndex('stage', 'stage', { unique: false });
        objectStore.createIndex('updatedAt', 'timestamps.updatedAt', { unique: false });
        objectStore.createIndex('nextActionDueAt', 'nextAction.dueAt', { unique: false });
      }
    };
  });
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Saves a lead to the database (insert or update).
 */
export async function saveLead(lead: Lead): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(lead);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to save lead: ${request.error}`));
  });
}

/**
 * Gets a lead by ID.
 */
export async function getLead(id: string): Promise<Lead | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(new Error(`Failed to get lead: ${request.error}`));
  });
}

/**
 * Gets a lead by profile URL.
 */
export async function getLeadByProfileUrl(profileUrl: string): Promise<Lead | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('profileUrl');
    const request = index.get(profileUrl);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(new Error(`Failed to get lead by URL: ${request.error}`));
  });
}

/**
 * Deletes a lead by ID.
 */
export async function deleteLead(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete lead: ${request.error}`));
  });
}

/**
 * Gets all leads, optionally filtered.
 */
export async function getAllLeads(filters?: LeadFilters): Promise<Lead[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      let leads = request.result as Lead[];

      // Apply filters
      if (filters) {
        leads = applyFilters(leads, filters);
      }

      // Sort by updatedAt descending
      leads.sort((a, b) =>
        new Date(b.timestamps.updatedAt).getTime() - new Date(a.timestamps.updatedAt).getTime()
      );

      resolve(leads);
    };
    request.onerror = () => reject(new Error(`Failed to get all leads: ${request.error}`));
  });
}

/**
 * Gets all leads in a specific stage.
 */
export async function getLeadsByStage(stage: Stage): Promise<Lead[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('stage');
    const request = index.getAll(stage);

    request.onsuccess = () => {
      const leads = request.result as Lead[];
      leads.sort((a, b) =>
        new Date(b.timestamps.updatedAt).getTime() - new Date(a.timestamps.updatedAt).getTime()
      );
      resolve(leads);
    };
    request.onerror = () => reject(new Error(`Failed to get leads by stage: ${request.error}`));
  });
}

/**
 * Clears all leads from the database.
 */
export async function clearAllLeads(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to clear leads: ${request.error}`));
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Applies filters to a list of leads.
 */
function applyFilters(leads: Lead[], filters: LeadFilters): Lead[] {
  return leads.filter((lead) => {
    // Filter by stage
    if (filters.stage !== undefined && lead.stage !== filters.stage) {
      return false;
    }

    // Filter by tags (lead must have ALL specified tags)
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) => lead.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    // Filter by next action existence
    if (filters.hasNextAction !== undefined) {
      const hasNextAction = lead.nextAction !== null;
      if (filters.hasNextAction !== hasNextAction) {
        return false;
      }
    }

    // Filter by next action due date
    if (filters.nextActionDueBefore && lead.nextAction) {
      const dueAt = new Date(lead.nextAction.dueAt).getTime();
      const dueBefore = new Date(filters.nextActionDueBefore).getTime();
      if (dueAt >= dueBefore) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Gets the count of leads by stage.
 */
export async function getLeadCountsByStage(): Promise<Record<Stage, number>> {
  const leads = await getAllLeads();

  const counts: Record<Stage, number> = {
    [Stage.NEW]: 0,
    [Stage.REQUEST_SENT]: 0,
    [Stage.CONNECTED]: 0,
    [Stage.ACTIVE_CONVO]: 0,
    [Stage.MEETING_BOOKED]: 0,
    [Stage.NURTURE]: 0,
    [Stage.LOST]: 0,
  };

  for (const lead of leads) {
    counts[lead.stage]++;
  }

  return counts;
}
