import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../types';

type StartScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Start'>;
};

export function StartScreen({ navigation }: StartScreenProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  const isLandscape = width > height;

  useEffect(() => {
    if (!isLandscape) {
      setSecondsRemaining(3);
      return;
    }

    setSecondsRemaining(3);
    const intervalId = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isLandscape]);

  useEffect(() => {
    if (isLandscape && secondsRemaining <= 0) {
      navigation.replace('Gameplay');
    }
  }, [isLandscape, navigation, secondsRemaining]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.title}>START</Text>
      {!isLandscape ? (
        <Text style={styles.body}>Turn your phone sideways to begin.</Text>
      ) : (
        <Text style={styles.body}>Starting in {secondsRemaining}...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  body: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
    textAlign: 'center',
  },
});
