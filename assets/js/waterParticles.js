const canvas = document.getElementById('water-canvas');
const ctx = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
const padding = 20;

let mouse = { x: 0, y: 0, active: false };

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

mouse.active = true;

// Particle setup
const NUM = 800;
const particles = [];
for (let i = 0; i < NUM; i++) {
  particles.push({
    x: Math.random() * (w - 2 * padding) + padding,
    y: Math.random() * (h / 2) + padding,
    vx: (Math.random() - 0.5) * 0.1,
    vy: (Math.random() - 0.5) * 0.1,
    r: 11
  });
}

// Physics constants
const gravity = 0.35;
const bounce = 0.6;
const friction = 0.995;
const interaction = 0.15;
const slothStrength = 0.03;
const maxSpeed = 10; // max speed clamp


// Scroll interaction (vertical + waves)
let lastScroll = window.scrollY;
window.addEventListener('scroll', () => {
    const scrollAccel = window.scrollY - lastScroll;
    lastScroll = window.scrollY;

    particles.forEach(p => { 
        // Stronger vertical reaction to scroll
        p.vy += -scrollAccel * 0.3; // increase from 0.001
        // Add horizontal slosh proportional to vertical movement
        p.vx += (-scrollAccel * 0.5) * (Math.random() - 0.5);
    });
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, w, h);

    // Particle physics
    for (let i = 0; i < NUM; i++) {
        let p = particles[i];

        // gravity
        p.vy += gravity;

        // horizontal sloshing (random small movement)
        p.vx += (Math.random() - 0.5) * slothStrength;

        // clamp max speed
        const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            p.vx *= scale;
            p.vy *= scale;
        }

        // motion
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= friction;
        p.vy *= friction;

        // wall collisions
        if (p.x - p.r < padding) { p.x = padding + p.r; p.vx *= -bounce; }
        if (p.x + p.r > w - padding) { p.x = w - padding - p.r; p.vx *= -bounce; }
        if (p.y - p.r < padding) { p.y = padding + p.r; p.vy *= -bounce; }
        if (p.y + p.r > h - padding) { 
            p.y = h - padding - p.r; 
            p.vy *= -bounce * 0.5; // dampen to reduce spasms
            p.vx *= 0.7; // horizontal friction at bottom
        }
    }
	if (mouse.active) {
		const radius = 100; // how far the click affects particles
		const strength = 20; // how strongly particles are pushed away

		particles.forEach(p => {
			const dx = p.x - mouse.x;
			const dy = p.y - mouse.y;
			const dist = Math.sqrt(dx*dx + dy*dy);

			if (dist < radius && dist > 0) {
				const force = (radius - dist) / radius * strength;
				const nx = dx / dist;
				const ny = dy / dist;
				p.vx += nx * force;
				p.vy += ny * force;
			}
		});
	}
    // Particle–particle repulsion
    for (let i = 0; i < NUM; i++) {
        for (let j = i + 1; j < NUM; j++) {
            const p1 = particles[i], p2 = particles[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const minDist = p1.r + p2.r;
            if (dist < minDist && dist > 0) {
                let overlap = (minDist - dist) / 2;
                if (overlap > 0.5) overlap = 0.5;
                const nx = dx / dist;
                const ny = dy / dist;
                p1.x -= nx * overlap;
                p1.y -= ny * overlap;
                p2.x += nx * overlap;
                p2.y += ny * overlap;

                p1.vx -= nx * interaction;
                p1.vy -= ny * interaction;
                p2.vx += nx * interaction;
                p2.vy += ny * interaction;
            }
        }
    }

    // Draw particles
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(50,150,255,0.9)';
        ctx.fill();
    });
}
animate();

// Resize handling
window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
});