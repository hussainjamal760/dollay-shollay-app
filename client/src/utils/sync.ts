import NetInfo from '@react-native-community/netinfo';
import { getUnsyncedUsers, markUserAsSynced } from '../database/db';
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
    }
  } catch (error) {
    console.error('Error during synchronization', error);
  }
};
