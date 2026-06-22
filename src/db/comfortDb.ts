import Dexie, { type Table } from 'dexie';
import { AppData } from '../types';

export interface AppStateRecord {
  id: string; // "current_state"
  data: AppData;
  updatedAt: string;
}

export class ComfortDatabase extends Dexie {
  appState!: Table<AppStateRecord, string>;

  constructor() {
    super('ComfortFinanceSuiteDB');
    this.version(1).stores({
      appState: 'id, updatedAt'
    });
  }
}

export const db = new ComfortDatabase();

/**
 * Saves the entire application state into IndexedDB via Dexie
 */
export async function saveToIndexedDB(data: AppData): Promise<void> {
  try {
    await db.appState.put({
      id: 'current_state',
      data: JSON.parse(JSON.stringify(data)), // Ensure deep-cloned JSON
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Comfort Dexie] Failed to write app state to IndexedDB:', error);
  }
}

/**
 * Loads the latest application state from IndexedDB via Dexie
 */
export async function loadFromIndexedDB(): Promise<AppData | null> {
  try {
    const record = await db.appState.get('current_state');
    if (record && record.data) {
      console.log('[Comfort Dexie] Successfully loaded backup state from IndexedDB:', record.updatedAt);
      return record.data;
    }
  } catch (error) {
    console.error('[Comfort Dexie] Failed to read app state from IndexedDB:', error);
  }
  return null;
}
