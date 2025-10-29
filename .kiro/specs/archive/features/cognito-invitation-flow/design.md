# Design Document

## Overview

本設計書は、Cognito招待フローの改善とパスワード変更機能の実装について記述します。現在の問題点は以下の2つです：

1. **招待メールの情報不足**: Cognitoから送信される招待メールには最低限の情報しか含まれず、アプリへのアクセス方法が不明
2. **初回パスワード変更画面の欠如**: 一時パスワードでログインした新規ユーザーがパスワードを変更する手段がない

これらの問題を解決するため、以下の3つの主要コンポーネントを実装します：

1. **Cognitoカスタムメールテンプレート**: 環境別の適切な情報を含む招待メール
2. **初回パスワード変更フロー**: NEW_PASSWORD_REQUIRED Challengeへの対応
3. **通常のパスワード変更機能**: ログイン済みユーザーのパスワード変更画面

## Architecture

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Expo)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  LoginScreen     │      │  ProfileScreen   │            │
│  │                  │      │                  │            │
│  │  - Email入力     │      │  - ユーザー情報  │            │
│  │  - Password入力  │      │  - ログアウト    │            │
│  │  - ログイン実行  │      │  - パスワード変更│◄───┐      │
│  └────────┬─────────┘      └────────┬─────────┘    │      │
│           │                         │              │      │
│           │ Challenge検出           │              │      │
│           ▼                         │              │      │
│  ┌──────────────────┐               │              │      │
│  │ChangePasswordScreen              │              │      │
│  │ (初回/通常共通)  │◄──────────────┘              │      │
│  │                  │                               │      │
│  │  - 現在のPW入力  │ (初回は一時PWを使用)         │      │
│  │  - 新しいPW入力  │                               │      │
│  │  - PW確認入力    │                               │      │
│  │  - ポリシー表示  │                               │      │
│  │  - バリデーション│                               │      │
│  └────────┬─────────┘                               │      │
│           │                                         │      │
│           │                                         │      │
└───────────┼─────────────────────────────────────────┼──────┘
            │                                         │
            ▼                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      AuthService                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  - login()                                                    │
│  - respondToNewPasswordChallenge()  ◄── 新規実装             │
│  - changePassword()                                           │
│  - handleAuthChallenge()            ◄── 新規実装             │
│                                                               │
└───────────┬─────────────────────────────────────────┬─────────┘
            │                                         │
            ▼                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cognito SDK                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  - InitiateAuthCommand                                        │
│  - RespondToAuthChallengeCommand    ◄── 新規使用             │
│  - ChangePasswordCommand                                      │
│                                                               │
└───────────┬─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cognito User Pool                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  - カスタムメールテンプレート  ◄── CDKで設定                │
│  - パスワードポリシー                                        │
│  - NEW_PASSWORD_REQUIRED Challenge                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 認証フロー図

#### 初回ログインフロー（NEW_PASSWORD_REQUIRED Challenge）

```
┌──────────┐
│ユーザー  │
└────┬─────┘
     │
     │ 1. 一時PWでログイン
     ▼
┌──────────────────┐
│ LoginScreen      │
└────┬─────────────┘
     │
     │ 2. InitiateAuth
     ▼
┌──────────────────┐
│ AuthService      │
└────┬─────────────┘
     │
     │ 3. InitiateAuthCommand
     ▼
┌──────────────────┐
│ Cognito          │
└────┬─────────────┘
     │
     │ 4. NEW_PASSWORD_REQUIRED Challenge
     ▼
┌──────────────────┐
│ AuthService      │
│ handleAuthChallenge()
└────┬─────────────┘
     │
     │ 5. Challenge情報を返す
     ▼
┌──────────────────┐
│ LoginScreen      │
│ ナビゲーション   │
└────┬─────────────┘
     │
     │ 6. ChangePasswordScreenへ遷移
     │    (session, username渡す)
     ▼
┌──────────────────┐
│ChangePasswordScreen
│ (初回モード)     │
└────┬─────────────┘
     │
     │ 7. 新しいPW入力
     ▼
┌──────────────────┐
│ AuthService      │
│ respondToNewPasswordChallenge()
└────┬─────────────┘
     │
     │ 8. RespondToAuthChallengeCommand
     ▼
┌──────────────────┐
│ Cognito          │
└────┬─────────────┘
     │
     │ 9. AuthenticationResult
     ▼
┌──────────────────┐
│ AuthService      │
│ トークン保存     │
└────┬─────────────┘
     │
     │ 10. ログイン完了
     ▼
┌──────────────────┐
│ StatsScreen      │
│ (ホーム画面)     │
└──────────────────┘
```

