/**
 * Canvas - Main workspace for the node editor
 */
class Canvas {
  constructor(canvasElement, nodesLayerElement) {
    this.canvas = canvasElement;
    this.nodesLayer = nodesLayerElement;
    this.ctx = canvasElement.getContext('2d');
    
    this.offset = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    
    this.isConnecting = false;
    this.connectionStart = null;
    this.connectionEnd = { x: 0, y: 0 };
    
    this.resize();
    this.setupEventListeners();
  }

  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.render();
  }

  setupEventListeners() {
    // Canvas panning
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        // Middle click or Shift+Left click for panning
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.canvas.classList.add('dragging');
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        
        this.offset.x += dx;
        this.offset.y += dy;
        
        this.dragStart = { x: e.clientX, y: e.clientY };
        
        this.updateNodesLayerTransform();
        this.render();
      }
      
      if (this.isConnecting) {
        const rect = this.canvas.getBoundingClientRect();
        this.connectionEnd = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        this.render();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.classList.remove('dragging');
    });

    // Zoom with mouse wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(2.0, this.zoom * zoomDelta));
      
      // Zoom towards mouse position
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const worldX = (mouseX - this.offset.x) / this.zoom;
      const worldY = (mouseY - this.offset.y) / this.zoom;
      
      this.zoom = newZoom;
      
      this.offset.x = mouseX - worldX * this.zoom;
      this.offset.y = mouseY - worldY * this.zoom;
      
      this.updateNodesLayerTransform();
      this.render();
    });

    // Resize canvas when window resizes
    window.addEventListener('resize', () => this.resize());
  }

  updateNodesLayerTransform() {
    this.nodesLayer.style.transform = `translate(${this.offset.x}px, ${this.offset.y}px) scale(${this.zoom})`;
    this.nodesLayer.style.transformOrigin = '0 0';
  }

  startConnection(fromNode, fromPort, startX, startY) {
    this.isConnecting = true;
    this.connectionStart = {
      nodeId: fromNode,
      port: fromPort,
      x: startX,
      y: startY
    };
    this.connectionEnd = { x: startX, y: startY };
  }

  endConnection(toNode, toPort) {
    const result = {
      from: {
        nodeId: this.connectionStart.nodeId,
        port: this.connectionStart.port
      },
      to: {
        nodeId: toNode,
        port: toPort
      }
    };
    
    this.isConnecting = false;
    this.connectionStart = null;
    this.render();
    
    return result;
  }

  cancelConnection() {
    this.isConnecting = false;
    this.connectionStart = null;
    this.render();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw temporary connection line if connecting
    if (this.isConnecting && this.connectionStart) {
      this.drawConnection(
        this.connectionStart.x,
        this.connectionStart.y,
        this.connectionEnd.x,
        this.connectionEnd.y,
        '#3b82f6',
        2
      );
    }
  }

  drawConnectionBetweenNodes(fromX, fromY, toX, toY, color = '#60a5fa', width = 2) {
    // Transform to canvas coordinates
    const startX = fromX * this.zoom + this.offset.x;
    const startY = fromY * this.zoom + this.offset.y;
    const endX = toX * this.zoom + this.offset.x;
    const endY = toY * this.zoom + this.offset.y;
    
    this.drawConnection(startX, startY, endX, endY, color, width);
  }

  drawConnection(startX, startY, endX, endY, color, width) {
    const ctx = this.ctx;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    
    // Calculate control points for bezier curve
    const dx = endX - startX;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 100);
    
    const cp1x = startX + controlPointOffset;
    const cp1y = startY;
    const cp2x = endX - controlPointOffset;
    const cp2y = endY;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();
  }

  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.offset.x) / this.zoom,
      y: (screenY - this.offset.y) / this.zoom
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.zoom + this.offset.x,
      y: worldY * this.zoom + this.offset.y
    };
  }
}

// Make Canvas available globally
if (typeof window !== 'undefined') {
  window.Canvas = Canvas;
}
