import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '../../../src/constants/theme';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useHabitsStore } from '../../../src/stores/habitsStore';
import { Habit, HabitCategory, HabitFrequency } from '../../../src/types';
import { HABIT_SUGGESTIONS, HABIT_ICONS, HABIT_COLORS } from '../../../src/constants/habits';
import { generateId } from '../../../src/lib/utils';

type HabitsView = 'today' | 'weekly' | 'stats';

export default function HabitsTab() {
  const [view, setView] = useState<HabitsView>('today');
  const [showCreate, setShowCreate] = useState(false);

  const habits = useHabitsStore((s) => s.habits);
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navRow}>
        <Text variant="title" style={{ flex: 1 }}>Habits</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
          <MaterialCommunityIcons name="plus" size={22} color={Colors.accent.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.segmented}>
        {(['today', 'weekly', 'stats'] as HabitsView[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.segment, view === v && styles.segmentActive]}
            onPress={() => setView(v)}
          >
            <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: view === v ? Colors.background.primary : Colors.text.secondary }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === 'today' && <TodayView onAddHabit={() => setShowCreate(true)} />}
      {view === 'weekly' && <WeeklyView />}
      {view === 'stats' && <StatsView />}

      <CreateHabitModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  );
}

function shouldShowTodayHabit(habit: Habit): boolean {
  if (!habit.isActive) return false;
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'specific_days') return (habit.daysOfWeek ?? []).includes(new Date().getDay());
  return true;
}

