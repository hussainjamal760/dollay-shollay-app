import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';
import { getUserLocally, saveUserLocally } from '../database/db';

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
      Alert.alert('Error', 'First and Last name cannot be empty');
      return;
    }
    setLoadingProfile(true);
    try {
      const response = await api.put('/auth/updateProfile', { firstName, lastName });
      if (response.data.success) {
        // Update local DB
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
      Alert.alert('Error', 'Please fill in both password fields');
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
          await SecureStore.deleteItemAsync('userToken');
          DeviceEventEmitter.emit('logout');
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      <Text style={styles.sectionTitle}>Profile Details</Text>
      <View style={styles.card}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          placeholderTextColor="#888"
        />
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile} disabled={loadingProfile}>
          {loadingProfile ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Update Name</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current Password"
          placeholderTextColor="#888"
          secureTextEntry
        />
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New Password"
          placeholderTextColor="#888"
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loadingPassword}>
          {loadingPassword ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Update Password</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#03DAC6',
    marginTop: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  label: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: '#bb86fc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#cf6679',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
