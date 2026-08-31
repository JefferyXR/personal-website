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

// ==================================================
// GEAR SIZE SETTINGS
// ==================================================

// These should add up to 100.

const SMALL_PERCENT = 50;
const MEDIUM_PERCENT = 35;
const BIG_PERCENT = 15;

// Gear radius ranges

const SMALL_MIN = 10;
const SMALL_MAX = 20;

const MEDIUM_MIN = 21;
const MEDIUM_MAX = 40;

const BIG_MIN = 41;
const BIG_MAX = 70;

// ==================================================
// GEAR APPEARANCE SETTINGS
// ==================================================

// Minimum and maximum number of teeth.
//
// The maximum prevents large gears from having
// extremely thin needle-like teeth.

const MIN_TEETH = 6;
const MAX_TEETH = 14;

// ==================================================
// ROTATION SETTINGS
// ==================================================

// Maximum rotational speed in radians per frame.
//
// Lower this further if you want slower rotation.

const MAX_ANGULAR_SPEED = 0.5;

// ==================================================
// PARTICLE SETUP
// ==================================================

const NUM = 50;
const particles = [];

function randomRange(min, max) {
return Math.random() * (max - min) + min;
}

function getGearSize() {

const random =
    Math.random() * 100;


// Small gear
if (random < SMALL_PERCENT) {

    return {
        size: randomRange(
            SMALL_MIN,
            SMALL_MAX
        ),

        type: 'small',

        // Lower mass means easier movement
        mass: 0.5
    };
}


// Medium gear
if (
    random <
    SMALL_PERCENT +
    MEDIUM_PERCENT
) {

    return {
        size: randomRange(
            MEDIUM_MIN,
            MEDIUM_MAX
        ),

        type: 'medium',

        mass: 1
    };
}


// Large gear
return {

    size: randomRange(
        BIG_MIN,
        BIG_MAX
    ),

    type: 'big',

    // Larger gears resist acceleration
    mass: 2
};

}

function getGearTeeth(radius) {

// Larger gears generally have more teeth,
// but the result is capped.

const calculatedTeeth =
    Math.round(radius * 0.45);


return Math.max(
    MIN_TEETH,
    Math.min(
        MAX_TEETH,
        calculatedTeeth
    )
);

}

for (let i = 0; i < NUM; i++) {

const gear =
    getGearSize();

const r =
    gear.size;


particles.push({

    x:
        Math.random() *
        (w - 2 * padding) +
        padding,

    y:
        Math.random() *
        (h / 2) +
        padding,


    vx:
        (Math.random() - 0.5) *
        0.1,

    vy:
        (Math.random() - 0.5) *
        0.1,


    // Collision radius
    r: r,


    // Gear type
    type:
        gear.type,


    // Mass
    mass:
        gear.mass,


    // Rotation
    angle:
        Math.random() *
        Math.PI * 2,


    angularVelocity:
        (Math.random() - 0.5) *
        0.005,


    // Number of gear teeth
    teeth:
        getGearTeeth(r)
});

}

// ==================================================
// PHYSICS SETTINGS
// ==================================================

const gravity = 0.15;
const bounce = 0.3;
const friction = 0.995;
const interaction = 0.15;
const slothStrength = 0.01;
const maxSpeed = 5;

// ==================================================
// SCROLL INTERACTION
// ==================================================

let lastScroll =
window.scrollY;

window.addEventListener(
'scroll',
() => {

    const scrollAccel =
        window.scrollY -
        lastScroll;

    lastScroll =
        window.scrollY;


    particles.forEach(p => {

        // Heavy gears react less to scrolling.
        p.vy +=
            (-scrollAccel * 0.3) /
            p.mass;


        p.vx +=
            (
                (-scrollAccel * 0.5) *
                (Math.random() - 0.5)
            ) /
            p.mass;


        // Heavier gears are harder to spin.
        p.angularVelocity +=
            (
                scrollAccel *
                (Math.random() - 0.5) *
                0.0005
            ) /
            p.mass;
    });
}

);

// ==================================================
// DRAW GEAR
// ==================================================

