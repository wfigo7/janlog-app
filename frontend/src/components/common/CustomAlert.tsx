/**
 * カスタムアラートコンポーネント
 * React NativeのAlert.alertの代替
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  onDismiss?: () => void;
}

export function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}: CustomAlertProps) {
  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* タイトル */}
          <Text style={styles.title}>{title}</Text>
          
          {/* メッセージ */}
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
          
          {/* ボタン */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.cancelButton,
                  button.style === 'destructive' && styles.destructiveButton,
                  buttons.length === 1 && styles.singleButton,
                  index === 0 && buttons.length > 1 && styles.firstButton,
                  index === buttons.length - 1 && buttons.length > 1 && styles.lastButton,
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 280,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleButton: {
    borderRadius: 0,
  },
  firstButton: {
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  lastButton: {
    // 最後のボタンのスタイル
  },
  cancelButton: {
    // キャンセルボタンのスタイル
  },
  destructiveButton: {
    // 破壊的ボタンのスタイル
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
  },
  destructiveButtonText: {
    color: '#FF3B30',
  },
});