/**
 * カスタムアラートフック
 */

import React, { useState, useCallback } from 'react';
import { CustomAlert } from '../components/common/CustomAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

export function useCustomAlert() {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    const defaultButtons: AlertButton[] = [
      {
        text: 'OK',
        style: 'default',
      },
    ];

    setAlertState({
      visible: true,
      title: options.title,
      message: options.message,
      buttons: options.buttons || defaultButtons,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const AlertComponent = useCallback(() => (
    <CustomAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      onDismiss={hideAlert}
    />
  ), [alertState, hideAlert]);

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
}