import NetInfo from '@react-native-community/netinfo';
import { getUnsyncedUsers, markUserAsSynced } from '../database/db';
import api from './api';

export const syncDataWithServer = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      console.log('Internet connected, starting sync...');
      const unsyncedUsers = await getUnsyncedUsers();
      
      for (const user of unsyncedUsers as any[]) {
        try {
          await api.post('/auth/sync', {
            id: user.server_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
          });
          await markUserAsSynced(user.server_id);
          console.log(`User ${user.email} synced successfully.`);
        } catch (err) {
          console.error(`Failed to sync user ${user.email}`, err);
        }
      }
    } else {
      console.log('No internet connection, skipping sync.');
    }
  } catch (error) {
    console.error('Error during synchronization', error);
  }
};
