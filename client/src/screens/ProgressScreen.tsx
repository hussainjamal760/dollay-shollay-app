import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { calculateProgressStats } from '../utils/progress';
import { useIsFocused } from '@react-navigation/native';

export default function ProgressScreen() {
  const [stats, setStats] = useState({ 
    totalVolume: 0, 
    totalWorkouts: 0, 
    currentStreak: 0,
    prs: [] as { name: string, weight: number }[],
    monthlyStats: { thisMonth: 0, lastMonth: 0 }
  });
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const loadStats = async () => {
    const data = await calculateProgressStats();
    setStats(data);
  };

  useEffect(() => {
    if (isFocused) {
      loadStats();
    }
  }, [isFocused]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const BADGES = [
    { id: 1, title: 'First Step', icon: '🥉', condition: stats.totalWorkouts >= 1, desc: 'Log 1 workout' },
    { id: 2, title: 'Consistent Lifter', icon: '🏋️', condition: stats.totalWorkouts >= 10, desc: 'Log 10 workouts' },
    { id: 3, title: 'On Fire', icon: '🔥', condition: stats.currentStreak >= 3, desc: '3-Day Streak' },
    { id: 4, title: '1 Week Strong', icon: '📅', condition: stats.currentStreak >= 7, desc: '7-Day Streak' },
    { id: 5, title: '1,000kg Club', icon: '🦍', condition: stats.totalVolume >= 1000, desc: 'Lift 1,000kg volume' },
    { id: 6, title: '10k Monster', icon: '🦖', condition: stats.totalVolume >= 10000, desc: 'Lift 10,000kg volume' }
  ];

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#bb86fc" />}
    >
      <Text style={styles.headerTitle}>Your Progress</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValue}>{stats.totalVolume}kg</Text>
          <Text style={styles.statLabel}>Total Volume</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>💪</Text>
          <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Monthly Activity</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={{
            labels: ['Last Month', 'This Month'],
            datasets: [{ data: [stats.monthlyStats.lastMonth, stats.monthlyStats.thisMonth] }]
          }}
          width={Dimensions.get('window').width - 40}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          fromZero
          chartConfig={{
            backgroundColor: '#1e1e1e',
            backgroundGradientFrom: '#1e1e1e',
            backgroundGradientTo: '#1e1e1e',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(3, 218, 198, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            barPercentage: 0.8,
            propsForBackgroundLines: { strokeDasharray: '', stroke: '#333' }
          }}
          style={{ borderRadius: 12, marginVertical: 8 }}
          showValuesOnTopOfBars
        />
      </View>

      <Text style={styles.sectionTitle}>All-Time PRs</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prsScroll}>
        {stats.prs.length > 0 ? (
          stats.prs.map((pr, idx) => (
            <View key={idx} style={styles.prCard}>
              <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
              <Text style={styles.prWeight}>{pr.weight} kg</Text>
              <Text style={styles.prLabel}>Max Lift</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noPrText}>Start lifting to set your first PR!</Text>
        )}
      </ScrollView>

      <Text style={styles.sectionTitle}>Achievements</Text>
      
      <View style={styles.badgesGrid}>
        {BADGES.map(badge => (
          <View key={badge.id} style={[styles.badgeCard, badge.condition ? styles.badgeUnlocked : styles.badgeLocked]}>
            <Text style={styles.badgeIcon}>{badge.icon}</Text>
            <Text style={[styles.badgeTitle, !badge.condition && styles.textLocked]}>{badge.title}</Text>
            <Text style={styles.badgeDesc}>{badge.desc}</Text>
            {!badge.condition && (
              <View style={styles.lockOverlay}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            )}
          </View>
        ))}
      </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statBox: {
    backgroundColor: '#1e1e1e',
    width: '31%',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#03DAC6',
    marginBottom: 15,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  badgeUnlocked: {
    borderColor: '#bb86fc',
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
  },
  badgeLocked: {
    borderColor: '#333',
    opacity: 0.7,
  },
  badgeIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  badgeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  badgeDesc: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
  textLocked: {
    color: '#666',
  },
  lockOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  lockIcon: {
    fontSize: 16,
  },
  chartContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  prsScroll: {
    marginBottom: 20,
  },
  prCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bb86fc',
    padding: 15,
    marginRight: 10,
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prName: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  prWeight: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  prLabel: {
    color: '#bb86fc',
    fontSize: 12,
    marginTop: 5,
  },
  noPrText: {
    color: '#888',
    fontStyle: 'italic',
    padding: 10,
  },
});