#### 通常のパスワード変更フロー

```
┌──────────┐
│ユーザー  │
└────┬─────┘
     │
     │ 1. プロフィール画面を開く
     ▼
┌──────────────────┐
│ ProfileScreen    │
└────┬─────────────┘
     │
     │ 2. パスワード変更を選択
     ▼
┌──────────────────┐
│ChangePasswordScreen
│ (通常モード)     │
└────┬─────────────┘
     │
     │ 3. 現在のPW + 新しいPW入力
     ▼
┌──────────────────┐
│ AuthService      │
│ changePassword() │
└────┬─────────────┘
     │
     │ 4. ChangePasswordCommand
     ▼
┌──────────────────┐
│ Cognito          │
└────┬─────────────┘
     │
     │ 5. 成功レスポンス
     ▼
┌──────────────────┐
│ChangePasswordScreen
│ 成功メッセージ   │
└────┬─────────────┘
     │
     │ 6. ProfileScreenに戻る
     ▼
┌──────────────────┐
│ ProfileScreen    │
└──────────────────┘
```

## Components and Interfaces

### 1. ChangePasswordScreen（新規作成）

初回パスワード変更と通常のパスワード変更の両方に対応する共通画面。

#### Props

```typescript
interface ChangePasswordScreenProps {
  // ナビゲーションパラメータ
  route: {
    params?: {
      // 初回パスワード変更用（NEW_PASSWORD_REQUIRED Challenge）
      isInitialSetup?: boolean;
      session?: string;
      username?: string;
    };
  };
  navigation: NavigationProp<any>;
}
```

#### State

```typescript
interface ChangePasswordState {
  // 入力値
  currentPassword: string;      // 通常モードのみ使用
  newPassword: string;
  confirmPassword: string;
  
  // UI状態
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  
  // バリデーション
  errors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
}
```

#### 主要メソッド

```typescript
// パスワード変更実行
async handleChangePassword(): Promise<void>

// バリデーション
validatePasswords(): boolean

// パスワードポリシーチェック
checkPasswordPolicy(password: string): {
  isValid: boolean;
  errors: string[];
}

// エラーハンドリング
handleError(error: any): void
```

### 2. AuthService拡張

#### 新規メソッド

```typescript
/**
 * NEW_PASSWORD_REQUIRED Challengeに応答
 */
async respondToNewPasswordChallenge(params: {
  username: string;
  newPassword: string;
  session: string;
}): Promise<User>

/**
 * 認証Challengeをハンドリング
 */
handleAuthChallenge(response: InitiateAuthCommandOutput): {
  challengeName: ChallengeNameType | null;
  session: string | null;
  username: string;
}
```

#### 既存メソッドの修正

```typescript
/**
 * ログイン（Challenge対応）
 */
async login(credentials: LoginCredentials): Promise<User | AuthChallenge>

// 戻り値の型を拡張
type LoginResult = User | AuthChallenge;

interface AuthChallenge {
  type: 'NEW_PASSWORD_REQUIRED';
  session: string;
  username: string;
}
```

### 3. AuthContext拡張

#### 新規State

```typescript
interface AuthState {
  // 既存
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // 新規追加
  authChallenge: AuthChallenge | null;
}
```

#### 新規Action

```typescript
type AuthAction =
  // 既存
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  // 新規追加
  | { type: 'AUTH_CHALLENGE'; payload: AuthChallenge }
  | { type: 'AUTH_CHALLENGE_COMPLETE' };
```

#### 新規メソッド

```typescript
interface AuthContextValue {
  // 既存
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (credentials: ChangePasswordCredentials) => Promise<void>;
  clearError: () => void;
  checkAuthState: () => Promise<void>;
  
  // 新規追加
  respondToChallenge: (newPassword: string) => Promise<void>;
  clearChallenge: () => void;
}
```

### 4. LoginScreen修正

#### Challenge検出とナビゲーション

