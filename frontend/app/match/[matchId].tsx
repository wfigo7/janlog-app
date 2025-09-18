import React from 'react';
import { Stack } from 'expo-router';
import MatchDetailScreen from '../../src/components/history/MatchDetailScreen';

export default function MatchDetailPage() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: '対局詳細',
          headerShown: true,
        }} 
      />
      <MatchDetailScreen />
    </>
  );
}