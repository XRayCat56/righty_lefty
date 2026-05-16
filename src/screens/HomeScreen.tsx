import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../types';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title}>Righty Lefty</Text>
      <Text style={styles.subtitle}>Choose an option</Text>

      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [styles.button, styles.buttonStart, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Start')}
        >
          <Text style={styles.buttonLabel}>Start</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.button, styles.buttonStats, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Stats')}
        >
          <Text style={styles.buttonLabel}>Stats</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.button, styles.buttonInstructions, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Instructions')}
        >
          <Text style={styles.buttonLabel}>Instructions</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  buttons: {
    marginTop: 48,
    gap: 16,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStart: {
    backgroundColor: '#22c55e',
  },
  buttonStats: {
    backgroundColor: '#3b82f6',
  },
  buttonInstructions: {
    backgroundColor: '#a855f7',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
