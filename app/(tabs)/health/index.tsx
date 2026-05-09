import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '../../../src/constants/theme';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useHealthStore } from '../../../src/stores/healthStore';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { HealthMetricType, SleepLog } from '../../../src/types';
import { generateId, formatDurationMinutes, calculateBMI } from '../../../src/lib/utils';

const RED = Colors.accent.secondary;

type HealthSection = 'body' | 'cardio' | 'sleep' | 'nutrition' | 'wellness';
type TimeRange = 7 | 30 | 90;

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
      <View style={styles.header}><Text variant="title">Health</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.md }}>
        {sections.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.sectionChip, section === s.id && styles.sectionChipActive]} onPress={() => setSection(s.id)}>
            <MaterialCommunityIcons name={s.icon as any} size={14} color={section === s.id ? Colors.background.primary : Colors.text.secondary} />
            <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 13, marginLeft: 4, color: section === s.id ? Colors.background.primary : Colors.text.secondary }}>{s.label}</Text>
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

function SparklineChart({ data, color = RED, height = 100 }: { data: { x: number; y: number }[]; color?: string; height?: number }) {
  const { width: screenWidth } = useWindowDimensions();
  const chartW = screenWidth - 64;
  if (data.length < 2) return <View style={{ height, alignItems: 'center', justifyContent: 'center' }}><Text variant="caption" color="secondary">Not enough data</Text></View>;
  const pad = { top: 8, right: 12, bottom: 20, left: 44 };
  const w = chartW - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));
  const rangeY = maxY - minY || 1;
  const minX = data[0].x; const maxX = data[data.length - 1].x; const rangeX = maxX - minX || 1;
  const xPt = (x: number) => (((x - minX) / rangeX) * w) + pad.left;
  const yPt = (y: number) => pad.top + h - ((y - minY) / rangeY) * h;
  const points = data.map((d) => ({ x: xPt(d.x), y: yPt(d.y) }));
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]; const curr = points[i]; const cpX = (prev.x + curr.x) / 2;
    linePath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const fillPath = linePath + ` L ${points[points.length - 1].x} ${pad.top + h} L ${points[0].x} ${pad.top + h} Z`;
  return (
    <Svg width={chartW} height={height}>
      <Defs>
        <LinearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Line x1={pad.left} y1={pad.top + h} x2={pad.left + w} y2={pad.top + h} stroke={Colors.border.subtle} strokeWidth={1} />
      <Path d={fillPath} fill={`url(#grad-${color})`} />
      <Path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {[{ y: yPt(minY), label: minY.toFixed(minY < 10 ? 1 : 0) }, { y: yPt(maxY), label: maxY.toFixed(maxY < 10 ? 1 : 0) }].map((l, i) => (
        <SvgText key={i} x={pad.left - 4} y={l.y + 4} textAnchor="end" fontSize={9} fill={Colors.text.disabled}>{l.label}</SvgText>
      ))}
      {[{ x: xPt(minX), label: format(new Date(minX), 'M/d') }, { x: xPt(maxX), label: format(new Date(maxX), 'M/d') }].map((l, i) => (
        <SvgText key={i} x={l.x} y={height - 2} textAnchor="middle" fontSize={9} fill={Colors.text.disabled}>{l.label}</SvgText>
      ))}
    </Svg>
  );
}

