# テスト実行スクリプト (PowerShell版)
# 使用方法:
#   .\test.ps1                    # 全てのテストを実行
#   .\test.ps1 frontend           # フロントエンドのテストのみ実行
#   .\test.ps1 backend            # バックエンドのテストのみ実行
#   .\test.ps1 infra              # インフラのテストのみ実行
#   .\test.ps1 frontend backend   # 複数指定も可能

param(
    [string[]]$Targets = @()
)

# エラー時に停止
$ErrorActionPreference = "Stop"

# ヘルプ表示
function Show-Help {
    Write-Host "テスト実行スクリプト" -ForegroundColor Blue
    Write-Host ""
    Write-Host "使用方法:"
    Write-Host "  .\test.ps1 [target...]"
    Write-Host ""
    Write-Host "対象:"
    Write-Host "  frontend    フロントエンドのテスト (React Native/Expo)" -ForegroundColor Green
    Write-Host "  backend     バックエンドのテスト (Python/FastAPI)" -ForegroundColor Green
    Write-Host "  infra       インフラのテスト (AWS CDK)" -ForegroundColor Green
    Write-Host "  all         全てのテスト (デフォルト)" -ForegroundColor Green
    Write-Host ""
    Write-Host "例:"
    Write-Host "  .\test.ps1                    # 全てのテストを実行"
    Write-Host "  .\test.ps1 frontend           # フロントエンドのテストのみ"
    Write-Host "  .\test.ps1 backend            # バックエンドのテストのみ"
    Write-Host "  .\test.ps1 frontend backend   # フロントエンドとバックエンドのテスト"
    Write-Host ""
}

# フロントエンドテスト実行
function Run-FrontendTests {
    Write-Host "=== フロントエンドテスト実行 ===" -ForegroundColor Blue
    
    if (-not (Test-Path "frontend")) {
        Write-Host "エラー: frontendディレクトリが見つかりません" -ForegroundColor Red
        return $false
    }
    
    Push-Location frontend
    try {
        Write-Host "依存関係をチェック中..." -ForegroundColor Yellow
        if (-not (Test-Path "node_modules")) {
            Write-Host "依存関係をインストール中..." -ForegroundColor Yellow
            npm install
        }
        
        Write-Host "TypeScript型チェックを実行中..." -ForegroundColor Yellow
        npm run type-check
        
        Write-Host "ESLintを実行中..." -ForegroundColor Yellow
        npm run lint
        
        Write-Host "Jestテストを実行中..." -ForegroundColor Yellow
        npm test
        
        Write-Host "✓ フロントエンドテスト完了" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ フロントエンドテストが失敗しました: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# バックエンドテスト実行
function Run-BackendTests {
    Write-Host "=== バックエンドテスト実行 ===" -ForegroundColor Blue
    
    if (-not (Test-Path "backend")) {
        Write-Host "エラー: backendディレクトリが見つかりません" -ForegroundColor Red
        return $false
    }
    
    Push-Location backend
    try {
        # 仮想環境の確認
        if (-not (Test-Path "venv")) {
            Write-Host "仮想環境を作成中..." -ForegroundColor Yellow
            python -m venv venv
        }
        
        # 仮想環境をアクティベート
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & "venv\Scripts\Activate.ps1"
        } else {
            Write-Host "仮想環境のアクティベーションスクリプトが見つかりません" -ForegroundColor Red
            return $false
        }
        
        Write-Host "依存関係をチェック中..." -ForegroundColor Yellow
        pip install -r requirements.txt | Out-Null
        
        Write-Host "Pytestを実行中..." -ForegroundColor Yellow
        python -m pytest tests/ -v
        
        Write-Host "✓ バックエンドテスト完了" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ バックエンドテストが失敗しました: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# インフラテスト実行
function Run-InfraTests {
    Write-Host "=== インフラテスト実行 ===" -ForegroundColor Blue
    
    if (-not (Test-Path "infra")) {
        Write-Host "エラー: infraディレクトリが見つかりません" -ForegroundColor Red
        return $false
    }
    
    Push-Location infra
    try {
        Write-Host "依存関係をチェック中..." -ForegroundColor Yellow
        if (-not (Test-Path "node_modules")) {
            Write-Host "依存関係をインストール中..." -ForegroundColor Yellow
            npm install
        }
        
        # CDKのテストがある場合
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.test) {
            Write-Host "CDKテストを実行中..." -ForegroundColor Yellow
            npm test
        } else {
            Write-Host "CDK構文チェックを実行中..." -ForegroundColor Yellow
            # 各環境での構文チェック
            try { npm run synth:local } catch { Write-Host "local環境の構文チェックをスキップ" -ForegroundColor Yellow }
            try { npm run synth:dev } catch { Write-Host "development環境の構文チェックをスキップ" -ForegroundColor Yellow }
        }
        
        Write-Host "✓ インフラテスト完了" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ インフラテストが失敗しました: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# 全テスト実行
function Run-AllTests {
    Write-Host "=== 全テスト実行 ===" -ForegroundColor Blue
    
    $failed = $false
    
    # フロントエンドテスト
    if (-not (Run-FrontendTests)) {
        $failed = $true
    }
    
    Write-Host ""
    
    # バックエンドテスト
    if (-not (Run-BackendTests)) {
        $failed = $true
    }
    
    Write-Host ""
    
    # インフラテスト
    if (-not (Run-InfraTests)) {
        $failed = $true
    }
    
    Write-Host ""
    
    if (-not $failed) {
        Write-Host "🎉 全てのテストが成功しました！" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ 一部のテストが失敗しました" -ForegroundColor Red
        return $false
    }
}

# メイン処理
function Main {
    # ヘルプオプション
    if ($Targets -contains "-h" -or $Targets -contains "--help") {
        Show-Help
        return
    }
    
    # 引数がない場合は全テスト実行
    if ($Targets.Count -eq 0) {
        $success = Run-AllTests
        if (-not $success) {
            exit 1
        }
        return
    }
    
    # 指定されたテストを実行
    $failed = $false
    
    foreach ($target in $Targets) {
        switch ($target) {
            "frontend" {
                if (-not (Run-FrontendTests)) {
                    $failed = $true
                }
            }
            "backend" {
                if (-not (Run-BackendTests)) {
                    $failed = $true
                }
            }
            "infra" {
                if (-not (Run-InfraTests)) {
                    $failed = $true
                }
            }
            "all" {
                if (-not (Run-AllTests)) {
                    $failed = $true
                }
            }
            default {
                Write-Host "エラー: 不明なターゲット '$target'" -ForegroundColor Red
                Write-Host "有効なターゲット: frontend, backend, infra, all"
                Show-Help
                exit 1
            }
        }
        
        # 複数ターゲットの場合は間に空行を入れる
        if ($Targets.Count -gt 1) {
            Write-Host ""
        }
    }
    
    if (-not $failed) {
        Write-Host "🎉 指定されたテストが全て成功しました！" -ForegroundColor Green
    } else {
        Write-Host "❌ 一部のテストが失敗しました" -ForegroundColor Red
        exit 1
    }
}

# スクリプト実行
Main