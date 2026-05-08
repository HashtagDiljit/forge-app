import React, { useCallback } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { MotiView } from 'moti';
import { Colors, Spacing, Radius, FontFamily } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { StatRing } from '../../src/components/ui/StatRing';
import { Badge } from '../../src/components/ui/Badge';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useHealthStore } from '../../src/stores/healthStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useHabitsStore } from '../../src/stores/habitsStore';
import { useTasksStore } from '../../src/stores/tasksStore';
import { formatDurationMinutes, formatNumber } from '../../src/lib/utils';

const STEP_GOAL = 10000;
const WATER_GOAL_ML = 2500;

function DashboardHeader() {
  const user = useSettingsStore((s) => s.user);
  const todayHabits = useHabitsStore((s) => s.getTodayHabits());
  const todayLogs = useHabitsStore((s) => s.getTodayLogs());
  const recentWorkouts = useWorkoutStore((s) => s.recentWorkouts);
  const getLastNightSleep = useHealthStore((s) => s.getLastNightSleep);
  const sleep = getLastNightSleep();

  const completedHabits = todayLogs.filter((l) => l.completed).length;
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasWorkout = recentWorkouts.some((w) => {
    if (!w.completedAt) return false;
    return format(new Date(w.completedAt), 'yyyy-MM-dd') === today;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const summaryParts: string[] = [];
  if (todayHabits.length > 0) summaryParts.push(`${completedHabits} of ${todayHabits.length} habits done`);
  if (hasWorkout) summaryParts.push('Workout logged');
  if (sleep) summaryParts.push(`${formatDurationMinutes(sleep.totalMinutes)} sleep`);

  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text variant="label" color="secondary">
          {format(new Date(), 'EEEE, MMMM d').toUpperCase()}
        </Text>
        <Text variant="display" style={{ marginTop: 2 }}>
          {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </Text>
        {summaryParts.length > 0 && (
          <Text variant="caption" style={{ marginTop: 4, lineHeight: 18 }}>
            {summaryParts.join(' · ')}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarButton}>
        <View style={styles.avatar}>
          <Text style={{ fontFamily: FontFamily.display, fontSize: 18, color: Colors.accent.primary }}>
            {user?.name?.charAt(0)?.toUpperCase() ?? 'F'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function StepsCard() {
  const getLatestMetric = useHealthStore((s) => s.getLatestMetric);
  const steps = getLatestMetric('steps');
  const count = steps?.value ?? 0;
  const pct = Math.round((count / STEP_GOAL) * 100);

  return (
    <Card onPress={() => router.push('/(tabs)/health')} style={styles.halfCard}>
      <Text variant="label" color="secondary">STEPS TODAY</Text>
      <View style={styles.ringRow}>
        <StatRing
          value={count}
          max={STEP_GOAL}
          size={72}
          strokeWidth={7}
          color={Colors.accent.primary}
          centerContent={
            <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 13, color: Colors.text.primary }}>
              {pct}%
            </Text>
          }
        />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text variant="display" style={{ fontSize: 28 }}>{formatNumber(count)}</Text>
          <Text variant="caption">Goal: {formatNumber(STEP_GOAL)}</Text>
        </View>
      </View>
    </Card>
  );
}

function SleepCard() {
  const sleep = useHealthStore((s) => s.getLastNightSleep());
  const hours = sleep ? (sleep.totalMinutes / 60).toFixed(1) : '--';
  const efficiency = sleep?.efficiency ? Math.round(sleep.efficiency * 100) : null;

  return (
    <Card onPress={() => router.push('/(tabs)/health')} style={styles.halfCard}>
      <Text variant="label" color="secondary">LAST NIGHT</Text>
      <Text variant="display" style={{ fontSize: 28, marginTop: 4 }}>{hours}<Text variant="caption" color="secondary"> hr</Text></Text>
      {efficiency !== null && <Text variant="caption">{efficiency}% efficient</Text>}
      {!sleep && <Text variant="caption" color="secondary">No data — tap to log</Text>}
    </Card>
  );
}

function HydrationCard() {
  const getMetricHistory = useHealthStore((s) => s.getMetricHistory);
  const today = format(new Date(), 'yyyy-MM-dd');
  const logs = getMetricHistory('hydration', 1);
  const todayMl = logs.reduce((sum, m) => sum + m.value, 0);
  const pct = Math.min(todayMl / WATER_GOAL_ML, 1);

  return (
    <Card onPress={() => router.push('/(tabs)/health')} style={styles.halfCard}>
      <Text variant="label" color="secondary">HYDRATION</Text>
      <View style={styles.ringRow}>
        <StatRing
          value={todayMl}
          max={WATER_GOAL_ML}
          size={72}
          strokeWidth={7}
          color="#3498DB"
          centerContent={
            <MaterialCommunityIcons name="water" size={20} color="#3498DB" />
          }
        />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text variant="display" style={{ fontSize: 22 }}>{todayMl}<Text variant="caption"> ml</Text></Text>
          <Text variant="caption">Goal: {WATER_GOAL_ML} ml</Text>
        </View>
      </View>
    </Card>
  );
}

function WorkoutVolumeCard() {
  const recentWorkouts = useWorkoutStore((s) => s.recentWorkouts);
  const unitSystem = useSettingsStore((s) => s.unitSystem);
  const cutoff = Date.now() - 7 * 86400000;
  const weekVolume = recentWorkouts
    .filter((w) => w.completedAt && w.completedAt >= cutoff)
    .reduce((sum, w) => sum + (w.totalVolumeKg ?? 0), 0);
  const weekWorkouts = recentWorkouts.filter((w) => w.completedAt && w.completedAt >= cutoff).length;

  return (
    <Card onPress={() => router.push('/(tabs)/train')} style={styles.halfCard}>
      <Text variant="label" color="secondary">THIS WEEK</Text>
      <Text variant="display" style={{ fontSize: 28, marginTop: 4 }}>
        {weekWorkouts}<Text variant="caption" color="secondary"> sessions</Text>
      </Text>
      <Text variant="caption">
        {Math.round(weekVolume).toLocaleString()} kg total volume
      </Text>
    </Card>
  );
}

function HeartRateCard() {
  const getLatestMetric = useHealthStore((s) => s.getLatestMetric);
  const hr = getLatestMetric('heart_rate_resting');

  return (
    <Card onPress={() => router.push('/(tabs)/health')} style={styles.halfCard}>
      <Text variant="label" color="secondary">RESTING HR</Text>
      <View style={styles.metricRow}>
        <MaterialCommunityIcons name="heart-pulse" size={28} color={Colors.accent.secondary} />
        <View style={{ marginLeft: Spacing.sm }}>
          <Text variant="display" style={{ fontSize: 28 }}>
            {hr?.value ?? '--'}
          </Text>
          <Text variant="caption">bpm</Text>
        </View>
      </View>
      {!hr && <Text variant="caption" color="secondary">Tap to log</Text>}
    </Card>
  );
}

function CaloriesCard() {
  const getLatestMetric = useHealthStore((s) => s.getLatestMetric);
  const calories = getLatestMetric('calories_active');
  const targets = useSettingsStore((s) => s.nutritionTargets);

  return (
    <Card onPress={() => router.push('/(tabs)/health')} style={styles.halfCard}>
      <Text variant="label" color="secondary">ACTIVE CALS</Text>
      <Text variant="display" style={{ fontSize: 28, marginTop: 4 }}>
        {calories?.value ?? '--'}<Text variant="caption" color="secondary"> kcal</Text>
      </Text>
      <Text variant="caption">Target: {targets.calorieTarget} kcal</Text>
    </Card>
  );
}

function WeightCard() {
  const getMetricHistory = useHealthStore((s) => s.getMetricHistory);
  const history = getMetricHistory('weight', 7);
  const latest = history[history.length - 1];
  const unitSystem = useSettingsStore((s) => s.unitSystem);

  const trend = history.length >= 2
    ? (history[history.length - 1].value - history[0].value)
    : 0;

  return (
    <Card onPress={() => router.push('/(tabs)/health')} style={styles.halfCard}>
      <Text variant="label" color="secondary">BODY WEIGHT</Text>
      <Text variant="display" style={{ fontSize: 28, marginTop: 4 }}>
        {latest?.value?.toFixed(1) ?? '--'}<Text variant="caption" color="secondary"> kg</Text>
      </Text>
      {trend !== 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialCommunityIcons
            name={trend < 0 ? 'trending-down' : 'trending-up'}
            size={14}
            color={trend < 0 ? Colors.accent.success : Colors.accent.secondary}
          />
          <Text variant="caption" color={trend < 0 ? 'success' : 'danger'}>
            {Math.abs(trend).toFixed(1)} kg (7d)
          </Text>
        </View>
      )}
    </Card>
  );
}

function HabitsStreakCard() {
  const habits = useHabitsStore((s) => s.habits);
  const streaks = useHabitsStore((s) => s.streaks);
  const longestStreak = habits.reduce((max, h) => Math.max(max, streaks[h.id]?.current ?? 0), 0);
  const completedToday = useHabitsStore((s) => s.getTodayLogs)().filter((l) => l.completed).length;
  const totalToday = useHabitsStore((s) => s.getTodayHabits)().length;

  return (
    <Card onPress={() => router.push('/(tabs)/habits')} style={styles.halfCard}>
      <Text variant="label" color="secondary">HABITS TODAY</Text>
      <Text variant="display" style={{ fontSize: 28, marginTop: 4 }}>
        {completedToday}<Text variant="caption" color="secondary"> / {totalToday}</Text>
      </Text>
      {longestStreak > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialCommunityIcons name="fire" size={14} color={Colors.accent.warning} />
          <Text variant="caption">{longestStreak} day streak</Text>
        </View>
      )}
    </Card>
  );
}

function TodaysPlan() {
  const todayHabits = useHabitsStore((s) => s.getTodayHabits());
  const todayLogs = useHabitsStore((s) => s.getTodayLogs());
  const todayTasks = useTasksStore((s) => s.getTodayTasks());
  const recentWorkouts = useWorkoutStore((s) => s.recentWorkouts);
  const templates = useWorkoutStore((s) => s.templates);

  const today = format(new Date(), 'yyyy-MM-dd');
  const completedHabitIds = new Set(todayLogs.filter((l) => l.completed).map((l) => l.habitId));
  const pendingHabits = todayHabits.filter((h) => !completedHabitIds.has(h.id)).slice(0, 3);
  const topTasks = todayTasks.slice(0, 3);

  return (
    <View style={styles.planSection}>
      <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Today's Plan</Text>

      {pendingHabits.length > 0 && (
        <>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.xs }}>PENDING HABITS</Text>
          {pendingHabits.map((h) => (
            <TouchableOpacity
              key={h.id}
              style={styles.planItem}
              onPress={() => router.push('/(tabs)/habits')}
            >
              <View style={[styles.habitDot, { backgroundColor: h.color }]} />
              <Text variant="bodyMedium">{h.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {topTasks.length > 0 && (
        <>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.xs, marginTop: Spacing.md }}>TASKS</Text>
          {topTasks.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.planItem}
              onPress={() => router.push('/(tabs)')}
            >
              <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={16} color={Colors.text.secondary} />
              <Text variant="bodyMedium" style={{ marginLeft: 8 }}>{t.title}</Text>
              {t.priority === 'high' && (
                <Badge label="High" color={Colors.accent.secondary} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </>
      )}

      {pendingHabits.length === 0 && topTasks.length === 0 && (
        <Text variant="body" color="secondary">All clear — great work today.</Text>
      )}
    </View>
  );
}

export default function Dashboard() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const cards = [
    StepsCard, SleepCard, HeartRateCard, CaloriesCard,
    HabitsStreakCard, WorkoutVolumeCard, HydrationCard, WeightCard,
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader />

        <View style={styles.grid}>
          {cards.map((CardComponent, i) => (
            <MotiView
              key={i}
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 350, delay: i * 60 }}
              style={{ width: '48.5%' }}
            >
              <CardComponent />
            </MotiView>
          ))}
        </View>

        <TodaysPlan />
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  avatarButton: { marginTop: 4 },
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
    marginBottom: Spacing.lg,
  },
  halfCard: { flex: 1, minHeight: 100 },
  ringRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  planSection: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    gap: Spacing.xs,
  },
  habitDot: { width: 10, height: 10, borderRadius: 5 },
});