```typescript
const handleLogin = async () => {
  try {
    await login(credentials);
    
    // Challengeが発生した場合
    if (authChallenge?.type === 'NEW_PASSWORD_REQUIRED') {
      navigation.navigate('ChangePassword', {
        isInitialSetup: true,
        session: authChallenge.session,
        username: authChallenge.username,
      });
    }
    // 通常ログイン成功時は自動的にStatsScreenへ
  } catch (error) {
    // エラーハンドリング
  }
};
```

### 5. ProfileScreen修正

#### パスワード変更ボタン追加

```typescript
<TouchableOpacity
  style={styles.changePasswordButton}
  onPress={() => navigation.navigate('ChangePassword', {
    isInitialSetup: false,
  })}
>
  <Text style={styles.changePasswordButtonText}>
    パスワード変更
  </Text>
</TouchableOpacity>
```

### 6. Cognito Stack修正（CDK）

#### カスタムメールテンプレート

```typescript
// User Pool設定
this.userPool = new cognito.UserPool(this, 'JanlogUserPool', {
  // 既存設定...
  
  // カスタム招待メールテンプレート
  userInvitation: {
    emailSubject: 'Janlogアプリへの招待',
    emailBody: this.getInvitationEmailBody(environment),
  },
});

// 環境別メールテンプレート
private getInvitationEmailBody(environment: string): string {
  const baseMessage = `
こんにちは！

Janlogアプリへの招待です。
以下の情報でログインしてください：

