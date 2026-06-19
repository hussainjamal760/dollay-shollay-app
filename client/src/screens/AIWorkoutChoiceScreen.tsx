import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, DeviceEventEmitter, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { saveWorkoutLocally } from '../database/db';
import { syncDataWithServer } from '../utils/sync';

export default function AIWorkoutChoiceScreen({ route }: any) {
  const { userDetails } = route.params;
  const [loading, setLoading] = useState(false);
  const [showDaysInput, setShowDaysInput] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState('4');

  const handleSkip = () => {
    DeviceEventEmitter.emit('profileCompleted');
  };

  const handleGenerateAI = async () => {
    const days = parseInt(daysPerWeek, 10);
    if (isNaN(days) || days < 1 || days > 7) {
      Alert.alert('Hold on', 'Please enter a number between 1 and 7.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/ai/generate-plan', {
        daysPerWeek: days,
        userDetails
      });

      if (response.data.success && response.data.plan) {
        const generatedPlan = response.data.plan;
        
        const workoutToSave = {
          name: generatedPlan.name || 'AI Custom Plan',
          isActive: true,
          days: generatedPlan.days || []
        };

        await saveWorkoutLocally(workoutToSave, false);
        await syncDataWithServer();
        
        Alert.alert('Success', 'AI has crafted your custom workout plan!', [
          {
            text: 'Let\'s Go!',
            onPress: () => DeviceEventEmitter.emit('profileCompleted')
          }
        ]);
      } else {
        Alert.alert('Error', 'AI failed to generate a plan. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Could not generate plan.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.headerContainer}>
          <View style={styles.iconPlaceholder}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.iconGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
              <Ionicons name="sparkles" size={40} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Profile Complete!</Text>
          <Text style={styles.subtitle}>Would you like our AI to instantly generate a personalized workout plan designed specifically for you?</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.actionContainer}>
          {showDaysInput ? (
            <View style={styles.daysContainer}>
              <Text style={styles.daysLabel}>How many days a week can you train?</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={daysPerWeek}
                onChangeText={setDaysPerWeek}
                maxLength={1}
                autoFocus
              />
              
              <TouchableOpacity style={styles.buttonWrapper} onPress={handleGenerateAI} disabled={loading}>
                <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Generate My Plan</Text>
                      <Ionicons name="sparkles" size={20} color="#FFF" style={styles.buttonIcon} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {!loading && (
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDaysInput(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.buttonWrapper} onPress={() => setShowDaysInput(true)}>
                <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Build Workout with AI</Text>
                    <Ionicons name="color-wand" size={20} color="#FFF" style={styles.buttonIcon} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Start without AI</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Zinc 950
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconPlaceholder: {
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FAFAFA',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  actionContainer: {
    width: '100%',
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    width: '100%',
  },
  button: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  skipButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A', // Zinc 800
    backgroundColor: '#18181B', // Zinc 900
  },
  skipText: {
    color: '#A1A1AA',
    fontSize: 16,
    fontWeight: '700',
  },
  daysContainer: {
    backgroundColor: '#18181B',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  daysLabel: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#09090B',
    color: '#6366F1',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    width: 100,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#27272A',
    marginBottom: 24,
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
  },
  cancelText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
});
