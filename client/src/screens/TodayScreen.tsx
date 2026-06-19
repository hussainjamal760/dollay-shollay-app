import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getWorkoutsLocally, deleteWorkoutLocally } from '../database/db';
import { useIsFocused } from '@react-navigation/native';

export default function TodayScreen({ navigation }: any) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadWorkouts();
    }
  }, [isFocused]);

  const loadWorkouts = async () => {
    const localWorkouts = await getWorkoutsLocally();
    setWorkouts(localWorkouts as any[]);
  };

  const activeWorkout = workouts.find(w => w.is_active === 1);

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Plan', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteWorkoutLocally(id);
        loadWorkouts();
      }}
    ]);
  };

  const handleEdit = (plan: any) => {
    navigation.navigate('CreateWorkout', { planToEdit: plan });
  };

  if (workouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.emptyContent}>
          <View style={styles.iconPlaceholder}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.iconGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
              <Ionicons name="barbell" size={40} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>No Workout Plan Yet</Text>
          <Text style={styles.emptySubtitle}>Start building your dream physique today by creating your first personalized workout plan.</Text>
          
          <TouchableOpacity style={styles.createButtonWrapper} onPress={() => navigation.navigate('CreateWorkout')}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.createButton}>
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.createButtonText}>Create Workout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text style={styles.title}>Your Plans</Text>
        <TouchableOpacity 
          style={styles.smallCreateButtonWrapper}
          onPress={() => navigation.navigate('CreateWorkout')}
        >
          <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.smallCreateButton}>
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.smallCreateButtonText}>New</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {activeWorkout ? (
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          <TouchableOpacity 
            style={styles.activeCardWrapper}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('WorkoutSession', { plan: activeWorkout })}
          >
            <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activeCard}>
              <View style={styles.activeCardHeader}>
                <Ionicons name="flash" size={16} color="#FFF" />
                <Text style={styles.activeLabel}>ACTIVE PLAN</Text>
              </View>
              <Text style={styles.activeTitle}>{activeWorkout.name}</Text>
              <View style={styles.activeFooter}>
                <Text style={styles.activeFooterText}>Tap to start session →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>All Plans</Text>
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(150 + index * 50).duration(400)}>
              <View style={styles.planCard}>
                <TouchableOpacity 
                  style={{ flex: 1 }}
                  onPress={() => navigation.navigate('WorkoutSession', { plan: item })}
                >
                  <Text style={styles.planName}>{item.name}</Text>
                  {item.is_active === 1 && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtnEdit}>
                    <Ionicons name="pencil" size={16} color="#A1A1AA" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionBtnDelete}>
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Zinc 950
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FAFAFA',
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FAFAFA',
    marginTop: 10,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#09090B',
    padding: 30,
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  iconPlaceholder: {
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FAFAFA',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButtonWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  createButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  smallCreateButtonWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  smallCreateButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  smallCreateButtonText: {
    color: '#FFF',
    fontWeight: '800',
    marginLeft: 4,
    fontSize: 14,
  },
  activeCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  activeCard: {
    padding: 24,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginLeft: 6,
    opacity: 0.8,
  },
  activeTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  activeFooter: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  activeFooterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: '#18181B', // Zinc 900
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  planName: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  activeBadgeText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnEdit: {
    padding: 12,
    backgroundColor: '#27272A',
    borderRadius: 100,
    marginLeft: 8,
  },
  actionBtnDelete: {
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 100,
    marginLeft: 8,
  },
});
