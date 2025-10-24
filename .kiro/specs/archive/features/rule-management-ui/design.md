# ルール管理UI機能 設計書

## 概要

ルール管理画面を追加し、ユーザーが麻雀ルールを管理できるようにします。管理者はグローバルルールと個人ルールの両方を管理でき、一般ユーザーは個人ルールのみを管理できます。

## アーキテクチャ

### 画面構成

```
タブナビゲーション
├── 統計タブ（既存）
├── 履歴タブ（既存）
├── 対局登録タブ（既存）
└── ルールタブ（新規）★
    └── ルール管理画面
        ├── グローバルルールセクション（管理者のみ表示）
        │   ├── ルール一覧
        │   ├── 新規作成ボタン
        │   ├── 編集ボタン
        │   └── 削除ボタン
        └── 個人ルールセクション
            ├── ルール一覧
            ├── 新規作成ボタン
            ├── 編集ボタン
            └── 削除ボタン
```

### コンポーネント構成

```
frontend/
├── app/
│   ├── (tabs)/
│   │   └── rules.tsx                  # ルール管理画面（タブ）
│   └── rules/
│       ├── create.tsx                 # ルール作成画面
│       └── [rulesetId].tsx            # ルール編集画面（動的ルート）
├── src/
│   ├── components/
│   │   └── rules/                     # 新規ディレクトリ
│   │       ├── RuleList.tsx           # ルール一覧コンポーネント
│   │       ├── RuleCard.tsx           # ルールカード（1件表示）
│   │       └── RuleFormComponent.tsx  # ルールフォーム共通コンポーネント
│   ├── hooks/
│   │   └── useRuleForm.ts             # ルールフォーム用カスタムフック
│   ├── services/
│   │   └── rulesetService.ts          # ルールAPI呼び出しサービス（既存拡張）
│   └── types/
│       └── ruleset.ts                 # ルール型定義（既存）
```

## コンポーネント設計

### 1. RuleManagementScreen.tsx

**責務:**
- ルール管理画面全体の制御
- グローバルルール・個人ルールの取得と表示
- ユーザーロールに応じた表示制御

**主要な状態:**
```typescript
interface RuleManagementState {
  globalRules: Ruleset[];        // グローバルルール一覧
  personalRules: Ruleset[];      // 個人ルール一覧
  isLoading: boolean;            // ローディング状態
  error: string | null;          // エラーメッセージ
  userRole: 'user' | 'admin';    // ユーザーロール
}
```

**主要な処理:**
```typescript
// ルール一覧取得（ルール名の昇順でソート）
const fetchRules = async () => {
  const rules = await rulesetService.getRulesets();
  
  // グローバルルールと個人ルールに分類し、ルール名の昇順でソート
  const global = rules
    .filter(r => r.isGlobal)
    .sort((a, b) => a.ruleName.localeCompare(b.ruleName, 'ja'));
  const personal = rules
    .filter(r => !r.isGlobal)
    .sort((a, b) => a.ruleName.localeCompare(b.ruleName, 'ja'));
  
  setGlobalRules(global);
  setPersonalRules(personal);
};

// 新規作成画面への遷移
const handleCreate = (isGlobal: boolean) => {
  if (isGlobal && !isAdmin) {
    Alert.alert('エラー', 'グローバルルールの作成は管理者のみ可能です');
    return;
  }
  router.push('../rules/create');
};

// 編集画面への遷移
const handleEdit = (rule: Ruleset) => {
  if (rule.isGlobal && !isAdmin) {
    Alert.alert('エラー', 'グローバルルールは編集できません');
    return;
  }
  router.push(`../rules/${rule.rulesetId}`);
};

// 削除処理
const handleDelete = async (rulesetId: string, isGlobal: boolean) => {
  if (isGlobal && userRole !== 'admin') {
    showError('グローバルルールは削除できません');
    return;
  }
  
  const confirmed = await showDeleteDialog();
  if (!confirmed) return;
  
  await ruleService.deleteRuleset(rulesetId);
  await fetchRules();
  showSuccess('ルールを削除しました');
};
```