// ─── Today View ────────────────────────────────────────────────────────────────
function TodayView({ onAddHabit }: { onAddHabit: () => void }) {
  const habits = useHabitsStore((s) => s.habits);
  const allLogs = useHabitsStore((s) => s.logs);
  const logHabit = useHabitsStore((s) => s.logHabit);
  const streaks = useHabitsStore((s) => s.streaks);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayHabits = habits.filter(shouldShowTodayHabit);
  const logs = allLogs.filter((l) => l.date === today);
  const completedIds = new Set(logs.filter((l) => l.completed).map((l) => l.habitId));
  const completedCount = completedIds.size;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Progress summary */}
      {todayHabits.length > 0 && (
        <View style={styles.progressRow}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium">{completedCount} of {todayHabits.length} complete</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${todayHabits.length > 0 ? (completedCount / todayHabits.length) * 100 : 0}%` }]} />
            </View>
          </View>
          {completedCount === todayHabits.length && todayHabits.length > 0 && (
            <Badge label="Perfect day!" color={Colors.accent.success} style={{ marginLeft: Spacing.sm }} />
          )}
        </View>
      )}

      {todayHabits.length === 0 ? (
        <EmptyState
          icon="check-circle-outline"
          title="No habits yet"
          description="Create habits to start building your streaks."
          actionLabel="Add a Habit"
          onAction={onAddHabit}
        />
      ) : (
        todayHabits.map((habit, i) => {
          const completed = completedIds.has(habit.id);
          const streak = streaks[habit.id];
          return (
            <MotiView
              key={habit.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: i * 50 }}
            >
              <HabitRow
                habit={habit}
                completed={completed}
                streak={streak?.current ?? 0}
                onToggle={() => {
                  logHabit(habit.id, today, !completed);
                  if (!completed) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                }}
              />
            </MotiView>
          );
        })
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function HabitRow({
  habit,
  completed,
  streak,
  onToggle,
}: {
  habit: Habit;
  completed: boolean;
  streak: number;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.habitRow, completed && styles.habitRowCompleted]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.habitColorDot, { backgroundColor: habit.color }]} />
      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
        <Text variant="bodyMedium" style={completed ? { opacity: 0.5 } : {}}>{habit.name}</Text>
        {streak > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MaterialCommunityIcons name="fire" size={12} color={Colors.accent.warning} />
            <Text variant="caption">{streak} day streak</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.checkCircle, { borderColor: habit.color }, completed && { backgroundColor: habit.color }]}
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {completed && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Weekly View ───────────────────────────────────────────────────────────────
function WeeklyView() {
  const habits = useHabitsStore((s) => s.habits).filter((h) => h.isActive);
  const getLogForDate = useHabitsStore((s) => s.getLogForDate);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE') };
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {habits.length === 0 ? (
        <EmptyState icon="calendar-week" title="No habits" description="Add habits to see your weekly grid." />
      ) : (
        habits.map((habit) => (
          <Card key={habit.id} style={{ marginBottom: Spacing.sm }}>
            <View style={styles.weeklyHeader}>
              <View style={[styles.habitColorDot, { backgroundColor: habit.color }]} />
              <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 8 }}>{habit.name}</Text>
            </View>
            <View style={styles.weekDots}>
              {days.map((d) => {
                const log = getLogForDate(habit.id, d.date);
                return (
                  <View key={d.date} style={{ alignItems: 'center', gap: 4 }}>
                    <Text variant="caption" style={{ fontSize: 10 }}>{d.label.charAt(0)}</Text>
                    <View style={[
                      styles.weekDot,
                      log?.completed && { backgroundColor: habit.color },
                      log?.skipped && { backgroundColor: Colors.text.disabled },
                    ]} />
                  </View>
                );
              })}
            </View>
          </Card>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Stats View ────────────────────────────────────────────────────────────────
function StatsView() {
  const habits = useHabitsStore((s) => s.habits).filter((h) => h.isActive);
  const streaks = useHabitsStore((s) => s.streaks);
  const getCompletionRate = useHabitsStore((s) => s.getCompletionRate);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {habits.map((h) => {
        const streak = streaks[h.id];
        const rate30 = getCompletionRate(h.id, 30);

        return (
          <Card key={h.id} style={{ marginBottom: Spacing.sm }} accent={h.color}>
            <Text variant="bodyMedium">{h.name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="display" style={{ fontSize: 22, color: h.color }}>{streak?.current ?? 0}</Text>
                <Text variant="caption">Current streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="display" style={{ fontSize: 22 }}>{streak?.longest ?? 0}</Text>
                <Text variant="caption">Best streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="display" style={{ fontSize: 22, color: Colors.accent.success }}>{Math.round(rate30 * 100)}%</Text>
                <Text variant="caption">30-day rate</Text>
              </View>
            </View>
          </Card>
        );
      })}

      {habits.length === 0 && (
        <EmptyState icon="chart-bar" title="No stats yet" description="Add habits and start tracking to see your statistics." />
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Create Habit Modal ────────────────────────────────────────────────────────
function CreateHabitModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const addHabit = useHabitsStore((s) => s.addHabit);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('check-circle');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [category, setCategory] = useState<HabitCategory>('health');
  const [step, setStep] = useState<'template' | 'custom'>('template');

  const reset = () => {
    setName(''); setSelectedIcon('check-circle'); setSelectedColor(HABIT_COLORS[0]);
    setFrequency('daily'); setCategory('health'); setStep('template');
  };

  const save = () => {
    if (!name.trim()) return;
    addHabit({
      id: generateId('habit'),
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      frequency,
      daysOfWeek: [],
      category,
      target: 1,
      isActive: true,
      createdAt: Date.now(),
    });
    reset();
    onClose();
  };

  const pickSuggestion = (s: typeof HABIT_SUGGESTIONS[0]) => {
    addHabit({
      id: generateId('habit'),
      name: s.name,
      icon: s.icon,
      color: s.color,
      frequency: 'daily',
      daysOfWeek: [],
      category: s.category as HabitCategory,
      target: s.target,
      targetUnit: s.targetUnit,
      isActive: true,
      createdAt: Date.now(),
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
            <Text variant="subtitle" style={{ flex: 1 }}>New Habit</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {step === 'template' ? (
            <>
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>SUGGESTIONS</Text>
                {HABIT_SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.suggestionRow} onPress={() => pickSuggestion(s)}>
                    <View style={[styles.suggestionIcon, { backgroundColor: `${s.color}20` }]}>
                      <MaterialCommunityIcons name={s.icon as any} size={18} color={s.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                      <Text variant="bodyMedium">{s.name}</Text>
                      <Badge label={s.category} color={s.color} style={{ marginTop: 2 }} />
                    </View>
                    <MaterialCommunityIcons name="plus" size={18} color={Colors.accent.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Button
                label="Create Custom Habit"
                onPress={() => setStep('custom')}
                variant="secondary"
                fullWidth
                style={{ marginTop: Spacing.md }}
              />
            </>
          ) : (
            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <Input label="Habit name" value={name} onChangeText={setName} placeholder="e.g. Morning run" />

              <Text variant="label" style={{ marginBottom: Spacing.xs }}>COLOR</Text>
              <View style={styles.colorRow}>
                {HABIT_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                    onPress={() => setSelectedColor(c)}
                  />
                ))}
              </View>

              <Text variant="label" style={{ marginVertical: Spacing.sm }}>CATEGORY</Text>
              <View style={styles.chipRow}>
                {(['health', 'fitness', 'mindfulness', 'learning', 'productivity'] as HabitCategory[]).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, category === c && styles.chipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: category === c ? Colors.background.primary : Colors.text.secondary }}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text variant="label" style={{ marginVertical: Spacing.sm }}>FREQUENCY</Text>
              <View style={styles.chipRow}>
                {([['daily', 'Daily'], ['specific_days', 'Specific days'], ['x_per_week', 'X per week']] as [HabitFrequency, string][]).map(([f, l]) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.chip, frequency === f && styles.chipActive]}
                    onPress={() => setFrequency(f)}
                  >
                    <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: frequency === f ? Colors.background.primary : Colors.text.secondary }}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
                <Button label="Back" onPress={() => setStep('template')} variant="secondary" style={{ flex: 1 }} />
                <Button label="Save Habit" onPress={save} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  addBtn: { padding: 8 },
  segmented: { flexDirection: 'row', backgroundColor: Colors.background.elevated, borderRadius: Radius.sm, margin: Spacing.md, marginTop: 0, padding: 3 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm - 3 },
  segmentActive: { backgroundColor: Colors.accent.primary },
  content: { padding: Spacing.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  progressBar: { height: 6, backgroundColor: Colors.background.elevated, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.accent.primary },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    minHeight: 56,
  },
  habitRowCompleted: { opacity: 0.6 },
  habitColorDot: { width: 10, height: 10, borderRadius: 5 },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  weekDots: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  statItem: { flex: 1, alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: Colors.background.elevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle, alignSelf: 'center', marginBottom: Spacing.md },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  suggestionIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.text.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.subtle },
  chipActive: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
});
