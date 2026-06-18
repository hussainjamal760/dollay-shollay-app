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

      CREATE TABLE IF NOT EXISTS workout_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        name TEXT,
        is_active INTEGER DEFAULT 0,
        days TEXT,
        sync_status INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS workout_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        plan_id TEXT,
        plan_name TEXT,
        date TEXT,
        exercises TEXT,
        sync_status INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS diet_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        date TEXT,
        food_text TEXT,
        protein REAL,
        carbs REAL,
        fat REAL,
        calories REAL,
        sync_status INTEGER DEFAULT 0
      );
    `);

    // Add new columns if they don't exist
    const columnsToAdd = [
      'profile_completed INTEGER DEFAULT 0',
      'body_type TEXT',
      'age INTEGER',
      'weight REAL',
      'goals TEXT',
      'experience INTEGER',
      'activity_level TEXT',
      'constraints TEXT',
      'focus_areas TEXT'
    ];

    for (const col of columnsToAdd) {
      try {
        await db.execAsync(`ALTER TABLE users ADD COLUMN ${col};`);
      } catch (e) {
        // Column probably already exists
      }
    }

  } catch (error) {
  }
};

export const saveUserLocally = async (user: any, synced = false) => {
  if (!db) await initDB();
  try {
    const syncStatus = synced ? 1 : 0;
    const profileCompleted = user.profileCompleted ? 1 : 0;
    const goalsStr = user.goals ? JSON.stringify(user.goals) : null;
    const focusAreasStr = user.focusAreas ? JSON.stringify(user.focusAreas) : null;
    
    await db!.runAsync(
      `INSERT OR REPLACE INTO users (server_id, first_name, last_name, email, sync_status, profile_completed, body_type, age, weight, goals, experience, activity_level, constraints, focus_areas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.firstName, user.lastName, user.email, syncStatus, profileCompleted, user.bodyType || null, user.age || null, user.weight || null, goalsStr, user.experience || null, user.activityLevel || null, user.constraints || null, focusAreasStr]
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
    await db!.runAsync(`UPDATE users SET sync_status = 1 WHERE server_id = ?`, [serverId]);
  } catch (error) {
  }
};

export const saveWorkoutLocally = async (workout: any, synced = false) => {
  if (!db) await initDB();
  try {
    const syncStatus = synced ? 1 : 0;
    const isActive = workout.isActive ? 1 : 0;
    const daysStr = JSON.stringify(workout.days || []);
    
    if (isActive) {
      await db!.runAsync(`UPDATE workout_plans SET is_active = 0`);
    }

    if (workout.id) {
      await db!.runAsync(
        `UPDATE workout_plans SET name = ?, is_active = ?, days = ?, sync_status = ? WHERE id = ?`,
        [workout.name, isActive, daysStr, syncStatus, workout.id]
      );
    } else if (workout.server_id) {
      await db!.runAsync(
        `INSERT OR REPLACE INTO workout_plans (server_id, name, is_active, days, sync_status) VALUES (?, ?, ?, ?, ?)`,
        [workout.server_id, workout.name, isActive, daysStr, syncStatus]
      );
    } else {
      await db!.runAsync(
        `INSERT INTO workout_plans (name, is_active, days, sync_status) VALUES (?, ?, ?, ?)`,
        [workout.name, isActive, daysStr, syncStatus]
      );
    }
  } catch (error) {
  }
};

export const deleteWorkoutLocally = async (id: number) => {
  if (!db) await initDB();
  try {
    await db!.runAsync(`DELETE FROM workout_plans WHERE id = ?`, [id]);
  } catch (error) {
  }
};

export const getWorkoutsLocally = async () => {
  if (!db) await initDB();
  try {
    const rows = await db!.getAllAsync(`SELECT * FROM workout_plans ORDER BY id DESC`);
    return rows;
  } catch (error) {
    return [];
  }
};

