/**
 * OpenAI Node
 * Sends prompts to OpenAI API and returns responses
 */
class OpenAINode extends Node {
  constructor(id, position) {
    super(id, 'openai', position);
    this.inputs = ['prompt'];
    this.outputs = ['output'];
    this.parameters = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1000,
      systemPrompt: 'You are a helpful assistant.'
    };
  }

  getDisplayName() {
    return 'OpenAI';
  }

  getParameterDefinitions() {
    return [
      {
        name: 'model',
        type: 'select',
        label: 'モデル',
        options: [
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
        ],
        default: 'gpt-4o-mini'
      },
      {
        name: 'temperature',
        type: 'number',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 2,
        step: 0.1
      },
      {
        name: 'max_tokens',
        type: 'number',
        label: 'Max Tokens',
        default: 1000,
        min: 1,
        max: 4000
      },
      {
        name: 'systemPrompt',
        type: 'textarea',
        label: 'システムプロンプト',
        default: 'You are a helpful assistant.'
      }
    ];
  }

  async execute(inputData) {
    // Get the prompt from input
    let prompt = '';
    if (inputData.prompt) {
      if (typeof inputData.prompt === 'string') {
        prompt = inputData.prompt;
      } else if (inputData.prompt.text) {
        prompt = inputData.prompt.text;
      } else if (typeof inputData.prompt === 'object') {
        prompt = JSON.stringify(inputData.prompt, null, 2);
      }
    }

    if (!prompt || prompt.trim() === '') {
      throw new Error('プロンプトが指定されていません');
    }

    // Get API key
    const apiKeyResult = await window.electronAPI.getApiKey('openai');
    if (!apiKeyResult.success || !apiKeyResult.apiKey) {
      throw new Error('OpenAI API キーが設定されていません。設定画面で設定してください。');
    }

    // Make API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyResult.apiKey}`
      },
      body: JSON.stringify({
        model: this.parameters.model,
        messages: [
          {
            role: 'system',
            content: this.parameters.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(this.parameters.temperature),
        max_tokens: parseInt(this.parameters.max_tokens)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Extract response
    const aiResponse = data.choices[0]?.message?.content || '';

    return {
      prompt,
      response: aiResponse,
      model: this.parameters.model,
      usage: data.usage,
      timestamp: new Date().toISOString()
    };
  }

  validate() {
    return true; // Validation happens at execution time
  }
}

// Register the node type
if (typeof window !== 'undefined' && window.nodeRegistry) {
  window.nodeRegistry.register('openai', OpenAINode, {
    displayName: 'OpenAI',
    description: 'OpenAI APIを使用してテキスト生成を行います',
    category: 'ai'
  });
}
