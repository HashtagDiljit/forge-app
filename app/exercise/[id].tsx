import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { EXERCISE_LIBRARY } from '../../src/constants/exercises';
import { useWorkoutStore } from '../../src/stores/workoutStore';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = EXERCISE_LIBRARY.find((e) => e.id === id);
  const prs = useWorkoutStore((s) => s.personalRecords);
  const pr = prs.find((p) => p.exerciseId === id);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text variant="body" style={{ padding: Spacing.lg }}>Exercise not found.</Text>
        <Button label="Back" onPress={() => router.back()} variant="ghost" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={Colors.text.primary}
          onPress={() => router.back()}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{exercise.name}</Text>
        <View style={styles.badges}>
          <Badge label={exercise.equipment} color={Colors.accent.primary} />
          <Badge label={exercise.movementPattern} color={Colors.text.secondary} />
        </View>

        <Card style={styles.section}>
          <Text variant="label" style={{ marginBottom: Spacing.sm }}>PRIMARY MUSCLES</Text>
          <View style={styles.chips}>
            {exercise.primaryMuscles.map((m) => (
              <Badge key={m} label={m} color={Colors.accent.secondary} />
            ))}
          </View>
          {exercise.secondaryMuscles.length > 0 && (
            <>
              <Text variant="label" style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>SECONDARY</Text>
              <View style={styles.chips}>
                {exercise.secondaryMuscles.map((m) => (
                  <Badge key={m} label={m} color={Colors.text.secondary} />
                ))}
              </View>
            </>
          )}
        </Card>

        {exercise.instructions && (
          <Card style={styles.section}>
            <Text variant="label" style={{ marginBottom: Spacing.sm }}>HOW TO PERFORM</Text>
            <Text variant="body" style={{ lineHeight: 22 }}>{exercise.instructions}</Text>
          </Card>
        )}

        {pr && (
          <Card style={styles.section} accent={Colors.accent.secondary}>
            <Text variant="label" style={{ marginBottom: Spacing.xs }}>PERSONAL RECORD</Text>
            <Text variant="display">{pr.e1rm.toFixed(1)} kg</Text>
            <Text variant="caption">e1RM · {pr.weightKg}kg × {pr.reps} reps</Text>
          </Card>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  header: { padding: Spacing.md, flexDirection: 'row' },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  badges: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
});
