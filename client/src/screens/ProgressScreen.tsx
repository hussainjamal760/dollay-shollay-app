import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { calculateProgressStats } from '../utils/progress';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

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
    { id: 1, title: 'First Step', icon: 'medal', condition: stats.totalWorkouts >= 1, desc: 'Log 1 workout' },
    { id: 2, title: 'Consistent Lifter', icon: 'barbell', condition: stats.totalWorkouts >= 10, desc: 'Log 10 workouts' },
    { id: 3, title: 'On Fire', icon: 'flame', condition: stats.currentStreak >= 3, desc: '3-Day Streak' },
    { id: 4, title: '1 Week Strong', icon: 'calendar', condition: stats.currentStreak >= 7, desc: '7-Day Streak' },
    { id: 5, title: '1,000kg Club', icon: 'star', condition: stats.totalVolume >= 1000, desc: 'Lift 1,000kg volume' },
    { id: 6, title: '10k Monster', icon: 'trophy', condition: stats.totalVolume >= 10000, desc: 'Lift 10,000kg volume' }
  ];

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
      showsVerticalScrollIndicator={false}
    >
      <Animated.Text entering={FadeInDown.duration(400)} style={styles.headerTitle}>Your Progress</Animated.Text>
      
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsContainer}>
        <View style={styles.statBoxWrapper}>
          <LinearGradient colors={['#18181B', '#27272A']} style={styles.statBox}>
            <Ionicons name="flame" size={28} color="#EF4444" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </LinearGradient>
        </View>
        <View style={styles.statBoxWrapper}>
          <LinearGradient colors={['#18181B', '#27272A']} style={styles.statBox}>
            <Ionicons name="stats-chart" size={28} color="#06B6D4" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.totalVolume}kg</Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </LinearGradient>
        </View>
        <View style={styles.statBoxWrapper}>
          <LinearGradient colors={['#18181B', '#27272A']} style={styles.statBox}>
            <Ionicons name="barbell" size={28} color="#8B5CF6" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Text style={styles.sectionTitle}>Monthly Activity</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: ['Last Month', 'This Month'],
              datasets: [{ data: [stats.monthlyStats.lastMonth, stats.monthlyStats.thisMonth] }]
            }}
            width={Dimensions.get('window').width - 48}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero
            chartConfig={{
              backgroundColor: '#18181B',
              backgroundGradientFrom: '#18181B',
              backgroundGradientTo: '#18181B',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Indigo/Purple
              labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`, // Zinc 400
              barPercentage: 0.7,
              propsForBackgroundLines: { strokeDasharray: '', stroke: '#27272A' }
            }}
            style={{ borderRadius: 16 }}
            showValuesOnTopOfBars
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Text style={styles.sectionTitle}>All-Time PRs</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prsScroll}>
          {stats.prs.length > 0 ? (
            stats.prs.map((pr, idx) => (
              <LinearGradient key={idx} colors={['rgba(139,92,246,0.1)', 'rgba(139,92,246,0.05)']} style={styles.prCard}>
                <Ionicons name="trophy" size={24} color="#8B5CF6" style={{marginBottom: 8}} />
                <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
                <Text style={styles.prWeight}>{pr.weight} kg</Text>
                <Text style={styles.prLabel}>Max Lift</Text>
              </LinearGradient>
            ))
          ) : (
            <View style={styles.noPrContainer}>
              <Ionicons name="barbell-outline" size={32} color="#3F3F46" />
              <Text style={styles.noPrText}>Start lifting to set your first PR!</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map(badge => (
            <View key={badge.id} style={[styles.badgeCard, badge.condition ? styles.badgeUnlocked : styles.badgeLocked]}>
              <View style={styles.badgeIconContainer}>
                {badge.condition ? (
                  <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.badgeGradient}>
                    <Ionicons name={badge.icon as any} size={28} color="#FFF" />
                  </LinearGradient>
                ) : (
                  <View style={styles.badgeLockedGradient}>
                    <Ionicons name={badge.icon as any} size={28} color="#71717A" />
                  </View>
                )}
              </View>
              <Text style={[styles.badgeTitle, !badge.condition && styles.textLocked]}>{badge.title}</Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
              {!badge.condition && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={14} color="#A1A1AA" />
                </View>
              )}
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBoxWrapper: {
    width: '31%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  statBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FAFAFA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FAFAFA',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartContainer: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  prsScroll: {
    marginBottom: 32,
  },
  prCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 20,
    marginRight: 12,
    width: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prName: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  prWeight: {
    color: '#FAFAFA',
    fontSize: 24,
    fontWeight: '900',
  },
  prLabel: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  noPrContainer: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: Dimensions.get('window').width - 48,
  },
  noPrText: {
    color: '#A1A1AA',
    fontWeight: '600',
    marginTop: 10,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#18181B',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  badgeUnlocked: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  badgeLocked: {
    borderColor: '#27272A',
    opacity: 0.8,
  },
  badgeIconContainer: {
    marginBottom: 12,
  },
  badgeGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  badgeLockedGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272A',
  },
  badgeTitle: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  badgeDesc: {
    color: '#A1A1AA',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  textLocked: {
    color: '#71717A',
  },
  lockOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#27272A',
    padding: 4,
    borderRadius: 100,
  },
});
