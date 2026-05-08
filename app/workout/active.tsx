import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { EXERCISE_LIBRARY } from '../../src/constants/exercises';
import { WorkoutExercise, WorkoutSet, Exercise } from '../../src/types';
import { generateId, formatDuration, epley1RM } from '../../src/lib/utils';

export default function ActiveWorkout() {
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const logSet = useWorkoutStore((s) => s.logSet);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const discardWorkout = useWorkoutStore((s) => s.discardWorkout);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);
  const tickRestTimer = useWorkoutStore((s) => s.tickRestTimer);
  const stopRestTimer = useWorkoutStore((s) => s.stopRestTimer);
  const getLastSetsForExercise = useWorkoutStore((s) => s.getLastSetsForExercise);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeWorkout) return;
    const start = activeWorkout.workout.startedAt;
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - start) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeWorkout?.workout.startedAt]);

  useEffect(() => {
    if (activeWorkout?.restTimerActive) {
      restTimerRef.current = setInterval(() => tickRestTimer(), 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, [activeWorkout?.restTimerActive]);

  if (!activeWorkout) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text variant="body" style={{ padding: Spacing.lg }}>No active workout.</Text>
        <Button label="Back" onPress={() => router.back()} variant="ghost" />
      </SafeAreaView>
    );
  }

  const { workout, restTimerActive, restTimerRemaining, restTimerSeconds } = activeWorkout;

  const handleFinish = () => {
    Alert.alert('Finish Workout?', 'This will save your session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish', onPress: () => {
          const finished = finishWorkout();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/(tabs)/train');
        },
      },
    ]);
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout?', 'All progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { discardWorkout(); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="close" size={24} color={Colors.text.secondary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text variant="bodyMedium">{workout.name}</Text>
          <Text variant="mono" style={{ color: Colors.accent.primary }}>{formatDuration(elapsedSeconds)}</Text>
        </View>
        <Button label="Finish" onPress={handleFinish} size="sm" />
      </View>

      {/* Rest timer banner */}
      {restTimerActive && (
        <TouchableOpacity style={styles.restBanner} onPress={stopRestTimer}>
          <MaterialCommunityIcons name="timer" size={18} color={Colors.accent.warning} />
          <Text variant="bodyMedium" style={{ flex: 1, marginLeft: Spacing.xs }}>
            Rest: {restTimerRemaining}s
          </Text>
          <Text variant="caption">Tap to skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {workout.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            workoutExercise={ex}
            onLogSet={(set) => {
              logSet(ex.id, set);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              startRestTimer(ex.restSeconds ?? 90);
            }}
            lastSets={getLastSetsForExercise(ex.exerciseId)}
          />
        ))}

        <Button
          label="Add Exercise"
          onPress={() => setShowAddExercise(true)}
          variant="secondary"
          fullWidth
          leftIcon={<MaterialCommunityIcons name="plus" size={18} color={Colors.text.primary} />}
          style={{ marginTop: Spacing.md }}
        />

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add exercise modal */}
      <ExercisePicker
        visible={showAddExercise}
        onSelect={(ex) => {
          const we: WorkoutExercise = {
            id: generateId('we'),
            exerciseId: ex.id,
            exercise: ex as Exercise,
            sets: [],
            restSeconds: 90,
          };
          addExercise(we);
          setShowAddExercise(false);
        }}
        onClose={() => setShowAddExercise(false)}
      />
    </SafeAreaView>
  );
}

