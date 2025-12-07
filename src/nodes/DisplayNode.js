/**
 * Display Node
 * Displays workflow results in a formatted view
 */
class DisplayNode extends Node {
  constructor(id, position) {
    super(id, 'display', position);
    this.inputs = ['data'];
    this.outputs = []; // Terminal node - no outputs
    this.parameters = {
      displayMode: 'formatted',
      showTimestamp: true
    };
  }

  getDisplayName() {
    return '結果表示';
  }

  getParameterDefinitions() {
    return [
      {
        name: 'displayMode',
        type: 'select',
        label: '表示モード',
        options: [
          { value: 'formatted', label: '整形表示' },
          { value: 'raw', label: 'Raw JSON' },
          { value: 'text', label: 'テキストのみ' }
        ],
        default: 'formatted'
      },
      {
        name: 'showTimestamp',
        type: 'select',
        label: 'タイムスタンプ',
        options: [
          { value: true, label: '表示' },
          { value: false, label: '非表示' }
        ],
        default: true
      }
    ];
  }

  async execute(inputData) {
    // Get the input data
    let data = inputData.data;
    
    if (!data) {
      throw new Error('表示するデータがありません');
    }

    // Format the data based on display mode
    let formattedOutput = '';
    const mode = this.parameters.displayMode;

    if (mode === 'raw') {
      formattedOutput = JSON.stringify(data, null, 2);
    } else if (mode === 'text') {
      // Try to extract text content
      if (typeof data === 'string') {
        formattedOutput = data;
      } else if (data.text) {
        formattedOutput = data.text;
      } else if (data.response) {
        formattedOutput = data.response;
      } else if (data.results) {
        // Handle search results
        formattedOutput = data.results.map((r, i) => 
          `${i + 1}. ${r.title || r.name || 'Result'}`
        ).join('\n');
      } else {
        formattedOutput = JSON.stringify(data, null, 2);
      }
    } else {
      // Formatted mode - create a nicely formatted view
      formattedOutput = this.formatData(data);
    }

    // Store the formatted output for display
    const result = {
      originalData: data,
      formattedOutput,
      displayMode: mode,
      timestamp: new Date().toISOString()
    };

    // Display the result using the modal (fallback to alert if not available)
    if (window.resultModal) {
      window.resultModal.showResult({
        ...result,
        showTimestamp: this.parameters.showTimestamp
      });
    } else {
      const displayText = this.parameters.showTimestamp 
        ? `=== 結果 ===\n\n${formattedOutput}\n\n[${result.timestamp}]`
        : `=== 結果 ===\n\n${formattedOutput}`;
      alert(displayText);
    }

    return result;
  }

  formatData(data) {
    if (typeof data === 'string') {
      return data;
    }

    let output = [];

    // Check for common data structures
    if (data.response) {
      output.push('📄 AI応答:');
      output.push(data.response);
      if (data.prompt) {
        output.push('\n💬 プロンプト:');
        output.push(data.prompt);
      }
      if (data.usage) {
        output.push('\n📊 使用量:');
        output.push(`  トークン: ${data.usage.total_tokens || 'N/A'}`);
      }
    } else if (data.text) {
      output.push('📝 テキスト:');
      output.push(data.text);
    } else if (data.results && Array.isArray(data.results)) {
      output.push(`🔍 検索結果 (${data.results.length}件):`);
      data.results.slice(0, 5).forEach((result, i) => {
        output.push(`\n${i + 1}. ${result.title || result.name || 'Result'}`);
        if (result.description) {
          output.push(`   ${result.description.substring(0, 100)}...`);
        }
        if (result.url) {
          output.push(`   🔗 ${result.url}`);
        }
      });
      if (data.results.length > 5) {
        output.push(`\n... 他 ${data.results.length - 5}件`);
      }
    } else {
      // Generic object display
      output.push('📦 データ:');
      output.push(JSON.stringify(data, null, 2));
    }

    return output.join('\n');
  }

  validate() {
    return true; // Always valid - will display whatever it receives
  }
}

// Register the node type
if (typeof window !== 'undefined' && window.nodeRegistry) {
  window.nodeRegistry.register('display', DisplayNode, {
    displayName: '結果表示',
    description: 'ワークフローの実行結果を表示します',
    category: 'output'
  });
}
