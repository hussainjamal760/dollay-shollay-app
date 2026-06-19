import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
                        <View style={styles.analysisHeader}>
                          <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                          <Text style={styles.analysisResultTitle}>AI Day Analysis</Text>
                        </View>
                        <Text style={styles.analysisResultText}>{dayAnalysis[dayObj.dayOfWeek]}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.analyzeDayButtonWrapper} 
                        onPress={() => analyzeDay(dayObj)}
                        disabled={loadingAnalysis[dayObj.dayOfWeek]}
                      >
                        <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.analyzeDayButton}>
                          {loadingAnalysis[dayObj.dayOfWeek] ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <>
                              <Ionicons name="sparkles" size={18} color="#FFF" style={{marginRight: 8}} />
                              <Text style={styles.analyzeDayButtonText}>Analyze Day with AI</Text>
                            </>
                          )}
                        </LinearGradient>
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
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                              <Ionicons name="flash" size={16} color="#8B5CF6" style={{marginRight: 6}} />
                              <Text style={styles.aiSuggestionText}>{aiSuggestions[key]}</Text>
                            </View>
                          ) : (
                            <TouchableOpacity onPress={() => fetchSuggestion(key, ex.name, history)} disabled={loadingSuggestions[key]} style={{flexDirection: 'row', alignItems: 'center'}}>
                              {loadingSuggestions[key] ? <ActivityIndicator size="small" color="#8B5CF6" /> : (
                                <>
                                  <Ionicons name="flash" size={16} color="#8B5CF6" style={{marginRight: 6}} />
                                  <Text style={styles.aiButtonText}>Get AI Overload Suggestion</Text>
                                </>
                              )}
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
                                              color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // #8B5CF6
                                              strokeWidth: 3
                                            },
                                            {
                                              data: repsData,
                                              color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`, // #06B6D4
                                              strokeWidth: 3
                                            }
                                          ],
                                          legend: ['Max Weight (kg)', 'Total Reps']
                                        }}
                                        width={Dimensions.get('window').width - 70}
                                        height={180}
                                        chartConfig={{
                                          backgroundColor: '#18181B',
                                          backgroundGradientFrom: '#18181B',
                                          backgroundGradientTo: '#18181B',
                                          decimalPlaces: 0,
                                          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                          labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`,
                                          style: { borderRadius: 8 },
                                          propsForDots: { r: '4', strokeWidth: '2', stroke: '#8B5CF6' }
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
                            style={styles.saveExButtonWrapper} 
                            onPress={() => handleSaveExercise(dayObj, ex)}
                            disabled={isSaving}
                          >
                            <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveExButton}>
                              {isSaving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveExButtonText}>Save {ex.name}</Text>}
                            </LinearGradient>
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
    backgroundColor: '#09090B',
  },
  content: {
    padding: 24,
    paddingBottom: 50,
  },
  planName: {
    fontSize: 28,
    color: '#FAFAFA',
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  instructions: {
    color: '#A1A1AA',
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  dayCard: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#18181B',
  },
  dayTitle: {
    fontSize: 20,
    color: '#FAFAFA',
    fontWeight: '700',
  },
  highlightedDay: {
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  highlightedText: {
    color: '#8B5CF6',
  },
  muscleSummary: {
    color: '#A1A1AA',
    fontSize: 14,
    marginTop: 6,
  },
  expandIcon: {
    color: '#A1A1AA',
    fontSize: 18,
  },
  exercisesContainer: {
    padding: 20,
    backgroundColor: '#18181B',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  restDayText: {
    color: '#A1A1AA',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#27272A',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3F3F46',
  },
  exerciseName: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '700',
  },
  muscleLabel: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  lastLoadContainer: {
    backgroundColor: '#18181B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  lastLoadTitle: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  lastLoadText: {
    color: '#FAFAFA',
    fontSize: 14,
    marginBottom: 2,
  },
  historySection: {
    marginBottom: 16,
  },
  historyToggleText: {
    color: '#06B6D4',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
    fontWeight: '600',
  },
  historyList: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#18181B',
    borderRadius: 12,
  },
  historyItemBox: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    paddingBottom: 10,
    marginBottom: 10,
  },
  historyItemDate: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  historyItemText: {
    color: '#A1A1AA',
    fontSize: 14,
    marginBottom: 2,
  },
  newLoadSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3F3F46',
  },
  newLoadTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  numSetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  numSetsLabel: {
    color: '#FAFAFA',
    fontSize: 15,
    marginRight: 12,
    fontWeight: '500',
  },
  numSetsInput: {
    backgroundColor: '#18181B',
    color: '#FAFAFA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#18181B',
    padding: 12,
    borderRadius: 12,
  },
  setLabel: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '700',
    width: 50,
  },
  setInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  setInputLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    marginRight: 6,
  },
  setInput: {
    backgroundColor: '#27272A',
    color: '#FAFAFA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
  },
  saveExButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  saveExButton: {
    padding: 16,
    alignItems: 'center',
  },
  saveExButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  aiSuggestionBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  aiSuggestionText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  aiButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '700',
  },
  dayAnalysisBox: {
    marginBottom: 24,
  },
  analyzeDayButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  analyzeDayButton: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  analyzeDayButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  analysisResultBox: {
    backgroundColor: '#18181B',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  analysisResultTitle: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  analysisResultText: {
    color: '#E4E4E7',
    fontSize: 15,
    lineHeight: 24,
  },
});

