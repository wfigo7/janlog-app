// jest.setup.js

// React Native Testing Libraryのクリーンアップ
import '@testing-library/jest-native/extend-expect';

// タイムゾーンを固定（CI環境での一貫性のため）
process.env.TZ = 'Asia/Tokyo';

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

// AWS SDK のモック
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn(),
  InitiateAuthCommand: jest.fn(),
  RespondToAuthChallengeCommand: jest.fn(),
  AdminCreateUserCommand: jest.fn(),
}));

// React Native polyfills のモック
jest.mock('react-native-get-random-values', () => ({}));
jest.mock('react-native-url-polyfill/auto', () => ({}));

// Expo Secure Store のモック
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));