import { openDB } from 'idb';

const DB_NAME = 'vidyasetu_db';
const STORE_NAME = 'offline_data';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
}

export async function saveOffline(key: string, data: any) {
  const db = await initDB();
  await db.put(STORE_NAME, data, key);
}

export async function getOffline(key: string) {
  const db = await initDB();
  return db.get(STORE_NAME, key);
}
