# Custom Node Development Guide

このディレクトリにカスタムノードのプラグインを配置できます。

## プラグインの作成方法

カスタムノードは、以下のフォーマットで JavaScript ファイルとして作成します：

```javascript
// plugins/example-node/index.js

class ExampleNode extends Node {
  constructor(id, position) {
    super(id, "example", position);

    // Define inputs (can be empty array for no inputs)
    this.inputs = ["input1", "input2"];

    // Define outputs (usually single output)
    this.outputs = ["output"];

    // Define parameters
    this.parameters = {
      paramA: "default value",
      paramB: 100,
    };
  }

  getDisplayName() {
    return "Example Node";
  }

  getParameterDefinitions() {
    return [
      {
        name: "paramA",
        type: "text",
        label: "Parameter A",
        default: "default value",
      },
      {
        name: "paramB",
        type: "number",
        label: "Parameter B",
        default: 100,
        min: 0,
        max: 1000,
      },
    ];
  }

  async execute(inputData) {
    // Access input data
    const input1 = inputData.input1;
    const input2 = inputData.input2;

    // Access parameters
    const paramA = this.parameters.paramA;
    const paramB = this.parameters.paramB;

    // Perform your custom logic
    const result = {
      processed: true,
      data: `${paramA}: ${paramB}`,
      inputs: { input1, input2 },
    };

    // Return result as JSON
    return result;
  }

  validate() {
    // Return true if node is properly configured
    return this.parameters.paramA !== "";
  }
}

// Export the plugin
module.exports = {
  nodeType: "example",
  nodeClass: ExampleNode,
  displayName: "Example Node",
  description: "An example custom node",
};
```

## パラメータタイプ

- `text`: テキスト入力
- `textarea`: 複数行テキスト入力
- `number`: 数値入力 (min, max, step オプション対応)
- `select`: ドロップダウン選択 (options 配列が必要)

## 入力データ

`execute()` メソッドの `inputData` パラメータには、接続された入力ノードからのデータが含まれます。
各入力ポート名がキーとなり、対応する値が格納されています。

## 出力データ

`execute()` メソッドから返すデータは、下流のノードに渡されます。
通常、JSON オブジェクトとして返します。

## プラグインの読み込み

現在、プラグインは手動で読み込む必要があります（将来的に UI 経由での読み込みを実装予定）。
`pluginLoader.loadPlugin(code, name)` を使用してプラグインを読み込めます。

## 注意事項

- ノードタイプ名はユニークである必要があります
- 非同期処理が必要な場合は `async/await` を使用してください
- エラーは `throw new Error()` で投げてください（ワークフローエンジンが処理します）