**UI構成:**
```tsx
<ScrollView>
  {/* 管理者のみ表示 */}
  {userRole === 'admin' && (
    <Section title="グローバルルール（全員共通）">
      <Button onPress={() => handleCreate(true)}>
        新規作成
      </Button>
      <RuleList
        rules={globalRules}
        onEdit={handleEdit}
        onDelete={handleDelete}
        editable={true}
      />
    </Section>
  )}

  {/* 全ユーザー表示 */}
  <Section title="個人ルール">
    <Button onPress={() => handleCreate(false)}>
      新規作成
    </Button>
    <RuleList
      rules={personalRules}
      onEdit={handleEdit}
      onDelete={handleDelete}
      editable={true}
    />
  </Section>

  {/* 参考表示（読み取り専用） */}
  {userRole === 'user' && globalRules.length > 0 && (
    <Section title="グローバルルール（参考）">
      <RuleList
        rules={globalRules}
        editable={false}
      />
    </Section>
  )}
</ScrollView>
```

### 2. RuleList.tsx

**責務:**
- ルール一覧の表示
- 編集・削除ボタンの制御

**Props:**
```typescript
interface RuleListProps {
  rules: Ruleset[];
  onEdit?: (rule: Ruleset) => void;
  onDelete?: (rulesetId: string, isGlobal: boolean) => void;
  editable: boolean;  // 編集可能かどうか
}
```

**UI構成:**
```tsx
<View>
  {rules.length === 0 ? (
    <EmptyMessage>ルールがありません</EmptyMessage>
  ) : (
    rules.map(rule => (
      <RuleCard
        key={rule.rulesetId}
        rule={rule}
        onEdit={editable ? () => onEdit?.(rule) : undefined}
        onDelete={editable ? () => onDelete?.(rule.rulesetId, rule.isGlobal) : undefined}
      />
    ))
  )}
</View>
```

### 3. RuleCard.tsx

**責務:**
- 1件のルール情報を表示
- 編集・削除ボタンの表示

**Props:**
```typescript
interface RuleCardProps {
  rule: Ruleset;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

**表示内容:**
- ルール名
- ゲームモード（3人麻雀 / 4人麻雀）
- 開始点・基準点
- ウマ設定（例: 10-30）
- オカ設定（例: +20）
- チップ有無
- メモ（あれば）

**UI構成:**
```tsx
<Card>
  <View style={styles.header}>
    <Text style={styles.ruleName}>{rule.ruleName}</Text>
    <Badge>{rule.gameMode === 'three' ? '3人麻雀' : '4人麻雀'}</Badge>
  </View>

  <View style={styles.details}>
    <DetailRow label="開始点" value={`${rule.startingPoints}点`} />
    <DetailRow label="基準点" value={`${rule.basePoints}点`} />
    <DetailRow label="ウマ" value={formatUma(rule.uma)} />
    <DetailRow label="オカ" value={`+${rule.oka}`} />
    <DetailRow label="チップ" value={rule.useChips ? 'あり' : 'なし'} />
    {rule.memo && <DetailRow label="メモ" value={rule.memo} />}
  </View>

  {(onEdit || onDelete) && (
    <View style={styles.actions}>
      {onEdit && (
        <Button variant="outline" onPress={onEdit}>
          編集
        </Button>
      )}
      {onDelete && (
        <Button variant="danger" onPress={onDelete}>
          削除
        </Button>
      )}
    </View>
  )}
