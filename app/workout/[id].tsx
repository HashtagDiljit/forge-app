import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { useWorkoutStore } from '../../src/stores/workoutStore';

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkoutStore((s) => s.recentWorkouts.find((w) => w.id === id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text variant="subtitle" style={{ flex: 1 }}>{workout?.name ?? 'Workout'}</Text>
      </View>

      {!workout ? (
        <View style={styles.center}>
          <Text variant="body" color="secondary">Workout not found.</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text variant="label" color="secondary">EXERCISES</Text>
          {workout.exercises.map((ex) => (
            <View key={ex.id} style={styles.row}>
              <Text variant="bodyMedium">{ex.exercise?.name ?? ex.exerciseId}</Text>
              <Text variant="caption" color="secondary">{ex.sets.length} sets</Text>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
});