function TimeRangeToggle({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  return (
    <View style={styles.timeToggle}>
      {([7, 30, 90] as TimeRange[]).map((v) => (
        <TouchableOpacity key={v} style={[styles.timeToggleBtn, value === v && { backgroundColor: RED }]} onPress={() => onChange(v)}>
          <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 11, color: value === v ? '#fff' : Colors.text.secondary }}>{v}d</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MetricGraphCard({ title, metricType, unit, onAdd, formatVal }: { title: string; metricType: HealthMetricType; unit: string; onAdd: () => void; formatVal?: (v: number) => string }) {
  const [range, setRange] = useState<TimeRange>(30);
  const latest = useHealthStore((s) => s.getLatestMetric)(metricType);
  const history = useHealthStore((s) => s.getMetricHistory)(metricType, range);
  const chartData = useMemo(() => history.slice().sort((a, b) => a.recordedAt - b.recordedAt).map((m) => ({ x: m.recordedAt, y: m.value })), [history]);
  const displayVal = latest ? (formatVal ? formatVal(latest.value) : latest.value.toFixed(1)) : '--';
  return (
    <Card style={styles.graphCard}>
      <View style={styles.graphCardHeader}>
        <View style={{ flex: 1 }}>
          <Text variant="label" color="secondary">{title.toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <Text style={{ fontFamily: FontFamily.display, fontSize: 32, color: Colors.text.primary }}>{displayVal}</Text>
            <Text variant="caption" color="secondary">{unit}</Text>
          </View>
          {latest && <Text variant="caption" color="secondary">{format(new Date(latest.recordedAt), 'MMM d, yyyy')}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end', gap: Spacing.sm }}>
          <TouchableOpacity style={styles.addCircleBtn} onPress={onAdd}><MaterialCommunityIcons name="plus" size={18} color={RED} /></TouchableOpacity>
          <TimeRangeToggle value={range} onChange={setRange} />
        </View>
      </View>
      {chartData.length >= 2 ? (
        <View style={{ marginTop: Spacing.sm }}><SparklineChart data={chartData} color={RED} height={100} /></View>
      ) : (
        <View style={{ marginTop: Spacing.sm, alignItems: 'center', paddingVertical: Spacing.md }}><Text variant="caption" color="secondary">Log at least 2 entries to see the trend</Text></View>
      )}
    </Card>
  );
}

function BodySection() {
  const addMetric = useHealthStore((s) => s.addMetric);
  const getLatestMetric = useHealthStore((s) => s.getLatestMetric);
  const user = useSettingsStore((s) => s.user);
  const unitSystem = useSettingsStore((s) => s.unitSystem);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showBodyFatModal, setShowBodyFatModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const latestWeight = getLatestMetric('weight');
  const bmi = latestWeight && user?.heightCm ? calculateBMI(latestWeight.value, user.heightCm) : null;
  const weightUnit = unitSystem === 'imperial' ? 'lbs' : 'kg';
  return (
    <ScrollView contentContainerStyle={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <MetricGraphCard title="Body Weight" metricType="weight" unit={weightUnit} onAdd={() => setShowWeightModal(true)} formatVal={(v) => v.toFixed(1)} />
      {bmi && <Card style={{ marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}><MaterialCommunityIcons name="scale" size={20} color={RED} /><View><Text variant="label" color="secondary">BMI</Text><Text variant="bodyMedium">{bmi}</Text></View></Card>}
      <MetricGraphCard title="Body Fat %" metricType="body_fat" unit="%" onAdd={() => setShowBodyFatModal(true)} formatVal={(v) => v.toFixed(1)} />
      <Card style={styles.simpleCard} onPress={() => setShowMeasurementsModal(true)}>
        <View style={styles.simpleCardRow}>
          <MaterialCommunityIcons name="tape-measure" size={20} color={RED} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}><Text variant="label" color="secondary">BODY MEASUREMENTS</Text><Text variant="caption" color="secondary">Waist, chest, arms, hips…</Text></View>
          <TouchableOpacity style={styles.addCircleBtn} onPress={() => setShowMeasurementsModal(true)}><MaterialCommunityIcons name="plus" size={18} color={RED} /></TouchableOpacity>
        </View>
      </Card>
      <LogMetricModal visible={showWeightModal} title="Log Weight" metricType="weight" unit={weightUnit} placeholder="75.0" onClose={() => setShowWeightModal(false)} onSave={(v) => { addMetric({ id: generateId('m'), type: 'weight', value: v, unit: weightUnit, recordedAt: Date.now(), source: 'manual' }); setShowWeightModal(false); }} />
      <LogMetricModal visible={showBodyFatModal} title="Log Body Fat %" metricType="body_fat" unit="%" placeholder="15.0" onClose={() => setShowBodyFatModal(false)} onSave={(v) => { addMetric({ id: generateId('m'), type: 'body_fat', value: v, unit: '%', recordedAt: Date.now(), source: 'manual' }); setShowBodyFatModal(false); }} />
      <MeasurementsModal visible={showMeasurementsModal} onClose={() => setShowMeasurementsModal(false)} />
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function CardioSection() {
  const addMetric = useHealthStore((s) => s.addMetric);
  const [showModal, setShowModal] = useState<HealthMetricType | null>(null);
  const metrics: { type: HealthMetricType; label: string; unit: string; placeholder: string }[] = [
    { type: 'steps', label: 'Steps', unit: 'steps', placeholder: '8000' },
    { type: 'heart_rate_resting', label: 'Resting Heart Rate', unit: 'bpm', placeholder: '60' },
    { type: 'calories_active', label: 'Active Calories', unit: 'kcal', placeholder: '400' },
    { type: 'distance', label: 'Distance', unit: 'km', placeholder: '5.0' },
    { type: 'spo2', label: 'Blood Oxygen (SpO2)', unit: '%', placeholder: '98' },
  ];
  return (
    <ScrollView contentContainerStyle={styles.sectionContent} showsVerticalScrollIndicator={false}>
      {metrics.map((m) => <MetricGraphCard key={m.type} title={m.label} metricType={m.type} unit={m.unit} onAdd={() => setShowModal(m.type)} formatVal={m.type === 'steps' ? (v) => Math.round(v).toLocaleString() : undefined} />)}
      {showModal && <LogMetricModal visible title={`Log ${metrics.find((m) => m.type === showModal)?.label}`} metricType={showModal} unit={metrics.find((m) => m.type === showModal)?.unit ?? ''} placeholder={metrics.find((m) => m.type === showModal)?.placeholder ?? ''} onClose={() => setShowModal(null)} onSave={(v) => { addMetric({ id: generateId('m'), type: showModal, value: v, unit: metrics.find((m) => m.type === showModal)?.unit ?? '', recordedAt: Date.now(), source: 'manual' }); setShowModal(null); }} />}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function SleepSection() {
  const addSleepLog = useHealthStore((s) => s.addSleepLog);
  const sleepLogs = useHealthStore((s) => s.sleepLogs);
  const [showModal, setShowModal] = useState(false);
  const [range, setRange] = useState<TimeRange>(30);
  const [bedHour, setBedHour] = useState('22'); const [bedMin, setBedMin] = useState('30');
  const [wakeHour, setWakeHour] = useState('6'); const [wakeMin, setWakeMin] = useState('30');
  const saveSleep = () => {
    const now = new Date();
    const bedtime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, parseInt(bedHour) || 0, parseInt(bedMin) || 0);
    const wakeTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(wakeHour) || 0, parseInt(wakeMin) || 0);
    const totalMinutes = Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000);
    if (totalMinutes <= 0) { Alert.alert('Invalid time', 'Wake time must be after bedtime.'); return; }
    addSleepLog({ id: generateId('sleep'), bedtime: bedtime.getTime(), wakeTime: wakeTime.getTime(), totalMinutes, source: 'manual', recordedAt: Date.now() });
    setShowModal(false);
  };
  const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
  const filtered = sleepLogs.filter((l) => l.wakeTime >= cutoff);
  const avgHours = filtered.length > 0 ? filtered.reduce((s, l) => s + l.totalMinutes, 0) / filtered.length / 60 : null;
  const chartData = useMemo(() => filtered.slice().sort((a, b) => a.wakeTime - b.wakeTime).map((l) => ({ x: l.wakeTime, y: l.totalMinutes / 60 })), [filtered]);
  const latestSleep = sleepLogs.length > 0 ? sleepLogs.reduce((a, b) => a.recordedAt > b.recordedAt ? a : b) : null;
  return (
    <ScrollView contentContainerStyle={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.graphCard}>
        <View style={styles.graphCardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="label" color="secondary">SLEEP DURATION</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              <Text style={{ fontFamily: FontFamily.display, fontSize: 32, color: Colors.text.primary }}>{latestSleep ? (latestSleep.totalMinutes / 60).toFixed(1) : '--'}</Text>
              <Text variant="caption" color="secondary">hrs</Text>
            </View>
            {latestSleep && <Text variant="caption" color="secondary">{format(new Date(latestSleep.wakeTime), 'MMM d')}</Text>}
            {avgHours != null && <Text variant="caption" color="secondary">Avg ({range}d): {avgHours.toFixed(1)} hrs</Text>}
          </View>
          <View style={{ alignItems: 'flex-end', gap: Spacing.sm }}>
            <TouchableOpacity style={styles.addCircleBtn} onPress={() => setShowModal(true)}><MaterialCommunityIcons name="plus" size={18} color={RED} /></TouchableOpacity>
            <TimeRangeToggle value={range} onChange={setRange} />
          </View>
        </View>
        {chartData.length >= 2 ? (
          <View style={{ marginTop: Spacing.sm }}><SparklineChart data={chartData} color={RED} height={100} /></View>
        ) : (
          <View style={{ marginTop: Spacing.md, alignItems: 'center', paddingBottom: Spacing.md }}>
            <TouchableOpacity style={[styles.addCircleBtn, { width: 'auto', paddingHorizontal: Spacing.md, borderRadius: Radius.pill }]} onPress={() => setShowModal(true)}>
              <MaterialCommunityIcons name="plus" size={16} color={RED} />
              <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 13, color: RED, marginLeft: 4 }}>Log Sleep</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
      {filtered.slice(0, 7).map((log) => (
        <Card key={log.id} style={{ marginBottom: Spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="bodyMedium">{format(new Date(log.wakeTime), 'EEE, MMM d')}</Text>
            <Text variant="mono" style={{ color: RED }}>{(log.totalMinutes / 60).toFixed(1)} hrs</Text>
          </View>
          <Text variant="caption" color="secondary">{format(new Date(log.bedtime), 'h:mm a')} → {format(new Date(log.wakeTime), 'h:mm a')}</Text>
        </Card>
      ))}
      {sleepLogs.length === 0 && <EmptyState icon="sleep" title="No sleep logs" description="Log your sleep to track trends." />}
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
  const [foodName, setFoodName] = useState(''); const [foodCals, setFoodCals] = useState('');
  const [foodProtein, setFoodProtein] = useState(''); const [foodCarbs, setFoodCarbs] = useState(''); const [foodFat, setFoodFat] = useState('');
  const [waterAmount, setWaterAmount] = useState('250');
  const waterLogs = getMetricHistory('hydration', 1);
  const totalWater = waterLogs.reduce((s, m) => s + m.value, 0);
  const saveFoodLog = () => {
    if (!foodName.trim() || !foodCals) return;
    addFoodLog({ id: generateId('food'), name: foodName.trim(), calories: parseFloat(foodCals) || 0, proteinG: parseFloat(foodProtein) || 0, carbsG: parseFloat(foodCarbs) || 0, fatG: parseFloat(foodFat) || 0, servingSize: 1, servingUnit: 'serving', loggedAt: Date.now(), mealType: 'snack' });
    setFoodName(''); setFoodCals(''); setFoodProtein(''); setFoodCarbs(''); setFoodFat('');
    setShowFoodModal(false);
  };
  return (
    <ScrollView contentContainerStyle={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.graphCard}>
        <Text variant="label" color="secondary">CALORIES TODAY</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
          <Text style={{ fontFamily: FontFamily.display, fontSize: 32, color: Colors.text.primary }}>{Math.round(totalCals)}</Text>
          <Text variant="caption" color="secondary">/ {targets.calorieTarget} kcal</Text>
        </View>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(totalCals / targets.calorieTarget, 1) * 100}%`, backgroundColor: RED }]} /></View>
      </Card>
      <Card style={styles.graphCard}>
        <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>MACROS</Text>
        <MacroRow label="Protein" value={totalProtein} target={targets.proteinG} color={RED} />
        <MacroRow label="Carbs" value={totalCarbs} target={targets.carbsG} color={Colors.accent.warning} />
        <MacroRow label="Fat" value={totalFat} target={targets.fatG} color="#9B59B6" />
      </Card>
      <Card style={styles.graphCard} onPress={() => setShowWaterModal(true)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text variant="label" color="secondary">WATER</Text>
          <TouchableOpacity style={styles.addCircleBtn} onPress={() => setShowWaterModal(true)}><MaterialCommunityIcons name="plus" size={18} color={RED} /></TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ fontFamily: FontFamily.display, fontSize: 32, color: Colors.text.primary }}>{Math.round(totalWater)}</Text>
          <Text variant="caption" color="secondary">/ {targets.waterMl} ml</Text>
        </View>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(totalWater / targets.waterMl, 1) * 100}%`, backgroundColor: '#3498DB' }]} /></View>
      </Card>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <Button label="Log Food" onPress={() => setShowFoodModal(true)} style={{ flex: 1 }} leftIcon={<MaterialCommunityIcons name="food" size={18} color={Colors.background.primary} />} />
        <Button label="Log Water" onPress={() => setShowWaterModal(true)} variant="secondary" style={{ flex: 1 }} leftIcon={<MaterialCommunityIcons name="water" size={18} color={Colors.text.primary} />} />
      </View>
      {todayFood.length > 0 && (
        <Card style={styles.graphCard}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>TODAY'S FOOD</Text>
          {todayFood.map((f) => <View key={f.id} style={styles.foodRow}><Text variant="bodyMedium" style={{ flex: 1 }}>{f.name}</Text><Text variant="mono">{Math.round(f.calories)} kcal</Text></View>)}
        </Card>
      )}
      <Modal visible={showFoodModal} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modalSheet}>
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
        </View></View>
      </Modal>
      <Modal visible={showWaterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Log Water</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
            {[150, 250, 330, 500].map((ml) => <TouchableOpacity key={ml} style={[styles.quickWater, waterAmount === ml.toString() && { backgroundColor: `${RED}20`, borderColor: RED }]} onPress={() => setWaterAmount(ml.toString())}><Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 13, color: waterAmount === ml.toString() ? RED : Colors.text.primary }}>{ml} ml</Text></TouchableOpacity>)}
          </View>
          <Input label="Amount (ml)" value={waterAmount} onChangeText={setWaterAmount} keyboardType="numeric" placeholder="250" />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Button label="Cancel" onPress={() => setShowWaterModal(false)} variant="secondary" style={{ flex: 1 }} />
            <Button label="Save" onPress={() => { addMetric({ id: generateId('m'), type: 'hydration', value: parseFloat(waterAmount) || 0, unit: 'ml', recordedAt: Date.now(), source: 'manual' }); setShowWaterModal(false); }} style={{ flex: 1 }} />
          </View>
        </View></View>
      </Modal>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function MacroRow({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text variant="caption">{label}</Text><Text variant="caption">{Math.round(value)} / {target}g</Text></View>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(value / target, 1) * 100}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

function WellnessSection() {
  const addMoodLog = useHealthStore((s) => s.addMoodLog);
  const moodLogs = useHealthStore((s) => s.moodLogs);
  const getTodayMoodLog = useHealthStore((s) => s.getTodayMoodLog);
  const todayMood = getTodayMoodLog();
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState(5); const [stress, setStress] = useState(5); const [notes, setNotes] = useState('');
  const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😄'];
  const saveWellness = () => { addMoodLog({ id: generateId('mood'), mood, energy, stress, notes: notes.trim() || undefined, loggedAt: Date.now() }); setNotes(''); };
  return (
    <ScrollView contentContainerStyle={styles.sectionContent} showsVerticalScrollIndicator={false}>
      {todayMood ? (
        <Card style={styles.graphCard}>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.xs }}>TODAY'S CHECK-IN</Text>
          <Text style={{ fontSize: 36 }}>{MOOD_EMOJIS[todayMood.mood - 1]}</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm }}>
            <View><Text variant="caption" color="secondary">Energy</Text><Text variant="bodyMedium">{todayMood.energy}/10</Text></View>
            <View><Text variant="caption" color="secondary">Stress</Text><Text variant="bodyMedium">{todayMood.stress}/10</Text></View>
          </View>
        </Card>
      ) : (
        <Card style={styles.graphCard}>
          <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Daily Check-In</Text>
          <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>MOOD</Text>
          <View style={styles.moodRow}>
            {([1, 2, 3, 4, 5] as const).map((m) => <TouchableOpacity key={m} style={[styles.moodButton, mood === m && styles.moodButtonActive]} onPress={() => setMood(m)}><Text style={{ fontSize: 28 }}>{MOOD_EMOJIS[m - 1]}</Text></TouchableOpacity>)}
          </View>
          <SliderRow label="Energy" value={energy} onChange={setEnergy} color={Colors.accent.success} />
          <SliderRow label="Stress" value={stress} onChange={setStress} color={RED} />
          <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="How are you feeling?" multiline numberOfLines={2} containerStyle={{ marginTop: Spacing.sm }} />
          <Button label="Save Check-In" onPress={saveWellness} fullWidth style={{ marginTop: Spacing.sm }} />
        </Card>
      )}
      {moodLogs.slice(0, 7).map((log) => (
        <Card key={log.id} style={{ marginBottom: Spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 24 }}>{MOOD_EMOJIS[log.mood - 1]}</Text><Text variant="caption">{format(new Date(log.loggedAt), 'MMM d')}</Text></View>
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs }}><Text variant="caption">Energy: {log.energy}/10</Text><Text variant="caption">Stress: {log.stress}/10</Text></View>
        </Card>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function SliderRow({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}><Text variant="label" color="secondary">{label.toUpperCase()}</Text><Text variant="mono" style={{ color }}>{value}/10</Text></View>
      <View style={{ flexDirection: 'row', gap: 4 }}>{Array.from({ length: 10 }, (_, i) => i + 1).map((v) => <TouchableOpacity key={v} style={[styles.sliderDot, v <= value && { backgroundColor: color }]} onPress={() => onChange(v)} />)}</View>
    </View>
  );
}

function LogMetricModal({ visible, title, metricType, unit, placeholder, onClose, onSave }: { visible: boolean; title?: string; metricType: HealthMetricType; unit: string; placeholder: string; onClose: () => void; onSave: (value: number) => void }) {
  const [value, setValue] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}><View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>{title ?? `Log ${metricType}`}</Text>
        <Input label={`Value (${unit})`} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={placeholder} />
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <Button label="Cancel" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
          <Button label="Save" onPress={() => { if (value) onSave(parseFloat(value)); }} style={{ flex: 1 }} />
        </View>
      </View></View>
    </Modal>
  );
}

function MeasurementsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const addMetric = useHealthStore((s) => s.addMetric);
  const measurements: { type: HealthMetricType; label: string }[] = [
    { type: 'neck', label: 'Neck (cm)' }, { type: 'chest', label: 'Chest (cm)' },
    { type: 'waist', label: 'Waist (cm)' }, { type: 'hips', label: 'Hips (cm)' },
    { type: 'biceps', label: 'Biceps (cm)' }, { type: 'thighs', label: 'Thighs (cm)' },
    { type: 'calves', label: 'Calves (cm)' },
  ];
  const [values, setValues] = useState<Record<string, string>>({});
  const save = () => {
    Object.entries(values).forEach(([type, val]) => { if (val && parseFloat(val) > 0) addMetric({ id: generateId('m'), type: type as HealthMetricType, value: parseFloat(val), unit: 'cm', recordedAt: Date.now(), source: 'manual' }); });
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}><View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Log Measurements</Text>
        <ScrollView style={{ maxHeight: 360 }}>
          {measurements.map((m) => <Input key={m.type} label={m.label} value={values[m.type] ?? ''} onChangeText={(v) => setValues((prev) => ({ ...prev, [m.type]: v }))} keyboardType="decimal-pad" placeholder="–" />)}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
          <Button label="Cancel" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
          <Button label="Save" onPress={save} style={{ flex: 1 }} />
        </View>
      </View></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  sectionScroll: { maxHeight: 48, flexGrow: 0, marginBottom: Spacing.xs },
  sectionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  sectionChipActive: { backgroundColor: RED, borderColor: RED },
  sectionContent: { padding: Spacing.md },
  graphCard: { marginBottom: Spacing.md, padding: Spacing.md },
  graphCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  timeToggle: { flexDirection: 'row', backgroundColor: Colors.background.card, borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border.subtle },
  timeToggleBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  addCircleBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${RED}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${RED}30` },
  simpleCard: { marginBottom: Spacing.md },
  simpleCardRow: { flexDirection: 'row', alignItems: 'center' },
  progressBar: { height: 6, backgroundColor: Colors.background.elevated, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  moodRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  moodButton: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  moodButtonActive: { backgroundColor: `${RED}20`, borderColor: RED },
  sliderDot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.background.elevated },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: Colors.background.elevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.subtle, alignSelf: 'center', marginBottom: Spacing.lg },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { backgroundColor: Colors.background.card, borderRadius: Radius.sm, padding: Spacing.sm, fontFamily: FontFamily.mono, fontSize: 28, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.subtle, width: 64, textAlign: 'center' },
  quickWater: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
});
