import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';
import { saveUserLocally } from '../database/db';
import { syncDataWithServer, downloadDataFromServer } from '../utils/sync';

export default function LoginScreen({ route, navigation }: any) {
  const [email, setEmail] = useState(route?.params?.email || '');
  const [password, setPassword] = useState(route?.params?.password || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route?.params?.email) setEmail(route.params.email);
    if (route?.params?.password) setPassword(route.params.password);
  }, [route?.params]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        await SecureStore.setItemAsync('userToken', response.data.token);
        await saveUserLocally(response.data.user, true);
        await syncDataWithServer();
        await downloadDataFromServer();
        DeviceEventEmitter.emit('login', {
          token: response.data.token,
          profileCompleted: !!response.data.user?.profileCompleted
        });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#bb86fc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#bb86fc',
    fontSize: 14,
  },
});
