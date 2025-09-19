# UI/UXガイドライン

## 概要

このドキュメントは、Janlogアプリの一貫したUI/UX実装のためのガイドラインです。

## アラート・ダイアログ

### ❌ 使用禁止: React Native標準のAlert.alert

```typescript
// ❌ 使用しないでください
import { Alert } from 'react-native';
Alert.alert('タイトル', 'メッセージ');
```

**理由:**
- Expo Web環境で正常に動作しない場合がある
- プラットフォーム間で表示が一貫しない
- カスタマイズが困難

### ✅ 推奨: CustomAlert コンポーネント

```typescript
// ✅ 推奨の実装方法
import { useCustomAlert } from '../../hooks/useCustomAlert';

function MyComponent() {
  const { showAlert, AlertComponent } = useCustomAlert();

  const handleAction = () => {
    showAlert({
      title: 'タイトル',
      message: 'メッセージ',
      buttons: [
        { text: 'キャンセル', style: 'cancel' },
        { text: '実行', style: 'destructive', onPress: handleConfirm },
      ],
    });
  };

  return (
    <View>
      {/* コンポーネントの内容 */}
      <AlertComponent />
    </View>
  );
}
```

**利点:**
- 全プラットフォームで一貫した表示
- カスタマイズ可能なデザイン
- Web環境でも正常動作

### アラートの種類

#### 1. シンプルなアラート
```typescript
showAlert({
  title: 'エラー',
  message: 'データの取得に失敗しました',
});
```

#### 2. 確認ダイアログ
```typescript
showAlert({
  title: 'ログアウト',
  message: 'ログアウトしますか？',
  buttons: [
    { text: 'キャンセル', style: 'cancel' },
    { text: 'ログアウト', style: 'destructive', onPress: handleLogout },
  ],
});
```

#### 3. 選択肢付きダイアログ
```typescript
showAlert({
  title: '保存方法を選択',
  message: 'データをどのように保存しますか？',
  buttons: [
    { text: 'キャンセル', style: 'cancel' },
    { text: '下書き保存', onPress: handleDraft },
    { text: '完了保存', onPress: handleComplete },
  ],
});
```

### ボタンスタイル

- `default`: 通常のアクション（青色）
- `cancel`: キャンセル操作（グレー）
- `destructive`: 削除など危険な操作（赤色）

## 通知システム

### 成功・エラー通知

```typescript
// 成功通知（緑色）
showNotificationMessage('対局を登録しました');

// エラー通知（オレンジ色）
showNotificationMessage('入力エラーがあります', 'error');
```

## カラーパレット

### アラート用カラー
- **Primary**: `#007AFF` - 通常のアクション
- **Cancel**: `#666666` - キャンセル操作
- **Destructive**: `#FF3B30` - 危険な操作
- **Success**: `#4CAF50` - 成功通知
- **Warning**: `#FF9800` - 警告通知

### 背景・テキスト
- **Background**: `#FFFFFF` - アラート背景
- **Overlay**: `rgba(0, 0, 0, 0.5)` - モーダルオーバーレイ
- **Title**: `#333333` - タイトルテキスト
- **Message**: `#666666` - メッセージテキスト

## 実装チェックリスト

### 新しいコンポーネントを作成する際

- [ ] `Alert.alert`を使用していないか確認
- [ ] `useCustomAlert`フックを使用
- [ ] `<AlertComponent />`をreturn文の最後に配置
- [ ] 適切なボタンスタイルを選択
- [ ] エラーハンドリングでアラートを表示

### コードレビュー時

- [ ] `import { Alert } from 'react-native'`がないか確認
- [ ] `Alert.alert`の使用がないか確認
- [ ] カスタムアラートが正しく実装されているか確認

## 例外ケース

以下の場合のみ、標準のAlert.alertの使用を検討可能：

1. **デバッグ用途**: 開発時の一時的なデバッグ
2. **サードパーティライブラリ**: 外部ライブラリが内部で使用する場合
3. **システムレベル**: OSレベルの重要な警告

ただし、本番環境では必ずカスタムアラートを使用してください。

## 関連ファイル

- `frontend/src/components/common/CustomAlert.tsx` - カスタムアラートコンポーネント
- `frontend/src/hooks/useCustomAlert.tsx` - カスタムアラートフック
- `frontend/src/components/common/NotificationMessage.tsx` - 通知コンポーネント

## 更新履歴

- 2025-01-19: 初版作成
- カスタムアラートシステム導入に伴うガイドライン策定