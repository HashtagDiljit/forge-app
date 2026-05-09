import { Redirect } from 'expo-router';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function Index() {
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);
  return <Redirect href={hasOnboarded ? '/(tabs)' : '/onboarding'} />;
}
