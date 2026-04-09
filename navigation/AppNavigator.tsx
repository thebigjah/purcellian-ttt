import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import GameScreen from '../screens/GameScreen';
import MainMenuScreen from '../screens/MainMenuScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  MainMenu: undefined;
  Game: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainMenu"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0c0a08' },
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        <Stack.Screen name="MainMenu" component={MainMenuScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
