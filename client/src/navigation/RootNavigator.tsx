import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import PRScreen from '../screens/PRScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AIWorkoutChoiceScreen from '../screens/AIWorkoutChoiceScreen';
import CreateWorkoutScreen from '../screens/CreateWorkoutScreen';
import WorkoutSessionScreen from '../screens/WorkoutSessionScreen';
import type { RootStackParamList } from './types';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, DeviceEventEmitter } from 'react-native';
import { getUserLocally } from '../database/db';

const Stack = createStackNavigator<any>();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [profileCompleted, setProfileCompleted] = useState<boolean>(false);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('profileCompleted', () => {
      setProfileCompleted(true);
    });
    const logoutListener = DeviceEventEmitter.addListener('logout', () => {
      setUserToken(null);
      setProfileCompleted(false);
    });

    const bootstrapAsync = async () => {
      let token;
      try {
        token = await SecureStore.getItemAsync('userToken');
        const user = await getUserLocally();
        if (user && user.profile_completed === 1) {
          setProfileCompleted(true);
        }
      } catch (e) {
      }
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();

    return () => {
      listener.remove();
      logoutListener.remove();
    };
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
      ) : !profileCompleted ? (
        <>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AIWorkoutChoice"
            component={AIWorkoutChoiceScreen}
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
          <Stack.Screen
            name="CreateWorkout"
            component={CreateWorkoutScreen}
            options={{ title: 'Create Workout Plan' }}
          />
          <Stack.Screen
            name="WorkoutSession"
            component={WorkoutSessionScreen}
            options={{ title: 'Workout Session' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
