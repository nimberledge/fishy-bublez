const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Ripple {
    constructor(x, y, maxRadius = Infinity, expandSpeed = 2, fadeSpeed = 0.015, hue = 0, delay = 0) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = maxRadius;
        this.expandSpeed = expandSpeed;
        this.fadeSpeed = fadeSpeed;
        this.hue = hue;
        this.delay = delay;
        this.alpha = 1;
        this.done = false;
    }

    update() {
        if (this.delay > 0) {
            this.delay--;
            return;
        }
        this.radius += this.expandSpeed;
        this.alpha -= this.fadeSpeed;
        if (this.alpha <= 0) {
            this.done = true;
        }
    }

    draw() {
        if (this.delay > 0) return; // don't draw until delay is over
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = `hsl(${this.hue}, 30%, 80%)`; // subtle hue tint for ripples
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
    }
}

class Bubble {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.vx = 0;
        this.vy = -2; // float upward
        this.growing = true;
        this.maxRadius = 80;
        // Random glimmer offset for variety
        this.glimmerOffsetX = (Math.random() - 0.5) * 0.4; // -0.2 to 0.2
        this.glimmerOffsetY = (Math.random() - 0.5) * 0.4;
        this.popped = false;
        // Random hue for colorful bubbles
        this.hue = Math.random() * 360;
    }

    draw() {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        // Create radial gradient for glimmer effect with random offset and hue
        const offsetX = this.radius * this.glimmerOffsetX;
        const offsetY = this.radius * this.glimmerOffsetY;
        const gradient = ctx.createRadialGradient(
            this.x + offsetX, this.y + offsetY, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 90%, 0.6)`); // bright center with hue, more transparent
        gradient.addColorStop(0.7, `hsla(${this.hue}, 70%, 70%, 0.4)`); // mid tone, transparent
        gradient.addColorStop(1, `hsla(${this.hue}, 50%, 50%, 0.1)`); // darker edge, very transparent
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = `hsla(${this.hue}, 60%, 40%, 0.2)`; // darker stroke, more transparent
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    update() {
        if (this.growing) {
            this.radius += 0.5;
            if (this.radius >= this.maxRadius) {
                this.popped = true; // burst if too big
            }
        } else {
            this.x += this.vx;
            this.y += this.vy;
            // Slowly cycle hue through HSL space
            this.hue += 0.1;
            if (this.hue >= 360) this.hue -= 360;
            // bounce off screen edges with full energy conservation
            if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
                this.vx = -this.vx;
            }
            if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
                this.vy = -this.vy;
            }
        }
    }
}

let bubbles = [];
let growingBubble = null;
let ripples = [];

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    let popped = false;
    // Check if touching an existing bubble to pop it
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(x - b.x, y - b.y);
        if (dist <= b.radius) {
            ripples.push(
                new Ripple(b.x, b.y, Infinity, 3, 0.01, b.hue, 0),
                new Ripple(b.x, b.y, Infinity, 3, 0.01, b.hue, 15),
                new Ripple(b.x, b.y, Infinity, 3, 0.01, b.hue, 30)
            ); // three larger pop ripples with matching hue, staggered delays
            bubbles.splice(i, 1);
            popped = true;
            break;
        }
    }
    if (!popped && !growingBubble) {
        growingBubble = new Bubble(x, y);
        bubbles.push(growingBubble);
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (growingBubble) {
        growingBubble.radius += 0.5;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (growingBubble) {
        growingBubble.growing = false;
        growingBubble.vx = (Math.random() - 0.5) * 2; // small random horizontal drift
        growingBubble = null;
    }
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw water-like background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, 'lightblue');
    bgGradient.addColorStop(1, 'deepskyblue');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Update and draw ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.update();
        if (r.done) {
            ripples.splice(i, 1);
        } else {
            r.draw();
        }
    }
    // Update and draw bubbles
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.update();
        if (b.popped) {
            ripples.push(
                new Ripple(b.x, b.y, Infinity, 3, 0.01, b.hue, 0),
                new Ripple(b.x, b.y, Infinity, 3, 0.01, b.hue, 15),
                new Ripple(b.x, b.y, Infinity, 3, 0.01, b.hue, 30)
            ); // three larger pop ripples with matching hue, staggered delays
            bubbles.splice(i, 1);
        } else {
            b.draw();
        }
    }
    requestAnimationFrame(animate);
}

animate();