import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontFamily } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useHealthStore } from '../../src/stores/healthStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useHabitsStore } from '../../src/stores/habitsStore';
import { useGoalsStore } from '../../src/stores/goalsStore';
import { useTasksStore } from '../../src/stores/tasksStore';
import { calculateTDEE, calculateBMI } from '../../src/lib/utils';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  right,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon as any} size={20} color={Colors.accent.primary} style={{ marginRight: Spacing.sm }} />
      <Text variant="bodyMedium" style={{ flex: 1 }}>{label}</Text>
      {value && <Text variant="caption" color="secondary">{value}</Text>}
      {right}
      {onPress && !right && (
        <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.text.secondary} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileSettings() {
  const user = useSettingsStore((s) => s.user);
  const unitSystem = useSettingsStore((s) => s.unitSystem);
  const setUnitSystem = useSettingsStore((s) => s.setUnitSystem);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const habitRemindersEnabled = useSettingsStore((s) => s.habitRemindersEnabled);
  const workoutRemindersEnabled = useSettingsStore((s) => s.workoutRemindersEnabled);
  const waterRemindersEnabled = useSettingsStore((s) => s.waterRemindersEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const clearSettings = useSettingsStore((s) => s.clearAll);
  const clearHealth = useHealthStore((s) => s.clearAll);
  const clearHabits = useHabitsStore((s) => s.clearAll);
  const clearGoals = useGoalsStore((s) => s.clearAll);
  const clearTasks = useTasksStore((s) => s.clearAll);

  const recentWorkouts = useWorkoutStore((s) => s.recentWorkouts);
  const habits = useHabitsStore((s) => s.habits);
  const allGoals = useGoalsStore((s) => s.goals);
  const goals = allGoals.filter((g) => g.status === 'active');

  const tdee = user ? calculateTDEE(user) : 0;
  const bmi = user ? calculateBMI(user.weightKg, user.heightCm) : 0;

  const handleExport = async () => {
    const healthMetrics = useHealthStore.getState().metrics;
    const habitsData = useHabitsStore.getState().habits;
    const goalsData = useGoalsStore.getState().goals;
    const tasksData = useTasksStore.getState().tasks;

    const data = {
      exportDate: new Date().toISOString(),
      user,
      workouts: recentWorkouts,
      healthMetrics,
      habits: habitsData,
      goals: goalsData,
      tasks: tasksData,
    };

    try {
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'FORGE Data Export',
      });
    } catch (e) {
      Alert.alert('Export failed');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your workouts, health data, habits, goals, and tasks. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            clearSettings();
            clearHealth();
            clearHabits();
            clearGoals();
            clearTasks();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text variant="title" style={{ flex: 1, marginLeft: Spacing.md }}>Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={{ fontFamily: FontFamily.display, fontSize: 32, color: Colors.accent.primary }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? 'F'}
            </Text>
          </View>
          <Text variant="display" style={{ textAlign: 'center', marginTop: Spacing.md }}>{user?.name ?? 'Athlete'}</Text>
          <Text variant="caption" style={{ textAlign: 'center' }}>FORGE member</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="mono" style={{ fontSize: 20, color: Colors.accent.primary }}>{recentWorkouts.length}</Text>
              <Text variant="caption">Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="mono" style={{ fontSize: 20, color: Colors.accent.success }}>{habits.length}</Text>
              <Text variant="caption">Habits</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="mono" style={{ fontSize: 20, color: Colors.accent.warning }}>{goals.length}</Text>
              <Text variant="caption">Goals</Text>
            </View>
          </View>
        </Card>

        {/* Personal stats */}
        {user && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>PERSONAL STATS</Text>
            <View style={styles.statGrid}>
              <View style={styles.statGridItem}>
                <Text variant="mono">{user.heightCm} cm</Text>
                <Text variant="caption" color="secondary">Height</Text>
              </View>
              <View style={styles.statGridItem}>
                <Text variant="mono">{user.weightKg} kg</Text>
                <Text variant="caption" color="secondary">Weight</Text>
              </View>
              <View style={styles.statGridItem}>
                <Text variant="mono">{user.age}</Text>
                <Text variant="caption" color="secondary">Age</Text>
              </View>
              <View style={styles.statGridItem}>
                <Text variant="mono">{bmi}</Text>
                <Text variant="caption" color="secondary">BMI</Text>
              </View>
              <View style={styles.statGridItem}>
                <Text variant="mono">{tdee}</Text>
                <Text variant="caption" color="secondary">TDEE</Text>
              </View>
              <View style={styles.statGridItem}>
                <Text variant="mono">{user.activityLevel.replace('_', ' ')}</Text>
                <Text variant="caption" color="secondary">Activity</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Units */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.xs }}>UNITS</Text>
          <SettingsRow
            icon="ruler"
            label="Unit System"
            value={unitSystem === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, ft)'}
            right={
              <Switch
                value={unitSystem === 'imperial'}
                onValueChange={(v) => setUnitSystem(v ? 'imperial' : 'metric')}
                trackColor={{ false: Colors.background.elevated, true: Colors.accent.primary }}
              />
            }
          />
        </Card>

        {/* Notifications */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.xs }}>NOTIFICATIONS</Text>
          <SettingsRow
            icon="bell"
            label="Notifications"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.background.elevated, true: Colors.accent.primary }}
              />
            }
          />
        </Card>

        {/* Health Connect note */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.xs }}>HEALTH DATA</Text>
          <View style={styles.noteRow}>
            <MaterialCommunityIcons name="sync" size={18} color={Colors.accent.warning} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text variant="bodyMedium">Health Connect Sync</Text>
              <Text variant="caption" color="secondary">
                Automatic sync with Samsung Health and other apps via Health Connect can be added in a future update. All metrics are currently entered manually.
              </Text>
            </View>
            <Badge label="Future" color={Colors.accent.warning} />
          </View>
        </Card>

        {/* Data */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.xs }}>DATA</Text>
          <SettingsRow icon="export" label="Export All Data (JSON)" onPress={handleExport} />
        </Card>

        {/* Danger zone */}
        <Card style={[styles.dangerCard]}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>DANGER ZONE</Text>
          <Button
            label="Clear All Data"
            variant="danger"
            onPress={handleClearAll}
            fullWidth
            leftIcon={<MaterialCommunityIcons name="delete-forever" size={18} color="#fff" />}
          />
          <Text variant="caption" color="secondary" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
            This permanently deletes all your data and cannot be undone.
          </Text>
        </Card>

        <Text variant="caption" color="secondary" style={{ textAlign: 'center', marginTop: Spacing.lg }}>
          FORGE · Build the version that wins.
        </Text>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  content: { padding: Spacing.md },
  profileCard: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.md },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.accent.primary}20`,
    borderWidth: 2,
    borderColor: `${Colors.accent.primary}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.lg },
  statItem: { alignItems: 'center' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statGridItem: { width: '33.33%', paddingVertical: Spacing.sm, alignItems: 'center' },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    minHeight: 48,
  },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm },
  dangerCard: { borderColor: `${Colors.accent.secondary}30`, borderWidth: 1 },
});
