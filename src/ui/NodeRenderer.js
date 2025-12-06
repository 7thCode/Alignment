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

  createNodeElement(node) {
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
    
    header.appendChild(title);
    header.appendChild(status);
    
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
            this.onPortClick(node.id, inputName, 'input', rect.left, rect.top + rect.height / 2);
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
    
    // Parameters
    const paramDefs = node.getParameterDefinitions();
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
            this.onPortClick(node.id, outputName, 'output', rect.right, rect.top + rect.height / 2);
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
    
    // Click to select
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

  renderNode(node) {
    if (this.nodeElements.has(node.id)) {
      this.updateNode(node);
      return;
    }
    
    const nodeEl = this.createNodeElement(node);
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
