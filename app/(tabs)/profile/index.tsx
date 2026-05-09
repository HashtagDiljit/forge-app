import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '../../../src/constants/theme';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useHealthStore } from '../../../src/stores/healthStore';
import { useWorkoutStore } from '../../../src/stores/workoutStore';

export default function ProfileTab() {
  const [editingBio, setEditingBio] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text variant="title" style={styles.pageTitle}>Profile</Text>

        <AvatarSection onEditPress={() => setEditingBio(true)} />

        {editingBio ? (
          <BioEditForm onDone={() => setEditingBio(false)} />
        ) : (
          <BioDisplayCard onEdit={() => setEditingBio(true)} />
        )}

        <SettingsSection />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AvatarSection({ onEditPress }: { onEditPress: () => void }) {
  const user = useSettingsStore((s) => s.user);
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <View style={styles.avatarSection}>
      <View style={styles.avatarWrap}>
        {user?.photoUri ? (
          <Image source={{ uri: user.photoUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.avatarEditBtn} onPress={onEditPress}>
          <MaterialCommunityIcons name="pencil" size={14} color={Colors.background.primary} />
        </TouchableOpacity>
      </View>
      <Text variant="title" style={{ marginTop: Spacing.sm }}>
        {user?.name || 'Set your name'}
      </Text>
      {user?.bio ? (
        <Text variant="caption" color="secondary" style={{ marginTop: 4, textAlign: 'center', maxWidth: 260 }}>
          {user.bio}
        </Text>
      ) : null}
    </View>
  );
}

function BioEditForm({ onDone }: { onDone: () => void }) {
  const user = useSettingsStore((s) => s.user);
  const updateUser = useSettingsStore((s) => s.updateUser);
  const unitSystem = useSettingsStore((s) => s.unitSystem);

  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user?.weightKg ? String(user.weightKg) : '');
  const [bio, setBio] = useState(user?.bio ?? '');

  const heightLabel = unitSystem === 'imperial' ? 'Height (in)' : 'Height (cm)';
  const weightLabel = unitSystem === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)';

  const save = () => {
    updateUser({
      name: name.trim() || 'Unknown',
      age: parseInt(age) || 0,
      heightCm: parseFloat(heightCm) || 0,
      weightKg: parseFloat(weightKg) || 0,
      bio: bio.trim(),
    });
    onDone();
  };

  return (
    <Card style={styles.sectionCard}>
      <Text variant="subtitle" style={{ marginBottom: Spacing.md }}>Edit Profile</Text>
      <Input label="Full Name" value={name} onChangeText={setName} placeholder="John Smith" />
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Input label="Age" value={age} onChangeText={setAge} keyboardType="numeric" placeholder="25" containerStyle={{ flex: 1 }} />
        <Input label={heightLabel} value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" placeholder="175" containerStyle={{ flex: 1 }} />
        <Input label={weightLabel} value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="75" containerStyle={{ flex: 1 }} />
      </View>
      <Input
        label="Bio (optional)"
        value={bio}
        onChangeText={setBio}
        placeholder="Tell us a bit about yourself..."
        multiline
        numberOfLines={3}
      />
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
        <Button label="Cancel" onPress={onDone} variant="secondary" style={{ flex: 1 }} />
        <Button label="Save" onPress={save} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

function BioDisplayCard({ onEdit }: { onEdit: () => void }) {
  const user = useSettingsStore((s) => s.user);
  const unitSystem = useSettingsStore((s) => s.unitSystem);

  if (!user) {
    return (
      <Card style={styles.sectionCard}>
        <View style={styles.emptyBioRow}>
          <MaterialCommunityIcons name="account-edit-outline" size={20} color={Colors.text.secondary} />
          <Text variant="caption" color="secondary" style={{ flex: 1, marginLeft: Spacing.sm }}>
            Tap to set up your profile
          </Text>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.accent.primary }}>Edit</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  const stats = [
    user.age ? { label: 'Age', value: `${user.age} yrs` } : null,
    user.heightCm ? { label: 'Height', value: `${user.heightCm} ${unitSystem === 'imperial' ? 'in' : 'cm'}` } : null,
    user.weightKg ? { label: 'Weight', value: `${user.weightKg} ${unitSystem === 'imperial' ? 'lbs' : 'kg'}` } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Card style={styles.sectionCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
        <Text variant="label" color="secondary">ABOUT ME</Text>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.text.secondary} />
          <Text variant="caption" style={{ marginLeft: 3 }}>Edit</Text>
        </TouchableOpacity>
      </View>

      {stats.length > 0 && (
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text variant="caption" color="secondary">{s.label}</Text>
              <Text variant="bodyMedium">{s.value}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function SettingsSection() {
  const {
    theme, setTheme,
    unitSystem, setUnitSystem,
    notificationsEnabled, setNotificationsEnabled,
    habitRemindersEnabled, setHabitRemindersEnabled,
    workoutRemindersEnabled, setWorkoutRemindersEnabled,
    waterRemindersEnabled, setWaterRemindersEnabled,
    nutritionTargets, setNutritionTargets,
    clearAll,
  } = useSettingsStore();

  const [showNutritionEdit, setShowNutritionEdit] = useState(false);
  const [calTarget, setCalTarget] = useState(String(nutritionTargets.calorieTarget));
  const [waterTarget, setWaterTarget] = useState(String(nutritionTargets.waterMl));
  const [proteinTarget, setProteinTarget] = useState(String(nutritionTargets.proteinG));

  const saveNutrition = () => {
    setNutritionTargets({
      calorieTarget: parseInt(calTarget) || nutritionTargets.calorieTarget,
      waterMl: parseInt(waterTarget) || nutritionTargets.waterMl,
      proteinG: parseInt(proteinTarget) || nutritionTargets.proteinG,
    });
    setShowNutritionEdit(false);
  };

  return (
    <>
      <Text variant="label" color="secondary" style={styles.groupLabel}>APPEARANCE</Text>
      <Card style={styles.sectionCard}>
        <SettingRow
          icon="theme-light-dark"
          label="Dark Mode"
          description={theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
        >
          <Switch
            value={theme === 'dark'}
            onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
            trackColor={{ true: Colors.accent.primary, false: Colors.background.elevated }}
            thumbColor={Colors.text.primary}
          />
        </SettingRow>

        <SettingDivider />

        <SettingRow icon="ruler" label="Units" description={unitSystem === 'metric' ? 'Metric (kg / cm)' : 'Imperial (lbs / ft)'}>
          <View style={styles.togglePill}>
            <TouchableOpacity
              style={[styles.toggleOption, unitSystem === 'metric' && styles.toggleOptionActive]}
              onPress={() => setUnitSystem('metric')}
            >
              <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: unitSystem === 'metric' ? Colors.background.primary : Colors.text.secondary }}>kg/cm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, unitSystem === 'imperial' && styles.toggleOptionActive]}
              onPress={() => setUnitSystem('imperial')}
            >
              <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 12, color: unitSystem === 'imperial' ? Colors.background.primary : Colors.text.secondary }}>lbs/ft</Text>
            </TouchableOpacity>
          </View>
        </SettingRow>
      </Card>

      <Text variant="label" color="secondary" style={styles.groupLabel}>NOTIFICATIONS</Text>
      <Card style={styles.sectionCard}>
        <SettingRow icon="bell-outline" label="All Notifications" description="Master toggle for all alerts">
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ true: Colors.accent.primary, false: Colors.background.elevated }}
            thumbColor={Colors.text.primary}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow icon="check-circle-outline" label="Habit Reminders" description="Daily habit check-in alerts">
          <Switch
            value={habitRemindersEnabled && notificationsEnabled}
            onValueChange={setHabitRemindersEnabled}
            disabled={!notificationsEnabled}
            trackColor={{ true: Colors.accent.primary, false: Colors.background.elevated }}
            thumbColor={Colors.text.primary}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow icon="dumbbell" label="Workout Reminders" description="Session schedule alerts">
          <Switch
            value={workoutRemindersEnabled && notificationsEnabled}
            onValueChange={setWorkoutRemindersEnabled}
            disabled={!notificationsEnabled}
            trackColor={{ true: Colors.accent.primary, false: Colors.background.elevated }}
            thumbColor={Colors.text.primary}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow icon="water-outline" label="Water Reminders" description="Hydration nudges throughout the day">
          <Switch
            value={waterRemindersEnabled && notificationsEnabled}
            onValueChange={setWaterRemindersEnabled}
            disabled={!notificationsEnabled}
            trackColor={{ true: Colors.accent.primary, false: Colors.background.elevated }}
            thumbColor={Colors.text.primary}
          />
        </SettingRow>
      </Card>

      <Text variant="label" color="secondary" style={styles.groupLabel}>GOALS & TARGETS</Text>
      <Card style={styles.sectionCard}>
        {showNutritionEdit ? (
          <View>
            <Input label="Daily Calories (kcal)" value={calTarget} onChangeText={setCalTarget} keyboardType="numeric" placeholder="2200" />
            <Input label="Water (ml)" value={waterTarget} onChangeText={setWaterTarget} keyboardType="numeric" placeholder="2500" />
            <Input label="Protein (g)" value={proteinTarget} onChangeText={setProteinTarget} keyboardType="numeric" placeholder="160" />
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
              <Button label="Cancel" onPress={() => setShowNutritionEdit(false)} variant="secondary" style={{ flex: 1 }} />
              <Button label="Save" onPress={saveNutrition} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowNutritionEdit(true)}>
            <SettingRow icon="target" label="Nutrition Targets" description={`${nutritionTargets.calorieTarget} kcal · ${nutritionTargets.waterMl} ml water · ${nutritionTargets.proteinG}g protein`}>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.text.secondary} />
            </SettingRow>
          </TouchableOpacity>
        )}
      </Card>

      <Text variant="label" color="secondary" style={styles.groupLabel}>ABOUT</Text>
      <Card style={styles.sectionCard}>
        <SettingRow icon="information-outline" label="FORGE" description="Version 1.0.0 · Built with Expo">
          <View />
        </SettingRow>
        <SettingDivider />
        <SettingRow icon="shield-lock-outline" label="Privacy" description="Your data stays on your device">
          <View />
        </SettingRow>
      </Card>

      <Text variant="label" color="secondary" style={styles.groupLabel}>DATA</Text>
      <Card style={styles.sectionCard}>
        <TouchableOpacity
          onPress={() => Alert.alert(
            'Clear All Data',
            'This will permanently delete all your workouts, health metrics, habits, and goals. This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear Everything',
                style: 'destructive',
                onPress: () => {
                  clearAll();
                  useHealthStore.getState().clearAll();
                  useWorkoutStore.setState({ recentWorkouts: [], templates: [], personalRecords: [], lastSetsByExercise: {}, activeWorkout: null });
                },
              },
            ]
          )}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.accent.secondary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ color: Colors.accent.secondary }}>Clear All Data</Text>
              <Text variant="caption" color="secondary">Permanently delete all app data</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    </>
  );
}

function SettingRow({ icon, label, description, children }: {
  icon: string; label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <MaterialCommunityIcons name={icon as any} size={20} color={Colors.text.secondary} style={{ marginRight: Spacing.sm }} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium">{label}</Text>
        {description && <Text variant="caption" color="secondary">{description}</Text>}
      </View>
      {children}
    </View>
  );
}

function SettingDivider() {
  return <View style={{ height: 1, backgroundColor: Colors.border.subtle, marginVertical: 2, marginLeft: 36 }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { padding: Spacing.md },
  pageTitle: { marginBottom: Spacing.md },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.lg },
  avatarWrap: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.accent.primary,
  },
  avatarInitials: { fontFamily: FontFamily.display, fontSize: 28, color: Colors.accent.primary },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  sectionCard: { marginBottom: Spacing.sm },
  emptyBioRow: { flexDirection: 'row', alignItems: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  statsRow: { flexDirection: 'row', gap: Spacing.lg },
  statItem: {},
  groupLabel: { marginBottom: 6, marginTop: Spacing.md, marginLeft: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  toggleOption: { paddingHorizontal: 10, paddingVertical: 5 },
  toggleOptionActive: { backgroundColor: Colors.accent.primary },
});
