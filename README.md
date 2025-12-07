# AI Alignment - Workflow Editor

ノードベースのビジュアルワークフローエディタ。AIサービスやデータソースを視覚的に接続してパイプラインを構築できます。

## 機能

- ✅ ドラッグ&ドロップによるノード配置・接続
- ✅ 4種類のデフォルトノード（ユーザー入力、Brave Search、OpenAI、Grok、結果表示）
- ✅ ワークフロー実行エンジン（手動/自動実行）
- ✅ セキュアなAPIキー管理
- ✅ ワークフロー保存/読込
- ✅ カスタムノードプラグインシステム

## VSCodeでの開発

### 必要な依存関係のインストール

```bash
npm install
```

### タスクの実行

VSCodeのコマンドパレット（`Cmd+Shift+P` / `Ctrl+Shift+P`）から **Tasks: Run Task** を選択して以下を実行できます：

- **npm: start** - アプリを起動
- **npm: dev** - 開発モードで起動（DevTools自動表示）
- **npm: pack** - パッケージング（テスト用）
- **npm: build** - 配布用ビルド
- **Clean and Build** - クリーン後にビルド

または、ターミナルから：

```bash
npm start       # アプリ起動
npm run dev     # 開発モード
npm run pack    # パッケージング
npm run build   # ビルド
```

### デバッグ

VSCodeのデバッグビュー（`Cmd+Shift+D` / `Ctrl+Shift+D`）から以下を選択：

- **Electron: Main Process** - メインプロセスをデバッグ
- **Electron: Main Process (Dev)** - DevTools付きでデバッグ
- **Electron: All** - メイン＆レンダラープロセスを同時デバッグ

ブレークポイントを設定して、`F5`でデバッグを開始できます。

## プロジェクト構造

```
Alignment/
├── main.js                 # Electronメインプロセス
├── preload.js              # プリロードスクリプト
├── index.html              # メインHTML
├── package.json            # 依存関係
├── src/
│   ├── core/              # コアシステム
│   ├── nodes/             # ノード実装
│   ├── ui/                # UIコンポーネント
│   ├── settings/          # 設定管理
│   ├── workflow/          # ワークフロー管理
│   └── plugins/           # プラグインシステム
├── styles/
│   └── main.css           # スタイル
└── plugins/
    └── README.md          # プラグイン開発ガイド
```

## ビルド成果物

`npm run build`を実行すると、`dist/`ディレクトリに配布用パッケージが生成されます：

- **macOS**: `dist/AI Alignment-*.dmg` と `dist/AI Alignment-*.zip`

## ライセンス

MIT