</Card>
```

### 4. useRuleForm.ts（カスタムフック）

**責務:**
- ルールフォームの状態管理
- バリデーション
- ゲームモード変更時のデフォルト値設定
- オカの自動計算

**Props:**
```typescript
interface UseRuleFormProps {
  initialRule?: Ruleset | null;  // 編集時の初期データ
  onSubmit: (formData: RuleFormData) => Promise<void>;
}
```

**フォームデータ:**
```typescript
interface RuleFormData {
  ruleName: string;
  gameMode: 'three' | 'four';
  startingPoints: string;
  basePoints: string;
  uma: string[];
  oka: string;
  useChips: boolean;
  memo: string;
}
```

**主要な機能:**
```typescript
// ゲームモード変更時のデフォルト値設定
const handleGameModeChange = (mode: 'three' | 'four') => {
  if (mode === 'three') {
    // 3人麻雀: 35000点持ち40000点返し
    setFormData({
      ...formData,
      gameMode: mode,
      startingPoints: '35000',
      basePoints: '40000',
      uma: ['20', '0', '-20'],
      oka: '15',
    });
  } else {
    // 4人麻雀: 25000点持ち30000点返し
    setFormData({
      ...formData,
      gameMode: mode,
      startingPoints: '25000',
      basePoints: '30000',
      uma: ['30', '10', '-10', '-30'],
      oka: '20',
    });
  }
};

