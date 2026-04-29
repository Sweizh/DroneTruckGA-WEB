/**
 * Canvas 地图可视化 - 支持 DPI 缩放
 */

class MapCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        
        this.offset = { x: 0, y: 0 };
        this.scale = 1;
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        
        this.depots = [];
        this.customers = [];
        this.launchPoints = [];
        this.truckRoutes = [];
        this.droneRoutes = [];
        
        this.initEvents();
        this.resize();
    }
    
    getColors() {
        const style = getComputedStyle(document.documentElement);
        const isDark = style.getPropertyValue('--bg-primary').trim().startsWith('#0');
        return {
            depot: '#f43f5e',
            customer: '#3b82f6',
            launchPoint: '#10b981',
            truckRoute: 'rgba(59, 130, 246, 0.6)',
            droneRoute: 'rgba(249, 115, 22, 0.5)',
            grid: isDark ? 'rgba(30, 58, 95, 0.4)' : 'rgba(226, 232, 240, 0.8)',
            text: style.getPropertyValue('--text-muted').trim() || '#64748b',
            bg: style.getPropertyValue('--bg-input').trim() || '#0f1724'
        };
    }
    
    initEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resize(), 100);
        });
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const w = rect.width || 800;
        const h = rect.height || 350;
        
        // 设置 canvas 实际像素尺寸（考虑 DPI）
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        
        // 设置 canvas 显示尺寸
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        
        // 缩放上下文以匹配 DPI
        this.ctx.scale(this.dpr, this.dpr);
        
        if (this.depots.length > 0 || this.customers.length > 0) {
            this.fitToContent();
        }
        this.render();
    }
    
    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }
    
    onMouseMove(e) {
        if (this.isDragging) {
            this.offset.x += e.clientX - this.lastMouse.x;
            this.offset.y += e.clientY - this.lastMouse.y;
            this.lastMouse = { x: e.clientX, y: e.clientY };
            this.render();
        }
    }
    
    onMouseUp() {
        this.isDragging = false;
    }
    
    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(10, this.scale * delta));
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.offset.x = mouseX - (mouseX - this.offset.x) * (newScale / this.scale);
        this.offset.y = mouseY - (mouseY - this.offset.y) * (newScale / this.scale);
        
        this.scale = newScale;
        this.render();
    }
    
    zoomIn() {
        this.scale = Math.min(10, this.scale * 1.2);
        this.render();
    }
    
    zoomOut() {
        this.scale = Math.max(0.1, this.scale / 1.2);
        this.render();
    }
    
    resetView() {
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.fitToContent();
    }
    
    fitToContent() {
        const allPoints = [...this.depots, ...this.customers, ...this.launchPoints];
        if (allPoints.length === 0) return;
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const p of allPoints) {
            const x = p.x !== undefined ? p.x : p[0];
            const y = p.y !== undefined ? p.y : p[1];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
        
        const displayWidth = this.canvas.width / this.dpr;
        const displayHeight = this.canvas.height / this.dpr;
        const padding = 50;
        const rangeX = maxX - minX || 100;
        const rangeY = maxY - minY || 100;
        
        const scaleX = (displayWidth - padding * 2) / rangeX;
        const scaleY = (displayHeight - padding * 2) / rangeY;
        this.scale = Math.min(scaleX, scaleY);
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        this.offset.x = displayWidth / 2 - centerX * this.scale;
        this.offset.y = displayHeight / 2 + centerY * this.scale;
    }
    
    worldToScreen(x, y) {
        return {
            x: x * this.scale + this.offset.x,
            y: -y * this.scale + this.offset.y
        };
    }
    
    setData(data) {
        this.depots = data.depots || [];
        this.customers = data.customers || [];
        this.launchPoints = data.launchPoints || [];
        this.truckRoutes = data.truckRoutes || [];
        this.droneRoutes = data.droneRoutes || [];
        
        this.fitToContent();
        this.render();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const colors = this.getColors();
        const displayWidth = this.canvas.width / this.dpr;
        const displayHeight = this.canvas.height / this.dpr;
        
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 0.5;
        
        const gridSize = 10;
        
        for (let x = -100; x <= 200; x += gridSize) {
            const p = this.worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(p.x, 0);
            ctx.lineTo(p.x, displayHeight);
            ctx.stroke();
        }
        
        for (let y = -100; y <= 200; y += gridSize) {
            const p = this.worldToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(0, p.y);
            ctx.lineTo(displayWidth, p.y);
            ctx.stroke();
        }
    }
    
    drawDepot(depot) {
        const ctx = this.ctx;
        const colors = this.getColors();
        const p = this.worldToScreen(depot.x, depot.y);
        const size = 28;
        
        ctx.fillStyle = colors.depot;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('W' + depot.id, p.x, p.y);
    }
    
    drawCustomer(customer) {
        const ctx = this.ctx;
        const colors = this.getColors();
        const p = this.worldToScreen(customer.x, customer.y);
        const radius = 10;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.customer;
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(customer.id, p.x, p.y);
    }
    
    drawLaunchPoint(lp, index) {
        const ctx = this.ctx;
        const colors = this.getColors();
        const x = lp.x !== undefined ? lp.x : lp[0];
        const y = lp.y !== undefined ? lp.y : lp[1];
        const p = this.worldToScreen(x, y);
        const size = 10;
        
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - size);
        ctx.lineTo(p.x - size, p.y + size / 2);
        ctx.lineTo(p.x + size, p.y + size / 2);
        ctx.closePath();
        ctx.fillStyle = colors.launchPoint;
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('L' + (index + 1), p.x, p.y + 1);
    }
    
    drawRoute(points, color, dashed = true) {
        if (points.length < 2) return;
        
        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        
        if (dashed) {
            ctx.setLineDash([5, 5]);
        } else {
            ctx.setLineDash([]);
        }
        
        ctx.beginPath();
        const first = this.worldToScreen(points[0].x, points[0].y);
        ctx.moveTo(first.x, first.y);
        
        for (let i = 1; i < points.length; i++) {
            const p = this.worldToScreen(points[i].x, points[i].y);
            ctx.lineTo(p.x, p.y);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    render() {
        const ctx = this.ctx;
        const displayWidth = this.canvas.width / this.dpr;
        const displayHeight = this.canvas.height / this.dpr;
        const colors = this.getColors();
        
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        this.drawGrid();
        
        for (const route of this.truckRoutes) {
            this.drawRoute(route, colors.truckRoute, true);
        }
        
        for (const route of this.droneRoutes) {
            this.drawRoute(route, colors.droneRoute, true);
        }
        
        for (const depot of this.depots) {
            this.drawDepot(depot);
        }
        
        for (const customer of this.customers) {
            this.drawCustomer(customer);
        }
        
        for (let i = 0; i < this.launchPoints.length; i++) {
            this.drawLaunchPoint(this.launchPoints[i], i);
        }
    }
}

/**
 * 收敛曲线图表 - 支持 DPI 缩放
 */
class ChartCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.data = [];
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resize(), 100);
        });
        
        // 延迟初始化，确保父容器有尺寸
        setTimeout(() => this.resize(), 100);
    }
    
    resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;
        
        const rect = parent.getBoundingClientRect();
        // 减去边框和内边距
        const w = (rect.width - 2) || 600;  // 减去 border
        const h = 280;
        
        // 设置 canvas 实际像素尺寸（考虑 DPI）
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        
        // 设置 canvas 显示尺寸
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        
        // 缩放上下文以匹配 DPI
        this.ctx.scale(this.dpr, this.dpr);
        
        if (this.data.length > 0) {
            this.render();
        } else {
            this.renderEmpty();
        }
    }
    
    setData(history) {
        this.data = history;
        this.render();
    }
    
    renderEmpty() {
        const ctx = this.ctx;
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;
        
        const style = getComputedStyle(document.documentElement);
        const bgInput = style.getPropertyValue('--bg-input').trim() || '#0f1724';
        const textMuted = style.getPropertyValue('--text-muted').trim() || '#64748b';
        
        ctx.fillStyle = bgInput;
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = textMuted;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('暂无数据', w / 2, h / 2);
    }
    
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        
        const style = getComputedStyle(document.documentElement);
        const bgInput = style.getPropertyValue('--bg-input').trim() || '#0f1724';
        const borderColor = style.getPropertyValue('--border-primary').trim() || '#1e3a5f';
        const textMuted = style.getPropertyValue('--text-muted').trim() || '#64748b';
        const accentColor = style.getPropertyValue('--accent').trim() || '#3b82f6';
        
        ctx.fillStyle = bgInput;
        ctx.fillRect(0, 0, w, h);
        
        if (this.data.length === 0) {
            ctx.fillStyle = textMuted;
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('暂无数据', w / 2, h / 2);
            return;
        }
        
        const plotW = w - padding.left - padding.right;
        const plotH = h - padding.top - padding.bottom;
        
        const minX = 0;
        const maxX = this.data.length - 1;
        const minY = Math.min(...this.data);
        const maxY = Math.max(...this.data);
        
        const rangeX = maxX - minX || 1;
        const rangeY = (maxY - minY) * 1.1 || 1;
        const adjustedMinY = minY - (rangeY * 0.05);
        
        // 网格和Y轴标签
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 0.5;
        
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const y = padding.top + (plotH / yTicks) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
            
            const value = maxY + (rangeY * 0.05) - (rangeY / yTicks) * i;
            ctx.fillStyle = textMuted;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toFixed(1), padding.left - 8, y);
        }
        
        // X轴标签
        const xTicks = Math.min(5, this.data.length - 1);
        for (let i = 0; i <= xTicks; i++) {
            const x = padding.left + (plotW / xTicks) * i;
            
            ctx.beginPath();
            ctx.strokeStyle = borderColor;
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, h - padding.bottom);
            ctx.stroke();
            
            const value = Math.round(minX + (rangeX / xTicks) * i);
            ctx.fillStyle = textMuted;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(value, x, h - padding.bottom + 8);
        }
        
        // 数据区域渐变填充
        const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
        gradient.addColorStop(0, accentColor + '40');
        gradient.addColorStop(1, accentColor + '05');
        
        ctx.beginPath();
        ctx.moveTo(padding.left, h - padding.bottom);
        
        for (let i = 0; i < this.data.length; i++) {
            const x = padding.left + ((i - minX) / rangeX) * plotW;
            const y = padding.top + ((maxY + (rangeY * 0.05) - this.data[i]) / rangeY) * plotH;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(padding.left + plotW, h - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 数据线
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        for (let i = 0; i < this.data.length; i++) {
            const x = padding.left + ((i - minX) / rangeX) * plotW;
            const y = padding.top + ((maxY + (rangeY * 0.05) - this.data[i]) / rangeY) * plotH;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        
        // 轴标签
        ctx.fillStyle = textMuted;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('迭代次数', w / 2, h - 10);
        
        ctx.save();
        ctx.translate(15, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('有效时间 (min)', 0, -10);
        ctx.restore();
    }
}
