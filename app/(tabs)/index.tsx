import React, { useCallback } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useShallow } from 'zustand/react/shallow';
import { Colors, Spacing, Radius, FontFamily } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useHealthStore } from '../../src/stores/healthStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useHabitsStore } from '../../src/stores/habitsStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shouldShowToday(habit: any): boolean {
  if (!habit.isActive) return false;
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'specific_days') {
    return (habit.daysOfWeek ?? []).includes(new Date().getDay());
  }
  return true;
}

// ─── Header ───────────────────────────────────────────────────────────────────

function DashboardHeader() {
  // Primitive selector — returns a string, never a new object
  const userName = useSettingsStore((s) => s.user?.name ?? '');

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = userName.split(' ')[0];

  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text variant="label" color="secondary">
          {format(new Date(), 'EEEE, MMMM d').toUpperCase()}
        </Text>
        <Text variant="display" style={{ marginTop: 2 }}>
          {greeting}
          {firstName ? `, ${firstName}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => router.push('/profile')}
        style={styles.avatarBtn}
      >
        <View style={styles.avatar}>
          <Text
            style={{
              fontFamily: FontFamily.display,
              fontSize: 18,
              color: Colors.accent.primary,
            }}
          >
            {userName.charAt(0).toUpperCase() || 'F'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Steps Card ───────────────────────────────────────────────────────────────

const STEP_GOAL = 10000;

function StepsCard() {
  // Array selector wrapped with useShallow — safe stable reference
  const metrics = useHealthStore(useShallow((s) => s.metrics));

  const steps = metrics
    .filter((m) => m.type === 'steps')
    .sort((a, b) => b.recordedAt - a.recordedAt)[0];
  const count = steps?.value ?? 0;
  const pct = Math.min(Math.round((count / STEP_GOAL) * 100), 100);

  return (
    <Card onPress={() => router.push('/(tabs)/health')} style={styles.halfCard}>
      <Text variant="label" color="secondary">STEPS</Text>
      <Text variant="display" style={styles.bigNumber}>
        {count.toLocaleString()}
      </Text>
      <Text variant="caption" color="secondary">
        {pct}% of {STEP_GOAL.toLocaleString()}
      </Text>
    </Card>
  );
}

// ─── Sleep Card ───────────────────────────────────────────────────────────────

function SleepCard() {
  // Array selector wrapped with useShallow
  const sleepLogs = useHealthStore(useShallow((s) => s.sleepLogs));

  const last =
    sleepLogs.length > 0
      ? [...sleepLogs].sort((a, b) => b.recordedAt - a.recordedAt)[0]
      : null;
  const hours = last ? (last.totalMinutes / 60).toFixed(1) : '--';

  return (
    <Card onPress={() => router.push('/(tabs)/health')} style={styles.halfCard}>
      <Text variant="label" color="secondary">SLEEP</Text>
      <Text variant="display" style={styles.bigNumber}>
        {hours}
        <Text variant="caption" color="secondary"> hr</Text>
      </Text>
      {last?.efficiency != null && (
        <Text variant="caption" color="secondary">
          {Math.round(last.efficiency * 100)}% efficient
        </Text>
      )}
      {!last && (
        <Text variant="caption" color="secondary">
          Tap to log
        </Text>
      )}
    </Card>
  );
}

// ─── Weight Card ──────────────────────────────────────────────────────────────

function WeightCard() {
  // Array selector wrapped with useShallow
  const metrics = useHealthStore(useShallow((s) => s.metrics));

  const latest = metrics
    .filter((m) => m.type === 'weight')
    .sort((a, b) => b.recordedAt - a.recordedAt)[0];

  return (
    <Card onPress={() => router.push('/(tabs)/health')} style={styles.halfCard}>
      <Text variant="label" color="secondary">WEIGHT</Text>
      <Text variant="display" style={styles.bigNumber}>
        {latest ? latest.value.toFixed(1) : '--'}
        <Text variant="caption" color="secondary"> kg</Text>
      </Text>
      {!latest && (
        <Text variant="caption" color="secondary">
          Tap to log
        </Text>
      )}
    </Card>
  );
}

// ─── Workout Card ─────────────────────────────────────────────────────────────

function WorkoutCard() {
  // Array selector wrapped with useShallow
  const recentWorkouts = useWorkoutStore(useShallow((s) => s.recentWorkouts));

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayWorkout = recentWorkouts.find((w) => {
    if (!w.completedAt) return false;
    return format(new Date(w.completedAt), 'yyyy-MM-dd') === today;
  });

  return (
    <Card onPress={() => router.push('/(tabs)/train')} style={styles.halfCard}>
      <Text variant="label" color="secondary">WORKOUT</Text>
      {todayWorkout ? (
        <>
          <Text variant="bodyMedium" style={{ marginTop: 4 }} numberOfLines={1}>
            {todayWorkout.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MaterialCommunityIcons
              name="check-circle"
              size={12}
              color={Colors.accent.success}
            />
            <Text variant="caption" color="secondary">Done</Text>
          </View>
        </>
      ) : (
        <>
          <Text variant="display" style={styles.bigNumber}>--</Text>
          <Text variant="caption" color="secondary">None today</Text>
        </>
      )}
    </Card>
  );
}

// ─── Habits Summary ───────────────────────────────────────────────────────────

function HabitsSummary() {
  // Two separate array selectors, each wrapped with useShallow
  const habits = useHabitsStore(useShallow((s) => s.habits));
  const logs = useHabitsStore(useShallow((s) => s.logs));

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayHabits = habits.filter(shouldShowToday);
  const completedCount = logs.filter(
    (l) => l.date === today && l.completed
  ).length;

  if (todayHabits.length === 0) return null;

  const allDone = completedCount === todayHabits.length;

  return (
    <Card onPress={() => router.push('/(tabs)/habits')}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text variant="label" color="secondary">TODAY'S HABITS</Text>
          <Text variant="display" style={{ fontSize: 28, marginTop: 4 }}>
            {completedCount}
            <Text variant="body" color="secondary"> / {todayHabits.length}</Text>
          </Text>
        </View>
        {allDone && (
          <View style={styles.badge}>
            <MaterialCommunityIcons
              name="trophy"
              size={16}
              color={Colors.accent.warning}
            />
            <Text
              style={{
                fontFamily: FontFamily.bodyMedium,
                fontSize: 12,
                color: Colors.accent.warning,
                marginLeft: 4,
              }}
            >
              Perfect day!
            </Text>
          </View>
        )}
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${todayHabits.length > 0 ? (completedCount / todayHabits.length) * 100 : 0}%`,
            },
          ]}
        />
      </View>
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader />

        <View style={styles.grid}>
          <StepsCard />
          <SleepCard />
          <WeightCard />
          <WorkoutCard />
        </View>

        <HabitsSummary />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  avatarBtn: { marginTop: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.accent.primary}20`,
    borderWidth: 1,
    borderColor: `${Colors.accent.primary}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  halfCard: { width: '48%' },
  bigNumber: { fontSize: 28, marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.accent.warning}15`,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.subtle,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.accent.primary,
  },
});
