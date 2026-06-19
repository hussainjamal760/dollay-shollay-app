import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import { saveUserLocally } from '../database/db';
import { syncDataWithServer } from '../utils/sync';

const { width } = Dimensions.get('window');

const BODY_TYPES = [
  { label: 'Slim / Hard to gain weight', value: 'Ectomorph', icon: '🏃‍♂️' },
  { label: 'Athletic / Normal', value: 'Mesomorph', icon: '🤸‍♂️' },
  { label: 'Heavy / Easy to gain weight', value: 'Endomorph', icon: '🏋️‍♂️' }
];

const GOALS = ['Build Muscle', 'Lose Fat', 'Get Stronger', 'General Health'];
const ACTIVITY_LEVELS = [
  { label: 'Sitting all day', icon: '🪑' },
  { label: 'Active job/lifestyle', icon: '🚶‍♂️' },
  { label: 'Very Active/Athlete', icon: '🏃‍♂️💨' }
];
const EXPERIENCE_LEVELS = [
  { label: 'Just Starting', value: 0 },
  { label: 'Some Experience (1-2 yrs)', value: 1 },
  { label: 'Advanced (3+ yrs)', value: 3 }
];
const FOCUS_AREAS = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core'];

const STEPS = [
  { id: 'bodyType', title: 'Body Type', subtitle: 'How would you describe your body?' },
  { id: 'goals', title: 'Your Goals', subtitle: 'What do you want to achieve?' },
  { id: 'activity', title: 'Activity Level', subtitle: 'How active are you daily?' },
  { id: 'experience', title: 'Experience', subtitle: 'How long have you been training?' },
  { id: 'stats', title: 'Basic Stats', subtitle: 'Let us crunch the numbers.' },
  { id: 'focus', title: 'Focus Areas', subtitle: 'Any specific muscles to prioritize?' },
  { id: 'constraints', title: 'Constraints', subtitle: 'Any medical conditions or pain?' }
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function OnboardingScreen({ navigation }: any) {
  const [stepIndex, setStepIndex] = useState(0);
  
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [constraints, setConstraints] = useState('');
  
  const [loading, setLoading] = useState(false);

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(((stepIndex + 1) / STEPS.length) * width, { duration: 300 });
  }, [stepIndex]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const toggleArray = (item: string, state: string[], setter: any) => {
    if (state.includes(item)) setter(state.filter((i: string) => i !== item));
    else setter([...state, item]);
  };

  const handleNext = () => {
    if (stepIndex === 0 && !bodyType) return Alert.alert('Hold on', 'Please select a body type.');
    if (stepIndex === 1 && goals.length === 0) return Alert.alert('Hold on', 'Please select at least one goal.');
    if (stepIndex === 2 && !activityLevel) return Alert.alert('Hold on', 'Please select your activity level.');
    if (stepIndex === 3 && experience === null) return Alert.alert('Hold on', 'Please select your experience level.');
    if (stepIndex === 4 && (!age || !weight)) return Alert.alert('Hold on', 'Please enter your age and weight.');

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleSubmit = async () => {
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
          bodyType, goals, age: parseInt(age, 10), weight: parseFloat(weight), experience, activityLevel, constraints, focusAreas
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

  const currentStep = STEPS[stepIndex];

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'bodyType':
        return (
          <View style={styles.grid}>
            {BODY_TYPES.map((type) => {
              const isSelected = bodyType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setBodyType(type.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardIcon}>{type.icon}</Text>
                  <Text style={[styles.cardText, isSelected && styles.textSelected]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'goals':
        return (
          <View style={styles.tagsContainer}>
            {GOALS.map((goal) => {
              const isSelected = goals.includes(goal);
              return (
                <TouchableOpacity
                  key={goal}
                  style={[styles.tag, isSelected && styles.tagSelected]}
                  onPress={() => toggleArray(goal, goals, setGoals)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, isSelected && styles.textSelected]}>{goal}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'activity':
        return (
          <View style={styles.grid}>
            {ACTIVITY_LEVELS.map((level) => {
              const isSelected = activityLevel === level.label;
              return (
                <TouchableOpacity
                  key={level.label}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setActivityLevel(level.label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardIcon}>{level.icon}</Text>
                  <Text style={[styles.cardText, isSelected && styles.textSelected]}>{level.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'experience':
        return (
          <View style={styles.grid}>
            {EXPERIENCE_LEVELS.map((exp) => {
              const isSelected = experience === exp.value;
              return (
                <TouchableOpacity
                  key={exp.label}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setExperience(exp.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cardText, isSelected && styles.textSelected]}>{exp.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'stats':
        return (
          <View style={styles.statsContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 25"
                placeholderTextColor="#52525B"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Weight (kg/lbs)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 75"
                placeholderTextColor="#52525B"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
          </View>
        );
      case 'focus':
        return (
          <View style={styles.tagsContainer}>
            {FOCUS_AREAS.map((area) => {
              const isSelected = focusAreas.includes(area);
              return (
                <TouchableOpacity
                  key={area}
                  style={[styles.tag, isSelected && styles.tagSelected]}
                  onPress={() => toggleArray(area, focusAreas, setFocusAreas)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, isSelected && styles.textSelected]}>{area}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'constraints':
        return (
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Bad lower back, knee pain, etc."
              placeholderTextColor="#52525B"
              multiline
              value={constraints}
              onChangeText={setConstraints}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
      </View>

      <View style={styles.header}>
        {stepIndex > 0 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.stepIndicator}>STEP {stepIndex + 1} OF {STEPS.length}</Text>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View key={currentStep.id} entering={FadeInRight.duration(400)} exiting={FadeOutLeft.duration(300)}>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
            
            <View style={styles.stepContentContainer}>
              {renderStepContent()}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButtonWrapper} onPress={handleNext} disabled={loading}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButton}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>{stepIndex === STEPS.length - 1 ? "Let's Go 🚀" : "Continue"}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Zinc 950
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#27272A',
    width: '100%',
    marginTop: 40,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    height: 60,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    color: '#A1A1AA',
    fontSize: 16,
    fontWeight: '600',
  },
  stepIndicator: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    position: 'absolute',
    right: 24,
    top: 28,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FAFAFA',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    marginBottom: 40,
    lineHeight: 24,
  },
  stepContentContainer: {
    width: '100%',
  },
  grid: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: '#18181B', // Zinc 900
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  cardText: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '600',
  },
  textSelected: {
    color: '#8B5CF6',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    backgroundColor: '#18181B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  tagText: {
    color: '#A1A1AA',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    gap: 24,
  },
  inputWrapper: {
    width: '100%',
  },
  inputLabel: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#18181B',
    color: '#FAFAFA',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 18,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(9, 9, 11, 0.9)', // Semi-transparent
  },
  nextButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  nextButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
