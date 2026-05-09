import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, subMonths, addMonths } from 'date-fns';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '../../../src/constants/theme';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useWorkoutStore } from '../../../src/stores/workoutStore';
import { EXERCISE_LIBRARY, WORKOUT_TEMPLATES, MUSCLE_GROUPS } from '../../../src/constants/exercises';
import { Exercise, Workout, WorkoutTemplate, TemplateExercise, WorkoutExercise, MuscleGroup } from '../../../src/types';
import { formatDuration, generateId } from '../../../src/lib/utils';

const BLUE = Colors.accent.primary;

type TrainView = 'overview' | 'exercises' | 'history' | 'records';

export default function TrainTab() {
  const [view, setView] = useState<TrainView>('overview');
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navRow}>
        <Text variant="title" style={{ flex: 1 }}>Train</Text>
        {activeWorkout && (
          <TouchableOpacity onPress={() => router.push('/workout/active')}>
            <Badge label="● ACTIVE" color={Colors.accent.success} />
          </TouchableOpacity>
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
  const recentWorkouts = useWorkoutStore((s) => s.recentWorkouts);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const addTemplate = useWorkoutStore((s) => s.addTemplate);
  const updateTemplate = useWorkoutStore((s) => s.updateTemplate);
  const deleteTemplate = useWorkoutStore((s) => s.deleteTemplate);

  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  const preloaded = useMemo<WorkoutTemplate[]>(() =>
    WORKOUT_TEMPLATES.map((t) => ({
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
    })), []);

  const allTemplates = useMemo(() => [...preloaded, ...templates], [preloaded, templates]);

  const startFromTemplate = (tpl: WorkoutTemplate) => {
    if (activeWorkout) {
      Alert.alert('Workout Active', 'Finish or discard your current workout first.');
      return;
    }
    startWorkout(tpl.name, tpl.id);
    router.push('/workout/active');
  };

  const startBlank = () => {
    if (activeWorkout) {
      Alert.alert('Workout Active', 'Finish or discard your current workout first.');
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
      <Text variant="caption" color="secondary" style={{ marginBottom: Spacing.lg, marginTop: -Spacing.sm }}>
        {format(new Date(), 'EEEE, MMMM d')}
      </Text>

      <View style={styles.sectionHeader}>
        <Text variant="subtitle">Templates</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreateTemplate(true)}
        >
          <MaterialCommunityIcons name="plus" size={18} color={BLUE} />
          <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 13, color: BLUE, marginLeft: 4 }}>New</Text>
        </TouchableOpacity>
      </View>

      {allTemplates.map((tpl) => (
        <TemplateCard
          key={tpl.id}
          template={tpl}
          onStart={() => startFromTemplate(tpl)}
          onEdit={!tpl.isPreloaded ? () => setEditingTemplate(tpl) : undefined}
          onDelete={!tpl.isPreloaded ? () => {
            Alert.alert('Delete Template', `Delete "${tpl.name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(tpl.id) },
            ]);
          } : undefined}
        />
      ))}

      <PlateCalculator visible={showPlateCalc} onClose={() => setShowPlateCalc(false)} />

      <TemplateEditorModal
        visible={showCreateTemplate}
        template={null}
        onClose={() => setShowCreateTemplate(false)}
        onSave={(t) => { addTemplate(t); setShowCreateTemplate(false); }}
      />
      <TemplateEditorModal
        visible={!!editingTemplate}
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={(t) => { updateTemplate(t.id, t); setEditingTemplate(null); }}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function TemplateCard({ template, onStart, onEdit, onDelete }: {
  template: WorkoutTemplate;
  onStart: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const exercises = template.exercises.map((te) => EXERCISE_LIBRARY.find((e) => e.id === te.exerciseId));

  return (
    <Card style={styles.templateCard}>
      <TouchableOpacity onPress={onStart} activeOpacity={0.7}>
        <View style={styles.templateHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium">{template.name}</Text>
            {template.isPreloaded && (
              <Badge label="Built-in" color={Colors.text.secondary} />
            )}
          </View>
          <TouchableOpacity
            style={[styles.startChip, { backgroundColor: `${BLUE}20`, borderColor: `${BLUE}40` }]}
            onPress={onStart}
          >
            <MaterialCommunityIcons name="play" size={14} color={BLUE} />
            <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: BLUE, marginLeft: 3 }}>Start</Text>
          </TouchableOpacity>
        </View>

        {exercises.length > 0 && (
          <View style={{ marginTop: Spacing.xs }}>
            {exercises.slice(0, 4).map((ex, i) => (
              <Text key={i} variant="caption" style={{ lineHeight: 18 }}>
                · {ex?.name ?? template.exercises[i].exerciseId}
                <Text variant="caption" color="secondary"> {template.exercises[i].defaultSets}×{template.exercises[i].defaultReps}</Text>
              </Text>
            ))}
            {exercises.length > 4 && (
              <Text variant="caption" color="secondary">+{exercises.length - 4} more</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {(onEdit || onDelete) && (
        <View style={styles.templateActions}>
          {onEdit && (
            <TouchableOpacity style={styles.templateActionBtn} onPress={onEdit}>
              <MaterialCommunityIcons name="pencil-outline" size={15} color={Colors.text.secondary} />
              <Text variant="caption" style={{ marginLeft: 3 }}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.templateActionBtn} onPress={onDelete}>
              <MaterialCommunityIcons name="trash-can-outline" size={15} color={Colors.accent.secondary} />
              <Text variant="caption" style={{ color: Colors.accent.secondary, marginLeft: 3 }}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
}

function TemplateEditorModal({ visible, template, onClose, onSave }: {
  visible: boolean;
  template: WorkoutTemplate | null;
  onClose: () => void;
  onSave: (t: WorkoutTemplate) => void;
}) {
  const [name, setName] = useState(template?.name ?? '');
  const [exercises, setExercises] = useState<TemplateExercise[]>(template?.exercises ?? []);
  const [showExPicker, setShowExPicker] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(template?.name ?? '');
      setExercises(template?.exercises ?? []);
    }
  }, [visible, template]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const t: WorkoutTemplate = {
      id: template?.id ?? generateId('tpl'),
      name: name.trim(),
      exercises,
      isPreloaded: false,
      createdAt: template?.createdAt ?? Date.now(),
    };
    onSave(t);
  };

  const addExercise = (ex: typeof EXERCISE_LIBRARY[0]) => {
    const te: TemplateExercise = {
      id: generateId('te'),
      exerciseId: ex.id,
      defaultSets: 3,
      defaultReps: 10,
      restSeconds: 90,
      order: exercises.length,
    };
    setExercises((prev) => [...prev, te]);
    setShowExPicker(false);
  };

  const removeExercise = (id: string) => setExercises((prev) => prev.filter((e) => e.id !== id));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
          <View style={styles.modalHandle} />
          <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>
            {template ? 'Edit Template' : 'New Template'}
          </Text>

          <Text variant="label" style={{ marginBottom: 4 }}>TEMPLATE NAME</Text>
          <TextInput
            style={styles.calcInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Push Day"
            placeholderTextColor={Colors.text.disabled}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm }}>
            <Text variant="label" style={{ flex: 1 }}>EXERCISES ({exercises.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowExPicker(true)}>
              <MaterialCommunityIcons name="plus" size={16} color={BLUE} />
              <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: BLUE, marginLeft: 3 }}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 240 }}>
            {exercises.map((te, i) => {
              const ex = EXERCISE_LIBRARY.find((e) => e.id === te.exerciseId);
              return (
                <View key={te.id} style={styles.tplExRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{ex?.name ?? te.exerciseId}</Text>
                    <Text variant="caption">{te.defaultSets} sets × {te.defaultReps} reps</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeExercise(te.id)}>
                    <MaterialCommunityIcons name="close" size={18} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              );
            })}
            {exercises.length === 0 && (
              <Text variant="caption" color="secondary" style={{ textAlign: 'center', paddingVertical: Spacing.md }}>
                Tap + Add to add exercises
              </Text>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
            <Button label="Cancel" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
            <Button label="Save" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </View>
      </View>

      <ExercisePickerModal
        visible={showExPicker}
        onSelect={addExercise}
        onClose={() => setShowExPicker(false)}
      />
    </Modal>
  );
}

function ExercisesView() {
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() =>
    EXERCISE_LIBRARY.filter((ex) => {
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = !filterMuscle || ex.primaryMuscles.includes(filterMuscle);
      return matchSearch && matchMuscle;
    }),
    [search, filterMuscle]
  );

  const handleAdd = (ex: typeof EXERCISE_LIBRARY[0]) => {
    if (!activeWorkout) {
      Alert.alert('No Active Workout', 'Start a workout first to add exercises.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Workout', onPress: () => { useWorkoutStore.getState().startWorkout('Quick Workout'); router.push('/workout/active'); } },
      ]);
      return;
    }
    const we: WorkoutExercise = {
      id: generateId('we'),
      exerciseId: ex.id,
      exercise: ex as Exercise,
      sets: [],
      restSeconds: 90,
    };
    addExercise(we);
    router.push('/workout/active');
  };

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
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, padding: Spacing.md }}>
        {MUSCLE_GROUPS.slice(0, 10).map((mg) => (
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

      {activeWorkout && (
        <View style={styles.addToWorkoutBanner}>
          <MaterialCommunityIcons name="dumbbell" size={14} color={BLUE} />
          <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: BLUE, marginLeft: 6 }}>
            Tap any exercise to add it to your active workout
          </Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{item.name}</Text>
                <Text variant="caption">{item.primaryMuscles.join(', ')} · {item.equipment}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                {activeWorkout && (
                  <TouchableOpacity
                    style={[styles.exActionBtn, { backgroundColor: `${BLUE}20`, borderColor: `${BLUE}40` }]}
                    onPress={() => handleAdd(item)}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={BLUE} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.exActionBtn}
                  onPress={() => router.push(`/exercise/${item.id}`)}
                >
                  <MaterialCommunityIcons name="information-outline" size={16} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState icon="dumbbell" title="No exercises found" description="Try a different search or filter." />
        }
      />
    </View>
  );
}

function HistoryView() {
  const recentWorkouts = useWorkoutStore((s) => s.recentWorkouts);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<typeof recentWorkouts[0] | null>(null);

  const workoutDates = useMemo(() => {
    const map = new Map<string, typeof recentWorkouts[0][]>();
    recentWorkouts.forEach((w) => {
      if (w.completedAt) {
        const key = format(new Date(w.completedAt), 'yyyy-MM-dd');
        const existing = map.get(key) ?? [];
        map.set(key, [...existing, w]);
      }
    });
    return map;
  }, [recentWorkouts]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={() => setCurrentMonth((m) => subMonths(m, 1))} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text variant="bodyMedium">{format(currentMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => setCurrentMonth((m) => addMonths(m, 1))} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.calWeekRow}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <Text key={d} variant="caption" style={styles.calWeekLabel}>{d}</Text>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>
        <View style={styles.calGrid}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.calCell} />
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const hasWorkout = workoutDates.has(key);
            const isToday = isSameDay(day, new Date());
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.calCell,
                  isToday && styles.calCellToday,
                  hasWorkout && styles.calCellWorkout,
                ]}
                onPress={() => {
                  if (hasWorkout) setSelectedWorkout(workoutDates.get(key)![0]);
                }}
                activeOpacity={hasWorkout ? 0.7 : 1}
              >
                <Text style={[
                  styles.calDayText,
                  ...(isToday ? [{ color: Colors.background.primary as string, fontFamily: FontFamily.bodyBold as string }] : []),
                  ...(hasWorkout && !isToday ? [{ color: BLUE as string }] : []),
                ] as any}>
                  {format(day, 'd')}
                </Text>
                {hasWorkout && (
                  <View style={[styles.calDot, { backgroundColor: isToday ? Colors.background.primary : BLUE }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {recentWorkouts.length === 0 && (
          <EmptyState
            icon="history"
            title="No workouts yet"
            description="Log your first workout to see it on the calendar."
          />
        )}

        {recentWorkouts.length > 0 && (
          <>
            <Text variant="subtitle" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>Recent Sessions</Text>
            {recentWorkouts.slice(0, 5).map((w) => (
              <TouchableOpacity key={w.id} onPress={() => setSelectedWorkout(w)}>
                <Card style={{ marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="caption" style={{ color: BLUE }}>
                      {w.completedAt ? format(new Date(w.completedAt), 'EEE, MMM d') : '–'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.text.secondary} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: 2 }}>
                    {w.durationSeconds && <Text variant="caption">{formatDuration(w.durationSeconds)}</Text>}
                    {w.totalVolumeKg != null && <Text variant="caption">{Math.round(w.totalVolumeKg).toLocaleString()} kg</Text>}
                    <Text variant="caption">{w.exercises.length} ex</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      <WorkoutSummaryModal
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
      />
    </View>
  );
}

function WorkoutSummaryModal({ workout, onClose }: { workout: Workout | null; onClose: () => void }) {
  if (!workout) return null;
  return (
    <Modal visible={!!workout} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
            <Text variant="subtitle">
              {workout.completedAt ? format(new Date(workout.completedAt), 'EEE, MMM d') : workout.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md }}>
            {workout.durationSeconds != null && (
              <View>
                <Text variant="caption" color="secondary">Duration</Text>
                <Text variant="bodyMedium">{formatDuration(workout.durationSeconds)}</Text>
              </View>
            )}
            {workout.totalVolumeKg != null && (
              <View>
                <Text variant="caption" color="secondary">Volume</Text>
                <Text variant="bodyMedium">{Math.round(workout.totalVolumeKg).toLocaleString()} kg</Text>
              </View>
            )}
            <View>
              <Text variant="caption" color="secondary">Exercises</Text>
              <Text variant="bodyMedium">{workout.exercises.length}</Text>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 280 }}>
            {workout.exercises.map((ex) => {
              const info = EXERCISE_LIBRARY.find((e) => e.id === ex.exerciseId);
              return (
                <View key={ex.id} style={{ marginBottom: Spacing.sm, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle }}>
                  <Text variant="bodyMedium">{info?.name ?? ex.exerciseId}</Text>
                  <Text variant="caption">
                    {ex.sets.length} sets · {ex.sets.reduce((s, set) => s + set.reps, 0)} total reps
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function RecordsView() {
  const prs = useWorkoutStore((s) => s.personalRecords);
  const { epley1RM } = require('../../../src/lib/utils');

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
          <Card style={{ marginBottom: Spacing.xs, borderLeftWidth: 3, borderLeftColor: BLUE }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="bodyMedium">{exercise?.name ?? pr.exerciseId}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="mono" style={{ fontSize: 18, color: BLUE }}>
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

function ExercisePickerModal({ visible, onSelect, onClose }: {
  visible: boolean;
  onSelect: (ex: typeof EXERCISE_LIBRARY[0]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() =>
    EXERCISE_LIBRARY.filter((e) => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = !filterMuscle || e.primaryMuscles.includes(filterMuscle);
      return matchSearch && matchMuscle;
    }),
    [search, filterMuscle]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { height: '85%' }]}>
          <View style={styles.modalHandle} />
          <Text variant="subtitle" style={{ marginBottom: Spacing.sm }}>Select Exercise</Text>

          <View style={[styles.searchInput, { marginBottom: Spacing.sm }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.text.secondary} />
            <TextInput
              style={styles.searchText}
              placeholder="Search..."
              placeholderTextColor={Colors.text.disabled}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40, flexGrow: 0, marginBottom: Spacing.sm }} contentContainerStyle={{ gap: 6, paddingRight: Spacing.md }}>
            {MUSCLE_GROUPS.slice(0, 10).map((mg) => (
              <TouchableOpacity
                key={mg.id}
                style={[styles.filterChip, filterMuscle === mg.id && styles.filterChipActive]}
                onPress={() => setFilterMuscle(filterMuscle === mg.id ? null : mg.id as MuscleGroup)}
              >
                <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 11, color: filterMuscle === mg.id ? Colors.background.primary : Colors.text.secondary }}>
                  {mg.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filtered}
            keyExtractor={(e) => e.id}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.pickerItem} onPress={() => onSelect(item)}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{item.name}</Text>
                  <Text variant="caption">{item.primaryMuscles.join(', ')} · {item.equipment}</Text>
                </View>
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={BLUE} />
              </TouchableOpacity>
            )}
          />
          <Button label="Cancel" onPress={onClose} variant="ghost" style={{ marginTop: Spacing.sm }} />
        </View>
      </View>
    </Modal>
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
              <TextInput style={styles.calcInput} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholderTextColor={Colors.text.disabled} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text variant="label" style={{ marginBottom: 4 }}>Bar (kg)</Text>
              <TextInput style={styles.calcInput} value={barbell} onChangeText={setBarbell} keyboardType="decimal-pad" placeholderTextColor={Colors.text.disabled} />
            </View>
          </View>

          <Text variant="label" style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>PLATES PER SIDE</Text>
          {result.plates.length === 0 ? (
            <Text variant="body" color="secondary">Enter a weight above bar weight.</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
              {result.plates.map((p: number, i: number) => (
                <View key={i} style={[styles.plateChip, { borderColor: `${BLUE}40` }]}>
                  <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 14, color: BLUE }}>{p}</Text>
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
  segmentActive: { backgroundColor: BLUE },
  quickActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm, marginTop: Spacing.xs },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, borderWidth: 1, borderColor: `${BLUE}40`, backgroundColor: `${BLUE}10` },
  templateCard: { marginBottom: Spacing.sm },
  templateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  templateActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border.subtle },
  templateActionBtn: { flexDirection: 'row', alignItems: 'center' },
  startChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, borderWidth: 1 },
  tplExRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  activeBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${Colors.accent.success}15`, borderRadius: Radius.sm, padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.accent.success}30`, marginBottom: Spacing.md },
  searchRow: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },
  searchInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.elevated, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border.subtle },
  searchText: { flex: 1, fontFamily: FontFamily.body, fontSize: FontSize.md, color: Colors.text.primary, paddingVertical: 10 },
  filterScroll: { maxHeight: 48, flexGrow: 0 },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  filterChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  addToWorkoutBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${BLUE}10`, paddingHorizontal: Spacing.md, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: `${BLUE}20` },
  exerciseCard: { marginBottom: Spacing.xs },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exActionBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  calWeekRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.xs },
  calWeekLabel: { flex: 1, textAlign: 'center', color: Colors.text.secondary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  calCellToday: { backgroundColor: BLUE, borderRadius: Radius.sm },
  calCellWorkout: {},
  calDayText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.text.primary },
  calDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: Colors.background.elevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, minHeight: 360 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle, alignSelf: 'center', marginBottom: Spacing.lg },
  calcRow: { flexDirection: 'row', gap: Spacing.md },
  calcInput: { backgroundColor: Colors.background.card, borderRadius: Radius.sm, padding: Spacing.sm, fontFamily: FontFamily.mono, fontSize: FontSize.lg, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.subtle },
  plateChip: { backgroundColor: Colors.background.card, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
});
