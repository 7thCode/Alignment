/**
 * Brave Search Node
 * Performs web search using Brave Search API
 */
class BraveSearchNode extends Node {
  constructor(id, position) {
    super(id, 'brave-search', position);
    this.inputs = ['query'];
    this.outputs = ['output'];
    this.parameters = {
      count: 10,
      safesearch: 'moderate',
      freshness: ''
    };
  }

  getDisplayName() {
    return 'Brave Search';
  }

  getParameterDefinitions() {
    return [
      {
        name: 'count',
        type: 'number',
        label: '結果数',
        default: 10,
        min: 1,
        max: 20
      },
      {
        name: 'safesearch',
        type: 'select',
        label: 'セーフサーチ',
        options: [
          { value: 'off', label: 'オフ' },
          { value: 'moderate', label: '標準' },
          { value: 'strict', label: '厳格' }
        ],
        default: 'moderate'
      },
      {
        name: 'freshness',
        type: 'select',
        label: '新しさ',
        options: [
          { value: '', label: '指定なし' },
          { value: 'pd', label: '過去24時間' },
          { value: 'pw', label: '過去1週間' },
          { value: 'pm', label: '過去1ヶ月' },
          { value: 'py', label: '過去1年' }
        ],
        default: ''
      }
    ];
  }

  async execute(inputData) {
    // Get the query from input
    let query = '';
    if (inputData.query) {
      if (typeof inputData.query === 'string') {
        query = inputData.query;
      } else if (inputData.query.text) {
        query = inputData.query.text;
      } else if (typeof inputData.query === 'object') {
        query = JSON.stringify(inputData.query);
      }
    }

    if (!query || query.trim() === '') {
      throw new Error('検索クエリが指定されていません');
    }

    // Get API key
    const apiKeyResult = await window.electronAPI.getApiKey('brave-search');
    if (!apiKeyResult.success || !apiKeyResult.apiKey) {
      throw new Error('Brave Search API キーが設定されていません。設定画面で設定してください。');
    }

    // Build request
    const params = new URLSearchParams({
      q: query,
      count: this.parameters.count.toString()
    });

    if (this.parameters.safesearch) {
      params.append('safesearch', this.parameters.safesearch);
    }

    if (this.parameters.freshness) {
      params.append('freshness', this.parameters.freshness);
    }

    // Make API request
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKeyResult.apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brave Search API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Format results
    return {
      query,
      results: data.web?.results || [],
      totalCount: data.web?.results?.length || 0,
      timestamp: new Date().toISOString()
    };
  }

  validate() {
    return true; // Validation happens at execution time
  }
}

// Register the node type
if (typeof window !== 'undefined' && window.nodeRegistry) {
  window.nodeRegistry.register('brave-search', BraveSearchNode, {
    displayName: 'Brave Search',
    description: 'Brave Search APIを使用してWeb検索を実行します',
    category: 'data-source'
  });
}
