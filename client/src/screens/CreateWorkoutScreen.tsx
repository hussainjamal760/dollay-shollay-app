import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { saveWorkoutLocally } from '../database/db';
import { syncDataWithServer } from '../utils/sync';

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
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Basic Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Workout Plan Name (e.g. Push Pull Legs)"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />
      
      <Text style={styles.sectionTitle}>Select Days</Text>
      <View style={styles.daysContainer}>
        {DAYS_OF_WEEK.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayButton, selectedDays.includes(day) && styles.dayButtonSelected]}
            onPress={() => toggleDay(day)}
          >
            <Text style={[styles.dayText, selectedDays.includes(day) && styles.dayTextSelected]}>
              {day.substring(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => {
          if (!name || selectedDays.length === 0) {
            Alert.alert('Error', 'Please enter name and select days');
            return;
          }
          setStep(2);
        }}
      >
        <Text style={styles.buttonText}>Next: Select Muscles</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Target Muscles</Text>
      {selectedDays.map(day => {
        const allMuscles = [...MUSCLES, ...customMuscles];
        return (
          <View key={day} style={styles.daySection}>
            <Text style={styles.dayLabel}>{day}</Text>
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
                placeholderTextColor="#999"
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
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(3)}>
          <Text style={styles.primaryButtonText}>Next: Exercises</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Exercises Detail</Text>
      
      {selectedDays.map(day => {
        const muscles = dayMuscles[day] || [];
        if (muscles.length === 0) return null;
        
        return (
          <View key={day} style={styles.exerciseDaySection}>
            <Text style={styles.exerciseDayLabel}>{day}</Text>
            
            {muscles.map(muscle => (
              <View key={muscle} style={styles.muscleSection}>
                <View style={styles.muscleHeader}>
                  <Text style={styles.muscleLabel}>{muscle}</Text>
                  <TouchableOpacity onPress={() => addExercise(day, muscle)} style={styles.addExerciseBtn}>
                    <Text style={styles.addExerciseText}>+ Add Exercise</Text>
                  </TouchableOpacity>
                </View>

                {exercises.filter(ex => ex.dayOfWeek === day && ex.muscle === muscle).map((ex, index) => (
                  <View key={ex.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseIndex}>Exercise {index + 1}</Text>
                      <TouchableOpacity onPress={() => removeExercise(ex.id)}>
                        <Text style={styles.removeText}>X</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.exInput}
                      placeholder="Exercise Name"
                      placeholderTextColor="#999"
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
                        <Text style={styles.setLabel}>Set {sIdx + 1}</Text>
                        <View style={styles.setInputGroup}>
                          <Text style={styles.setInputLabel}>kg</Text>
                          <TextInput
                            style={styles.setInput}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#666"
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
                            placeholderTextColor="#666"
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
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.saveButtonText}>Save Workout</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  progressDot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#333',
  },
  progressDotActive: {
    backgroundColor: '#bb86fc',
  },
  progressLine: {
    height: 3,
    width: 40,
    backgroundColor: '#333',
  },
  progressLineActive: {
    backgroundColor: '#bb86fc',
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#bb86fc',
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 'bold',
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
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    backgroundColor: '#1e1e1e',
    width: '23%',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  dayButtonSelected: {
    backgroundColor: '#bb86fc',
    borderColor: '#bb86fc',
  },
  dayText: {
    color: '#ccc',
    fontWeight: 'bold',
  },
  dayTextSelected: {
    color: '#000',
  },
  button: {
    backgroundColor: '#bb86fc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  daySection: {
    marginBottom: 20,
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
  },
  dayLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  tagSelected: {
    backgroundColor: '#bb86fc',
  },
  tagText: {
    color: '#ccc',
  },
  tagTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  customMuscleInput: {
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
    minWidth: 80,
    textAlign: 'center',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#bb86fc',
    padding: 15,
    borderRadius: 8,
    flex: 0.65,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#03DAC6',
    padding: 15,
    borderRadius: 8,
    flex: 0.65,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  exerciseDaySection: {
    marginBottom: 30,
  },
  exerciseDayLabel: {
    color: '#bb86fc',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 5,
  },
  muscleSection: {
    marginBottom: 20,
  },
  muscleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  muscleLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addExerciseBtn: {
    padding: 5,
  },
  addExerciseText: {
    color: '#03DAC6',
    fontWeight: 'bold',
  },
  exerciseCard: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  exerciseIndex: {
    color: '#999',
    fontSize: 12,
  },
  removeText: {
    color: '#CF6679',
    fontWeight: 'bold',
  },
  exInput: {
    backgroundColor: '#2c2c2c',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  numSetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  numSetsLabel: {
    color: '#bbb',
    fontSize: 14,
    marginRight: 10,
  },
  numSetsInput: {
    backgroundColor: '#111',
    color: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#444',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#222',
    padding: 8,
    borderRadius: 8,
  },
  setLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    width: 45,
  },
  setInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  setInputLabel: {
    color: '#999',
    fontSize: 11,
    marginRight: 5,
  },
  setInput: {
    backgroundColor: '#111',
    color: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 55,
  },
});
