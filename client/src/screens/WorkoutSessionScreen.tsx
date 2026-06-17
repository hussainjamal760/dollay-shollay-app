import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getWorkoutLogsForPlan, saveWorkoutLogLocally } from '../database/db';
import { syncDataWithServer } from '../utils/sync';

export default function WorkoutSessionScreen({ route, navigation }: any) {
  const { plan } = route.params;
  const [loadingEx, setLoadingEx] = useState<{ [key: string]: boolean }>({});
  const [allDays, setAllDays] = useState<any[]>([]);
  const [expandedDays, setExpandedDays] = useState<{ [day: string]: boolean }>({});
  const [expandedHistory, setExpandedHistory] = useState<{ [exKey: string]: boolean }>({});
  
  const [historyMap, setHistoryMap] = useState<{ [exKey: string]: any[] }>({});
  const [newLoads, setNewLoads] = useState<{ [exKey: string]: any }>({});

  useEffect(() => {
    let parsedDays = [];
    try {
      parsedDays = typeof plan.days === 'string' ? JSON.parse(plan.days) : plan.days;
    } catch (e) {
      parsedDays = [];
    }

    setAllDays(parsedDays);

    const initNewLoads: any = {};
    parsedDays.forEach((d: any) => {
      d.exercises.forEach((ex: any) => {
        const key = `${d.dayOfWeek}_${ex.name}`;
        initNewLoads[key] = {
          weightLifted: ex.weightLifted ? ex.weightLifted.toString() : '0',
          sets: ex.sets ? ex.sets.toString() : '0',
          reps: ex.reps ? ex.reps.toString() : '0'
        };
      });
    });
    setNewLoads(initNewLoads);

    loadHistory();
  }, [plan]);

  const loadHistory = async () => {
    const planIdStr = plan.server_id || plan.id.toString();
    const logs = await getWorkoutLogsForPlan(planIdStr);
    
    const hMap: { [exKey: string]: any[] } = {};

    logs.forEach((logRow: any) => {
      let exList = [];
      try {
        exList = JSON.parse(logRow.exercises);
      } catch (e) {}

      exList.forEach((ex: any) => {
        // Since old logs might not have dayOfWeek saved natively in the exercise object,
        // we'll try to map it by name. If they did the same exercise on 2 days, they share history.
        // But let's build keys dynamically. If we don't have dayOfWeek in the log, we fallback to just name.
        const keyMatch = ex.dayOfWeek ? `${ex.dayOfWeek}_${ex.name}` : ex.name;
        
        // We'll populate history map based on just exercise name to be safe across days,
        // or specifically by day if tracked. Let's just use the exact name for history.
        const histKey = ex.name;
        if (!hMap[histKey]) hMap[histKey] = [];
        hMap[histKey].push({
          date: new Date(logRow.date).toLocaleDateString(),
          weightLifted: ex.weightLifted,
          sets: ex.sets,
          reps: ex.reps
        });
      });
    });

    setHistoryMap(hMap);
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const toggleHistory = (key: string) => {
    setExpandedHistory(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateNewLoad = (key: string, field: string, value: string) => {
    setNewLoads(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveExercise = async (dayObj: any, ex: any) => {
    const key = `${dayObj.dayOfWeek}_${ex.name}`;
    const load = newLoads[key];

    if (!load) return;

    setLoadingEx(prev => ({ ...prev, [key]: true }));

    const workoutLog = {
      planId: plan.server_id || plan.id.toString(),
      planName: plan.name,
      date: new Date().toISOString(),
      exercises: [
        {
          dayOfWeek: dayObj.dayOfWeek,
          muscle: ex.muscle,
          name: ex.name,
          weightLifted: parseFloat(load.weightLifted) || 0,
          sets: parseInt(load.sets, 10) || 0,
          reps: parseInt(load.reps, 10) || 0
        }
      ]
    };

    try {
      await saveWorkoutLogLocally(workoutLog, false);
      syncDataWithServer(); // Fire and forget sync
      
      // Update history map locally instantly
      const histKey = ex.name;
      setHistoryMap(prev => {
        const curHist = prev[histKey] || [];
        return {
          ...prev,
          [histKey]: [
            {
              date: new Date().toLocaleDateString(),
              weightLifted: workoutLog.exercises[0].weightLifted,
              sets: workoutLog.exercises[0].sets,
              reps: workoutLog.exercises[0].reps
            },
            ...curHist
          ]
        };
      });
      
      Alert.alert('Saved!', `${ex.name} logged successfully.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save load');
    } finally {
      setLoadingEx(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.instructions}>Click a day to view exercises and log your progress.</Text>

      {allDays.map(dayObj => {
        const isExpanded = expandedDays[dayObj.dayOfWeek];
        // Unique muscles for the day summary
        const muscles = Array.from(new Set(dayObj.exercises.map((e:any) => e.muscle))).join(', ');
        
        return (
          <View key={dayObj.dayOfWeek} style={styles.dayCard}>
            <TouchableOpacity 
              style={styles.dayHeader} 
              onPress={() => toggleDay(dayObj.dayOfWeek)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.dayTitle}>{dayObj.dayOfWeek}</Text>
                <Text style={styles.muscleSummary}>{muscles || 'Rest Day'}</Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.exercisesContainer}>
                {(!dayObj.exercises || dayObj.exercises.length === 0) ? (
                  <Text style={styles.restDayText}>No exercises scheduled. Take a break!</Text>
                ) : (
                  dayObj.exercises.map((ex: any, index: number) => {
                    const key = `${dayObj.dayOfWeek}_${ex.name}`;
                    const histKey = ex.name;
                    const history = historyMap[histKey] || [];
                    const lastLoad = history.length > 0 ? history[0] : ex;
                    const loadState = newLoads[key] || {};
                    const histExpanded = expandedHistory[key];
                    const isSaving = loadingEx[key];

                    return (
                      <View key={key} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseName}>{index + 1}. {ex.name}</Text>
                          <Text style={styles.muscleLabel}>{ex.muscle}</Text>
                        </View>
                        
                        {/* Current/Last Saved Load */}
                        <View style={styles.lastLoadContainer}>
                          <Text style={styles.lastLoadTitle}>Last Saved Load</Text>
                          <Text style={styles.lastLoadText}>
                            {lastLoad.weightLifted} kg  ×  {lastLoad.sets} sets  ×  {lastLoad.reps} reps
                          </Text>
                        </View>

                        {/* History Dropdown */}
                        {history.length > 1 && (
                          <View style={styles.historySection}>
                            <TouchableOpacity onPress={() => toggleHistory(key)}>
                              <Text style={styles.historyToggleText}>
                                {histExpanded ? 'Hide History ▲' : `View Past History (${history.length - 1} more) ▼`}
                              </Text>
                            </TouchableOpacity>
                            {histExpanded && (
                              <View style={styles.historyList}>
                                {(() => {
                                  // Prepare chronologically sorted data for the chart (excluding the active "New Load" which isn't saved yet)
                                  // history array is already sorted DESC. We reverse it for chronological plotting.
                                  const chartData = [...history].reverse();
                                  
                                  const labels = chartData.map(h => {
                                    const d = new Date(h.date);
                                    return `${d.getMonth()+1}/${d.getDate()}`; // MM/DD
                                  });
                                  
                                  const weights = chartData.map(h => parseFloat(h.weightLifted) || 0);
                                  const repsData = chartData.map(h => parseInt(h.reps) || 0);

                                  return (
                                    <>
                                      <LineChart
                                        data={{
                                          labels: labels,
                                          datasets: [
                                            {
                                              data: weights,
                                              color: (opacity = 1) => `rgba(3, 218, 198, ${opacity})`, // Cyan for weight
                                              strokeWidth: 2
                                            },
                                            {
                                              data: repsData,
                                              color: (opacity = 1) => `rgba(187, 134, 252, ${opacity})`, // Purple for reps
                                              strokeWidth: 2
                                            }
                                          ],
                                          legend: ['Weight (kg)', 'Reps']
                                        }}
                                        width={Dimensions.get('window').width - 70} // Responsive width
                                        height={180}
                                        chartConfig={{
                                          backgroundColor: '#1a1a1a',
                                          backgroundGradientFrom: '#1a1a1a',
                                          backgroundGradientTo: '#1a1a1a',
                                          decimalPlaces: 0,
                                          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                          labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity})`,
                                          style: { borderRadius: 8 },
                                          propsForDots: { r: '4', strokeWidth: '1', stroke: '#fff' }
                                        }}
                                        bezier
                                        style={{ marginVertical: 8, borderRadius: 8 }}
                                      />
                                      {history.slice(1).map((h, i) => (
                                        <Text key={i} style={styles.historyItemText}>
                                          {h.date}: {h.weightLifted} kg × {h.sets} sets × {h.reps} reps
                                        </Text>
                                      ))}
                                    </>
                                  );
                                })()}
                              </View>
                            )}
                          </View>
                        )}

                        {/* Add New Load */}
                        <View style={styles.newLoadSection}>
                          <Text style={styles.newLoadTitle}>Add New Load</Text>
                          <View style={styles.inputsRow}>
                            <View style={styles.inputGroup}>
                              <Text style={styles.inputLabel}>Weight (kg)</Text>
                              <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={loadState.weightLifted}
                                onChangeText={(val) => updateNewLoad(key, 'weightLifted', val)}
                              />
                            </View>
                            <View style={styles.inputGroup}>
                              <Text style={styles.inputLabel}>Sets</Text>
                              <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={loadState.sets}
                                onChangeText={(val) => updateNewLoad(key, 'sets', val)}
                              />
                            </View>
                            <View style={styles.inputGroup}>
                              <Text style={styles.inputLabel}>Reps</Text>
                              <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={loadState.reps}
                                onChangeText={(val) => updateNewLoad(key, 'reps', val)}
                              />
                            </View>
                          </View>

                          <TouchableOpacity 
                            style={styles.saveExButton} 
                            onPress={() => handleSaveExercise(dayObj, ex)}
                            disabled={isSaving}
                          >
                            {isSaving ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.saveExButtonText}>Save {ex.name}</Text>}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        );
      })}
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
  planName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  instructions: {
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
  },
  dayCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#252525',
  },
  dayTitle: {
    fontSize: 20,
    color: '#03DAC6',
    fontWeight: 'bold',
  },
  muscleSummary: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 3,
  },
  expandIcon: {
    color: '#03DAC6',
    fontSize: 18,
  },
  exercisesContainer: {
    padding: 15,
    backgroundColor: '#1e1e1e',
  },
  restDayText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  exerciseName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  muscleLabel: {
    color: '#bb86fc',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  lastLoadContainer: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#bb86fc',
  },
  lastLoadTitle: {
    color: '#bb86fc',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastLoadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historySection: {
    marginBottom: 12,
  },
  historyToggleText: {
    color: '#03DAC6',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 5,
  },
  historyList: {
    marginTop: 5,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  historyItemText: {
    color: '#bbb',
    fontSize: 13,
    marginBottom: 4,
  },
  newLoadSection: {
    marginTop: 5,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  newLoadTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabel: {
    color: '#999',
    fontSize: 11,
    marginBottom: 5,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#444',
  },
  saveExButton: {
    backgroundColor: '#03DAC6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  saveExButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