export const getUnsyncedWorkouts = async () => {
  if (!db) await initDB();
  try {
    const rows = await db!.getAllAsync(`SELECT * FROM workout_plans WHERE sync_status = 0`);
    return rows;
  } catch (error) {
    return [];
  }
};

export const markWorkoutAsSynced = async (id: number, serverId: string) => {
  if (!db) await initDB();
  try {
    await db!.runAsync(`UPDATE workout_plans SET sync_status = 1, server_id = ? WHERE id = ?`, [serverId, id]);
  } catch (error) {
  }
};

export const saveWorkoutLogLocally = async (log: any, synced = false) => {
  if (!db) await initDB();
  try {
    const syncStatus = synced ? 1 : 0;
    const exercisesStr = JSON.stringify(log.exercises || []);
    
    if (log.server_id) {
      await db!.runAsync(
        `INSERT OR REPLACE INTO workout_logs (server_id, plan_id, plan_name, date, exercises, sync_status) VALUES (?, ?, ?, ?, ?, ?)`,
        [log.server_id, log.planId, log.planName, log.date, exercisesStr, syncStatus]
      );
    } else {
      await db!.runAsync(
        `INSERT INTO workout_logs (plan_id, plan_name, date, exercises, sync_status) VALUES (?, ?, ?, ?, ?)`,
        [log.planId, log.planName, log.date, exercisesStr, syncStatus]
      );
    }
  } catch (error) {
  }
};

export const getWorkoutLogsLocally = async () => {
  if (!db) await initDB();
  try {
    const rows = await db!.getAllAsync(`SELECT * FROM workout_logs ORDER BY id DESC`);
    return rows;
  } catch (error) {
    return [];
  }
};

export const getWorkoutLogsForPlan = async (planId: string) => {
  if (!db) await initDB();
  try {
    const rows = await db!.getAllAsync(`SELECT * FROM workout_logs WHERE plan_id = ? ORDER BY date DESC`, [planId]);
    return rows;
  } catch (error) {
    return [];
  }
};

export const getUnsyncedLogs = async () => {
  if (!db) await initDB();
  try {
    const rows = await db!.getAllAsync(`SELECT * FROM workout_logs WHERE sync_status = 0`);
    return rows;
  } catch (error) {
    return [];
  }
};

export const markLogAsSynced = async (id: number, serverId: string) => {
  if (!db) await initDB();
  try {
    await db!.runAsync(`UPDATE workout_logs SET sync_status = 1, server_id = ? WHERE id = ?`, [serverId, id]);
  } catch (error) {
  }
};

export const saveDietLogLocally = async (log: any, synced = false) => {
  if (!db) await initDB();
  try {
    const syncStatus = synced ? 1 : 0;
    if (log.id) {
       await db!.runAsync(
         `UPDATE diet_logs SET date = ?, food_text = ?, protein = ?, carbs = ?, fat = ?, calories = ?, sync_status = ? WHERE id = ?`,
         [log.date, log.food_text, log.protein, log.carbs, log.fat, log.calories, syncStatus, log.id]
       );
    } else if (log.server_id) {
      await db!.runAsync(
        `INSERT OR REPLACE INTO diet_logs (server_id, date, food_text, protein, carbs, fat, calories, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [log.server_id, log.date, log.food_text, log.protein, log.carbs, log.fat, log.calories, syncStatus]
      );
    } else {
      await db!.runAsync(
        `INSERT INTO diet_logs (date, food_text, protein, carbs, fat, calories, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [log.date, log.food_text, log.protein, log.carbs, log.fat, log.calories, syncStatus]
      );
    }
  } catch (error) {
  }
};

export const getDietLogsLocally = async () => {
  if (!db) await initDB();
  try {
    const rows = await db!.getAllAsync(`SELECT * FROM diet_logs ORDER BY date DESC, id DESC`);
    return rows;
  } catch (error) {
    return [];
  }
};

export const deleteDietLogLocally = async (id: number) => {
  if (!db) await initDB();
  try {
    await db!.runAsync(`DELETE FROM diet_logs WHERE id = ?`, [id]);
  } catch (error) {
  }
};