ユーザー名: {username}
一時パスワード: {####}

初回ログイン時に新しいパスワードを設定していただきます。
  `.trim();

  if (environment === 'development') {
    return `${baseMessage}

【アクセス方法】
1. Expo Goアプリをインストール
   - iOS: App Store
   - Android: Google Play

2. 以下のURLをExpo Goで開く
   exp://[development-url]

3. ログイン画面でユーザー名と一時パスワードを入力

Janlogアプリ
    `.trim();
  }

  // production環境
  return `${baseMessage}

【アクセス方法】
1. アプリをダウンロード
   - iOS: App Store
   - Android: Google Play

2. アプリを起動してログイン

Janlogアプリ
  `.trim();
}
```

## Data Models

### AuthChallenge型（新規）

```typescript
/**
 * 認証Challenge情報
 */
export interface AuthChallenge {
  type: 'NEW_PASSWORD_REQUIRED';
  session: string;
  username: string;
}
```

### ChangePasswordCredentials型（拡張）

```typescript
/**
 * パスワード変更認証情報
 */
export interface ChangePasswordCredentials {
  oldPassword: string;
  newPassword: string;
  confirmPassword?: string;  // UI用（バリデーションで使用）
}

/**
 * 初回パスワード設定用
 */
export interface InitialPasswordSetupCredentials {
  username: string;
  temporaryPassword: string;  // sessionから取得
  newPassword: string;
  session: string;
}
```

### パスワードポリシー定数

```typescript
export const PASSWORD_POLICY = {
  minLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireDigits: true,
  requireSymbols: false,
} as const;

export const PASSWORD_POLICY_MESSAGES = {
  minLength: '8文字以上',
  requireLowercase: '小文字を含む',
  requireUppercase: '大文字を含む',
  requireDigits: '数字を含む',
  requireSymbols: '記号を含む',
} as const;
```

## Error Handling

### エラー分類

#### 1. 初回パスワード変更エラー

```typescript
// NEW_PASSWORD_REQUIRED Challenge関連
- 'InvalidPasswordException': パスワードポリシー違反
- 'InvalidParameterException': 無効なパラメータ
- 'NotAuthorizedException': セッション期限切れ
- 'TooManyRequestsException': リクエスト過多
```

#### 2. 通常パスワード変更エラー

```typescript
// ChangePassword関連
- 'NotAuthorizedException': 現在のパスワードが間違っている
- 'InvalidPasswordException': 新しいパスワードがポリシー違反
- 'LimitExceededException': 変更回数制限
- 'TooManyRequestsException': リクエスト過多
```

#### 3. バリデーションエラー

```typescript
// クライアント側バリデーション
- 'PASSWORD_MISMATCH': 新しいパスワードと確認パスワードが不一致
- 'PASSWORD_SAME_AS_OLD': 新しいパスワードが現在のパスワードと同じ
- 'PASSWORD_POLICY_VIOLATION': パスワードポリシー違反
- 'EMPTY_FIELD': 必須フィールドが空
```

### エラーハンドリング戦略

#### ChangePasswordScreen

```typescript
private handleError(error: any): void {
  let errorMessage: string;
  
  if (error?.name) {
    switch (error.name) {
      case 'NotAuthorizedException':
        errorMessage = this.props.route.params?.isInitialSetup
          ? 'セッションの有効期限が切れました。再度ログインしてください。'
          : '現在のパスワードが正しくありません。';
        break;
      
      case 'InvalidPasswordException':
        errorMessage = 'パスワードが要件を満たしていません。';
        break;
      
      case 'LimitExceededException':
        errorMessage = 'パスワード変更の回数制限に達しました。しばらく待ってから再試行してください。';
        break;
      
      case 'TooManyRequestsException':
        errorMessage = 'リクエストが多すぎます。しばらく待ってから再試行してください。';
        break;
      
      default:
        errorMessage = 'パスワード変更に失敗しました。';
    }
  } else {
    errorMessage = error.message || 'パスワード変更に失敗しました。';
  }
  
  this.showAlert({
    title: 'エラー',
    message: errorMessage,
  });
}
```

#### AuthService

```typescript
private handleAuthError(error: any): AuthError {
  // 既存のエラーハンドリングに追加
  if (error?.name === 'InvalidPasswordException') {
    // パスワードポリシー違反の詳細を抽出
    const policyErrors = this.extractPasswordPolicyErrors(error);
    return {
      code: 'INVALID_PASSWORD',
      message: 'パスワードが要件を満たしていません',
      details: policyErrors,
    };
  }
  
  // 既存のエラーハンドリング...
}

private extractPasswordPolicyErrors(error: any): string[] {
  // Cognitoのエラーメッセージからポリシー違反の詳細を抽出
  const errors: string[] = [];
  const message = error.message || '';
  
  if (message.includes('length')) {
    errors.push(PASSWORD_POLICY_MESSAGES.minLength);
  }
  if (message.includes('lowercase')) {
    errors.push(PASSWORD_POLICY_MESSAGES.requireLowercase);
  }
  if (message.includes('uppercase')) {
    errors.push(PASSWORD_POLICY_MESSAGES.requireUppercase);
  }
  if (message.includes('numeric')) {
    errors.push(PASSWORD_POLICY_MESSAGES.requireDigits);
  }
  
  return errors;
}
```

## Testing Strategy

### 単体テスト

#### AuthService

```typescript
describe('AuthService', () => {
  describe('respondToNewPasswordChallenge', () => {
    it('新しいパスワードでChallengeに応答できる', async () => {
      // テスト実装
    });
    
    it('無効なセッションでエラーを返す', async () => {
      // テスト実装
    });
    
    it('パスワードポリシー違反でエラーを返す', async () => {
      // テスト実装
    });
  });
  
  describe('handleAuthChallenge', () => {
    it('NEW_PASSWORD_REQUIRED Challengeを検出できる', () => {
      // テスト実装
    });
    
    it('Challenge情報を正しく抽出できる', () => {
      // テスト実装
    });
  });
});
```

#### ChangePasswordScreen

```typescript
describe('ChangePasswordScreen', () => {
  describe('初回パスワード変更モード', () => {
    it('現在のパスワード入力フィールドを表示しない', () => {
      // テスト実装
    });
    
    it('パスワードポリシーを表示する', () => {
      // テスト実装
    });
    
    it('パスワード変更成功後にホーム画面に遷移する', async () => {
      // テスト実装
    });
  });
  
  describe('通常パスワード変更モード', () => {
    it('現在のパスワード入力フィールドを表示する', () => {
      // テスト実装
    });
    
    it('パスワード変更成功後にプロフィール画面に戻る', async () => {
      // テスト実装
    });
  });
  
  describe('バリデーション', () => {
    it('新しいパスワードと確認パスワードが一致しない場合エラーを表示', () => {
      // テスト実装
    });
    
    it('パスワードポリシー違反の場合エラーを表示', () => {
      // テスト実装
    });
  });
});
```

### 統合テスト

#### 初回ログインフロー

```typescript
describe('初回ログインフロー', () => {
  it('一時パスワードでログイン → パスワード変更画面 → ホーム画面', async () => {
    // 1. 一時パスワードでログイン
    // 2. NEW_PASSWORD_REQUIRED Challengeを受信
    // 3. ChangePasswordScreenに遷移
    // 4. 新しいパスワードを設定
    // 5. ホーム画面に遷移
    // 6. ログイン状態を確認
  });
});
```

#### 通常パスワード変更フロー

```typescript
describe('通常パスワード変更フロー', () => {
  it('プロフィール画面 → パスワード変更画面 → プロフィール画面', async () => {
    // 1. ログイン済み状態
    // 2. プロフィール画面を開く
    // 3. パスワード変更を選択
    // 4. ChangePasswordScreenに遷移
    // 5. 現在のパスワードと新しいパスワードを入力
    // 6. パスワード変更実行
    // 7. プロフィール画面に戻る
    // 8. ログイン状態を維持
  });
});
```

### 手動テスト

#### local環境

- モック認証のため、NEW_PASSWORD_REQUIRED Challengeはスキップ
- 通常のパスワード変更機能のみテスト（UI確認）

#### development環境

1. **初回ログインテスト**
   - 管理者がAdminCreateUserでユーザー作成
   - 招待メールを確認（カスタムテンプレート）
   - 一時パスワードでログイン
   - パスワード変更画面が表示されることを確認
   - 新しいパスワードを設定
   - ホーム画面に遷移することを確認

2. **通常パスワード変更テスト**
   - ログイン済み状態でプロフィール画面を開く
   - パスワード変更を選択
   - 現在のパスワードと新しいパスワードを入力
   - パスワード変更実行
   - 成功メッセージを確認
   - ログイン状態が維持されることを確認

3. **エラーケーステスト**
   - 間違った現在のパスワードを入力
   - パスワードポリシー違反のパスワードを入力
   - 新しいパスワードと確認パスワードが不一致
   - セッション期限切れ（初回ログイン）

## Implementation Notes

### 環境別の動作差異

#### local環境

- 静的JWT認証を使用
- NEW_PASSWORD_REQUIRED Challengeは発生しない
- パスワード変更機能はUI確認のみ（実際の変更は行わない）
- 招待メールは送信されない

#### development環境

- 実際のCognito認証を使用
- NEW_PASSWORD_REQUIRED Challengeが発生
- パスワード変更機能が実際に動作
- カスタム招待メールが送信される（Expo Go用）

#### production環境（将来実装）

- 実際のCognito認証を使用
- NEW_PASSWORD_REQUIRED Challengeが発生
- パスワード変更機能が実際に動作
- カスタム招待メールが送信される（App Store/Google Play用）

### セキュリティ考慮事項

1. **パスワード表示/非表示**: デフォルトは非表示、トグルボタンで切り替え可能
2. **セッション管理**: NEW_PASSWORD_REQUIRED Challengeのセッションは短時間で期限切れ
3. **エラーメッセージ**: セキュリティ上の理由から、詳細すぎる情報は表示しない
4. **トークン保存**: SecureStore（モバイル）またはsessionStorage（Web）を使用
5. **ログアウト**: パスワード変更後もログイン状態を維持（UX優先）

### UX考慮事項

1. **初回パスワード変更**: 一時パスワードは自動入力（ユーザーは新しいパスワードのみ入力）
2. **パスワードポリシー表示**: 入力前に要件を明示
3. **リアルタイムバリデーション**: 入力中にポリシー違反をチェック
4. **成功フィードバック**: パスワード変更成功時に明確なメッセージ
5. **エラーリカバリ**: エラー発生時も入力内容を保持（再入力の手間を削減）

### パフォーマンス考慮事項

1. **バリデーション**: クライアント側で事前チェック（サーバーリクエスト削減）
2. **エラーハンドリング**: 適切なタイムアウト設定
3. **ローディング状態**: 非同期処理中のUI状態管理

### 将来の拡張性

1. **パスワードリセット機能**: 忘れたパスワードのリセットフロー
2. **MFA対応**: 多要素認証の追加
3. **パスワード履歴**: 過去のパスワードの再利用防止
4. **パスワード強度メーター**: リアルタイムで強度を表示
5. **生体認証**: Face ID/Touch IDの統合
