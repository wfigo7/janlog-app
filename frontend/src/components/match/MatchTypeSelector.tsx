import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MatchType } from '../../types/match';

interface MatchTypeSelectorProps {
  selectedType: MatchType | null;
  onTypeChange: (type: MatchType | null) => void;
}

const MatchTypeSelector: React.FC<MatchTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const matchTypes: { value: MatchType; label: string }[] = [
    { value: 'free', label: 'フリー' },
    { value: 'set', label: 'セット' },
    { value: 'competition', label: '競技' },
  ];

  const handlePress = (type: MatchType) => {
    // 同じボタンを再度タップした場合は選択解除
    if (selectedType === type) {
      onTypeChange(null);
    } else {
      onTypeChange(type);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>対局種別（任意）</Text>
      <View style={styles.buttonGroup}>
        {matchTypes.map((type) => {
          const isSelected = selectedType === type.value;
          return (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.button,
                isSelected && styles.buttonSelected,
              ]}
              onPress={() => handlePress(type.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  isSelected && styles.buttonTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  buttonTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default MatchTypeSelector;
