import { UserProfile } from '../types';

// ─── 1RM Calculators ──────────────────────────────────────────────────────────
export const epley1RM = (weightKg: number, reps: number): number => {
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
};

export const calculateE1RM = epley1RM;

// ─── Plate Calculator ───────────────────────────────────────────────────────────────
const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25];

export const calculatePlates = (
  targetKg: number,
  barbellKg = 20
): { plates: number[]; remainder: number } => {
  let remaining = (targetKg - barbellKg) / 2;
  const plates: number[] = [];

  for (const plate of PLATE_SIZES) {
    while (remaining >= plate) {
      plates.push(plate);
      remaining = Math.round((remaining - plate) * 1000) / 1000;
    }
  }

  return { plates, remainder: remaining };
};

// ─── TDEE / Nutrition ───────────────────────────────────────────────────────────────
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const calculateBMR = (profile: UserProfile): number => {
  const { sex, weightKg, heightCm, age } = profile;
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
};

export const calculateTDEE = (profile: UserProfile): number => {
  const bmr = calculateBMR(profile);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
};

export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
};

export const calculateFFMI = (weightKg: number, heightCm: number, bodyFatPercent: number): number => {
  const heightM = heightCm / 100;
  const leanMass = weightKg * (1 - bodyFatPercent / 100);
  return Math.round((leanMass / (heightM * heightM) + 6.1 * (1.8 - heightM)) * 10) / 10;
};

// ─── Unit Converters ────────────────────────────────────────────────────────────────
export const kgToLbs = (kg: number): number => Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number): number => Math.round(lbs / 2.20462 * 10) / 10;
export const cmToFtIn = (cm: number): string => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};
export const ftInToCm = (feet: number, inches: number): number =>
  Math.round((feet * 30.48 + inches * 2.54) * 10) / 10;
export const mToKm = (m: number): number => Math.round(m / 100) / 10;
export const mToMiles = (m: number): number => Math.round(m / 1609.344 * 10) / 10;

// ─── Formatters ─────────────────────────────────────────────────────────────────────────
export const formatWeight = (kg: number, imperial: boolean): string =>
  imperial ? `${kgToLbs(kg)} lbs` : `${kg} kg`;

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const formatDurationMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const formatVolume = (kg: number, imperial: boolean): string => {
  if (imperial) {
    const lbs = Math.round(kgToLbs(kg));
    return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${lbs} lbs`;
  }
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`;
};

export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
};

// ─── ID Generator ───────────────────────────────────────────────────────────────────────────
export const generateId = (prefix = 'id'): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ─── Sleep Score ──────────────────────────────────────────────────────────────────────────
export const calculateSleepScore = (totalMinutes: number, efficiency?: number): number => {
  const durationScore = Math.min(totalMinutes / 480, 1) * 70;
  const efficiencyScore = (efficiency ?? 0.85) * 30;
  return Math.round(durationScore + efficiencyScore);
};

// ─── Streak Utils ─────────────────────────────────────────────────────────────────────────
export const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
