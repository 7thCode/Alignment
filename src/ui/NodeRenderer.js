/**
 * NodeRenderer - Renders nodes in the DOM
 */
class NodeRenderer {
  constructor(nodesLayer, onNodeSelect, onNodeMove, onPortClick) {
    this.nodesLayer = nodesLayer;
    this.onNodeSelect = onNodeSelect;
    this.onNodeMove = onNodeMove;
    this.onPortClick = onPortClick;
    this.nodeElements = new Map();
  }

  async createNodeElement(node) {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'node';
    nodeEl.id = `node-${node.id}`;
    nodeEl.style.left = `${node.position.x}px`;
    nodeEl.style.top = `${node.position.y}px`;
    
    // Header
    const header = document.createElement('div');
    header.className = 'node-header';
    
    const title = document.createElement('div');
    title.className = 'node-title';
    title.textContent = node.getDisplayName();
    
    const status = document.createElement('div');
    status.className = 'node-status';
    status.id = `status-${node.id}`;
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'node-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'ノードを削除';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`ノード "${node.getDisplayName()}" を削除しますか？`)) {
        const connectionRenderer = window.connectionRenderer;
        const workflowEngine = window.workflowEngine;
        
        // Find and remove all connections related to this node
        const connectionsToRemove = [];
        connectionRenderer.connections.forEach((connData, connId) => {
          if (connData.connection.from.nodeId === node.id || 
              connData.connection.to.nodeId === node.id) {
            connectionsToRemove.push(connId);
          }
        });
        
        // Remove connections from ConnectionRenderer
        connectionsToRemove.forEach(connId => {
          connectionRenderer.removeConnection(connId);
        });
        
        // Remove from workflow engine (this also removes connections)
        workflowEngine.removeNode(node.id);
        
        // Remove node from renderer
        this.removeNode(node.id);
        
        // Re-render remaining connections
        connectionRenderer.render();
        
        console.log(`Deleted node: ${node.id} and ${connectionsToRemove.length} related connections`);
      }
    });
    
    header.appendChild(title);
    header.appendChild(status);
    header.appendChild(deleteBtn);
    
    // Make header draggable
    header.addEventListener('mousedown', (e) => this.handleDragStart(e, node, nodeEl));
    
    // Body
    const body = document.createElement('div');
    body.className = 'node-body';
    
    // Input ports
    if (node.inputs && node.inputs.length > 0) {
      const portsDiv = document.createElement('div');
      portsDiv.className = 'node-ports';
      
      node.inputs.forEach((inputName) => {
        const portDiv = document.createElement('div');
        portDiv.className = 'node-port';
        
        const port = document.createElement('div');
        port.className = 'port input';
        port.dataset.nodeId = node.id;
        port.dataset.port = inputName;
        port.dataset.direction = 'input';
        
        port.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onPortClick) {
            const rect = port.getBoundingClientRect();
            const canvasRect = document.getElementById('canvas').getBoundingClientRect();
            const x = rect.left - canvasRect.left;
            const y = rect.top + rect.height / 2 - canvasRect.top;
            this.onPortClick(node.id, inputName, 'input', x, y);
          }
        });
        
        const label = document.createElement('span');
        label.textContent = inputName;
        
        portDiv.appendChild(port);
        portDiv.appendChild(label);
        portsDiv.appendChild(portDiv);
      });
      
      body.appendChild(portsDiv);
    }
    
    // Parameters - await if async
    const paramDefsResult = node.getParameterDefinitions();
    const paramDefs = paramDefsResult instanceof Promise ? await paramDefsResult : paramDefsResult;
    
    if (paramDefs && paramDefs.length > 0) {
      paramDefs.forEach((paramDef) => {
        const paramDiv = this.createParameterInput(node, paramDef);
        body.appendChild(paramDiv);
      });
    }
    
    // Output ports
    if (node.outputs && node.outputs.length > 0) {
      const portsDiv = document.createElement('div');
      portsDiv.className = 'node-ports';
      portsDiv.style.marginTop = '8px';
      
      node.outputs.forEach((outputName) => {
        const portDiv = document.createElement('div');
        portDiv.className = 'node-port';
        portDiv.style.justifyContent = 'flex-end';
        
        const label = document.createElement('span');
        label.textContent = outputName;
        
        const port = document.createElement('div');
        port.className = 'port output';
        port.dataset.nodeId = node.id;
        port.dataset.port = outputName;
        port.dataset.direction = 'output';
        
        port.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onPortClick) {
            const rect = port.getBoundingClientRect();
            const canvasRect = document.getElementById('canvas').getBoundingClientRect();
            const x = rect.right - canvasRect.left;
            const y = rect.top + rect.height / 2 - canvasRect.top;
            this.onPortClick(node.id, outputName, 'output', x, y);
          }
        });
        
        portDiv.appendChild(label);
        portDiv.appendChild(port);
        portsDiv.appendChild(portDiv);
      });
      
      body.appendChild(portsDiv);
    }
    
    nodeEl.appendChild(header);
    nodeEl.appendChild(body);
    
    // Make node selectable
    nodeEl.addEventListener('click', (e) => {
      if (e.target === nodeEl || e.target.closest('.node-header')) {
        if (this.onNodeSelect) {
          this.onNodeSelect(node.id);
        }
      }
    });
    
    return nodeEl;
  }

  createParameterInput(node, paramDef) {
    const paramDiv = document.createElement('div');
    paramDiv.className = 'node-param';
    
    const label = document.createElement('label');
    label.textContent = paramDef.label;
    paramDiv.appendChild(label);
    
    let input;
    
    if (paramDef.type === 'select') {
      input = document.createElement('select');
      paramDef.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        input.appendChild(option);
      });
      input.value = node.parameters[paramDef.name] || paramDef.default;
    } else if (paramDef.type === 'textarea') {
      input = document.createElement('textarea');
      input.value = node.parameters[paramDef.name] || paramDef.default || '';
    } else if (paramDef.type === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.value = node.parameters[paramDef.name] || paramDef.default || 0;
      if (paramDef.min !== undefined) input.min = paramDef.min;
      if (paramDef.max !== undefined) input.max = paramDef.max;
      if (paramDef.step !== undefined) input.step = paramDef.step;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = node.parameters[paramDef.name] || paramDef.default || '';
    }
    
    input.addEventListener('input', (e) => {
      node.parameters[paramDef.name] = e.target.value;
    });
    
    paramDiv.appendChild(input);
    return paramDiv;
  }

  handleDragStart(e, node, nodeEl) {
    e.preventDefault();
    let isDragging = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = node.position.x;
    const startPosY = node.position.y;
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      node.position.x = startPosX + dx;
      node.position.y = startPosY + dy;
      
      nodeEl.style.left = `${node.position.x}px`;
      nodeEl.style.top = `${node.position.y}px`;
      
      if (this.onNodeMove) {
        this.onNodeMove(node.id);
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  async renderNode(node) {
    if (this.nodeElements.has(node.id)) {
      this.updateNode(node);
      return;
    }
    
    const nodeEl = await this.createNodeElement(node);
    this.nodesLayer.appendChild(nodeEl);
    this.nodeElements.set(node.id, nodeEl);
  }

  updateNode(node) {
    const nodeEl = this.nodeElements.get(node.id);
    if (!nodeEl) return;
    
    // Update position
    nodeEl.style.left = `${node.position.x}px`;
    nodeEl.style.top = `${node.position.y}px`;
    
    // Update status
    const statusEl = nodeEl.querySelector(`#status-${node.id}`);
    if (statusEl) {
      statusEl.className = `node-status ${node.status}`;
    }
    
    // Update selected state
    if (node.selected) {
      nodeEl.classList.add('selected');
    } else {
      nodeEl.classList.remove('selected');
    }
    
    // Update executing state
    if (node.status === 'executing') {
      nodeEl.classList.add('executing');
    } else {
      nodeEl.classList.remove('executing');
    }
  }

  removeNode(nodeId) {
    const nodeEl = this.nodeElements.get(nodeId);
    if (nodeEl) {
      nodeEl.remove();
      this.nodeElements.delete(nodeId);
    }
  }

  updatePortConnection(nodeId, port, direction, isConnected) {
    const nodeEl = this.nodeElements.get(nodeId);
    if (!nodeEl) return;
    
    const portEl = nodeEl.querySelector(`.port.${direction}[data-port="${port}"]`);
    if (portEl) {
      if (isConnected) {
        portEl.classList.add('connected');
      } else {
        portEl.classList.remove('connected');
      }
    }
  }
}

// Make NodeRenderer available globally
if (typeof window !== 'undefined') {
  window.NodeRenderer = NodeRenderer;
}
