import React from 'react';
import { Stack } from 'expo-router';
import MatchEditScreen from '../../../src/components/match/MatchEditScreen';

export default function MatchEditPage() {
  return (
    <>
      <Stack.Screen
        options={{
          title: '対局編集',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MatchEditScreen />
    </>
  );
}