import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { getUserLocally, getDietLogsLocally, saveDietLogLocally, deleteDietLogLocally } from '../database/db';
import { calculateMacroGoals } from '../utils/diet';
import api from '../utils/api';
import { useIsFocused } from '@react-navigation/native';

export default function DietScreen() {
  const isFocused = useIsFocused();
  
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  
  const [foodText, setFoodText] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [calories, setCalories] = useState('');
  
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const user = await getUserLocally();
    const calculatedGoals = calculateMacroGoals(user);
    setGoals(calculatedGoals);

    const allLogs = await getDietLogsLocally();
    setLogs(allLogs);

    // Calculate today's consumed macros
    const todayStr = new Date().toISOString().split('T')[0];
    let cCals = 0, cPro = 0, cCarbs = 0, cFat = 0;
    
    allLogs.forEach((log: any) => {
      if (log.date === todayStr) {
        cCals += log.calories || 0;
        cPro += log.protein || 0;
        cCarbs += log.carbs || 0;
        cFat += log.fat || 0;
      }
    });
    
    setConsumed({ calories: cCals, protein: cPro, carbs: cCarbs, fat: cFat });
  };

  const handleAnalyze = async () => {
    if (!foodText.trim()) {
      Alert.alert('Error', 'Please enter what you ate first.');
      return;
    }
    setAnalyzing(true);
    try {
      const response = await api.post('/ai/analyze-food', { foodText });
      if (response.data.success && response.data.macros) {
        const m = response.data.macros;
        setProtein(m.protein.toString());
        setCarbs(m.carbs.toString());
        setFat(m.fat.toString());
        setCalories(m.calories.toString());
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to analyze food.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddMeal = async () => {
    if (!foodText.trim()) {
      Alert.alert('Error', 'Please describe the meal.');
      return;
    }
    
    const log = {
      date: new Date().toISOString().split('T')[0],
      food_text: foodText,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      calories: parseFloat(calories) || 0
    };

    await saveDietLogLocally(log);
    
    // Reset form
    setFoodText('');
    setProtein('');
    setCarbs('');
    setFat('');
    setCalories('');
    
    loadData();
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Delete Meal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteDietLogLocally(id);
        loadData();
      }}
    ]);
  };

  const renderProgressBar = (label: string, current: number, target: number, color: string, unit: string = 'g') => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    return (
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValues}>{Math.round(current)} / {target}{unit}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Diet & Macros</Text>
        
        {/* Dashboard */}
        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardTitle}>Today's Goals</Text>
          {renderProgressBar('Calories', consumed.calories, goals.calories, '#03DAC6', ' kcal')}
          {renderProgressBar('Protein', consumed.protein, goals.protein, '#bb86fc')}
          {renderProgressBar('Carbs', consumed.carbs, goals.carbs, '#ffb74d')}
          {renderProgressBar('Fat', consumed.fat, goals.fat, '#e57373')}
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add Meal</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 2 eggs and 1 slice of bread"
            placeholderTextColor="#888"
            value={foodText}
            onChangeText={setFoodText}
            multiline
          />
          
          <View style={styles.macrosInputRow}>
            <View style={styles.macroInputBox}>
              <Text style={styles.macroInputLabel}>Protein</Text>
              <TextInput style={styles.macroInput} keyboardType="numeric" value={protein} onChangeText={setProtein} />
            </View>
            <View style={styles.macroInputBox}>
              <Text style={styles.macroInputLabel}>Carbs</Text>
              <TextInput style={styles.macroInput} keyboardType="numeric" value={carbs} onChangeText={setCarbs} />
            </View>
            <View style={styles.macroInputBox}>
              <Text style={styles.macroInputLabel}>Fat</Text>
              <TextInput style={styles.macroInput} keyboardType="numeric" value={fat} onChangeText={setFat} />
            </View>
            <View style={styles.macroInputBox}>
              <Text style={styles.macroInputLabel}>Kcal</Text>
              <TextInput style={styles.macroInput} keyboardType="numeric" value={calories} onChangeText={setCalories} />
            </View>
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.aiBtn} onPress={handleAnalyze} disabled={analyzing}>
              {analyzing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.aiBtnText}>🪄 Analyze with AI</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddMeal}>
              <Text style={styles.addBtnText}>Save Meal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meal History */}
        <Text style={styles.historyTitle}>Meal History</Text>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No meals logged yet.</Text>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logDate}>{log.date}</Text>
                <TouchableOpacity onPress={() => handleDelete(log.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.logFood}>{log.food_text}</Text>
              <View style={styles.logMacros}>
                <Text style={styles.logMacroText}>P: {log.protein}g</Text>
                <Text style={styles.logMacroText}>C: {log.carbs}g</Text>
                <Text style={styles.logMacroText}>F: {log.fat}g</Text>
                <Text style={[styles.logMacroText, {color: '#03DAC6'}]}>{log.calories} kcal</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 20,
  },
  dashboardCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  dashboardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressRow: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressValues: {
    color: '#fff',
    fontSize: 14,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  formCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#121212',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  macrosInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  macroInputBox: {
    width: '23%',
  },
  macroInputLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
  },
  macroInput: {
    backgroundColor: '#121212',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiBtn: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderWidth: 1,
    borderColor: '#bb86fc',
    flex: 1,
    marginRight: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiBtnText: {
    color: '#bb86fc',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: '#03DAC6',
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#03DAC6',
    marginBottom: 15,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
  },
  logCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logDate: {
    color: '#aaa',
    fontSize: 12,
  },
  deleteText: {
    color: '#CF6679',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logFood: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  logMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#252525',
    padding: 10,
    borderRadius: 8,
  },
  logMacroText: {
    color: '#ddd',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
