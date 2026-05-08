import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '../../../src/constants/theme';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useHealthStore } from '../../../src/stores/healthStore';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { HealthMetric, HealthMetricType, SleepLog, FoodLog, MoodLog } from '../../../src/types';
import { generateId, formatDurationMinutes, calculateBMI } from '../../../src/lib/utils';

type HealthSection = 'body' | 'cardio' | 'sleep' | 'nutrition' | 'wellness';

export default function HealthTab() {
  const [section, setSection] = useState<HealthSection>('body');

  const sections: { id: HealthSection; label: string; icon: string }[] = [
    { id: 'body', label: 'Body', icon: 'human' },
    { id: 'cardio', label: 'Cardio', icon: 'run' },
    { id: 'sleep', label: 'Sleep', icon: 'sleep' },
    { id: 'nutrition', label: 'Nutrition', icon: 'food-apple' },
    { id: 'wellness', label: 'Wellness', icon: 'brain' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text variant="title">Health</Text>
        <HealthConnectNote />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.md }}>
        {sections.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sectionChip, section === s.id && styles.sectionChipActive]}
            onPress={() => setSection(s.id)}
          >
            <MaterialCommunityIcons
              name={s.icon as any}
              size={14}
              color={section === s.id ? Colors.background.primary : Colors.text.secondary}
            />
            <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 13, marginLeft: 4, color: section === s.id ? Colors.background.primary : Colors.text.secondary }}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {section === 'body' && <BodySection />}
      {section === 'cardio' && <CardioSection />}
      {section === 'sleep' && <SleepSection />}
      {section === 'nutrition' && <NutritionSection />}
      {section === 'wellness' && <WellnessSection />}
    </SafeAreaView>
  );
}

