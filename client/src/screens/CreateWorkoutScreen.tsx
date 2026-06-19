import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { saveWorkoutLocally } from '../database/db';
import { syncDataWithServer } from '../utils/sync';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'];

export default function CreateWorkoutScreen({ route, navigation }: any) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  
  const [dayMuscles, setDayMuscles] = useState<{ [day: string]: string[] }>({});
  
  const [customMuscles, setCustomMuscles] = useState<string[]>([]);
  const [newMuscleText, setNewMuscleText] = useState<{ [day: string]: string }>({});

  const [exercises, setExercises] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.planToEdit) {
      const p = route.params.planToEdit;
      setEditingId(p.id);
      setName(p.name);
      
      try {
        const parsedDays = typeof p.days === 'string' ? JSON.parse(p.days) : p.days;
        
        const sDays = parsedDays.map((d: any) => d.dayOfWeek);
        setSelectedDays(sDays);
        
        const dMuscles: any = {};
        const exList: any[] = [];
        let exIdCounter = 1;
        
        parsedDays.forEach((d: any) => {
          dMuscles[d.dayOfWeek] = d.muscles || [];
          (d.exercises || []).forEach((ex: any) => {
            exList.push({
              id: String(exIdCounter++),
              dayOfWeek: d.dayOfWeek,
              muscle: ex.muscle,
              name: ex.name,
              numSets: String(ex.setsData?.length || ex.sets || 1),
              setsData: ex.setsData && ex.setsData.length > 0 
                  ? ex.setsData.map((s:any) => ({ weightLifted: String(s.weightLifted), reps: String(s.reps) }))
                  : Array.from({length: ex.sets || 1}).map(() => ({ weightLifted: '', reps: '' }))
            });
          });
        });
        
        setDayMuscles(dMuscles);
        setExercises(exList);
      } catch (e) {
        console.log('Error parsing days for edit:', e);
      }
    }
  }, [route.params]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleMuscle = (day: string, muscle: string) => {
    const current = dayMuscles[day] || [];
    if (current.includes(muscle)) {
      setDayMuscles({ ...dayMuscles, [day]: current.filter(m => m !== muscle) });
    } else {
      setDayMuscles({ ...dayMuscles, [day]: [...current, muscle] });
    }
  };

  const addExercise = (day: string, muscle: string) => {
    setExercises([...exercises, { 
      id: Date.now().toString(), 
      dayOfWeek: day, 
      muscle, 
      name: '', 
      numSets: '1', 
      setsData: [{ weightLifted: '', reps: '' }] 
    }]);
  };

  const updateExercise = (id: string, field: string, value: string) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const updateSetCount = (id: string, countStr: string) => {
    const count = parseInt(countStr) || 0;
    setExercises(exercises.map(ex => {
      if (ex.id === id) {
        let newSetsData = [...ex.setsData];
        if (count > newSetsData.length) {
          const lastSet = newSetsData[newSetsData.length - 1] || { weightLifted: '', reps: '' };
          for (let i = newSetsData.length; i < count; i++) {
            newSetsData.push({ ...lastSet });
          }
        } else if (count < newSetsData.length) {
          newSetsData = newSetsData.slice(0, count);
        }
        return { ...ex, numSets: countStr, setsData: newSetsData };
      }
      return ex;
    }));
  };

  const updateSetData = (id: string, setIndex: number, field: string, value: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === id) {
        const newSetsData = [...ex.setsData];
        newSetsData[setIndex] = { ...newSetsData[setIndex], [field]: value };
        return { ...ex, setsData: newSetsData };
      }
      return ex;
    }));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    setLoading(true);

    const daysPayload = selectedDays.map(day => ({
      dayOfWeek: day,
      muscles: dayMuscles[day] || [],
      exercises: exercises
        .filter(ex => ex.dayOfWeek === day)
        .map(ex => {
          const parsedSetsData = ex.setsData.map((s: any) => ({
            weightLifted: parseFloat(s.weightLifted) || 0,
            reps: parseInt(s.reps, 10) || 0
          }));

          return {
            muscle: ex.muscle,
            name: ex.name,
            setsData: parsedSetsData,
            weightLifted: parsedSetsData.length > 0 ? parsedSetsData[0].weightLifted : 0,
            sets: parsedSetsData.length,
            reps: parsedSetsData.length > 0 ? parsedSetsData[0].reps : 0
          };
        })
    }));

    const workout = {
      id: editingId,
      name,
      isActive: true,
      days: daysPayload
    };

    try {
      await saveWorkoutLocally(workout, false);
      await syncDataWithServer();
      Alert.alert('Success', 'Workout created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
      <Text style={styles.title}>Basic Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Workout Plan Name (e.g. Push Pull Legs)"
        placeholderTextColor="#71717A"
        value={name}
        onChangeText={setName}
      />
      
      <Text style={styles.sectionTitle}>Select Days</Text>
      <View style={styles.daysContainer}>
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDays.includes(day);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => toggleDay(day)}
            >
              {isSelected ? (
                <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.dayGradient}>
                  <Text style={styles.dayTextSelected}>{day.substring(0, 3)}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.dayText}>{day.substring(0, 3)}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <TouchableOpacity 
        style={styles.buttonWrapper} 
        onPress={() => {
          if (!name || selectedDays.length === 0) {
            Alert.alert('Error', 'Please enter name and select days');
            return;
          }
          setStep(2);
        }}
      >
        <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.button}>
          <Text style={styles.buttonText}>Next: Select Muscles</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
      <Text style={styles.title}>Target Muscles</Text>
      {selectedDays.map(day => {
        const allMuscles = [...MUSCLES, ...customMuscles];
        return (
          <View key={day} style={styles.daySection}>
            <View style={styles.daySectionHeader}>
              <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
            <View style={styles.tagsContainer}>
              {allMuscles.map(muscle => {
                const isSelected = (dayMuscles[day] || []).includes(muscle);
                return (
                  <TouchableOpacity
                    key={muscle}
                    style={[styles.tag, isSelected && styles.tagSelected]}
                    onPress={() => toggleMuscle(day, muscle)}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{muscle}</Text>
                  </TouchableOpacity>
                );
              })}
              
              <TextInput
                style={styles.customMuscleInput}
                placeholder="+ Custom"
                placeholderTextColor="#71717A"
                value={newMuscleText[day] || ''}
                onChangeText={(val) => setNewMuscleText({...newMuscleText, [day]: val})}
                onSubmitEditing={() => {
                  const val = newMuscleText[day];
                  if (val && val.trim().length > 0) {
                    const trimmed = val.trim();
                    if (!customMuscles.includes(trimmed) && !MUSCLES.includes(trimmed)) {
                      setCustomMuscles([...customMuscles, trimmed]);
                    }
                    const current = dayMuscles[day] || [];
                    if (!current.includes(trimmed)) {
                      setDayMuscles({ ...dayMuscles, [day]: [...current, trimmed] });
                    }
                    setNewMuscleText({...newMuscleText, [day]: ''});
                  }
                }}
              />
            </View>
          </View>
        );
      })}
      
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={18} color="#A1A1AA" style={{ marginRight: 6 }} />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButtonWrapper} onPress={() => setStep(3)}>
          <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Next: Exercises</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
      <Text style={styles.title}>Exercises Detail</Text>
      
      {selectedDays.map(day => {
        const muscles = dayMuscles[day] || [];
        if (muscles.length === 0) return null;
        
        return (
          <View key={day} style={styles.exerciseDaySection}>
            <View style={styles.exerciseDayHeader}>
              <Ionicons name="calendar" size={20} color="#8B5CF6" />
              <Text style={styles.exerciseDayLabel}>{day}</Text>
            </View>
            
            {muscles.map(muscle => (
              <View key={muscle} style={styles.muscleSection}>
                <View style={styles.muscleHeader}>
                  <Text style={styles.muscleLabel}>{muscle}</Text>
                  <TouchableOpacity onPress={() => addExercise(day, muscle)} style={styles.addExerciseBtn}>
                    <Ionicons name="add-circle" size={16} color="#06B6D4" style={{marginRight: 4}} />
                    <Text style={styles.addExerciseText}>Add Exercise</Text>
                  </TouchableOpacity>
                </View>

                {exercises.filter(ex => ex.dayOfWeek === day && ex.muscle === muscle).map((ex, index) => (
                  <View key={ex.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseIndex}>Exercise {index + 1}</Text>
                      <TouchableOpacity onPress={() => removeExercise(ex.id)}>
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.exInput}
                      placeholder="Exercise Name"
                      placeholderTextColor="#71717A"
                      value={ex.name}
                      onChangeText={(val) => updateExercise(ex.id, 'name', val)}
                    />
                    
                    {/* Per-Set Tracking UI */}
                    <View style={styles.numSetsRow}>
                      <Text style={styles.numSetsLabel}>Number of Sets:</Text>
                      <TextInput
                        style={styles.numSetsInput}
                        keyboardType="numeric"
                        value={ex.numSets}
                        onChangeText={(val) => updateSetCount(ex.id, val)}
                      />
                    </View>

                    {ex.setsData.map((setObj: any, sIdx: number) => (
                      <View key={sIdx} style={styles.setRow}>
                        <View style={styles.setLabelContainer}>
                          <Text style={styles.setLabel}>Set {sIdx + 1}</Text>
                        </View>
                        <View style={styles.setInputGroup}>
                          <Text style={styles.setInputLabel}>kg</Text>
                          <TextInput
                            style={styles.setInput}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#52525B"
                            value={setObj.weightLifted}
                            onChangeText={(val) => updateSetData(ex.id, sIdx, 'weightLifted', val)}
                          />
                        </View>
                        <View style={styles.setInputGroup}>
                          <Text style={styles.setInputLabel}>reps</Text>
                          <TextInput
                            style={styles.setInput}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#52525B"
                            value={setObj.reps}
                            onChangeText={(val) => updateSetData(ex.id, sIdx, 'reps', val)}
                          />
                        </View>
                      </View>
                    ))}

                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      })}

      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={18} color="#A1A1AA" style={{ marginRight: 6 }} />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButtonWrapper} onPress={handleSave} disabled={loading}>
          <LinearGradient colors={['#10B981', '#059669']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.primaryButton}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Text style={styles.primaryButtonText}>Save Workout</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginLeft: 6 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  content: {
    padding: 24,
    paddingBottom: 50,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#27272A',
  },
  progressDotActive: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  progressLine: {
    height: 3,
    width: 40,
    backgroundColor: '#27272A',
  },
  progressLineActive: {
    backgroundColor: '#8B5CF6',
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FAFAFA',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#A1A1AA',
    marginTop: 24,
    marginBottom: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#18181B',
    color: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    backgroundColor: '#18181B',
    width: '23%',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
    overflow: 'hidden',
  },
  dayButtonSelected: {
    borderColor: 'transparent',
  },
  dayGradient: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    color: '#A1A1AA',
    fontWeight: '700',
    paddingVertical: 14,
  },
  dayTextSelected: {
    color: '#FFF',
    fontWeight: '800',
  },
  buttonWrapper: {
    marginTop: 40,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  daySection: {
    marginBottom: 24,
    backgroundColor: '#18181B',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayLabel: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#27272A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  tagSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  tagText: {
    color: '#E4E4E7',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#8B5CF6',
    fontWeight: '800',
  },
  customMuscleInput: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
    minWidth: 100,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  secondaryButton: {
    backgroundColor: '#18181B',
    padding: 16,
    borderRadius: 12,
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
    flexDirection: 'row',
  },
  secondaryButtonText: {
    color: '#E4E4E7',
    fontWeight: '700',
  },
  primaryButtonWrapper: {
    flex: 0.6,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
  exerciseDaySection: {
    marginBottom: 32,
  },
  exerciseDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    paddingBottom: 10,
  },
  exerciseDayLabel: {
    color: '#8B5CF6',
    fontSize: 22,
    fontWeight: '900',
    marginLeft: 8,
  },
  muscleSection: {
    marginBottom: 24,
  },
  muscleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  muscleLabel: {
    color: '#E4E4E7',
    fontSize: 18,
    fontWeight: '800',
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  addExerciseText: {
    color: '#06B6D4',
    fontWeight: '700',
    fontSize: 13,
  },
  exerciseCard: {
    backgroundColor: '#18181B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIndex: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  exInput: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3F3F46',
    fontSize: 16,
  },
  numSetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#09090B',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  numSetsLabel: {
    color: '#E4E4E7',
    fontSize: 14,
    marginRight: 12,
    fontWeight: '600',
  },
  numSetsInput: {
    backgroundColor: '#18181B',
    color: '#FAFAFA',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#27272A',
    padding: 10,
    borderRadius: 10,
  },
  setLabelContainer: {
    backgroundColor: '#3F3F46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    width: 60,
    alignItems: 'center',
  },
  setLabel: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '800',
  },
  setInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  setInputLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    marginRight: 8,
    fontWeight: '600',
  },
  setInput: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: '#3F3F46',
    minWidth: 60,
  },
});
