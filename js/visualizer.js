/**
 * Visualizer
 */
class Visualizer {
    constructor(canvas, audioManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioManager = audioManager;
        this.mode = 'bars';
        this.animationId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    start() {
        if (!this.animationId) this.animate();
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        const width = this.canvas.width;
        const height = this.canvas.height;
        this.ctx.clearRect(0, 0, width, height);

        if (!this.audioManager.analyser) return;

        const bufferLength = this.audioManager.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        if (this.mode === 'wave') {
            this.audioManager.analyser.getByteTimeDomainData(dataArray);
            this.drawWave(width, height, dataArray, bufferLength);
        } else {
            this.audioManager.analyser.getByteFrequencyData(dataArray);
            this.drawBars(width, height, dataArray, bufferLength);
        }
    }

    drawBars(width, height, data, bufferLength) {
        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = data[i] / 2;
            const gradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.8)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    drawWave(width, height, data, bufferLength) {
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
        this.ctx.beginPath();
        const sliceWidth = width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = data[i] / 128.0;
            const y = v * height / 2;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
            x += sliceWidth;
        }
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
    }

    toggleMode() {
        this.mode = this.mode === 'bars' ? 'wave' : 'bars';
    }
}
