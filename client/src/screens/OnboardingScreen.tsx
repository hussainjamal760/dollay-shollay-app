import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../utils/api';
import { saveUserLocally, getUserLocally } from '../database/db';
import { syncDataWithServer } from '../utils/sync';

const BODY_TYPES = ['Ectomorph', 'Mesomorph', 'Endomorph', 'Skinny Fat'];
const GOALS = ['Build Muscle', 'Lose Fat', 'Improve Endurance', 'General Fitness', 'Powerlifting', 'Bodybuilding'];

export default function OnboardingScreen({ navigation }: any) {
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const handleSubmit = async () => {
    if (!bodyType || goals.length === 0 || !age || !weight || !experience) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/profile', {
        bodyType,
        goals,
        age: parseInt(age, 10),
        weight: parseFloat(weight),
        experience: parseInt(experience, 10)
      });

      if (response.data.success) {
        const localUser = await getUserLocally();
        if (localUser) {
          const updatedUser = {
            ...localUser,
            profileCompleted: true,
            bodyType,
            goals,
            age: parseInt(age, 10),
            weight: parseFloat(weight),
            experience: parseInt(experience, 10)
          };
          await saveUserLocally(updatedUser, false);
          await syncDataWithServer();
        }
        
        Alert.alert('Success', 'Profile completed! Please restart the app.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete Your Profile</Text>

      <Text style={styles.sectionTitle}>Body Type</Text>
      <View style={styles.cardsContainer}>
        {BODY_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.card, bodyType === type && styles.cardSelected]}
            onPress={() => setBodyType(type)}
          >
            <Text style={[styles.cardText, bodyType === type && styles.cardTextSelected]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Goals (Select multiple)</Text>
      <View style={styles.tagsContainer}>
        {GOALS.map((goal) => (
          <TouchableOpacity
            key={goal}
            style={[styles.tag, goals.includes(goal) && styles.tagSelected]}
            onPress={() => toggleGoal(goal)}
          >
            <Text style={[styles.tagText, goals.includes(goal) && styles.tagTextSelected]}>{goal}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Exact Age"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />
      <TextInput
        style={styles.input}
        placeholder="Exact Weight (kg/lbs)"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />
      <TextInput
        style={styles.input}
        placeholder="Years of Experience"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={experience}
        onChangeText={setExperience}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Finish Setup</Text>}
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
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginTop: 20,
    marginBottom: 10,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardSelected: {
    borderColor: '#bb86fc',
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
  },
  cardText: {
    color: '#ccc',
    fontWeight: '600',
  },
  cardTextSelected: {
    color: '#bb86fc',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  tagSelected: {
    backgroundColor: '#bb86fc',
    borderColor: '#bb86fc',
  },
  tagText: {
    color: '#ccc',
  },
  tagTextSelected: {
    color: '#000',
    fontWeight: 'bold',
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
    marginTop: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
