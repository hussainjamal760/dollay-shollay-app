import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, DeviceEventEmitter } from 'react-native';
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
      Alert.alert('Invalid Days', 'Please enter a number between 1 and 7.');
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
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile is Ready!</Text>
      <Text style={styles.subtitle}>Would you like our AI to instantly generate a personalized workout plan for you?</Text>

      {showDaysInput ? (
        <View style={styles.daysContainer}>
          <Text style={styles.daysLabel}>How many days a week can you train?</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={daysPerWeek}
            onChangeText={setDaysPerWeek}
            maxLength={1}
          />
          <TouchableOpacity style={styles.aiButton} onPress={handleGenerateAI} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.aiButtonText}>Generate My Plan ✨</Text>}
          </TouchableOpacity>
          {!loading && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDaysInput(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.aiButton} onPress={() => setShowDaysInput(true)}>
            <Text style={styles.aiButtonText}>Make Workout using AI ✨</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Start without it</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  aiButton: {
    backgroundColor: '#03DAC6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#03DAC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  aiButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  skipText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  daysContainer: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  daysLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#03DAC6',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 80,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
  },
  cancelText: {
    color: '#888',
    fontSize: 14,
  },
});
