import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import api from '../utils/api';
import { getUserLocally, saveUserLocally, clearAllDataLocally } from '../database/db';
import { syncDataWithServer } from '../utils/sync';

export default function SettingsScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userProfileCompleted, setUserProfileCompleted] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await getUserLocally();
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setUserId(user.id);
      setUserEmail(user.email);
      setUserProfileCompleted(user.profile_completed);
    }
  };

  const handleUpdateProfile = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Hold on', 'First and Last name cannot be empty');
      return;
    }
    setLoadingProfile(true);
    try {
      const response = await api.put('/auth/updateProfile', { firstName, lastName });
      if (response.data.success) {
        const updatedUser = {
          id: userId,
          email: userEmail,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          profileCompleted: userProfileCompleted
        };
        await saveUserLocally(updatedUser, true);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Hold on', 'Please fill in both password fields');
      return;
    }
    setLoadingPassword(true);
    try {
      const response = await api.put('/auth/updatePassword', { currentPassword, newPassword });
      if (response.data.success) {
        Alert.alert('Success', 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          const netInfo = await NetInfo.fetch();
          if (!netInfo.isConnected) {
            Alert.alert('Offline', 'You must be connected to the internet to log out so your data can be synced.');
            return;
          }

          await syncDataWithServer();
          await SecureStore.deleteItemAsync('userToken');
          await clearAllDataLocally();
          DeviceEventEmitter.emit('logout');
        }
      }
    ]);
  };

  // Extract initials for the avatar
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.avatarCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <Text style={styles.userName}>{firstName} {lastName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      <Text style={styles.sectionTitle}>Profile Details</Text>
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            placeholderTextColor="#52525B"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            placeholderTextColor="#52525B"
          />
        </View>

        <TouchableOpacity style={styles.buttonWrapper} onPress={handleUpdateProfile} disabled={loadingProfile}>
          <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
            {loadingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#52525B"
            secureTextEntry
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor="#52525B"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.buttonWrapper} onPress={handleUpdatePassword} disabled={loadingPassword}>
          <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
            {loadingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Danger Zone</Text>
      <View style={styles.card}>
        <Text style={styles.dangerText}>Logging out will sync your data to the cloud and clear the local cache.</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Zinc 950
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FAFAFA',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FAFAFA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#18181B', // Zinc 900
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  dangerText: {
    color: '#A1A1AA',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tint
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
