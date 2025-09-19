// jest.setup.js

// React Native Testing Libraryのクリーンアップ
import '@testing-library/jest-native/extend-expect';

// console.error を無効化（必要に応じて）
global.console = {
  ...console,
  error: jest.fn(),
};

// Alert のモック
global.Alert = {
  alert: jest.fn(),
};

// Expo vector-icons のモック
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  AntDesign: 'AntDesign',
}));