// オカの自動計算
const calculateOka = (start: string, base: string, gameMode: 'three' | 'four') => {
  const startNum = parseInt(start, 10);
  const baseNum = parseInt(base, 10);
  if (isNaN(startNum) || isNaN(baseNum)) return;
  
  const diff = baseNum - startNum;
  const calculatedOka = (diff * (gameMode === 'three' ? 3 : 4)) / 1000;
  return calculatedOka.toString();
};
```

**バリデーション:**
```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!ruleName.trim()) {
    newErrors.ruleName = 'ルール名を入力してください';
  }

  if (startingPoints <= 0) {
    newErrors.startingPoints = '開始点は正の数値を入力してください';
  }

  if (basePoints <= 0) {
    newErrors.basePoints = '基準点は正の数値を入力してください';
  }

  if (gameMode === 'three' && uma.length !== 3) {
    newErrors.uma = '3人麻雀のウマは3つ必要です';
  }

  if (gameMode === 'four' && uma.length !== 4) {
    newErrors.uma = '4人麻雀のウマは4つ必要です';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**保存処理:**
```typescript
const handleSubmit = async () => {
  if (!validateForm()) return;

  setIsSubmitting(true);
  try {
    const ruleData: RulesetInput = {
      ruleName,
      gameMode,
      startingPoints,
      basePoints,
      uma,
      oka,
      useChips,
      memo: memo.trim() || undefined,
      isGlobal: mode === 'create' ? isGlobal : rule.isGlobal,
    };

    if (mode === 'create') {
      await ruleService.createRuleset(ruleData);
      showSuccess('ルールを作成しました');
    } else {
      await ruleService.updateRuleset(rule.rulesetId, ruleData);
      showSuccess('ルールを更新しました');
    }

    navigation.goBack();
  } catch (error) {
    showError('保存に失敗しました');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 5. RuleFormComponent.tsx（共通フォームコンポーネント）

**責務:**
- ルール作成・編集フォームのUI表示
- 入力イベントのハンドリング

**Props:**
```typescript
interface RuleFormComponentProps {
  formData: RuleFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  submitButtonText: string;
  onGameModeChange: (mode: 'three' | 'four') => void;
  onFieldChange: (field: keyof RuleFormData, value: any) => void;
  onUmaChange: (index: number, value: string) => void;
  onSubmit: () => void;
}
```

**特徴:**
- 作成画面と編集画面で共通利用
- ゲームモード選択モーダル
- オカは自動計算（読み取り専用表示）
- リアルタイムバリデーション

**UI構成:**
```tsx
<ScrollView>
  <Form>
    <TextInput
      label="ルール名"
      value={ruleName}
      onChangeText={setRuleName}
      error={errors.ruleName}
      placeholder="例: Mリーグルール"
    />

    <Picker
      label="ゲームモード"
      value={gameMode}
      onValueChange={setGameMode}
      items={[
        { label: '3人麻雀', value: 'three' },
        { label: '4人麻雀', value: 'four' },
      ]}
    />

    <NumberInput
      label="開始点"
      value={startingPoints}
      onChangeValue={setStartingPoints}
      error={errors.startingPoints}
      placeholder="25000"
    />

    <NumberInput
      label="基準点"
      value={basePoints}
      onChangeValue={setBasePoints}
      error={errors.basePoints}
      placeholder="30000"
    />

    <UmaInput
      label="ウマ"
      value={uma}
      onChange={setUma}
      gameMode={gameMode}
      error={errors.uma}
    />

    <NumberInput
      label="オカ"
      value={oka}
      onChangeValue={setOka}
      placeholder="20"
    />

    <Switch
      label="チップを使用する"
      value={useChips}
      onValueChange={setUseChips}
    />

    <TextInput
      label="メモ（任意）"
      value={memo}
      onChangeText={setMemo}
      multiline
      placeholder="例: ○○店ルール"
    />

    <Button
      onPress={handleSubmit}
      disabled={isSubmitting}
      loading={isSubmitting}
    >
      {mode === 'create' ? '作成' : '更新'}
    </Button>
  </Form>
</ScrollView>
```

### 6. 削除確認ダイアログ

**実装方法:**
- React NativeのAlert.alertを使用
- モーダルコンポーネントは不要

**表示内容:**
```typescript
Alert.alert(
  'ルールを削除',
  '本当に削除してもよろしいですか？\n※ 既存の対局データには影響しません',
  [
    { text: 'キャンセル', style: 'cancel' },
    { text: '削除', style: 'destructive', onPress: handleDelete }
  ]
);
```

## ルール一覧のソート

### ソート条件

**ルール管理画面:**
- ルール名の昇順（日本語対応）
- グローバルルールと個人ルールをそれぞれ独立してソート

**対局登録画面のルール選択:**
- ルール名の昇順（日本語対応）
- ユーザーがルールを見つけやすくするため

**実装方法:**
```typescript
const sortedRules = rules.sort((a, b) => 
  a.ruleName.localeCompare(b.ruleName, 'ja')
);
```

**理由:**
- ユーザーがルール名でルールを探しやすい
- 日本語の自然な順序（ひらがな、カタカナ、漢字、英数字）でソート
- 作成日時順だとUUIDベースで実質ランダムになるため不適切

## API設計

### 既存APIの活用

既存のルールセットAPIをそのまま使用します。

**エンドポイント:**
- `GET /rulesets` - ルール一覧取得（グローバル+個人）
- `POST /rulesets` - ルール作成
- `PUT /rulesets/{rulesetId}` - ルール更新
- `DELETE /rulesets/{rulesetId}` - ルール削除

**バックエンド側の権限チェック:**
```python
# グローバルルールの作成・更新・削除は管理者のみ
@router.post("/rulesets")
async def create_ruleset(
    ruleset: RulesetInput,
    current_user: User = Depends(get_current_user)
):
    if ruleset.isGlobal and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="グローバルルールの作成は管理者のみ可能です"
        )
    # ... 作成処理

@router.put("/rulesets/{ruleset_id}")
async def update_ruleset(
    ruleset_id: str,
    ruleset: RulesetInput,
    current_user: User = Depends(get_current_user)
):
    existing = await ruleset_service.get_ruleset(ruleset_id)
    if existing.isGlobal and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="グローバルルールの更新は管理者のみ可能です"
        )
    # ... 更新処理

@router.delete("/rulesets/{ruleset_id}")
async def delete_ruleset(
    ruleset_id: str,
    current_user: User = Depends(get_current_user)
):
    existing = await ruleset_service.get_ruleset(ruleset_id)
    if existing.isGlobal and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="グローバルルールの削除は管理者のみ可能です"
        )
    # ... 削除処理
