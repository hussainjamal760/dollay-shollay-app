import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../utils/api';
import { saveUserLocally } from '../database/db';
import { syncDataWithServer } from '../utils/sync';

const BODY_TYPES = [
  { label: 'Slim / Hard to gain weight', value: 'Ectomorph' },
  { label: 'Athletic / Normal', value: 'Mesomorph' },
  { label: 'Heavy / Easy to gain weight', value: 'Endomorph' }
];

const GOALS = ['Build Muscle', 'Lose Fat', 'Get Stronger', 'General Health'];
const ACTIVITY_LEVELS = ['Sitting all day', 'Active job/lifestyle', 'Very Active/Athlete'];
const EXPERIENCE_LEVELS = [
  { label: 'Just Starting', value: 0 },
  { label: 'Some Experience (1-2 yrs)', value: 1 },
  { label: 'Advanced (3+ yrs)', value: 3 }
];
const FOCUS_AREAS = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core'];

export default function OnboardingScreen({ navigation }: any) {
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [constraints, setConstraints] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleArray = (item: string, state: string[], setter: any) => {
    if (state.includes(item)) setter(state.filter(i => i !== item));
    else setter([...state, item]);
  };

  const handleSubmit = async () => {
    if (!bodyType || goals.length === 0 || !age || !weight || experience === null || !activityLevel) {
      Alert.alert('Missing Details', 'Please fill in the basic details so we can help you better.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/profile', {
        bodyType,
        goals,
        age: parseInt(age, 10),
        weight: parseFloat(weight),
        experience,
        activityLevel,
        constraints,
        focusAreas
      });

      if (response.data.success) {
        const updatedUser = {
          ...response.data.user,
          bodyType,
          goals,
          age: parseInt(age, 10),
          weight: parseFloat(weight),
          experience,
          activityLevel,
          constraints,
          focusAreas
        };
        await saveUserLocally(updatedUser, true);
        await syncDataWithServer();
        navigation.navigate('AIWorkoutChoice', { userDetails: updatedUser });
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tell Us About Yourself</Text>
      <Text style={styles.subtitle}>Help us tailor the best experience for you.</Text>

      <Text style={styles.sectionTitle}>1. How would you describe your body?</Text>
      <View style={styles.optionsContainer}>
        {BODY_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[styles.card, bodyType === type.value && styles.cardSelected]}
            onPress={() => setBodyType(type.value)}
          >
            <Text style={[styles.cardText, bodyType === type.value && styles.textSelected]}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>2. What is your main goal? (Select multiple)</Text>
      <View style={styles.tagsContainer}>
        {GOALS.map((goal) => (
          <TouchableOpacity
            key={goal}
            style={[styles.tag, goals.includes(goal) && styles.tagSelected]}
            onPress={() => toggleArray(goal, goals, setGoals)}
          >
            <Text style={[styles.tagText, goals.includes(goal) && styles.textSelected]}>{goal}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>3. What is your daily activity level?</Text>
      <View style={styles.optionsContainer}>
        {ACTIVITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.card, activityLevel === level && styles.cardSelected]}
            onPress={() => setActivityLevel(level)}
          >
            <Text style={[styles.cardText, activityLevel === level && styles.textSelected]}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>4. Experience Level</Text>
      <View style={styles.optionsContainer}>
        {EXPERIENCE_LEVELS.map((exp) => (
          <TouchableOpacity
            key={exp.label}
            style={[styles.card, experience === exp.value && styles.cardSelected]}
            onPress={() => setExperience(exp.value)}
          >
            <Text style={[styles.cardText, experience === exp.value && styles.textSelected]}>{exp.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>5. Basic Stats</Text>
      <View style={styles.statsRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 10 }]}
          placeholder="Age (e.g. 25)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Weight (kg/lbs)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
      </View>

      <Text style={styles.sectionTitle}>6. Focus Areas (Optional)</Text>
      <View style={styles.tagsContainer}>
        {FOCUS_AREAS.map((area) => (
          <TouchableOpacity
            key={area}
            style={[styles.tag, focusAreas.includes(area) && styles.tagSelected]}
            onPress={() => toggleArray(area, focusAreas, setFocusAreas)}
          >
            <Text style={[styles.tagText, focusAreas.includes(area) && styles.textSelected]}>{area}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>7. Medical Conditions / Constraints (Optional)</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="E.g. Bad lower back, knee pain, etc."
        placeholderTextColor="#999"
        multiline
        value={constraints}
        onChangeText={setConstraints}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Next Step ➔</Text>}
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
    paddingTop: 60,
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginTop: 20,
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
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
    textAlign: 'center',
  },
  textSelected: {
    color: '#bb86fc',
    fontWeight: 'bold',
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
    borderColor: '#bb86fc',
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
  },
  tagText: {
    color: '#ccc',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#03DAC6',
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