function HealthConnectNote() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <MaterialCommunityIcons name="information-outline" size={20} color={Colors.text.secondary} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.infoOverlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="sync" size={24} color={Colors.accent.warning} />
            <Text variant="bodyMedium" style={{ marginTop: 8, textAlign: 'center' }}>Health Connect Sync</Text>
            <Text variant="caption" style={{ textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
              Automatic sync with Samsung Health and other apps via Health Connect can be added in a future update.
              All metrics are currently entered manually — tap any card to log data.
            </Text>
            <Button label="Got it" onPress={() => setVisible(false)} size="sm" style={{ marginTop: Spacing.md }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Body Section ─────────────────────────────────────────────────────────────
function BodySection() {
  const addMetric = useHealthStore((s) => s.addMetric);
  const getMetricHistory = useHealthStore((s) => s.getMetricHistory);
  const getLatestMetric = useHealthStore((s) => s.getLatestMetric);
  const user = useSettingsStore((s) => s.user);

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showBodyFatModal, setShowBodyFatModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);

  const latestWeight = getLatestMetric('weight');
  const latestBF = getLatestMetric('body_fat');
  const weightHistory = getMetricHistory('weight', 30);

  const bmi = latestWeight && user ? calculateBMI(latestWeight.value, user.heightCm) : null;

  return (
    <ScrollView contentContainerStyle={styles.sectionContent}>
      {/* Weight */}
      <Card onPress={() => setShowWeightModal(true)} style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text variant="label" color="secondary">BODY WEIGHT</Text>
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.accent.primary} />
        </View>
        <Text variant="display">
          {latestWeight?.value?.toFixed(1) ?? '--'}
          <Text variant="caption" color="secondary"> kg</Text>
        </Text>
        {latestWeight && (
          <Text variant="caption">{format(new Date(latestWeight.recordedAt), 'MMM d, yyyy')}</Text>
        )}
        {bmi && <Text variant="caption">BMI: {bmi}</Text>}
      </Card>

      {/* Body fat */}
      <Card onPress={() => setShowBodyFatModal(true)} style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text variant="label" color="secondary">BODY FAT %</Text>
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.accent.primary} />
        </View>
        <Text variant="display">
          {latestBF?.value?.toFixed(1) ?? '--'}
          <Text variant="caption" color="secondary"> %</Text>
        </Text>
        {!latestBF && <Text variant="caption" color="secondary">Tap to log</Text>}
      </Card>

      {/* Weight history list */}
      {weightHistory.length > 0 && (
        <Card style={{ marginBottom: Spacing.md }}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>WEIGHT HISTORY</Text>
          {weightHistory.slice(-7).reverse().map((m) => (
            <View key={m.id} style={styles.historyRow}>
              <Text variant="caption">{format(new Date(m.recordedAt), 'MMM d')}</Text>
              <Text variant="mono">{m.value.toFixed(1)} kg</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Measurements */}
      <Card onPress={() => setShowMeasurementsModal(true)} style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text variant="label" color="secondary">BODY MEASUREMENTS</Text>
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.accent.primary} />
        </View>
        <Text variant="caption" color="secondary">Waist, hips, arms, chest…</Text>
      </Card>

      {/* Modals */}
      <LogMetricModal
        visible={showWeightModal}
        title="Log Weight"
        metricType="weight"
        unit="kg"
        placeholder="75.0"
        onClose={() => setShowWeightModal(false)}
        onSave={(v) => {
          addMetric({ id: generateId('m'), type: 'weight', value: v, unit: 'kg', recordedAt: Date.now(), source: 'manual' });
          setShowWeightModal(false);
        }}
      />
      <LogMetricModal
        visible={showBodyFatModal}
        title="Log Body Fat %"
        metricType="body_fat"
        unit="%"
        placeholder="15.0"
        onClose={() => setShowBodyFatModal(false)}
        onSave={(v) => {
          addMetric({ id: generateId('m'), type: 'body_fat', value: v, unit: '%', recordedAt: Date.now(), source: 'manual' });
          setShowBodyFatModal(false);
        }}
      />
      <MeasurementsModal
        visible={showMeasurementsModal}
        onClose={() => setShowMeasurementsModal(false)}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Cardio Section ───────────────────────────────────────────────────────────
function CardioSection() {
  const addMetric = useHealthStore((s) => s.addMetric);
  const getLatestMetric = useHealthStore((s) => s.getLatestMetric);
  const getMetricHistory = useHealthStore((s) => s.getMetricHistory);
  const [showModal, setShowModal] = useState<HealthMetricType | null>(null);

  const metrics: { type: HealthMetricType; label: string; unit: string; icon: string; placeholder: string }[] = [
    { type: 'steps', label: 'Steps', unit: 'steps', icon: 'walk', placeholder: '8000' },
    { type: 'heart_rate_resting', label: 'Resting Heart Rate', unit: 'bpm', icon: 'heart-pulse', placeholder: '60' },
    { type: 'calories_active', label: 'Active Calories', unit: 'kcal', icon: 'fire', placeholder: '400' },
    { type: 'distance', label: 'Distance', unit: 'm', icon: 'map-marker-distance', placeholder: '5000' },
    { type: 'spo2', label: 'Blood Oxygen (SpO2)', unit: '%', icon: 'lungs', placeholder: '98' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.sectionContent}>
      {metrics.map((m) => {
        const latest = getLatestMetric(m.type);
        return (
          <Card key={m.type} onPress={() => setShowModal(m.type)} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text variant="label" color="secondary">{m.label.toUpperCase()}</Text>
              <MaterialCommunityIcons name={m.icon as any} size={18} color={Colors.accent.primary} />
            </View>
            <Text variant="display">
              {latest?.value != null ? (m.type === 'distance' ? (latest.value / 1000).toFixed(2) : latest.value) : '--'}
              <Text variant="caption" color="secondary"> {m.type === 'distance' ? 'km' : m.unit}</Text>
            </Text>
            {!latest && <Text variant="caption" color="secondary">Tap to log</Text>}
          </Card>
        );
      })}

      {showModal && (
        <LogMetricModal
          visible={true}
          title={`Log ${metrics.find((m) => m.type === showModal)?.label}`}
          metricType={showModal}
          unit={metrics.find((m) => m.type === showModal)?.unit ?? ''}
          placeholder={metrics.find((m) => m.type === showModal)?.placeholder ?? ''}
          onClose={() => setShowModal(null)}
          onSave={(v) => {
            addMetric({ id: generateId('m'), type: showModal, value: v, unit: metrics.find((m) => m.type === showModal)?.unit ?? '', recordedAt: Date.now(), source: 'manual' });
            setShowModal(null);
          }}
        />
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Sleep Section ────────────────────────────────────────────────────────────
function SleepSection() {
  const addSleepLog = useHealthStore((s) => s.addSleepLog);
  const sleepLogs = useHealthStore((s) => s.sleepLogs);
  const [showModal, setShowModal] = useState(false);
  const [bedHour, setBedHour] = useState('22');
  const [bedMin, setBedMin] = useState('30');
  const [wakeHour, setWakeHour] = useState('6');
  const [wakeMin, setWakeMin] = useState('30');

  const saveSleep = () => {
    const now = new Date();
    const bedtime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, parseInt(bedHour), parseInt(bedMin));
    const wakeTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(wakeHour), parseInt(wakeMin));
    const totalMinutes = Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000);
    if (totalMinutes <= 0) { Alert.alert('Invalid time'); return; }

    addSleepLog({
      id: generateId('sleep'),
      bedtime: bedtime.getTime(),
      wakeTime: wakeTime.getTime(),
      totalMinutes,
      source: 'manual',
      recordedAt: Date.now(),
    });
    setShowModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.sectionContent}>
      <Button
        label="Log Last Night's Sleep"
        onPress={() => setShowModal(true)}
        leftIcon={<MaterialCommunityIcons name="plus" size={18} color={Colors.background.primary} />}
        fullWidth
        style={{ marginBottom: Spacing.md }}
      />

      {sleepLogs.length === 0 ? (
        <EmptyState icon="sleep" title="No sleep logs" description="Log your sleep to track trends over time." />
      ) : (
        sleepLogs.slice(0, 14).map((log) => (
          <Card key={log.id} style={styles.metricCard}>
            <Text variant="bodyMedium">{format(new Date(log.wakeTime), 'EEE, MMM d')}</Text>
            <Text variant="display" style={{ fontSize: 28 }}>
              {(log.totalMinutes / 60).toFixed(1)}
              <Text variant="caption" color="secondary"> hours</Text>
            </Text>
            <Text variant="caption">
              {format(new Date(log.bedtime), 'h:mm a')} → {format(new Date(log.wakeTime), 'h:mm a')}
            </Text>
          </Card>
        ))
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text variant="subtitle" style={{ marginBottom: Spacing.lg }}>Log Sleep</Text>
            <Text variant="label" style={{ marginBottom: Spacing.xs }}>BEDTIME (previous night)</Text>
            <View style={styles.timeRow}>
              <TextInput style={styles.timeInput} value={bedHour} onChangeText={setBedHour} keyboardType="numeric" maxLength={2} />
              <Text variant="title" style={{ marginHorizontal: 8 }}>:</Text>
              <TextInput style={styles.timeInput} value={bedMin} onChangeText={setBedMin} keyboardType="numeric" maxLength={2} />
            </View>
            <Text variant="label" style={{ marginBottom: Spacing.xs, marginTop: Spacing.md }}>WAKE TIME</Text>
            <View style={styles.timeRow}>
              <TextInput style={styles.timeInput} value={wakeHour} onChangeText={setWakeHour} keyboardType="numeric" maxLength={2} />
              <Text variant="title" style={{ marginHorizontal: 8 }}>:</Text>
              <TextInput style={styles.timeInput} value={wakeMin} onChangeText={setWakeMin} keyboardType="numeric" maxLength={2} />
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl }}>
              <Button label="Cancel" onPress={() => setShowModal(false)} variant="secondary" style={{ flex: 1 }} />
              <Button label="Save" onPress={saveSleep} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Nutrition Section ────────────────────────────────────────────────────────
function NutritionSection() {
  const targets = useSettingsStore((s) => s.nutritionTargets);
  const addFoodLog = useHealthStore((s) => s.addFoodLog);
  const getTodayFoodLogs = useHealthStore((s) => s.getTodayFoodLogs);
  const addMetric = useHealthStore((s) => s.addMetric);
  const getMetricHistory = useHealthStore((s) => s.getMetricHistory);

  const todayFood = getTodayFoodLogs();
  const totalCals = todayFood.reduce((s, f) => s + f.calories, 0);
  const totalProtein = todayFood.reduce((s, f) => s + f.proteinG, 0);
  const totalCarbs = todayFood.reduce((s, f) => s + f.carbsG, 0);
  const totalFat = todayFood.reduce((s, f) => s + f.fatG, 0);

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [foodCals, setFoodCals] = useState('');
  const [foodProtein, setFoodProtein] = useState('');
  const [foodCarbs, setFoodCarbs] = useState('');
  const [foodFat, setFoodFat] = useState('');
  const [waterAmount, setWaterAmount] = useState('250');

  const waterLogs = getMetricHistory('hydration', 1);
  const totalWater = waterLogs.reduce((s, m) => s + m.value, 0);

  const saveFoodLog = () => {
    if (!foodName.trim() || !foodCals) return;
    addFoodLog({
      id: generateId('food'),
      name: foodName.trim(),
      calories: parseFloat(foodCals) || 0,
      proteinG: parseFloat(foodProtein) || 0,
      carbsG: parseFloat(foodCarbs) || 0,
      fatG: parseFloat(foodFat) || 0,
      servingSize: 1,
      servingUnit: 'serving',
      loggedAt: Date.now(),
      mealType: 'snack',
    });
    setFoodName(''); setFoodCals(''); setFoodProtein(''); setFoodCarbs(''); setFoodFat('');
    setShowFoodModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.sectionContent}>
      {/* Calories overview */}
      <Card style={styles.metricCard}>
        <Text variant="label" color="secondary">CALORIES TODAY</Text>
        <Text variant="display">{Math.round(totalCals)}<Text variant="caption" color="secondary"> / {targets.calorieTarget} kcal</Text></Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(totalCals / targets.calorieTarget, 1) * 100}%`, backgroundColor: Colors.accent.primary }]} />
        </View>
      </Card>

      {/* Macros */}
      <Card style={styles.metricCard}>
        <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>MACROS</Text>
        <MacroRow label="Protein" value={totalProtein} target={targets.proteinG} color={Colors.accent.secondary} />
        <MacroRow label="Carbs" value={totalCarbs} target={targets.carbsG} color={Colors.accent.warning} />
        <MacroRow label="Fat" value={totalFat} target={targets.fatG} color="#9B59B6" />
      </Card>

      {/* Water */}
      <Card style={styles.metricCard} onPress={() => setShowWaterModal(true)}>
        <View style={styles.metricHeader}>
          <Text variant="label" color="secondary">WATER</Text>
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.accent.primary} />
        </View>
        <Text variant="display">{Math.round(totalWater)}<Text variant="caption" color="secondary"> / {targets.waterMl} ml</Text></Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(totalWater / targets.waterMl, 1) * 100}%`, backgroundColor: '#3498DB' }]} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <Button label="Log Food" onPress={() => setShowFoodModal(true)} style={{ flex: 1 }} leftIcon={<MaterialCommunityIcons name="food" size={18} color={Colors.background.primary} />} />
        <Button label="Log Water" onPress={() => setShowWaterModal(true)} variant="secondary" style={{ flex: 1 }} leftIcon={<MaterialCommunityIcons name="water" size={18} color={Colors.text.primary} />} />
      </View>

      {/* Today's food list */}
      {todayFood.length > 0 && (
        <Card style={{ marginBottom: Spacing.md }}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>TODAY'S FOOD</Text>
          {todayFood.map((f) => (
            <View key={f.id} style={styles.foodRow}>
              <Text variant="bodyMedium" style={{ flex: 1 }}>{f.name}</Text>
              <Text variant="mono">{Math.round(f.calories)} kcal</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Food modal */}
      <Modal visible={showFoodModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Log Food</Text>
            <Input label="Food name" value={foodName} onChangeText={setFoodName} placeholder="e.g. Chicken breast" />
            <Input label="Calories (kcal)" value={foodCals} onChangeText={setFoodCals} keyboardType="decimal-pad" placeholder="200" />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Input label="Protein (g)" value={foodProtein} onChangeText={setFoodProtein} keyboardType="decimal-pad" placeholder="30" containerStyle={{ flex: 1 }} />
              <Input label="Carbs (g)" value={foodCarbs} onChangeText={setFoodCarbs} keyboardType="decimal-pad" placeholder="0" containerStyle={{ flex: 1 }} />
              <Input label="Fat (g)" value={foodFat} onChangeText={setFoodFat} keyboardType="decimal-pad" placeholder="5" containerStyle={{ flex: 1 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
              <Button label="Cancel" onPress={() => setShowFoodModal(false)} variant="secondary" style={{ flex: 1 }} />
              <Button label="Save" onPress={saveFoodLog} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Water modal */}
      <Modal visible={showWaterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Log Water</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {[150, 250, 330, 500].map((ml) => (
                <TouchableOpacity key={ml} style={styles.quickWater} onPress={() => setWaterAmount(ml.toString())}>
                  <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 13, color: waterAmount === ml.toString() ? Colors.background.primary : Colors.text.primary }}>{ml} ml</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Amount (ml)" value={waterAmount} onChangeText={setWaterAmount} keyboardType="numeric" placeholder="250" />
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Button label="Cancel" onPress={() => setShowWaterModal(false)} variant="secondary" style={{ flex: 1 }} />
              <Button label="Save" onPress={() => {
                addMetric({ id: generateId('m'), type: 'hydration', value: parseFloat(waterAmount) || 0, unit: 'ml', recordedAt: Date.now(), source: 'manual' });
                setShowWaterModal(false);
              }} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function MacroRow({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(value / target, 1);
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text variant="caption">{label}</Text>
        <Text variant="caption">{Math.round(value)} / {target}g</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Wellness Section ─────────────────────────────────────────────────────────
function WellnessSection() {
  const addMoodLog = useHealthStore((s) => s.addMoodLog);
  const moodLogs = useHealthStore((s) => s.moodLogs);
  const getTodayMoodLog = useHealthStore((s) => s.getTodayMoodLog);
  const todayMood = getTodayMoodLog();

  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [notes, setNotes] = useState('');

  const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😄'];

  const saveWellness = () => {
    addMoodLog({
      id: generateId('mood'),
      mood,
      energy,
      stress,
      notes: notes.trim() || undefined,
      loggedAt: Date.now(),
    });
    setNotes('');
  };

  return (
    <ScrollView contentContainerStyle={styles.sectionContent}>
      {todayMood ? (
        <Card style={{ marginBottom: Spacing.md }}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.xs }}>TODAY'S CHECK-IN</Text>
          <Text style={{ fontSize: 36 }}>{MOOD_EMOJIS[todayMood.mood - 1]}</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm }}>
            <View>
              <Text variant="caption" color="secondary">Energy</Text>
              <Text variant="bodyMedium">{todayMood.energy}/10</Text>
            </View>
            <View>
              <Text variant="caption" color="secondary">Stress</Text>
              <Text variant="bodyMedium">{todayMood.stress}/10</Text>
            </View>
          </View>
        </Card>
      ) : (
        <Card style={styles.metricCard}>
          <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Daily Check-In</Text>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>MOOD</Text>
          <View style={styles.moodRow}>
            {([1, 2, 3, 4, 5] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.moodButton, mood === m && styles.moodButtonActive]}
                onPress={() => setMood(m)}
              >
                <Text style={{ fontSize: 28 }}>{MOOD_EMOJIS[m - 1]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <SliderRow label="Energy" value={energy} onChange={setEnergy} color={Colors.accent.success} />
          <SliderRow label="Stress" value={stress} onChange={setStress} color={Colors.accent.secondary} />

          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="How are you feeling?"
            multiline
            numberOfLines={2}
            containerStyle={{ marginTop: Spacing.sm }}
          />
          <Button label="Save Check-In" onPress={saveWellness} fullWidth />
        </Card>
      )}

      {moodLogs.slice(0, 7).map((log) => (
        <Card key={log.id} style={styles.metricCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 24 }}>{MOOD_EMOJIS[log.mood - 1]}</Text>
            <Text variant="caption">{format(new Date(log.loggedAt), 'MMM d')}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs }}>
            <Text variant="caption">Energy: {log.energy}/10</Text>
            <Text variant="caption">Stress: {log.stress}/10</Text>
          </View>
        </Card>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function SliderRow({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text variant="label" color="secondary">{label.toUpperCase()}</Text>
        <Text variant="mono" style={{ color }}>{value}/10</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.sliderDot, v <= value && { backgroundColor: color }]}
            onPress={() => onChange(v)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Reusable: Log Metric Modal ────────────────────────────────────────────────
function LogMetricModal({
  visible, title, metricType, unit, placeholder, onClose, onSave,
}: {
  visible: boolean;
  title?: string;
  metricType: HealthMetricType;
  unit: string;
  placeholder: string;
  onClose: () => void;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>{title ?? `Log ${metricType}`}</Text>
          <Input
            label={`Value (${unit})`}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder={placeholder}
          />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Button label="Cancel" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
            <Button label="Save" onPress={() => { if (value) onSave(parseFloat(value)); }} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Measurements Modal ────────────────────────────────────────────────────────
function MeasurementsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const addMetric = useHealthStore((s) => s.addMetric);
  const measurements: { type: HealthMetricType; label: string }[] = [
    { type: 'neck', label: 'Neck (cm)' },
    { type: 'chest', label: 'Chest (cm)' },
    { type: 'waist', label: 'Waist (cm)' },
    { type: 'hips', label: 'Hips (cm)' },
    { type: 'biceps', label: 'Biceps (cm)' },
    { type: 'thighs', label: 'Thighs (cm)' },
    { type: 'calves', label: 'Calves (cm)' },
  ];
  const [values, setValues] = useState<Record<string, string>>({});

  const save = () => {
    Object.entries(values).forEach(([type, val]) => {
      if (val && parseFloat(val) > 0) {
        addMetric({ id: generateId('m'), type: type as HealthMetricType, value: parseFloat(val), unit: 'cm', recordedAt: Date.now(), source: 'manual' });
      }
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Log Measurements</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {measurements.map((m) => (
              <Input
                key={m.type}
                label={m.label}
                value={values[m.type] ?? ''}
                onChangeText={(v) => setValues((prev) => ({ ...prev, [m.type]: v }))}
                keyboardType="decimal-pad"
                placeholder="–"
              />
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
            <Button label="Cancel" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
            <Button label="Save" onPress={save} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  sectionScroll: { maxHeight: 48, flexGrow: 0, marginBottom: Spacing.xs },
  sectionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  sectionChipActive: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
  sectionContent: { padding: Spacing.md },
  metricCard: { marginBottom: Spacing.md },
  metricHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  progressBar: { height: 6, backgroundColor: Colors.background.elevated, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: Colors.background.elevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle, alignSelf: 'center', marginBottom: Spacing.lg },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { backgroundColor: Colors.background.card, borderRadius: Radius.sm, padding: Spacing.sm, fontFamily: FontFamily.mono, fontSize: 28, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.subtle, width: 64, textAlign: 'center' },
  quickWater: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  moodRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  moodButton: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  moodButtonActive: { backgroundColor: `${Colors.accent.primary}20`, borderColor: Colors.accent.primary },
  sliderDot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.background.elevated },
  infoOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: Spacing.xl },
  infoBox: { backgroundColor: Colors.background.elevated, borderRadius: Radius.md, padding: Spacing.xl, alignItems: 'center', maxWidth: 320 },
});
