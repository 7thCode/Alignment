/**
 * User Input Node
 * Accepts text input from the user and outputs it as data
 */
class UserInputNode extends Node {
  constructor(id, position) {
    super(id, 'user-input', position);
    this.inputs = []; // No inputs
    this.outputs = ['output'];
    this.parameters = {
      inputText: '',
      label: 'User Input'
    };
  }

  getDisplayName() {
    return 'ユーザー入力';
  }

  getParameterDefinitions() {
    return [
      {
        name: 'label',
        type: 'text',
        label: 'ラベル',
        default: 'User Input'
      },
      {
        name: 'inputText',
        type: 'textarea',
        label: '入力テキスト',
        default: ''
      }
    ];
  }

  async execute(inputData) {
    // Simply return the user's input text as JSON
    return {
      text: this.parameters.inputText,
      timestamp: new Date().toISOString()
    };
  }

  validate() {
    return this.parameters.inputText && this.parameters.inputText.trim().length > 0;
  }
}

// Register the node type
if (typeof window !== 'undefined' && window.nodeRegistry) {
  window.nodeRegistry.register('user-input', UserInputNode, {
    displayName: 'ユーザー入力',
    description: 'テキストを入力して下流のノードに渡します',
    category: 'input'
  });
}
