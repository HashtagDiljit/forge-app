import React from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

function Card({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardUnit}>{unit}</Text>
    </View>
  );
}

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>FORGE</Text>
        <Text style={styles.date}>{TODAY}</Text>

        <View style={styles.grid}>
          <Card label="Steps" value="0" unit="today" />
          <Card label="Sleep" value="0h" unit="last night" />
          <Card label="Weight" value="0 kg" unit="last logged" />
          <Card label="Workout" value="None" unit="today" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080A0C',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00D4FF',
    letterSpacing: 4,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#111418',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2328',
  },
  cardLabel: {
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  cardUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
});
