# Infra サブディレクトリ用Makefile
# 全てのコマンドをプロジェクトルートのMakefileに委譲します

# プロジェクトルートを検出（.rootファイルの存在で判定）
ROOT_DIR := $(shell \
	dir="$(PWD)"; \
	while [ "$$dir" != "/" ]; do \
		if [ -f "$$dir/.root" ]; then \
			echo "$$dir"; \
			break; \
		fi; \
		dir=$$(dirname "$$dir"); \
	done \
)

# プロジェクトルートが見つからない場合のエラー処理
ifeq ($(ROOT_DIR),)
$(error プロジェクトルートが見つかりません。.rootファイルがあるディレクトリから実行してください)
endif

# 全てのターゲットをルートのMakefileに委譲（動的に処理）
%:
	@$(MAKE) -C $(ROOT_DIR) $@