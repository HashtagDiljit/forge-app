import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, differenceInDays, parseISO } from 'date-fns';
import { MotiView } from 'moti';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '../../../src/constants/theme';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useGoalsStore } from '../../../src/stores/goalsStore';
import { Goal, GoalCategory, GoalMilestone } from '../../../src/types';
import { generateId } from '../../../src/lib/utils';

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  fitness: Colors.accent.secondary,
  health: Colors.accent.success,
  learning: Colors.accent.primary,
  career: Colors.accent.warning,
  finance: '#2ECC71',
  personal: '#9B59B6',
};

const CATEGORY_ICONS: Record<GoalCategory, string> = {
  fitness: 'dumbbell',
  health: 'heart-pulse',
  learning: 'school',
  career: 'briefcase',
  finance: 'currency-usd',
  personal: 'account',
};

export default function GoalsTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const goals = useGoalsStore((s) => s.goals);
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navRow}>
        <Text variant="title" style={{ flex: 1 }}>Goals</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
          <MaterialCommunityIcons name="plus" size={22} color={Colors.accent.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeGoals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="No active goals"
            description="Set a goal to start tracking your progress toward what matters most."
            actionLabel="Create a Goal"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          activeGoals.map((goal, i) => (
            <MotiView
              key={goal.id}
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 350, delay: i * 60 }}
            >
              <GoalCard goal={goal} />
            </MotiView>
          ))
        )}

        {completedGoals.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.sectionToggle}
              onPress={() => setShowCompleted((p) => !p)}
            >
              <MaterialCommunityIcons
                name={showCompleted ? 'chevron-down' : 'chevron-right'}
                size={18}
                color={Colors.text.secondary}
              />
              <Text variant="label" color="secondary">
                {completedGoals.length} COMPLETED GOAL{completedGoals.length > 1 ? 'S' : ''}
              </Text>
            </TouchableOpacity>

            {showCompleted && completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} compact />
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <CreateGoalModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  );
}

