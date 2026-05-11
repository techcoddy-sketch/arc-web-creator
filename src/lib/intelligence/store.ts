/**
 * Intelligence Layer — local event store (IndexedDB).
 * Hybrid storage: raw behavior events stay on-device; aggregates sync to Supabase.
 */

export type BehaviorEventType =
  | "snooze"
  | "complete"
  | "ignore"
  | "open"
  | "dismiss";

export interface BehaviorEvent {
  id?: number;
  type: BehaviorEventType;
  entity_type?: "task" | "document_reminder" | "routine_step";
  entity_id?: string;
  /** Snooze duration in minutes, when type === "snooze". */
  snooze_minutes?: number;
  /** Local hour 0-23 at the time of the event. */
  hour: number;
  /** ISO timestamp. */
  ts: string;
}

const DB_NAME = "remonk_intelligence";
const STORE = "events";
const VERSION = 1;
const MAX_EVENTS = 2000; // cap to keep storage tiny

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("no-idb"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        os.createIndex("by_ts", "ts");
        os.createIndex("by_type", "type");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function isIntelligenceEnabled(): Promise<boolean> {
  try {
    return localStorage.getItem("intelligence_enabled") !== "false";
  } catch {
    return true;
  }
}

export function setIntelligenceEnabled(v: boolean) {
  try {
    localStorage.setItem("intelligence_enabled", v ? "true" : "false");
  } catch {}
}

export async function logEvent(evt: Omit<BehaviorEvent, "ts" | "hour"> & { ts?: string; hour?: number }) {
  if (!(await isIntelligenceEnabled())) return;
  try {
    const db = await openDb();
    const now = new Date();
    const full: BehaviorEvent = {
      ...evt,
      ts: evt.ts ?? now.toISOString(),
      hour: evt.hour ?? now.getHours(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).add(full);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    // Trim periodically (cheap heuristic).
    if (Math.random() < 0.05) await trim();
  } catch (e) {
    // Never block the app on intelligence failures.
    console.warn("[intelligence] logEvent failed", e);
  }
}

export async function getAllEvents(): Promise<BehaviorEvent[]> {
  try {
    const db = await openDb();
    return await new Promise<BehaviorEvent[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as BehaviorEvent[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function clearAllEvents() {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

async function trim() {
  try {
    const db = await openDb();
    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (count <= MAX_EVENTS) return;
    const toDelete = count - MAX_EVENTS;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      const idx = tx.objectStore(STORE).index("by_ts");
      const cursorReq = idx.openCursor();
      let removed = 0;
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor || removed >= toDelete) return resolve();
        cursor.delete();
        removed++;
        cursor.continue();
      };
      cursorReq.onerror = () => resolve();
    });
  } catch {}
}
