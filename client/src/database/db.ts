import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
  try {
    db = await SQLite.openDatabaseAsync('appData.db');
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE,
        sync_status INTEGER DEFAULT 0
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database', error);
  }
};

export const saveUserLocally = async (user: { id: string, firstName: string, lastName: string, email: string }, synced = false) => {
  if (!db) await initDB();
  try {
    const syncStatus = synced ? 1 : 0;
    // @ts-ignore
    await db!.runAsync(
      `INSERT OR REPLACE INTO users (server_id, first_name, last_name, email, sync_status) VALUES (?, ?, ?, ?, ?)`,
      [user.id, user.firstName, user.lastName, user.email, syncStatus]
    );
    console.log('User saved locally');
  } catch (error) {
    console.error('Error saving user locally', error);
  }
};

export const getUnsyncedUsers = async () => {
  if (!db) await initDB();
  try {
    // @ts-ignore
    const allRows = await db!.getAllAsync(`SELECT * FROM users WHERE sync_status = 0`);
    return allRows;
  } catch (error) {
    console.error('Error getting unsynced users', error);
    return [];
  }
};

export const markUserAsSynced = async (serverId: string) => {
  if (!db) await initDB();
  try {
    // @ts-ignore
    await db!.runAsync(`UPDATE users SET sync_status = 1 WHERE server_id = ?`, [serverId]);
  } catch (error) {
    console.error('Error marking user as synced', error);
  }
};
