import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontFamily } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { UserProfile } from '../../src/types';
import { generateId, calculateTDEE } from '../../src/lib/utils';

const { width: SCREEN_W } = Dimensions.get('window');
const TOTAL_STEPS = 4;

const ACTIVITY_OPTIONS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
  { id: 'light', label: 'Light', desc: '1–3 workouts/week' },
  { id: 'moderate', label: 'Moderate', desc: '3–5 workouts/week' },
  { id: 'active', label: 'Active', desc: '6–7 workouts/week' },
  { id: 'very_active', label: 'Very Active', desc: 'Twice daily, physical job' },
];

const GOAL_OPTIONS = [
  { id: 'build_muscle', label: 'Build Muscle', icon: 'arm-flex' },
  { id: 'lose_fat', label: 'Lose Fat', icon: 'fire' },
  { id: 'get_stronger', label: 'Get Stronger', icon: 'weight-lifter' },
  { id: 'improve_fitness', label: 'Improve Fitness', icon: 'run-fast' },
  { id: 'better_health', label: 'Better Health', icon: 'heart-pulse' },
  { id: 'build_habits', label: 'Build Habits', icon: 'calendar-check' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);
  const setUser = useSettingsStore((s) => s.setUser);
  const setNutritionTargets = useSettingsStore((s) => s.setNutritionTargets);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>('moderate');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const goTo = (s: number) => {
    setStep(s);
    scrollRef.current?.scrollTo({ x: s * SCREEN_W, animated: true });
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const finish = () => {
    const profile: UserProfile = {
      id: generateId('user'),
      name: name.trim() || 'Athlete',
      age: parseInt(age) || 25,
      sex,
      heightCm: parseFloat(heightCm) || 175,
      weightKg: parseFloat(weightKg) || 75,
      activityLevel,
      goals: selectedGoals,
      createdAt: Date.now(),
    };
    setUser(profile);
    const tdee = calculateTDEE(profile);
    setNutritionTargets({
      calorieTarget: tdee,
      proteinG: Math.round(profile.weightKg * 2.2),
      carbsG: Math.round((tdee * 0.4) / 4),
      fatG: Math.round((tdee * 0.3) / 9),
      waterMl: 2500,
    });
    setHasOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* Step 0: Welcome */}
          <View style={styles.page}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>⚡</Text>
              <Text variant="hero" style={{ textAlign: 'center' }}>FORGE</Text>
              <Text variant="body" color="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
                Build the version that wins.
              </Text>
            </View>
            <Text variant="body" color="secondary" style={styles.welcomeText}>
              Your personal health, fitness, and productivity command centre. Everything tracked, nothing wasted.
            </Text>
            <Button label="Get Started" onPress={() => goTo(1)} size="lg" fullWidth />
          </View>

          {/* Step 1: Profile setup */}
          <View style={styles.page}>
            <Text variant="display" style={styles.stepTitle}>Tell us about you</Text>
            <Text variant="body" color="secondary" style={styles.stepDesc}>
              Used to personalise your targets and calculations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Input
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                leftIcon="account"
              />

              <Input
                label="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="25"
                leftIcon="cake"
              />

              <Text variant="label" style={styles.fieldLabel}>Sex</Text>
              <View style={styles.row}>
                {(['male', 'female', 'other'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, sex === s && styles.chipActive]}
                    onPress={() => setSex(s)}
                  >
                    <Text style={{ color: sex === s ? Colors.background.primary : Colors.text.primary, fontFamily: FontFamily.bodyMedium, fontSize: 13 }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Height (cm)"
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                placeholder="175"
                leftIcon="human-male-height"
              />

              <Input
                label="Weight (kg)"
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder="75"
                leftIcon="scale"
              />

              <Text variant="label" style={styles.fieldLabel}>Activity Level</Text>
              {ACTIVITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionRow, activityLevel === opt.id && styles.optionRowActive]}
                  onPress={() => setActivityLevel(opt.id as UserProfile['activityLevel'])}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{opt.label}</Text>
                    <Text variant="caption">{opt.desc}</Text>
                  </View>
                  {activityLevel === opt.id && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={Colors.accent.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <View style={{ height: 32 }} />
            </ScrollView>

            <Button label="Continue" onPress={() => goTo(2)} size="lg" fullWidth />
          </View>

          {/* Step 2: Goals */}
          <View style={styles.page}>
            <Text variant="display" style={styles.stepTitle}>What's your focus?</Text>
            <Text variant="body" color="secondary" style={styles.stepDesc}>
              Select everything that applies.
            </Text>

            <View style={styles.goalsGrid}>
              {GOAL_OPTIONS.map((g) => {
                const selected = selectedGoals.includes(g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.goalCard, selected && styles.goalCardActive]}
                    onPress={() => toggleGoal(g.id)}
                  >
                    <MaterialCommunityIcons
                      name={g.icon as any}
                      size={28}
                      color={selected ? Colors.background.primary : Colors.accent.primary}
                    />
                    <Text
                      variant="bodyMedium"
                      style={{ color: selected ? Colors.background.primary : Colors.text.primary, marginTop: 8, textAlign: 'center', fontSize: 13 }}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button label="Continue" onPress={() => goTo(3)} size="lg" fullWidth style={{ marginTop: Spacing.lg }} />
          </View>

          {/* Step 3: Health & note */}
          <View style={styles.page}>
            <View style={styles.healthNote}>
              <MaterialCommunityIcons name="information-outline" size={32} color={Colors.accent.primary} />
              <Text variant="subtitle" style={{ marginTop: Spacing.md, textAlign: 'center' }}>
                Health Data
              </Text>
              <Text variant="body" color="secondary" style={{ textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
                FORGE uses manual entry for all health metrics. You can log weight, heart rate, steps, sleep, and more from the Health tab at any time.
              </Text>
              <View style={styles.noteBox}>
                <MaterialCommunityIcons name="sync" size={18} color={Colors.accent.warning} style={{ marginBottom: 6 }} />
                <Text variant="caption" color="secondary" style={{ textAlign: 'center', lineHeight: 18 }}>
                  Health Connect sync (automatic data from Samsung Health and other apps) can be added in a future update. For now, all metrics are entered manually with no friction.
                </Text>
              </View>
            </View>

            <Button label="Let's Go" onPress={finish} size="lg" fullWidth style={{ marginTop: Spacing.xl }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: Spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border.subtle },
  dotActive: { width: 20, backgroundColor: Colors.accent.primary },
  page: { width: SCREEN_W, padding: Spacing.lg, flex: 1, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontSize: 48, marginBottom: Spacing.md },
  welcomeText: { textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
  stepTitle: { marginBottom: Spacing.xs },
  stepDesc: { marginBottom: Spacing.lg },
  fieldLabel: { marginBottom: Spacing.xs, marginTop: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.elevated,
    marginBottom: Spacing.xs,
  },
  optionRowActive: { borderColor: Colors.accent.primary, backgroundColor: `${Colors.accent.primary}15` },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  goalCard: {
    width: (SCREEN_W - Spacing.lg * 2 - Spacing.sm * 2) / 3,
    aspectRatio: 1,
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  goalCardActive: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
  healthNote: {
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  noteBox: {
    marginTop: Spacing.md,
    backgroundColor: `${Colors.accent.warning}15`,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.accent.warning}30`,
    alignItems: 'center',
  },
});