function drawGear(p) {

ctx.save();

ctx.translate(
    p.x,
    p.y
);

ctx.rotate(
    p.angle
);


const outerRadius =
    p.r;

const rootRadius =
    p.r * 0.75;


// Four points per tooth creates
// wider, block-like teeth.

const pointsPerTooth =
    4;

const totalPoints =
    p.teeth *
    pointsPerTooth;


ctx.beginPath();


for (
    let i = 0;
    i < totalPoints;
    i++
) {

    const angle =
        (i / totalPoints) *
        Math.PI * 2;


    const toothPosition =
        i %
        pointsPerTooth;


    let radius;


    // The outer portion occupies
    // half of each tooth.
    if (
        toothPosition === 0 ||
        toothPosition === 1
    ) {

        radius =
            outerRadius;

    } else {

        radius =
            rootRadius;
    }


    const x =
        Math.cos(angle) *
        radius;

    const y =
        Math.sin(angle) *
        radius;


    if (i === 0) {

        ctx.moveTo(
            x,
            y
        );

    } else {

        ctx.lineTo(
            x,
            y
        );
    }
}


ctx.closePath();


// Gear body
ctx.fillStyle =
    'rgba(178, 172, 214, 0.95)';

ctx.fill();


// Outer outline
ctx.strokeStyle =
    'rgba(105, 100, 150, 0.9)';

ctx.lineWidth =
    Math.max(
        1,
        p.r * 0.05
    );

ctx.stroke();


// ==================================================
// CENTRE HOLE
// ==================================================

const holeRadius =
    p.r * 0.3;


ctx.beginPath();

ctx.arc(
    0,
    0,
    holeRadius,
    0,
    Math.PI * 2
);


// Cut the centre out.
ctx.globalCompositeOperation =
    'destination-out';

ctx.fill();


ctx.globalCompositeOperation =
    'source-over';


// Hole outline
ctx.beginPath();

ctx.arc(
    0,
    0,
    holeRadius,
    0,
    Math.PI * 2
);

ctx.strokeStyle =
    'rgba(105, 100, 150, 0.9)';

ctx.lineWidth =
    Math.max(
        1,
        p.r * 0.04
    );

ctx.stroke();


// ==================================================
// INNER RING
// ==================================================

ctx.beginPath();

ctx.arc(
    0,
    0,
    p.r * 0.52,
    0,
    Math.PI * 2
);

ctx.strokeStyle =
    'rgba(130, 125, 180, 0.5)';

ctx.stroke();


ctx.restore();

}

// ==================================================
// ANIMATION LOOP
// ==================================================

function animate() {

requestAnimationFrame(
    animate
);


ctx.clearRect(
    0,
    0,
    w,
    h
);


// ==================================================
// GEAR PHYSICS
// ==================================================

for (
    let i = 0;
    i < NUM;
    i++
) {

    const p =
        particles[i];


    // Gravity affects all gears.
    p.vy +=
        gravity;


    // Random horizontal movement.
    // Heavy gears react less strongly.

    p.vx +=
        (
            (Math.random() - 0.5) *
            slothStrength
        ) /
        p.mass;


    // ==================================================
    // SPEED LIMIT
    // ==================================================

    const speed =
        Math.sqrt(
            p.vx * p.vx +
            p.vy * p.vy
        );


    if (
        speed >
        maxSpeed
    ) {

        const scale =
            maxSpeed /
            speed;

        p.vx *=
            scale;

        p.vy *=
            scale;
    }


    // ==================================================
    // MOVEMENT
    // ==================================================

    p.x +=
        p.vx;

    p.y +=
        p.vy;


    // ==================================================
    // ROTATION
    // ==================================================

    // Limit maximum rotation speed.

    p.angularVelocity =
        Math.max(
            -MAX_ANGULAR_SPEED,
            Math.min(
                MAX_ANGULAR_SPEED,
                p.angularVelocity
            )
        );


    p.angle +=
        p.angularVelocity;


    // Rotational friction.

    p.angularVelocity *=
        0.985;


    // ==================================================
    // LINEAR FRICTION
    // ==================================================

    p.vx *=
        friction;

    p.vy *=
        friction;


    // ==================================================
    // WALL COLLISIONS
    // ==================================================

    if (
        p.x - p.r <
        padding
    ) {

        p.x =
            padding +
            p.r;

        p.vx *=
            -bounce;

        p.angularVelocity +=
            p.vy *
            0.002 /
            p.mass;
    }


    if (
        p.x + p.r >
        w - padding
    ) {

        p.x =
            w -
            padding -
            p.r;

        p.vx *=
            -bounce;

        p.angularVelocity -=
            p.vy *
            0.002 /
            p.mass;
    }


    if (
        p.y - p.r <
        padding
    ) {

        p.y =
            padding +
            p.r;

        p.vy *=
            -bounce;

        p.angularVelocity -=
            p.vx *
            0.002 /
            p.mass;
    }


    if (
        p.y + p.r >
        h - padding
    ) {

        p.y =
            h -
            padding -
            p.r;

        p.vy *=
            -bounce *
            0.5;

        p.vx *=
            0.7;


        // Large gears rotate more slowly.

        p.angularVelocity +=
            (
                p.vx /
                p.r
            ) *
            0.01 /
            p.mass;
    }
}


// ==================================================
// MOUSE INTERACTION
// ==================================================

if (
    mouse.active
) {

    const radius =
        100;

    const strength =
        20;


    particles.forEach(p => {

        const dx =
            p.x -
            mouse.x;

        const dy =
            p.y -
            mouse.y;


        const dist =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            dist <
            radius &&
            dist >
            0
        ) {

            const force =
                (radius - dist) /
                radius *
                strength;


            const nx =
                dx /
                dist;

            const ny =
                dy /
                dist;


            // Heavy gears accelerate less.

            p.vx +=
                (nx * force) /
                p.mass;

            p.vy +=
                (ny * force) /
                p.mass;


            // Slow spinning response.

            p.angularVelocity +=
                (
                    (Math.random() - 0.5) *
                    0.01
                ) /
                p.mass;
        }
    });
}


