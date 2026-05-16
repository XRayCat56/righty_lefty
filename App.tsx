import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { InstructionsScreen } from './src/screens/InstructionsScreen';
import { GameplayScreen } from './src/screens/GameplayScreen';
import { StartScreen } from './src/screens/StartScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#f8fafc',
            headerTitleStyle: { fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: '#0f172a' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Start" component={StartScreen} />
          <Stack.Screen name="Gameplay" component={GameplayScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Stats" component={StatsScreen} />
          <Stack.Screen name="Instructions" component={InstructionsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
