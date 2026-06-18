import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getWorkoutLogsForPlan, saveWorkoutLogLocally } from '../database/db';
import { syncDataWithServer } from '../utils/sync';
import api from '../utils/api';

const getTodayDayOfWeek = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

export default function WorkoutSessionScreen({ route, navigation }: any) {
  const { plan } = route.params;
  const [loadingEx, setLoadingEx] = useState<{ [key: string]: boolean }>({});
  const [allDays, setAllDays] = useState<any[]>([]);
  const [expandedDays, setExpandedDays] = useState<{ [day: string]: boolean }>({});
  const [expandedHistory, setExpandedHistory] = useState<{ [exKey: string]: boolean }>({});
  const [historyMap, setHistoryMap] = useState<{ [exKey: string]: any[] }>({});
  const [newLoads, setNewLoads] = useState<{ [exKey: string]: any }>({});
  const [aiSuggestions, setAiSuggestions] = useState<{ [exKey: string]: string }>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<{ [exKey: string]: boolean }>({});
  
  const [dayAnalysis, setDayAnalysis] = useState<{ [day: string]: string }>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<{ [day: string]: boolean }>({});

  const analyzeDay = async (dayObj: any) => {
    const day = dayObj.dayOfWeek;
    try {
      setLoadingAnalysis(prev => ({ ...prev, [day]: true }));
      const response = await api.post('/ai/analyze-day', {
        dayOfWeek: day,
        exercises: dayObj.exercises
      });
      if (response.data.success) {
        setDayAnalysis(prev => ({ ...prev, [day]: response.data.analysis }));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to get analysis.');
    } finally {
      setLoadingAnalysis(prev => ({ ...prev, [day]: false }));
    }
  };

  const fetchSuggestion = async (key: string, exName: string, history: any[]) => {
    try {
      setLoadingSuggestions(prev => ({ ...prev, [key]: true }));
      const response = await api.post('/ai/suggest-overload', { exerciseName: exName, history });
      if (response.data.success) {
        setAiSuggestions(prev => ({ ...prev, [key]: response.data.suggestion }));
      }
    } catch (e) {
      setAiSuggestions(prev => ({ ...prev, [key]: 'Error getting suggestion' }));
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [key]: false }));
    }
  };

  const todayLabel = getTodayDayOfWeek();

  useEffect(() => {
    let parsedDays = [];
    try {
      parsedDays = typeof plan.days === 'string' ? JSON.parse(plan.days) : plan.days;
    } catch (e) {
      parsedDays = [];
    }
    setAllDays(parsedDays);
    loadHistory(parsedDays);
  }, [plan]);

  const loadHistory = async (parsedDays: any[]) => {
    const planIdStr = plan.server_id || plan.id.toString();
    const logs = await getWorkoutLogsForPlan(planIdStr);
    
    const hMap: { [exKey: string]: any[] } = {};

    logs.forEach((logRow: any) => {
      let exList = [];
      try {
        exList = JSON.parse(logRow.exercises);
      } catch (e) {}

      exList.forEach((ex: any) => {
        const histKey = ex.name;
        if (!hMap[histKey]) hMap[histKey] = [];
        
        let setsData = ex.setsData;
        if (!setsData || setsData.length === 0) {
          setsData = [];
          const numSets = parseInt(ex.sets) || 1;
          for(let i=0; i<numSets; i++) {
            setsData.push({ weightLifted: parseFloat(ex.weightLifted) || 0, reps: parseInt(ex.reps) || 0 });
          }
        }

        hMap[histKey].push({
          date: new Date(logRow.date).toLocaleDateString(),
          dateObj: new Date(logRow.date),
          setsData: setsData
        });
      });
    });

    setHistoryMap(hMap);

    const initNewLoads: any = {};
    parsedDays.forEach((d: any) => {
      d.exercises.forEach((ex: any) => {
        const key = `${d.dayOfWeek}_${ex.name}`;
        const histKey = ex.name;
        
        let initialSetsData = [];
        let numSets = 0;

        if (hMap[histKey] && hMap[histKey].length > 0) {
          const lastLoad = hMap[histKey][0];
          initialSetsData = JSON.parse(JSON.stringify(lastLoad.setsData));
          numSets = initialSetsData.length;
        } else if (ex.setsData && ex.setsData.length > 0) {
          initialSetsData = JSON.parse(JSON.stringify(ex.setsData));
          numSets = initialSetsData.length;
        } else {
          numSets = parseInt(ex.sets) || 1;
          for(let i=0; i<numSets; i++) {
            initialSetsData.push({ weightLifted: ex.weightLifted?.toString() || '0', reps: ex.reps?.toString() || '0' });
          }
        }

        initNewLoads[key] = {
          numSets: numSets.toString(),
          setsData: initialSetsData.map((s: any) => ({
            weightLifted: s.weightLifted.toString(),
            reps: s.reps.toString()
          }))
        };
      });
    });
    setNewLoads(initNewLoads);
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const toggleHistory = (key: string) => {
    setExpandedHistory(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSetCount = (key: string, countStr: string) => {
    const count = parseInt(countStr) || 0;
    setNewLoads(prev => {
      const current = prev[key];
      let newSetsData = [...current.setsData];
      
      if (count > newSetsData.length) {
        const lastSet = newSetsData[newSetsData.length - 1] || { weightLifted: '0', reps: '0' };
        for (let i = newSetsData.length; i < count; i++) {
          newSetsData.push({ ...lastSet });
        }
      } else if (count < newSetsData.length) {
        newSetsData = newSetsData.slice(0, count);
      }

      return {
        ...prev,
        [key]: { ...current, numSets: countStr, setsData: newSetsData }
      };
    });
  };

  const updateSetData = (key: string, setIndex: number, field: string, value: string) => {
    setNewLoads(prev => {
      const current = prev[key];
      const newSetsData = [...current.setsData];
      newSetsData[setIndex] = { ...newSetsData[setIndex], [field]: value };
      
      return {
        ...prev,
        [key]: { ...current, setsData: newSetsData }
      };
    });
  };

  const handleSaveExercise = async (dayObj: any, ex: any) => {
    const key = `${dayObj.dayOfWeek}_${ex.name}`;
    const load = newLoads[key];

    if (!load || load.setsData.length === 0) {
      Alert.alert('Error', 'Please enter at least 1 set.');
      return;
    }

    setLoadingEx(prev => ({ ...prev, [key]: true }));

    const parsedSetsData = load.setsData.map((s: any) => ({
      weightLifted: parseFloat(s.weightLifted) || 0,
      reps: parseInt(s.reps, 10) || 0
    }));

    const workoutLog = {
      planId: plan.server_id || plan.id.toString(),
      planName: plan.name,
      date: new Date().toISOString(),
      exercises: [
        {
          dayOfWeek: dayObj.dayOfWeek,
          muscle: ex.muscle,
          name: ex.name,
          setsData: parsedSetsData,
          weightLifted: parsedSetsData.length > 0 ? parsedSetsData[0].weightLifted : 0,
          sets: parsedSetsData.length,
          reps: parsedSetsData.length > 0 ? parsedSetsData[0].reps : 0,
        }
      ]
    };

    try {
      await saveWorkoutLogLocally(workoutLog, false);
      syncDataWithServer(); 
      
      const histKey = ex.name;
      setHistoryMap(prev => {
        const curHist = prev[histKey] || [];
        return {
          ...prev,
          [histKey]: [
            {
              date: new Date().toLocaleDateString(),
              dateObj: new Date(),
              setsData: parsedSetsData
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
      <Text style={styles.planName}>{plan.name} - Full Routine</Text>
      <Text style={styles.instructions}>Review your routine. Log any day's workout by editing your numbers and clicking "Save".</Text>

      {allDays.map(dayObj => {
        const isExpanded = expandedDays[dayObj.dayOfWeek];
        const isToday = dayObj.dayOfWeek === todayLabel;
        const muscles = Array.from(new Set(dayObj.exercises.map((e:any) => e.muscle))).join(', ');
        
        return (
          <View key={dayObj.dayOfWeek} style={[styles.dayCard, isToday && styles.highlightedDay]}>
            <TouchableOpacity 
              style={styles.dayHeader} 
              onPress={() => toggleDay(dayObj.dayOfWeek)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={[styles.dayTitle, isToday && styles.highlightedText]}>
                  {dayObj.dayOfWeek} {isToday && '(Today)'}
                </Text>
                <Text style={styles.muscleSummary}>{muscles || 'Rest Day'}</Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.exercisesContainer}>
                
                {dayObj.exercises && dayObj.exercises.length > 0 && (
                  <View style={styles.dayAnalysisBox}>
                    {dayAnalysis[dayObj.dayOfWeek] ? (
                      <View style={styles.analysisResultBox}>
                        <Text style={styles.analysisResultTitle}>🧠 AI Day Analysis</Text>
                        <Text style={styles.analysisResultText}>{dayAnalysis[dayObj.dayOfWeek]}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.analyzeDayButton} 
                        onPress={() => analyzeDay(dayObj)}
                        disabled={loadingAnalysis[dayObj.dayOfWeek]}
                      >
                        {loadingAnalysis[dayObj.dayOfWeek] ? (
                          <ActivityIndicator color="#000" />
                        ) : (
                          <Text style={styles.analyzeDayButtonText}>🧠 Analyze Day with AI</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {(!dayObj.exercises || dayObj.exercises.length === 0) ? (
                  <Text style={styles.restDayText}>No exercises scheduled. Take a break!</Text>
                ) : (
                  dayObj.exercises.map((ex: any, index: number) => {
                    const key = `${dayObj.dayOfWeek}_${ex.name}`;
                    const histKey = ex.name;
                    const history = historyMap[histKey] || [];
                    const lastLoad = history.length > 0 ? history[0] : null;
                    const loadState = newLoads[key];
                    const histExpanded = expandedHistory[key];
                    const isSaving = loadingEx[key];

                    if (!loadState) return null;

                    return (
                      <View key={key} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseName}>{index + 1}. {ex.name}</Text>
                          <Text style={styles.muscleLabel}>{ex.muscle}</Text>
                        </View>
                        
                        {lastLoad && (
                          <View style={styles.lastLoadContainer}>
                            <Text style={styles.lastLoadTitle}>Last Saved Load</Text>
                            {lastLoad.setsData.map((s: any, idx: number) => (
                              <Text key={idx} style={styles.lastLoadText}>
                                Set {idx + 1}: {s.weightLifted} kg  ×  {s.reps} reps
                              </Text>
                            ))}
                          </View>
                        )}

                        <View style={styles.aiSuggestionBox}>
                          {aiSuggestions[key] ? (
                            <Text style={styles.aiSuggestionText}>✨ AI: {aiSuggestions[key]}</Text>
                          ) : (
                            <TouchableOpacity onPress={() => fetchSuggestion(key, ex.name, history)} disabled={loadingSuggestions[key]}>
                              {loadingSuggestions[key] ? <ActivityIndicator size="small" color="#bb86fc" /> : <Text style={styles.aiButtonText}>✨ Get AI Overload Suggestion</Text>}
                            </TouchableOpacity>
                          )}
                        </View>

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
                                  const chartData = [...history].reverse();
                                  
                                  const labels = chartData.map(h => {
                                    const d = h.dateObj;
                                    return `${d.getMonth()+1}/${d.getDate()}`;
                                  });
                                  
                                  const weights = chartData.map(h => Math.max(...h.setsData.map((s:any) => s.weightLifted)) || 0);
                                  const repsData = chartData.map(h => h.setsData.reduce((sum:number, s:any) => sum + s.reps, 0) || 0);

                                  return (
                                    <>
                                      <LineChart
                                        data={{
                                          labels: labels,
                                          datasets: [
                                            {
                                              data: weights,
                                              color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
                                              strokeWidth: 3
                                            },
                                            {
                                              data: repsData,
                                              color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
                                              strokeWidth: 3
                                            }
                                          ],
                                          legend: ['Max Weight (kg)', 'Total Reps']
                                        }}
                                        width={Dimensions.get('window').width - 70}
                                        height={180}
                                        chartConfig={{
                                          backgroundColor: '#1C1C1E',
                                          backgroundGradientFrom: '#1C1C1E',
                                          backgroundGradientTo: '#1C1C1E',
                                          decimalPlaces: 0,
                                          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                          labelColor: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`,
                                          style: { borderRadius: 8 },
                                          propsForDots: { r: '4', strokeWidth: '2', stroke: '#FF2D55' }
                                        }}
                                        bezier
                                        style={{ marginVertical: 8, borderRadius: 8 }}
                                      />
                                      {history.slice(1).map((h, i) => (
                                        <View key={i} style={styles.historyItemBox}>
                                          <Text style={styles.historyItemDate}>{h.date}</Text>
                                          {h.setsData.map((s:any, idx:number) => (
                                            <Text key={idx} style={styles.historyItemText}>
                                              Set {idx + 1}: {s.weightLifted} kg × {s.reps} reps
                                            </Text>
                                          ))}
                                        </View>
                                      ))}
                                    </>
                                  );
                                })()}
                              </View>
                            )}
                          </View>
                        )}

                        <View style={styles.newLoadSection}>
                          <Text style={styles.newLoadTitle}>Add New Load</Text>
                          
                          <View style={styles.numSetsRow}>
                            <Text style={styles.numSetsLabel}>Number of Sets:</Text>
                            <TextInput
                              style={styles.numSetsInput}
                              keyboardType="numeric"
                              value={loadState.numSets}
                              onChangeText={(val) => updateSetCount(key, val)}
                            />
                          </View>

                          {loadState.setsData.map((setObj: any, sIdx: number) => (
                            <View key={sIdx} style={styles.setRow}>
                              <Text style={styles.setLabel}>Set {sIdx + 1}</Text>
                              <View style={styles.setInputGroup}>
                                <Text style={styles.setInputLabel}>kg</Text>
                                <TextInput
                                  style={styles.setInput}
                                  keyboardType="numeric"
                                  value={setObj.weightLifted}
                                  onChangeText={(val) => updateSetData(key, sIdx, 'weightLifted', val)}
                                />
                              </View>
                              <View style={styles.setInputGroup}>
                                <Text style={styles.setInputLabel}>reps</Text>
                                <TextInput
                                  style={styles.setInput}
                                  keyboardType="numeric"
                                  value={setObj.reps}
                                  onChangeText={(val) => updateSetData(key, sIdx, 'reps', val)}
                                />
                              </View>
                            </View>
                          ))}

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
    backgroundColor: '#000000',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  planName: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 5,
  },
  instructions: {
    color: '#8E8E93',
    fontSize: 15,
    marginBottom: 20,
  },
  dayCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#1C1C1E',
  },
  dayTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  highlightedDay: {
    borderWidth: 1,
    borderColor: '#FF2D55',
  },
  highlightedText: {
    color: '#FF2D55',
  },
  muscleSummary: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
  expandIcon: {
    color: '#8E8E93',
    fontSize: 18,
  },
  exercisesContainer: {
    padding: 15,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  restDayText: {
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  muscleLabel: {
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lastLoadContainer: {
    backgroundColor: '#1C1C1E',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  lastLoadTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  lastLoadText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 2,
  },
  historySection: {
    marginBottom: 12,
  },
  historyToggleText: {
    color: '#0A84FF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  historyList: {
    marginTop: 5,
    padding: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
  },
  historyItemBox: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    paddingBottom: 8,
    marginBottom: 8,
  },
  historyItemDate: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyItemText: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 2,
  },
  newLoadSection: {
    marginTop: 5,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
  },
  newLoadTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  numSetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  numSetsLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    marginRight: 10,
  },
  numSetsInput: {
    backgroundColor: '#1C1C1E',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#1C1C1E',
    padding: 10,
    borderRadius: 8,
  },
  setLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    width: 50,
  },
  setInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  setInputLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginRight: 5,
  },
  setInput: {
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    minWidth: 60,
  },
  saveExButton: {
    backgroundColor: '#FF2D55',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  saveExButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aiSuggestionBox: {
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  aiSuggestionText: {
    color: '#FF2D55',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  aiButtonText: {
    color: '#FF2D55',
    fontSize: 14,
    fontWeight: '600',
  },
  dayAnalysisBox: {
    marginBottom: 20,
  },
  analyzeDayButton: {
    backgroundColor: '#2C2C2E',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeDayButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisResultBox: {
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 12,
  },
  analysisResultTitle: {
    color: '#FF2D55',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  analysisResultText: {
    color: '#E5E5EA',
    fontSize: 15,
    lineHeight: 22,
  },
});

