import NetInfo from '@react-native-community/netinfo';
import { getUnsyncedUsers, markUserAsSynced, getUnsyncedWorkouts, markWorkoutAsSynced, getUnsyncedLogs, markLogAsSynced, getUnsyncedDietLogs, markDietLogAsSynced, saveWorkoutLocally, saveWorkoutLogLocally, saveDietLogLocally } from '../database/db';
import api from './api';

export const syncDataWithServer = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      const unsyncedUsers = await getUnsyncedUsers();
      
      for (const user of unsyncedUsers as any[]) {
        try {
          await api.post('/auth/sync', {
            id: user.server_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            profileCompleted: user.profile_completed === 1,
            bodyType: user.body_type,
            age: user.age,
            weight: user.weight,
            goals: user.goals ? JSON.parse(user.goals) : undefined,
            experience: user.experience
          });
          await markUserAsSynced(user.server_id);
        } catch (err) {
        }
      }

      const unsyncedWorkouts = await getUnsyncedWorkouts();
      if (unsyncedWorkouts.length > 0) {
        try {
          const plansPayload = (unsyncedWorkouts as any[]).map(w => ({
            server_id: w.server_id,
            name: w.name,
            isActive: w.is_active === 1,
            days: w.days ? JSON.parse(w.days) : []
          }));
          const response = await api.post('/workouts/sync', { plans: plansPayload });
          if (response.data.success) {
            for (const w of unsyncedWorkouts as any[]) {
              await markWorkoutAsSynced(w.id, w.server_id || `offline_${w.id}`);
            }
          }
        } catch (err) {
        }
      }

      const unsyncedLogs = await getUnsyncedLogs();
      if (unsyncedLogs.length > 0) {
        try {
          const logsPayload = (unsyncedLogs as any[]).map(l => ({
            server_id: l.server_id,
            planId: l.plan_id,
            planName: l.plan_name,
            date: l.date,
            exercises: l.exercises ? JSON.parse(l.exercises) : []
          }));
          const response = await api.post('/logs/sync', { logs: logsPayload });
          if (response.data.success) {
            for (const l of unsyncedLogs as any[]) {
              await markLogAsSynced(l.id, l.server_id || `offline_${l.id}`);
            }
          }
        } catch (err) {
        }
      }
      const unsyncedDietLogs = await getUnsyncedDietLogs();
      if (unsyncedDietLogs.length > 0) {
        try {
          const dietLogsPayload = (unsyncedDietLogs as any[]).map(l => ({
            server_id: l.server_id,
            date: l.date,
            food_text: l.food_text,
            protein: l.protein,
            carbs: l.carbs,
            fat: l.fat,
            calories: l.calories
          }));
          const response = await api.post('/diet/sync', { logs: dietLogsPayload });
          if (response.data.success) {
            for (const l of unsyncedDietLogs as any[]) {
              await markDietLogAsSynced(l.id, l.server_id || `offline_${l.id}`);
            }
          }
        } catch (err) {
        }
      }
    }
  } catch (error) {
  }
};

export const downloadDataFromServer = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;

    // Fetch Workout Plans
    try {
      const response = await api.get('/workouts');
      if (response.data.success) {
        for (const plan of response.data.workoutPlans) {
          await saveWorkoutLocally({
            server_id: plan._id,
            name: plan.name,
            isActive: plan.isActive,
            days: plan.days
          }, true);
        }
      }
    } catch (e) {}

    // Fetch Workout Logs
    try {
      const response = await api.get('/logs');
      if (response.data.success) {
        for (const log of response.data.logs) {
          await saveWorkoutLogLocally({
            server_id: log._id,
            planId: log.planId,
            planName: log.planName,
            date: log.date,
            exercises: log.exercises
          }, true);
        }
      }
    } catch (e) {}

    // Fetch Diet Logs
    try {
      const response = await api.get('/diet');
      if (response.data.success) {
        for (const log of response.data.logs) {
          await saveDietLogLocally({
            server_id: log._id,
            date: log.date,
            food_text: log.food_text,
            protein: log.protein,
            carbs: log.carbs,
            fat: log.fat,
            calories: log.calories
          }, true);
        }
      }
    } catch (e) {}

  } catch (error) {
  }
};
