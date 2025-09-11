/**
 * ゲームモードタブコンポーネント
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GameMode } from '../../types/stats';

interface GameModeTabProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export const GameModeTab: React.FC<GameModeTabProps> = ({ 
  selectedMode, 
  onModeChange 
}) => {
  const tabs = [
    { key: 'four' as GameMode, label: '4人麻雀' },
    { key: 'three' as GameMode, label: '3人麻雀' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            selectedMode === tab.key && styles.activeTab,
          ]}
          onPress={() => onModeChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              selectedMode === tab.key && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});