import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';

type TabIconProps = {
  name: string;
  focused: boolean;
  color: string;
};

function TabIcon({ name, focused, color }: TabIconProps) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <MaterialCommunityIcons name={name as any} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: Colors.accent.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="view-dashboard" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="train/index"
        options={{
          title: 'Train',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="dumbbell" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="health/index"
        options={{
          title: 'Health',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="heart-pulse" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits/index"
        options={{
          title: 'Habits',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="check-circle-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="flag-outline" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    elevation: 0,
  },
  tabLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
  },
  iconContainer: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconContainerActive: {
    backgroundColor: `${Colors.accent.primary}18`,
  },
});
