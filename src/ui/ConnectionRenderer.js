/**
 * ConnectionRenderer - Manages rendering of connections between nodes
 */
class ConnectionRenderer {
  constructor(canvas, nodeRenderer, onConnectionDelete) {
    this.canvas = canvas;
    this.nodeRenderer = nodeRenderer;
    this.onConnectionDelete = onConnectionDelete;
    this.connections = new Map();
    this.svgElement = null;
    this.createSVGLayer();
  }

  createSVGLayer() {
    // Create SVG element for connections
    this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgElement.id = 'connections-svg';
    this.svgElement.style.position = 'absolute';
    this.svgElement.style.top = '0';
    this.svgElement.style.left = '0';
    this.svgElement.style.width = '100%';
    this.svgElement.style.height = '100%';
    this.svgElement.style.pointerEvents = 'none';
    this.svgElement.style.zIndex = '1';
    
    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.appendChild(this.svgElement);
  }

  addConnection(connection, fromNode, toNode) {
    this.connections.set(connection.id, {
      connection,
      fromNode,
      toNode,
      pathElement: null
    });
    
    // Update port visual state
    this.nodeRenderer.updatePortConnection(
      connection.from.nodeId,
      connection.from.port,
      'output',
      true
    );
    this.nodeRenderer.updatePortConnection(
      connection.to.nodeId,
      connection.to.port,
      'input',
      true
    );
  }

  removeConnection(connectionId) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      // Remove SVG path element
      if (conn.pathElement && conn.pathElement.parentNode) {
        conn.pathElement.parentNode.removeChild(conn.pathElement);
      }
      
      // Update port visual state
      this.nodeRenderer.updatePortConnection(
        conn.connection.from.nodeId,
        conn.connection.from.port,
        'output',
        false
      );
      this.nodeRenderer.updatePortConnection(
        conn.connection.to.nodeId,
        conn.connection.to.port,
        'input',
        false
      );
      
      this.connections.delete(connectionId);
    }
  }

  render() {
    // Clear all existing paths
    while (this.svgElement.firstChild) {
      this.svgElement.removeChild(this.svgElement.firstChild);
    }
    
    // Draw all connections
    this.connections.forEach((connData, connectionId) => {
      const { connection, fromNode, toNode } = connData;
      
      const fromEl = document.getElementById(`node-${fromNode.id}`);
      const toEl = document.getElementById(`node-${toNode.id}`);
      
      if (!fromEl || !toEl) return;
      
      // Get port positions
      const fromPort = fromEl.querySelector(`.port.output[data-port="${connection.from.port}"]`);
      const toPort = toEl.querySelector(`.port.input[data-port="${connection.to.port}"]`);
      
      if (!fromPort || !toPort) return;
      
      const fromRect = fromPort.getBoundingClientRect();
      const toRect = toPort.getBoundingClientRect();
      const canvasRect = this.canvas.canvas.getBoundingClientRect();
      
      const fromX = fromRect.right - canvasRect.left;
      const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
      const toX = toRect.left - canvasRect.left;
      const toY = toRect.top + toRect.height / 2 - canvasRect.top;
      
      // Create SVG path
      const path = this.createConnectionPath(fromX, fromY, toX, toY, connectionId);
      connData.pathElement = path;
      this.svgElement.appendChild(path);
    });
  }

  createConnectionPath(startX, startY, endX, endY, connectionId) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Calculate bezier curve
    const dx = endX - startX;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 100);
    
    const cp1x = startX + controlPointOffset;
    const cp1y = startY;
    const cp2x = endX - controlPointOffset;
    const cp2y = endY;
    
    const pathData = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', '#60a5fa');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.style.pointerEvents = 'stroke';
    path.style.cursor = 'pointer';
    path.dataset.connectionId = connectionId;
    
    // Add hover effect
    path.addEventListener('mouseenter', () => {
      path.setAttribute('stroke', '#3b82f6');
      path.setAttribute('stroke-width', '3');
    });
    
    path.addEventListener('mouseleave', () => {
      path.setAttribute('stroke', '#60a5fa');
      path.setAttribute('stroke-width', '2');
    });
    
    // Add click to delete
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('この接続を削除しますか？')) {
        if (this.onConnectionDelete) {
          this.onConnectionDelete(connectionId);
        }
      }
    });
    
    return path;
  }

  clear() {
    // Remove all path elements
    this.connections.forEach(connData => {
      if (connData.pathElement && connData.pathElement.parentNode) {
        connData.pathElement.parentNode.removeChild(connData.pathElement);
      }
    });
    this.connections.clear();
  }
}

// Make ConnectionRenderer available globally
if (typeof window !== 'undefined') {
  window.ConnectionRenderer = ConnectionRenderer;
}
