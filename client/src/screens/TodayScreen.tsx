import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert } from 'react-native';
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
        <Text style={styles.emptyTitle}>No Workout Plan Yet</Text>
        <Text style={styles.emptySubtitle}>Start building your dream physique today by creating your first personalized workout plan.</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateWorkout')}
        >
          <Text style={styles.createButtonText}>+ Create Workout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Plans</Text>
        <TouchableOpacity 
          style={styles.smallCreateButton}
          onPress={() => navigation.navigate('CreateWorkout')}
        >
          <Text style={styles.smallCreateButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {activeWorkout ? (
        <TouchableOpacity 
          style={styles.activeCard}
          onPress={() => navigation.navigate('WorkoutSession', { plan: activeWorkout })}
        >
          <Text style={styles.activeLabel}>ACTIVE PLAN</Text>
          <Text style={styles.activeTitle}>{activeWorkout.name}</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.sectionTitle}>All Plans</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.planCard}>
            <TouchableOpacity 
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('WorkoutSession', { plan: item })}
            >
              <Text style={styles.planName}>{item.name}</Text>
              {item.is_active === 1 && <Text style={styles.activeBadge}>Active</Text>}
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtnEdit}>
                <Text style={styles.actionTextEdit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionBtnDelete}>
                <Text style={styles.actionTextDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: '#FF2D55',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  smallCreateButton: {
    backgroundColor: '#FF2D55',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  smallCreateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF2D55',
  },
  activeLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  activeTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    color: '#FF2D55',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  actionBtnEdit: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  actionBtnDelete: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  actionTextEdit: {
    color: '#0A84FF',
    fontWeight: '600',
    fontSize: 13,
  },
  actionTextDelete: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 13,
  },
});
