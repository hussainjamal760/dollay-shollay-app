import NetInfo from '@react-native-community/netinfo';
import { getUnsyncedUsers, markUserAsSynced, getUnsyncedWorkouts, markWorkoutAsSynced } from '../database/db';
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
    }
  } catch (error) {
  }
};
