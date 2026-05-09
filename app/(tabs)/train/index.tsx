import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '../../../src/constants/theme';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { EXERCISE_LIBRARY, WORKOUT_TEMPLATES, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '../../../src/constants/exercises';
import { Exercise, WorkoutTemplate, MuscleGroup, EquipmentType } from '../../../src/types';
import { formatDuration, generateId, epley1RM } from '../../../src/lib/utils';

type TrainView = 'overview' | 'exercises' | 'history' | 'records';

export default function TrainTab() {
  const [view, setView] = useState<TrainView>('overview');
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navRow}>
        <Text variant="title" style={{ flex: 1 }}>Train</Text>
        {activeWorkout && (
          <Badge label="● ACTIVE" color={Colors.accent.success} />
        )}
      </View>
      <View style={styles.segmented}>
        {(['overview', 'exercises', 'history', 'records'] as TrainView[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.segment, view === v && styles.segmentActive]}
            onPress={() => setView(v)}
          >
            <Text style={{
              fontFamily: FontFamily.bodyMedium,
              fontSize: 12,
              color: view === v ? Colors.background.primary : Colors.text.secondary,
            }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === 'overview' && <OverviewView />}
      {view === 'exercises' && <ExercisesView />}
      {view === 'history' && <HistoryView />}
      {view === 'records' && <RecordsView />}
    </SafeAreaView>
  );
}

function OverviewView() {
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const templates = useWorkoutStore((s) => s.templates);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const [showPlateCalc, setShowPlateCalc] = useState(false);

  const allTemplates = useMemo(() => {
    const preloaded = WORKOUT_TEMPLATES.map((t) => ({
      ...t,
      createdAt: 0,
      exercises: t.exercises.map((e, i) => ({
        id: `${t.id}-${e.exerciseId}`,
        exerciseId: e.exerciseId,
        defaultSets: e.defaultSets,
        defaultReps: e.defaultReps,
        restSeconds: e.restSeconds,
        order: i,
      })),
    })) as WorkoutTemplate[];
    return [...preloaded, ...templates];
  }, [templates]);

  const startFromTemplate = (tpl: WorkoutTemplate) => {
    if (activeWorkout) {
      Alert.alert('Workout Active', 'You have an active workout. Finish or discard it first.');
      return;
    }
    startWorkout(tpl.name, tpl.id);
    router.push('/workout/active');
  };

  const startBlank = () => {
    if (activeWorkout) {
      Alert.alert('Workout Active', 'You have an active workout. Finish or discard it first.');
      return;
    }
    startWorkout('Quick Workout');
    router.push('/workout/active');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {activeWorkout && (
        <TouchableOpacity style={styles.activeBanner} onPress={() => router.push('/workout/active')}>
          <MaterialCommunityIcons name="dumbbell" size={20} color={Colors.accent.success} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text variant="bodyMedium" color="success">Workout In Progress</Text>
            <Text variant="caption">{activeWorkout.workout.name} · Tap to continue</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      )}

      <View style={styles.quickActions}>
        <Button
          label="Quick Start"
          onPress={startBlank}
          size="lg"
          fullWidth
          leftIcon={<MaterialCommunityIcons name="plus" size={20} color={Colors.background.primary} />}
        />
        <Button
          label="Plate Calc"
          onPress={() => setShowPlateCalc(true)}
          variant="secondary"
          leftIcon={<MaterialCommunityIcons name="calculator" size={18} color={Colors.text.primary} />}
        />
      </View>

      <Text variant="subtitle" style={styles.sectionTitle}>Templates</Text>
      {allTemplates.map((tpl) => (
        <Card key={tpl.id} style={styles.templateCard} onPress={() => startFromTemplate(tpl)}>
          <View style={styles.templateHeader}>
            <Text variant="bodyMedium">{tpl.name}</Text>
            {tpl.isPreloaded && <Badge label="Built-in" color={Colors.text.secondary} />}
          </View>
          {tpl.exercises.length > 0 && (
            <Text variant="caption" style={{ marginTop: 4 }}>
              {tpl.exercises.length} exercises
            </Text>
          )}
        </Card>
      ))}

      <PlateCalculator visible={showPlateCalc} onClose={() => setShowPlateCalc(false)} />
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function ExercisesView() {
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | null>(null);
  const [filterEquip, setFilterEquip] = useState<EquipmentType | null>(null);

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = !filterMuscle || ex.primaryMuscles.includes(filterMuscle);
      const matchesEquip = !filterEquip || ex.equipment === filterEquip;
      return matchesSearch && matchesMuscle && matchesEquip;
    });
  }, [search, filterMuscle, filterEquip]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchText}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.text.disabled}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, padding: Spacing.md }}>
        {MUSCLE_GROUPS.slice(0, 8).map((mg) => (
          <TouchableOpacity
            key={mg.id}
            style={[styles.filterChip, filterMuscle === mg.id && styles.filterChipActive]}
            onPress={() => setFilterMuscle(filterMuscle === mg.id ? null : mg.id as MuscleGroup)}
          >
            <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: filterMuscle === mg.id ? Colors.background.primary : Colors.text.secondary }}>
              {mg.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card style={styles.exerciseCard} onPress={() => router.push(`/exercise/${item.id}`)}>
            <View style={styles.exerciseHeader}>
              <Text variant="bodyMedium">{item.name}</Text>
              <Badge label={item.equipment} color={Colors.text.secondary} />
            </View>
            <Text variant="caption">
              {item.primaryMuscles.join(', ')}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="dumbbell"
            title="No exercises found"
            description="Try a different search or filter."
          />
        }
      />
    </View>
  );
}

