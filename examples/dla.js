const Behaviours = require("../");

const NUM_PARTICLES = 5000;

const rand = (min, max) => min + Math.random() * (max - min);

const pointOnCircle = (r, a) => {
  const angle = a * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
};

const points = Array.from({ length: NUM_PARTICLES }).map((_, i) => ({
  pos: pointOnCircle(i === 0 ? 0.1 : 0.5, Math.random()),
  vel: [rand(-0.1, 0.1), rand(-0.1, 0.1)],
  static: i === 0
}));

const b = new Behaviours({ dimensions: 2 });

const simulationStep = b.compose(
  b.subset(
    { condition: p => !p.static },
    b.repelOthers({ maxDistance: 0.001, force: 0.002 }),
    b.attractPoint({ maxDistance: 4.0, force: 0.0005 }),
    b.limitVelocity({ limit: 0.02 }),
    b.addVelocity()
  ),

  b.subset(
    { condition: p => p.static, conditionOthers: false },
    b.collideOthers({
      maxDistance: 0.0003,
      onCollision: (a, b) => {
        if (a.static || b.static) {
          a.static = b.static = true;
        }
      }
    })
  )
);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = "absolute";
canvas.style.top = 0;
canvas.style.left = 0;

const { width, height } = canvas;
const k = Math.min(width, height);

const loop = () => {
  requestAnimationFrame(loop);

  ctx.fillStyle = "#CECECE";
  ctx.fillRect(0, 0, width, height);

  simulationStep(points);

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    ctx.fillStyle = p.static ? "#222" : "#999";

    ctx.fillRect(
      (p.pos[0] * k) / 2 + width / 2 - 2,
      (p.pos[1] * k) / 2 + height / 2 - 2,
      4,
      4
    );
  }
};

loop();

if (window.sketchbook) {
  Array.from({ length: 2000 }).forEach(() => {
    simulationStep(points);
  });

  setTimeout(() => {
    window.sketchbook.shot();
  }, 100);
}
