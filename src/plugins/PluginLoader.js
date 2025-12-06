/**
 * Plugin Loader
 * Loads custom node plugins from the plugins directory
 */
class PluginLoader {
  constructor(nodeRegistry) {
    this.nodeRegistry = nodeRegistry;
    this.loadedPlugins = new Map();
  }

  /**
   * Load a plugin from code
   * @param {string} pluginCode - JavaScript code for the plugin
   * @param {string} pluginName - Name of the plugin
   */
  loadPlugin(pluginCode, pluginName) {
    try {
      // Create a safe execution context
      const sandbox = {
        Node: window.Node,
        console: console
      };
      
      // Execute plugin code in sandbox
      const func = new Function(...Object.keys(sandbox), pluginCode + '\nreturn module.exports;');
      const plugin = func(...Object.values(sandbox));
      
      if (!plugin || !plugin.nodeType || !plugin.nodeClass) {
        throw new Error('Invalid plugin format: must export nodeType and nodeClass');
      }
      
      // Register the plugin node type
      this.nodeRegistry.register(
        plugin.nodeType,
        plugin.nodeClass,
        {
          displayName: plugin.displayName || plugin.nodeType,
          description: plugin.description || '',
          category: 'custom'
        }
      );
      
      this.loadedPlugins.set(pluginName, plugin);
      console.log(`Loaded plugin: ${pluginName} (${plugin.nodeType})`);
      
      return true;
    } catch (error) {
      console.error(`Failed to load plugin ${pluginName}:`, error);
      alert(`プラグインの読み込みに失敗しました: ${pluginName}\n${error.message}`);
      return false;
    }
  }

  /**
   * Unload a plugin
   * @param {string} pluginName
   */
  unloadPlugin(pluginName) {
    const plugin = this.loadedPlugins.get(pluginName);
    if (plugin) {
      this.nodeRegistry.unregister(plugin.nodeType);
      this.loadedPlugins.delete(pluginName);
      console.log(`Unloaded plugin: ${pluginName}`);
      return true;
    }
    return false;
  }

  /**
   * Get all loaded plugins
   * @returns {Array<{name: string, nodeType: string, displayName: string}>}
   */
  getLoadedPlugins() {
    const plugins = [];
    this.loadedPlugins.forEach((plugin, name) => {
      plugins.push({
        name,
        nodeType: plugin.nodeType,
        displayName: plugin.displayName || plugin.nodeType
      });
    });
    return plugins;
  }
}

// Make PluginLoader available globally
if (typeof window !== 'undefined') {
  window.PluginLoader = PluginLoader;
}
