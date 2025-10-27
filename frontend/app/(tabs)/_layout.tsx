import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { HeaderGameModeSelector } from '@/src/components/common/HeaderGameModeSelector';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // ゲームモード切り替えを表示する画面
  const screensWithGameMode = ['index', 'history', 'register', 'rules'];

  const getHeaderRight = (routeName: string) => {
    if (screensWithGameMode.includes(routeName)) {
      const HeaderRight = () => <HeaderGameModeSelector />;
      HeaderRight.displayName = 'HeaderRight';
      return HeaderRight;
    }
    return undefined;
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '成績統計',
          tabBarLabel: '統計',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          headerRight: getHeaderRight('index'),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '対局履歴',
          tabBarLabel: '履歴',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
          headerRight: getHeaderRight('history'),
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: '対局登録',
          tabBarLabel: '登録',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
          headerRight: getHeaderRight('register'),
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          title: 'ルール管理',
          tabBarLabel: 'ルール',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          headerRight: getHeaderRight('rules'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarLabel: 'プロフィール',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