// ==================================================
// GEAR COLLISIONS
// ==================================================

for (
    let i = 0;
    i < NUM;
    i++
) {

    for (
        let j = i + 1;
        j < NUM;
        j++
    ) {

        const p1 =
            particles[i];

        const p2 =
            particles[j];


        const dx =
            p2.x -
            p1.x;

        const dy =
            p2.y -
            p1.y;


        const dist =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const minDist =
            p1.r +
            p2.r;


        if (
            dist <
            minDist &&
            dist >
            0
        ) {

            const overlap =
                Math.min(
                    (minDist - dist) /
                    2,
                    0.8
                );


            const nx =
                dx /
                dist;

            const ny =
                dy /
                dist;


            // Separate based on relative mass.
            // Heavy gears move less.

            const totalMass =
                p1.mass +
                p2.mass;


            const p1Move =
                p2.mass /
                totalMass;

            const p2Move =
                p1.mass /
                totalMass;


            p1.x -=
                nx *
                overlap *
                p1Move;

            p1.y -=
                ny *
                overlap *
                p1Move;


            p2.x +=
                nx *
                overlap *
                p2Move;

            p2.y +=
                ny *
                overlap *
                p2Move;


            // ==================================================
            // VELOCITY RESPONSE
            // ==================================================

            const relativeVelocityX =
                p2.vx -
                p1.vx;

            const relativeVelocityY =
                p2.vy -
                p1.vy;


            const velocityAlongNormal =
                relativeVelocityX *
                nx +
                relativeVelocityY *
                ny;


            // Only apply collision response
            // if gears are moving toward each other.

            if (
                velocityAlongNormal <
                0
            ) {

                const restitution =
                    0.3;


                const impulse =
                    (
                        -(1 + restitution) *
                        velocityAlongNormal
                    ) /
                    (
                        1 / p1.mass +
                        1 / p2.mass
                    );


                const impulseX =
                    impulse *
                    nx;

                const impulseY =
                    impulse *
                    ny;


                p1.vx -=
                    impulseX /
                    p1.mass;

                p1.vy -=
                    impulseY /
                    p1.mass;


                p2.vx +=
                    impulseX /
                    p2.mass;

                p2.vy +=
                    impulseY /
                    p2.mass;
            }


            // ==================================================
            // ROTATION FROM COLLISION
            // ==================================================

            // Larger/heavier gears gain
            // much less rotational velocity.

            const collisionSpin =
                (
                    p1.vx -
                    p2.vx
                ) *
                0.003;


            p1.angularVelocity +=
                collisionSpin /
                (
                    p1.mass *
                    p1.r
                );


            p2.angularVelocity -=
                collisionSpin /
                (
                    p2.mass *
                    p2.r
                );
        }
    }
}


// ==================================================
// DRAW GEARS
// ==================================================

particles.forEach(
    drawGear
);

}

animate();

// ==================================================
// RESIZE
// ==================================================

window.addEventListener(
'resize',
() => {

    w =
        canvas.width =
        window.innerWidth;

    h =
        canvas.height =
        window.innerHeight;
}

);