export const HABIT_SUGGESTIONS = [
  // Health
  { name: 'Drink 8 glasses of water', icon: 'water', color: '#00D4FF', category: 'health', target: 8, targetUnit: 'glasses' },
  { name: 'Take vitamins', icon: 'pill', color: '#2ECC71', category: 'health', target: 1, targetUnit: 'dose' },
  { name: 'Sleep 8 hours', icon: 'sleep', color: '#7B68EE', category: 'health', target: 8, targetUnit: 'hours' },
  { name: 'Log meals', icon: 'food', color: '#F39C12', category: 'health' },
  // Fitness
  { name: 'Work out', icon: 'dumbbell', color: '#FF4757', category: 'fitness' },
  { name: 'Walk 10,000 steps', icon: 'walk', color: '#2ECC71', category: 'fitness', target: 10000, targetUnit: 'steps' },
  { name: 'Stretch for 10 minutes', icon: 'yoga', color: '#FF6B9D', category: 'fitness', target: 10, targetUnit: 'minutes' },
  { name: 'Run 5km', icon: 'run', color: '#F39C12', category: 'fitness' },
  // Mindfulness
  { name: 'Meditate', icon: 'meditation', color: '#9B59B6', category: 'mindfulness', target: 10, targetUnit: 'minutes' },
  { name: 'Journal', icon: 'notebook', color: '#E67E22', category: 'mindfulness' },
  { name: 'Gratitude practice', icon: 'heart', color: '#E74C3C', category: 'mindfulness' },
  { name: 'No screens before bed', icon: 'phone-off', color: '#7A7D85', category: 'mindfulness' },
  // Learning
  { name: 'Read for 30 minutes', icon: 'book-open', color: '#3498DB', category: 'learning', target: 30, targetUnit: 'minutes' },
  { name: 'Study / practice skill', icon: 'school', color: '#1ABC9C', category: 'learning' },
  { name: 'Listen to a podcast', icon: 'headphones', color: '#E91E63', category: 'learning' },
  // Productivity
  { name: 'Deep work session', icon: 'laptop', color: '#00D4FF', category: 'productivity', target: 90, targetUnit: 'minutes' },
  { name: 'Plan tomorrow', icon: 'calendar-check', color: '#F39C12', category: 'productivity' },
  { name: 'Inbox zero', icon: 'email', color: '#2ECC71', category: 'productivity' },
  { name: 'No social media', icon: 'cancel', color: '#FF4757', category: 'productivity' },
];

export const HABIT_ICONS = [
  'water', 'pill', 'sleep', 'food', 'dumbbell', 'walk', 'yoga', 'run',
  'meditation', 'notebook', 'heart', 'phone-off', 'book-open', 'school',
  'headphones', 'laptop', 'calendar-check', 'email', 'cancel', 'fire',
  'star', 'check-circle', 'clock', 'home', 'music', 'bicycle', 'swim',
];

export const HABIT_COLORS = [
  '#00D4FF', '#FF4757', '#2ECC71', '#F39C12', '#9B59B6',
  '#3498DB', '#E74C3C', '#1ABC9C', '#E67E22', '#FF6B9D',
  '#7B68EE', '#E91E63',
];