// ─── Exercise Card ─────────────────────────────────────────────────────────────
function ExerciseCard({
  workoutExercise,
  onLogSet,
  lastSets,
}: {
  workoutExercise: WorkoutExercise;
  onLogSet: (set: WorkoutSet) => void;
  lastSets: WorkoutSet[];
}) {
  const exerciseInfo = EXERCISE_LIBRARY.find((e) => e.id === workoutExercise.exerciseId);
  const lastSet = workoutExercise.sets[workoutExercise.sets.length - 1];
  const prevSet = lastSets[workoutExercise.sets.length] ?? lastSets[lastSets.length - 1];

  const [weight, setWeight] = useState(
    prevSet ? prevSet.weightKg.toString() : '0'
  );
  const [reps, setReps] = useState(
    prevSet ? prevSet.reps.toString() : '10'
  );
  const [rpe, setRpe] = useState('');

  const handleLog = () => {
    const set: WorkoutSet = {
      id: generateId('set'),
      exerciseId: workoutExercise.exerciseId,
      weightKg: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      rpe: rpe ? parseFloat(rpe) : undefined,
      isWarmup: false,
      completedAt: Date.now(),
    };
    onLogSet(set);
    setRpe('');
  };

  return (
    <Card style={styles.exCard}>
      <Text variant="bodyMedium">{exerciseInfo?.name ?? workoutExercise.exerciseId}</Text>
      {exerciseInfo && (
        <Text variant="caption" style={{ marginBottom: Spacing.sm }}>
          {exerciseInfo.primaryMuscles.join(', ')}
        </Text>
      )}

      {/* Logged sets */}
      {workoutExercise.sets.length > 0 && (
        <View style={styles.setsTable}>
          <View style={styles.setRow}>
            <Text variant="label" style={{ width: 24 }}>#</Text>
            <Text variant="label" style={{ flex: 1 }}>WEIGHT</Text>
            <Text variant="label" style={{ flex: 1 }}>REPS</Text>
            <Text variant="label" style={{ width: 40 }}>RPE</Text>
          </View>
          {workoutExercise.sets.map((s, i) => (
            <View key={s.id} style={styles.setRow}>
              <Text variant="mono" style={{ width: 24 }}>{i + 1}</Text>
              <Text variant="mono" style={{ flex: 1 }}>{s.weightKg}</Text>
              <Text variant="mono" style={{ flex: 1 }}>{s.reps}</Text>
              <Text variant="mono" style={{ width: 40 }}>{s.rpe ?? '-'}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Log new set */}
      <View style={styles.logRow}>
        <View style={styles.logField}>
          <Text variant="label" style={{ marginBottom: 4 }}>WEIGHT (kg)</Text>
          <TextInput
            style={styles.logInput}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          {prevSet && (
            <Text variant="caption" style={{ marginTop: 2 }}>prev: {prevSet.weightKg}</Text>
          )}
        </View>
        <View style={styles.logField}>
          <Text variant="label" style={{ marginBottom: 4 }}>REPS</Text>
          <TextInput
            style={styles.logInput}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            selectTextOnFocus
          />
          {prevSet && (
            <Text variant="caption" style={{ marginTop: 2 }}>prev: {prevSet.reps}</Text>
          )}
        </View>
        <View style={[styles.logField, { flex: 0.6 }]}>
          <Text variant="label" style={{ marginBottom: 4 }}>RPE</Text>
          <TextInput
            style={styles.logInput}
            value={rpe}
            onChangeText={setRpe}
            keyboardType="decimal-pad"
            placeholder="–"
            placeholderTextColor={Colors.text.disabled}
          />
        </View>
        <TouchableOpacity style={styles.logButton} onPress={handleLog}>
          <MaterialCommunityIcons name="check" size={22} color={Colors.background.primary} />
        </TouchableOpacity>
      </View>

      {/* e1RM display */}
      {lastSet && (
        <Text variant="caption" color="accent" style={{ marginTop: 4 }}>
          e1RM: {epley1RM(lastSet.weightKg, lastSet.reps).toFixed(1)} kg
        </Text>
      )}
    </Card>
  );
}

// ─── Exercise Picker ──────────────────────────────────────────────────────────
function ExercisePicker({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (ex: typeof EXERCISE_LIBRARY[0]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = EXERCISE_LIBRARY.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHandle} />
          <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Add Exercise</Text>
          <View style={styles.pickerSearch}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.text.secondary} />
            <TextInput
              style={styles.pickerSearchInput}
              placeholder="Search..."
              placeholderTextColor={Colors.text.disabled}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(e) => e.id}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.pickerItem} onPress={() => onSelect(item)}>
                <Text variant="bodyMedium">{item.name}</Text>
                <Text variant="caption">{item.primaryMuscles.join(', ')} · {item.equipment}</Text>
              </TouchableOpacity>
            )}
          />
          <Button label="Cancel" onPress={onClose} variant="ghost" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.accent.warning}18`,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.accent.warning}30`,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },
  exCard: { marginBottom: Spacing.md },
  setsTable: { marginBottom: Spacing.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  logRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs, marginTop: Spacing.sm },
  logField: { flex: 1 },
  logInput: {
    backgroundColor: Colors.background.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    textAlign: 'center',
    minHeight: 44,
  },
  logButton: {
    backgroundColor: Colors.accent.primary,
    borderRadius: Radius.sm,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  pickerSheet: {
    backgroundColor: Colors.background.elevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    height: '80%',
  },
  pickerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle, alignSelf: 'center', marginBottom: Spacing.md },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  pickerSearchInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    paddingVertical: 10,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
});