```

## データモデル

### 既存のRulesetモデルを使用

```typescript
interface Ruleset {
  rulesetId: string;
  ruleName: string;
  gameMode: 'three' | 'four';
  startingPoints: number;
  basePoints: number;
  uma: number[];
  oka: number;
  useChips: boolean;
  memo?: string;
  isGlobal: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### DynamoDBデータ構造

**グローバルルール:**
```
PK: GLOBAL
SK: RULESET#{rulesetId}
```

**個人ルール:**
```
PK: USER#{userId}
SK: RULESET#{rulesetId}
```

## ナビゲーション設計

### タブナビゲーションの更新

```typescript
// TabNavigation.tsx
const Tab = createBottomTabNavigator();

function TabNavigation() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: '統計',
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: '履歴',
          tabBarIcon: ({ color, size }) => (
            <Icon name="history" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MatchRegistration"
        component={MatchRegistrationScreen}
        options={{
          title: '対局登録',
          tabBarIcon: ({ color, size }) => (
            <Icon name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      {/* 新規追加 */}
      <Tab.Screen
        name="Rules"
        component={RuleManagementScreen}
        options={{
          title: 'ルール',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

### スタックナビゲーション

```typescript
// RulesStackNavigator.tsx
const Stack = createStackNavigator();

function RulesStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RuleManagement"
        component={RuleManagementScreen}
        options={{ title: 'ルール管理' }}
      />
      <Stack.Screen
        name="RuleForm"
        component={RuleFormScreen}
        options={({ route }) => ({
          title: route.params.mode === 'create' ? 'ルール作成' : 'ルール編集',
        })}
      />
    </Stack.Navigator>
  );
}
```

## エラーハンドリング

### フロントエンド

**エラー表示:**
```typescript
// 通知システムを使用
showError('グローバルルールは編集できません');
showError('ルールの削除に失敗しました');
showSuccess('ルールを作成しました');
```

**バリデーションエラー:**
```typescript
// フォーム内にエラーメッセージを表示
<TextInput
  error={errors.ruleName}
  // ...
/>
```

### バックエンド

**権限エラー:**
```python
raise HTTPException(
    status_code=403,
    detail="グローバルルールの作成は管理者のみ可能です"
)
```

**バリデーションエラー:**
```python
raise HTTPException(
    status_code=400,
    detail="ルール名は必須です"
)
```

## テスト戦略

### フロントエンドテスト

**単体テスト:**
```typescript
// RuleCard.test.tsx
describe('RuleCard', () => {
  it('ルール情報を正しく表示する', () => {
    const rule = createMockRule();
    const { getByText } = render(<RuleCard rule={rule} />);
    expect(getByText(rule.ruleName)).toBeTruthy();
  });

  it('編集ボタンが押された時にonEditが呼ばれる', () => {
    const onEdit = jest.fn();
    const { getByText } = render(
      <RuleCard rule={createMockRule()} onEdit={onEdit} />
    );
    fireEvent.press(getByText('編集'));
    expect(onEdit).toHaveBeenCalled();
  });
});
```

**統合テスト:**
```typescript
// RuleManagementScreen.test.tsx
describe('RuleManagementScreen', () => {
  it('管理者はグローバルルールセクションを表示する', async () => {
    mockUserRole('admin');
    const { getByText } = render(<RuleManagementScreen />);
    await waitFor(() => {
      expect(getByText('グローバルルール（全員共通）')).toBeTruthy();
    });
  });

  it('一般ユーザーはグローバルルールセクションを表示しない', async () => {
    mockUserRole('user');
    const { queryByText } = render(<RuleManagementScreen />);
    await waitFor(() => {
      expect(queryByText('グローバルルール（全員共通）')).toBeNull();
    });
  });
});
```

### バックエンドテスト

**権限チェックテスト:**
```python
def test_create_global_rule_as_user_fails():
    """一般ユーザーはグローバルルールを作成できない"""
    client = TestClient(app)
    response = client.post(
        "/rulesets",
        json={"ruleName": "Test", "isGlobal": True, ...},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403

def test_create_global_rule_as_admin_succeeds():
    """管理者はグローバルルールを作成できる"""
    client = TestClient(app)
    response = client.post(
        "/rulesets",
        json={"ruleName": "Test", "isGlobal": True, ...},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
```

## UX設計

### ルール一覧画面

**レイアウト:**
- カード形式で1件ずつ表示
- 重要な情報（ルール名、ゲームモード、ウマ・オカ）を一目で確認可能
- 編集・削除ボタンを各カードに配置

**空状態:**
- ルールがない場合は「ルールがありません」メッセージを表示
- 新規作成ボタンを目立たせる

### ルール作成・編集フォーム

**入力支援:**
- 開始点・基準点を入力すると、一般的なウマを自動提案
- ゲームモード変更時に適切な入力欄を表示

**バリデーション:**
- リアルタイムバリデーション（500msデバウンス）
- エラー箇所を視覚的にハイライト
- 具体的なエラーメッセージを表示

### 削除確認

**安全性:**
- 削除前に確認ダイアログを表示
- 「既存の対局データには影響しません」と明記
- キャンセルボタンを目立たせる

## パフォーマンス考慮事項

### データ取得の最適化

```typescript
// ルール一覧は初回のみ取得、以降はキャッシュを使用
const [rules, setRules] = useState<Ruleset[]>([]);
const [lastFetch, setLastFetch] = useState<number>(0);

const fetchRules = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && now - lastFetch < 60000) {
    // 1分以内は再取得しない
    return;
  }

  const data = await ruleService.getRulesets();
  setRules(data);
  setLastFetch(now);
};
```

### レンダリング最適化

```typescript
// RuleCard をメモ化
export const RuleCard = React.memo<RuleCardProps>(({ rule, onEdit, onDelete }) => {
  // ...
});

