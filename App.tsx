import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import MarketScreen from './screens/MarketScreen';
import NewsScreen from './screens/NewsScreen';
import WatchlistScreen from './screens/WatchlistScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Market') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            else if (route.name === 'News') iconName = focused ? 'newspaper' : 'newspaper-outline';
            else if (route.name === 'Watchlist') iconName = focused ? 'star' : 'star-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#00d4aa',
          tabBarInactiveTintColor: '#555',
          tabBarStyle: { backgroundColor: '#0d1117', borderTopColor: '#1e2433' },
          headerStyle: { backgroundColor: '#0d1117' },
          headerTintColor: '#fff',
        })}
      >
        <Tab.Screen name="Market" component={MarketScreen} options={{ title: '시장 현황' }} />
        <Tab.Screen name="News" component={NewsScreen} options={{ title: '뉴스' }} />
        <Tab.Screen name="Watchlist" component={WatchlistScreen} options={{ title: '관심 종목' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
