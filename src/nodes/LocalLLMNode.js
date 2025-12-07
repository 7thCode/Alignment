/**
 * Local LLM Node
 * Uses locally loaded GGUF models via node-llama-cpp for text generation
 */
class LocalLLMNode extends Node {
  constructor(id, position) {
    super(id, 'local-llm', position);
    this.inputs = ['prompt'];
    this.outputs = ['output'];
    this.parameters = {
      selectedModel: '', // Model file path
      temperature: 0.7,
      max_tokens: 2048,
      systemPrompt: 'You are a helpful AI assistant.'
    };
  }

  getDisplayName() {
    return 'ローカルLLM';
  }

  async getParameterDefinitions() {
    // Fetch installed models dynamically
    let modelOptions = [{ value: '', label: 'モデルを選択...' }];
    
    try {
      const models = await window.electronAPI.modelList();
      modelOptions = [
        { value: '', label: 'モデルを選択...' },
        ...models.map(m => ({
          value: m.path,
          label: `${m.name} (${m.sizeFormatted})`
        }))
      ];
    } catch (error) {
      console.error('Failed to load models:', error);
    }

    return [
      {
        name: 'selectedModel',
        type: 'select',
        label: 'モデル',
        options: modelOptions,
        default: ''
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
        default: 2048,
        min: 1,
        max: 4096
      },
      {
        name: 'systemPrompt',
        type: 'textarea',
        label: 'システムプロンプト',
        default: 'You are a helpful AI assistant.'
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

    // Check if model is selected
    if (!this.parameters.selectedModel) {
      throw new Error('モデルが選択されていません。ノードのパラメータでモデルを選択してください。');
    }

    // Auto-load model if needed
    const currentModel = await window.electronAPI.modelCurrent();
    
    // Load selected model if different or not loaded
    if (!currentModel.isLoaded || currentModel.modelPath !== this.parameters.selectedModel) {
      console.log(`Loading model: ${this.parameters.selectedModel}`);
      
      try {
        const loadResult = await window.electronAPI.modelLoad(this.parameters.selectedModel);
        if (!loadResult.success) {
          throw new Error(`モデルのロードに失敗しました: ${loadResult.error || '不明なエラー'}`);
        }
        console.log('Model loaded successfully');
      } catch (error) {
        throw new Error(`モデルのロードエラー: ${error.message}`);
      }
    }

    // Combine system prompt and user prompt
    const fullPrompt = this.parameters.systemPrompt 
      ? `${this.parameters.systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`
      : `User: ${prompt}\n\nAssistant:`;

    // Execute prompt using loaded model
    const result = await window.electronAPI.modelPrompt(fullPrompt, {
      temperature: parseFloat(this.parameters.temperature),
      maxTokens: parseInt(this.parameters.max_tokens),
      stopSequences: ['\n\nUser:', '\nUser:']
    });

    if (!result.success) {
      throw new Error(`LLM実行エラー: ${result.error || '不明なエラー'}`);
    }

    // Extract and clean response
    let aiResponse = result.response || '';
    
    // Remove potential "Assistant:" prefix if present
    aiResponse = aiResponse.replace(/^Assistant:\s*/i, '').trim();

    return {
      prompt,
      response: aiResponse,
      model: this.parameters.selectedModel,
      parameters: {
        temperature: this.parameters.temperature,
        max_tokens: this.parameters.max_tokens
      },
      timestamp: new Date().toISOString()
    };
  }

  validate() {
    return true; // Validation happens at execution time
  }
}

// Register the node type
if (typeof window !== 'undefined' && window.nodeRegistry) {
  window.nodeRegistry.register('local-llm', LocalLLMNode, {
    displayName: 'ローカルLLM',
    description: 'ローカルにロードされたGGUFモデルを使用してテキスト生成を行います',
    category: 'ai'
  });
}