function HistoryView() {
  const recentWorkouts = useWorkoutStore((s) => s.recentWorkouts);

  if (recentWorkouts.length === 0) {
    return (
      <EmptyState
        icon="history"
        title="No workouts yet"
        description="Log your first workout to see your history here."
      />
    );
  }

  return (
    <FlatList
      data={recentWorkouts}
      keyExtractor={(w) => w.id}
      contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
      renderItem={({ item: w }) => (
        <Card style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text variant="bodyMedium">{w.name}</Text>
            <Text variant="caption">{w.completedAt ? format(new Date(w.completedAt), 'MMM d') : 'In progress'}</Text>
          </View>
          <View style={styles.historyMeta}>
            {w.durationSeconds && (
              <Text variant="caption">{formatDuration(w.durationSeconds)}</Text>
            )}
            {w.totalVolumeKg != null && (
              <Text variant="caption">{Math.round(w.totalVolumeKg).toLocaleString()} kg volume</Text>
            )}
            <Text variant="caption">{w.exercises.length} exercises</Text>
          </View>
        </Card>
      )}
    />
  );
}

function RecordsView() {
  const prs = useWorkoutStore((s) => s.personalRecords);

  if (prs.length === 0) {
    return (
      <EmptyState
        icon="trophy-outline"
        title="No PRs yet"
        description="Complete workouts to set personal records."
      />
    );
  }

  const sorted = [...prs].sort((a, b) => b.e1rm - a.e1rm).slice(0, 20);

  return (
    <FlatList
      data={sorted}
      keyExtractor={(pr) => pr.exerciseId}
      contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
      renderItem={({ item: pr }) => {
        const exercise = EXERCISE_LIBRARY.find((e) => e.id === pr.exerciseId);
        return (
          <Card style={styles.prCard} accent={Colors.accent.secondary}>
            <View style={styles.prRow}>
              <Text variant="bodyMedium">{exercise?.name ?? pr.exerciseId}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="mono" style={{ fontSize: 18, color: Colors.accent.secondary }}>
                  {pr.e1rm.toFixed(1)} kg
                </Text>
                <Text variant="caption">{pr.weightKg}×{pr.reps}</Text>
              </View>
            </View>
          </Card>
        );
      }}
    />
  );
}

function PlateCalculator({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [target, setTarget] = useState('100');
  const [barbell, setBarbell] = useState('20');
  const { calculatePlates } = require('../../../src/lib/utils');

  const result = useMemo(() => {
    const t = parseFloat(target) || 0;
    const b = parseFloat(barbell) || 20;
    if (t <= b) return { plates: [], remainder: 0 };
    return calculatePlates(t, b);
  }, [target, barbell]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text variant="subtitle" style={{ marginBottom: Spacing.lg }}>Plate Calculator</Text>

          <View style={styles.calcRow}>
            <View style={{ flex: 1 }}>
              <Text variant="label" style={{ marginBottom: 4 }}>Target (kg)</Text>
              <TextInput
                style={styles.calcInput}
                value={target}
                onChangeText={setTarget}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.text.disabled}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text variant="label" style={{ marginBottom: 4 }}>Bar (kg)</Text>
              <TextInput
                style={styles.calcInput}
                value={barbell}
                onChangeText={setBarbell}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.text.disabled}
              />
            </View>
          </View>

          <Text variant="label" style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
            PLATES PER SIDE
          </Text>
          {result.plates.length === 0 ? (
            <Text variant="body" color="secondary">Enter a weight above bar weight.</Text>
          ) : (
            <View style={styles.platesRow}>
              {result.plates.map((p: number, i: number) => (
                <View key={i} style={styles.plateChip}>
                  <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 14, color: Colors.accent.primary }}>{p}</Text>
                  <Text variant="caption">kg</Text>
                </View>
              ))}
            </View>
          )}

          <Button label="Close" onPress={onClose} variant="ghost" style={{ marginTop: Spacing.xl }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  segmented: { flexDirection: 'row', backgroundColor: Colors.background.elevated, borderRadius: Radius.sm, margin: Spacing.md, marginTop: 0, padding: 3 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm - 3 },
  segmentActive: { backgroundColor: Colors.accent.primary },
  quickActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionTitle: { marginBottom: Spacing.sm },
  templateCard: { marginBottom: Spacing.sm },
  templateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.accent.success}15`,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.accent.success}30`,
    marginBottom: Spacing.md,
  },
  searchRow: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  searchText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    paddingVertical: 10,
  },
  filterScroll: { maxHeight: 48, flexGrow: 0 },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  filterChipActive: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
  exerciseCard: { marginBottom: Spacing.xs },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyCard: { marginBottom: Spacing.sm },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  historyMeta: { flexDirection: 'row', gap: Spacing.md },
  prCard: { marginBottom: Spacing.xs },
  prRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: Colors.background.elevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    minHeight: 360,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle, alignSelf: 'center', marginBottom: Spacing.lg },
  calcRow: { flexDirection: 'row', gap: Spacing.md },
  calcInput: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  platesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  plateChip: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.accent.primary}40`,
  },
});
