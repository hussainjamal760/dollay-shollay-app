import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { getWorkoutsLocally } from '../database/db';
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
        <View style={styles.activeCard}>
          <Text style={styles.activeLabel}>ACTIVE PLAN</Text>
          <Text style={styles.activeTitle}>{activeWorkout.name}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>All Plans</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.planCard}>
            <Text style={styles.planName}>{item.name}</Text>
            {item.is_active === 1 && <Text style={styles.activeBadge}>Active</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: '#bb86fc',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: '#bb86fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  createButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallCreateButton: {
    backgroundColor: '#bb86fc',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  smallCreateButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  activeCard: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderWidth: 1,
    borderColor: '#bb86fc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  activeLabel: {
    color: '#bb86fc',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  activeTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  planCard: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#bb86fc',
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