// ─── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, compact = false }: { goal: Goal; compact?: boolean }) {
  const completeMilestone = useGoalsStore((s) => s.completeMilestone);
  const updateProgress = useGoalsStore((s) => s.updateProgress);
  const [showDetail, setShowDetail] = useState(false);
  const [progressInput, setProgressInput] = useState(goal.currentValue.toString());

  const pct = Math.min(goal.currentValue / goal.targetValue, 1);
  const color = CATEGORY_COLORS[goal.category];
  const daysLeft = differenceInDays(parseISO(goal.endDate), new Date());
  const completedMilestones = goal.milestones.filter((m) => m.completedAt).length;

  return (
    <>
      <Card style={[styles.goalCard, compact ? styles.goalCardCompact : null].filter(Boolean) as any} accent={color} onPress={() => setShowDetail(true)}>
        <View style={styles.goalHeader}>
          <View style={[styles.goalIcon, { backgroundColor: `${color}20` }]}>
            <MaterialCommunityIcons name={CATEGORY_ICONS[goal.category] as any} size={16} color={color} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text variant="bodyMedium">{goal.title}</Text>
            {!compact && <Badge label={goal.category} color={color} style={{ marginTop: 3 }} />}
          </View>
          {goal.status === 'completed' && (
            <MaterialCommunityIcons name="trophy" size={18} color={Colors.accent.warning} />
          )}
        </View>

        {!compact && (
          <>
            <View style={styles.goalProgress}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text variant="caption">{goal.currentValue} / {goal.targetValue} {goal.unit}</Text>
                <Text variant="mono" style={{ fontSize: 12, color }}>{Math.round(pct * 100)}%</Text>
              </View>
            </View>

            <View style={styles.goalFooter}>
              {daysLeft >= 0 ? (
                <Text variant="caption">{daysLeft} days left</Text>
              ) : (
                <Text variant="caption" color="danger">Overdue by {Math.abs(daysLeft)} days</Text>
              )}
              {goal.milestones.length > 0 && (
                <Text variant="caption">{completedMilestones}/{goal.milestones.length} milestones</Text>
              )}
            </View>
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                <Text variant="subtitle" style={{ flex: 1 }}>{goal.title}</Text>
                <TouchableOpacity onPress={() => setShowDetail(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {goal.description && (
                <Text variant="body" color="secondary" style={{ marginBottom: Spacing.md }}>{goal.description}</Text>
              )}

              {/* Progress update */}
              <Card style={{ marginBottom: Spacing.md }}>
                <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>UPDATE PROGRESS</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' }}>
                  <Input
                    label={`Current value (${goal.unit})`}
                    value={progressInput}
                    onChangeText={setProgressInput}
                    keyboardType="decimal-pad"
                    containerStyle={{ flex: 1 }}
                  />
                  <Button
                    label="Update"
                    onPress={() => {
                      const v = parseFloat(progressInput);
                      if (!isNaN(v)) updateProgress(goal.id, v);
                    }}
                    style={{ marginBottom: Spacing.md }}
                  />
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(parseFloat(progressInput) / goal.targetValue, 1) * 100}%`, backgroundColor: color }]} />
                </View>
              </Card>

              {/* Milestones */}
              {goal.milestones.length > 0 && (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>MILESTONES</Text>
                  {goal.milestones.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.milestoneRow}
                      onPress={() => !m.completedAt && completeMilestone(goal.id, m.id)}
                    >
                      <MaterialCommunityIcons
                        name={m.completedAt ? 'check-circle' : 'circle-outline'}
                        size={20}
                        color={m.completedAt ? color : Colors.text.secondary}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                        <Text variant="bodyMedium" style={m.completedAt ? { opacity: 0.5 } : {}}>{m.title}</Text>
                        <Text variant="caption">Target: {m.targetValue} {goal.unit}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </Card>
              )}

              {/* Dates */}
              <Card>
                <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>TIMELINE</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text variant="caption" color="secondary">Start</Text>
                    <Text variant="bodyMedium">{format(parseISO(goal.startDate), 'MMM d, yyyy')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="caption" color="secondary">Deadline</Text>
                    <Text variant="bodyMedium">{format(parseISO(goal.endDate), 'MMM d, yyyy')}</Text>
                  </View>
                </View>
              </Card>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Create Goal Modal ─────────────────────────────────────────────────────────
function CreateGoalModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const addGoal = useGoalsStore((s) => s.addGoal);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('fitness');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd'));
  const [milestones, setMilestones] = useState<string[]>(['', '', '']);

  const categories: GoalCategory[] = ['fitness', 'health', 'learning', 'career', 'finance', 'personal'];

  const reset = () => {
    setTitle(''); setDescription(''); setCategory('fitness');
    setTargetValue(''); setUnit('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd'));
    setMilestones(['', '', '']);
  };

  const save = () => {
    if (!title.trim() || !targetValue) return;
    const tv = parseFloat(targetValue);
    const validMilestones: GoalMilestone[] = milestones
      .filter((m) => m.trim())
      .map((m, i) => ({
        id: generateId('ms'),
        goalId: '',
        title: m.trim(),
        targetValue: tv * ((i + 1) / milestones.filter((m) => m.trim()).length),
        order: i,
      }));

    addGoal({
      id: generateId('goal'),
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      targetValue: tv,
      currentValue: 0,
      unit: unit.trim() || 'units',
      startDate,
      endDate,
      status: 'active',
      milestones: validMilestones,
      reflections: [],
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
            <Text variant="subtitle" style={{ flex: 1 }}>New Goal</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
            <Input label="Goal title" value={title} onChangeText={setTitle} placeholder="e.g. Bench press 100 kg" />
            <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Why does this matter?" multiline numberOfLines={2} />

            <Text variant="label" style={{ marginBottom: Spacing.xs }}>CATEGORY</Text>
            <View style={styles.chipRow}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && { backgroundColor: CATEGORY_COLORS[c], borderColor: CATEGORY_COLORS[c] }]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: category === c ? '#fff' : Colors.text.secondary }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Input label="Target value" value={targetValue} onChangeText={setTargetValue} keyboardType="decimal-pad" placeholder="100" containerStyle={{ flex: 1 }} />
              <Input label="Unit" value={unit} onChangeText={setUnit} placeholder="kg" containerStyle={{ flex: 1 }} />
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Input label="Start date" value={startDate} onChangeText={setStartDate} placeholder="yyyy-mm-dd" containerStyle={{ flex: 1 }} />
              <Input label="End date" value={endDate} onChangeText={setEndDate} placeholder="yyyy-mm-dd" containerStyle={{ flex: 1 }} />
            </View>

            <Text variant="label" style={{ marginBottom: Spacing.xs }}>MILESTONES (optional)</Text>
            {milestones.map((m, i) => (
              <Input
                key={i}
                value={m}
                onChangeText={(v) => setMilestones((prev) => { const next = [...prev]; next[i] = v; return next; })}
                placeholder={`Milestone ${i + 1}`}
                leftIcon="flag"
              />
            ))}

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.sm }}>
              <Button label="Cancel" onPress={() => { reset(); onClose(); }} variant="secondary" style={{ flex: 1 }} />
              <Button label="Create Goal" onPress={save} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  addBtn: { padding: 8 },
  content: { padding: Spacing.md },
  goalCard: { marginBottom: Spacing.md },
  goalCardCompact: { marginBottom: Spacing.xs },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  goalIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  goalProgress: { marginTop: Spacing.sm },
  progressBar: { height: 6, backgroundColor: Colors.background.elevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  sectionToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: Colors.background.elevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle, alignSelf: 'center', marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.subtle },
});
