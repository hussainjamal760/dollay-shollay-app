import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import PRScreen from '../screens/PRScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import type { RootStackParamList } from './types';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator<any>();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      try {
        token = await SecureStore.getItemAsync('userToken');
      } catch (e) {
        console.error('Restoring token failed', e);
      }
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#bb86fc" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#ffffff',
        headerBackTitleVisible: false,
      }}
    >
      {userToken == null ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="Main" 
            component={BottomTabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="PRs" 
            component={PRScreen} 
            options={{ title: 'Personal Records' }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
}
