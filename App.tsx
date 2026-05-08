import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import MarketScreen from './screens/MarketScreen';
import NewsScreen from './screens/NewsScreen';
import WatchlistScreen from './screens/WatchlistScreen';
import StockDetailScreen from './screens/StockDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function WatchlistStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B0E17' },
        headerTintColor: '#fff',
        headerBackTitle: '',
        contentStyle: { backgroundColor: '#0B0E17' },
      }}
    >
      <Stack.Screen name="WatchlistHome" component={WatchlistScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StockDetail" component={StockDetailScreen} />
    </Stack.Navigator>
  );
}

function MarketStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B0E17' },
        headerTintColor: '#fff',
        headerBackTitle: '',
        contentStyle: { backgroundColor: '#0B0E17' },
      }}
    >
      <Stack.Screen name="MarketHome" component={MarketScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StockDetail" component={StockDetailScreen} />
    </Stack.Navigator>
  );
}

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
          tabBarActiveTintColor: '#00C896',
          tabBarInactiveTintColor: '#4A5568',
          tabBarStyle: { backgroundColor: '#0B0E17', borderTopColor: '#1C2033', height: 60, paddingBottom: 8 },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Market" component={MarketStack} />
        <Tab.Screen name="News" component={NewsScreen} />
        <Tab.Screen name="Watchlist" component={WatchlistStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
