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
        sync_status INTEGER DEFAULT 0,
        profile_completed INTEGER DEFAULT 0,
        body_type TEXT,
        age INTEGER,
        weight REAL,
        goals TEXT,
        experience INTEGER
      );
    `);
  } catch (error) {
  }
};

export const saveUserLocally = async (user: any, synced = false) => {
  if (!db) await initDB();
  try {
    const syncStatus = synced ? 1 : 0;
    const profileCompleted = user.profileCompleted ? 1 : 0;
    const goalsStr = user.goals ? JSON.stringify(user.goals) : null;
    
    await db!.runAsync(
      `INSERT OR REPLACE INTO users (server_id, first_name, last_name, email, sync_status, profile_completed, body_type, age, weight, goals, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.firstName, user.lastName, user.email, syncStatus, profileCompleted, user.bodyType || null, user.age || null, user.weight || null, goalsStr, user.experience || null]
    );
  } catch (error) {
  }
};

export const getUserLocally = async () => {
  if (!db) await initDB();
  try {
    const row = await db!.getFirstAsync(`SELECT * FROM users LIMIT 1`);
    return row;
  } catch (error) {
    return null;
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
