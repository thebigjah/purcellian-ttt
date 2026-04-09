import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { SettingsProvider } from './utils/SettingsContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <AppNavigator />
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
