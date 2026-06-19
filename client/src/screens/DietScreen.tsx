import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { getUserLocally, getDietLogsLocally, saveDietLogLocally, deleteDietLogLocally, saveUserLocally } from '../database/db';
import { calculateMacroGoals } from '../utils/diet';
import api from '../utils/api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [savingGoals, setSavingGoals] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const user = await getUserLocally();
    let calculatedGoals = calculateMacroGoals(user);
    if (user && user.customMacros) {
      calculatedGoals = user.customMacros;
    }
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

  const openEditModal = () => {
    setCustomCalories(goals.calories.toString());
    setCustomProtein(goals.protein.toString());
    setCustomCarbs(goals.carbs.toString());
    setCustomFat(goals.fat.toString());
    setEditModalVisible(true);
  };

  const saveCustomGoals = async () => {
    setSavingGoals(true);
    const newMacros = {
      calories: parseFloat(customCalories) || goals.calories,
      protein: parseFloat(customProtein) || goals.protein,
      carbs: parseFloat(customCarbs) || goals.carbs,
      fat: parseFloat(customFat) || goals.fat
    };
    
    try {
      await api.put('/auth/updateMacros', { customMacros: newMacros });
    } catch(e) {
      // It's okay if offline, we'll sync later
    }
    
    const user = await getUserLocally();
    if (user) {
      user.customMacros = newMacros;
      await saveUserLocally(user, false);
    }
    
    setGoals(newMacros);
    setEditModalVisible(false);
    setSavingGoals(false);
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

  const renderProgressBar = (label: string, current: number, target: number, colors: string[], unit: string = 'g', icon: string) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    return (
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLabelRow}>
            <Ionicons name={icon as any} size={16} color={colors[1]} style={{marginRight: 6}} />
            <Text style={styles.progressLabel}>{label}</Text>
          </View>
          <Text style={styles.progressValues}>
            <Text style={{color: '#FAFAFA', fontWeight: '800'}}>{Math.round(current)}</Text>
            <Text style={{color: '#71717A'}}> / {target}{unit}</Text>
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={colors}
            start={{x:0, y:0}}
            end={{x:1, y:0}}
            style={[styles.progressBarFill, { width: `${percentage}%` }]}
          />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(400)} style={styles.headerTitle}>Diet & Macros</Animated.Text>
        
        {/* Dashboard */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.dashboardCard}>
          <View style={styles.dashboardHeaderRow}>
            <Text style={styles.dashboardTitle}>Today's Goals</Text>
            <TouchableOpacity onPress={openEditModal} style={styles.editGoalsBtn}>
              <Ionicons name="pencil" size={14} color="#A1A1AA" />
              <Text style={styles.editGoalsText}>Edit Goals</Text>
            </TouchableOpacity>
          </View>
          {renderProgressBar('Calories', consumed.calories, goals.calories, ['#06B6D4', '#22D3EE'], ' kcal', 'flame')}
          {renderProgressBar('Protein', consumed.protein, goals.protein, ['#6366F1', '#8B5CF6'], 'g', 'barbell')}
          {renderProgressBar('Carbs', consumed.carbs, goals.carbs, ['#F59E0B', '#FBBF24'], 'g', 'restaurant')}
          {renderProgressBar('Fat', consumed.fat, goals.fat, ['#EF4444', '#F87171'], 'g', 'water')}
        </Animated.View>

        {/* Input Form */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <Ionicons name="add-circle" size={20} color="#8B5CF6" />
            <Text style={styles.formTitle}>Add Meal</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 2 eggs and 1 slice of bread"
            placeholderTextColor="#71717A"
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
            <TouchableOpacity style={styles.aiBtnWrapper} onPress={handleAnalyze} disabled={analyzing}>
              <LinearGradient colors={['rgba(99,102,241,0.1)', 'rgba(139,92,246,0.1)']} style={styles.aiBtn}>
                {analyzing ? <ActivityIndicator size="small" color="#8B5CF6" /> : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#8B5CF6" style={{marginRight: 6}} />
                    <Text style={styles.aiBtnText}>Analyze with AI</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.addBtnWrapper} onPress={handleAddMeal}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.addBtn}>
                <Text style={styles.addBtnText}>Save Meal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Meal History */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={styles.historyTitle}>Meal History</Text>
          {logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="fast-food-outline" size={40} color="#3F3F46" />
              <Text style={styles.emptyText}>No meals logged yet.</Text>
            </View>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logDate}>{log.date}</Text>
                  <TouchableOpacity onPress={() => handleDelete(log.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.logFood}>{log.food_text}</Text>
                <View style={styles.logMacros}>
                  <Text style={styles.logMacroText}>P: {log.protein}g</Text>
                  <Text style={styles.logMacroText}>C: {log.carbs}g</Text>
                  <Text style={styles.logMacroText}>F: {log.fat}g</Text>
                  <View style={styles.kcalBadge}>
                    <Text style={styles.kcalText}>{log.calories} kcal</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Edit Goals Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Custom Goals</Text>
            
            <Text style={styles.modalLabel}>Calories (kcal)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={customCalories} onChangeText={setCustomCalories} />
            
            <Text style={styles.modalLabel}>Protein (g)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={customProtein} onChangeText={setCustomProtein} />
            
            <Text style={styles.modalLabel}>Carbs (g)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={customCarbs} onChangeText={setCustomCarbs} />
            
            <Text style={styles.modalLabel}>Fat (g)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={customFat} onChangeText={setCustomFat} />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveCustomGoals} disabled={savingGoals}>
                {savingGoals ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.modalSaveText}>Save Goals</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Zinc 950
  },
  content: {
    padding: 24,
    paddingBottom: 50,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FAFAFA',
    marginTop: 20,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  dashboardCard: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  dashboardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dashboardTitle: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '800',
  },
  editGoalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  editGoalsText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  progressRow: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    color: '#E4E4E7',
    fontSize: 15,
    fontWeight: '600',
  },
  progressValues: {
    fontSize: 14,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#27272A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  formCard: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  macrosInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroInputBox: {
    width: '23%',
  },
  macroInputLabel: {
    color: '#A1A1AA',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  macroInput: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 10,
    padding: 10,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiBtnWrapper: {
    flex: 1,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  aiBtn: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnText: {
    color: '#8B5CF6',
    fontWeight: '700',
    fontSize: 15,
  },
  addBtnWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addBtn: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FAFAFA',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#18181B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  emptyText: {
    color: '#A1A1AA',
    fontWeight: '500',
    marginTop: 10,
  },
  logCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  logDate: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  logFood: {
    color: '#FAFAFA',
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  logMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#09090B',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  logMacroText: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '700',
  },
  kcalBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  kcalText: {
    color: '#06B6D4',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  modalTitle: {
    color: '#FAFAFA',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#27272A',
    borderRadius: 12,
  },
  modalCancelText: {
    color: '#FAFAFA',
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: '800',
  },
});