// RuleList でキーを適切に設定
{rules.map(rule => (
  <RuleCard
    key={rule.rulesetId}
    rule={rule}
    // ...
  />
))}
```

## セキュリティ考慮事項

### フロントエンド

**権限チェック:**
```typescript
// ユーザーロールに応じた表示制御
{userRole === 'admin' && (
  <Button onPress={handleCreateGlobal}>
    グローバルルール作成
  </Button>
)}

// 編集・削除ボタンの制御
const canEdit = (rule: Ruleset) => {
  if (rule.isGlobal) {
    return userRole === 'admin';
  }
  return true;
};
```

### バックエンド

**権限チェック（必須）:**
- フロントエンドの制御は回避可能なため、バックエンドで必ず権限チェック
- グローバルルールの作成・更新・削除は管理者のみ
- 個人ルールは作成者本人のみ編集・削除可能

```python
# 個人ルールの所有者チェック
if not ruleset.isGlobal and ruleset.createdBy != current_user.userId:
    raise HTTPException(
        status_code=403,
        detail="他人のルールは編集できません"
    )
```

## 実装の優先順位

### Phase 1: 基本機能（MVP）
1. タブナビゲーションにルールタブを追加
2. ルール一覧画面の実装（グローバル・個人の表示）
3. ルール作成フォームの実装
4. ルール編集フォームの実装
5. ルール削除機能の実装
6. バックエンドの権限チェック実装

### Phase 2: UX改善
1. ウマ自動提案機能
2. リアルタイムバリデーション
3. ローディング・エラー表示の改善
4. 空状態の改善

### Phase 3: 将来拡張
1. ルールテンプレート機能
2. ルールのインポート・エクスポート
3. ルール使用履歴の表示
4. ルール検索・フィルター機能

## 関連ドキュメント

- **要件書**: `.kiro/specs/features/rule-management-ui/requirements.md`
- **OpenAPI仕様**: `/spec/openapi.yaml`
- **Core設計**: `.kiro/specs/core/design.md`
- **Core要件**: `.kiro/specs/core/requirements.md`
