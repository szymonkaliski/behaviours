const Behaviours = require("../");

const NUM_PARTICLES = 2000;

const rand = (min, max) => min + Math.random() * (max - min);

const points = Array.from({ length: NUM_PARTICLES }).map(() => ({
  pos: [rand(-0.1, 0.1), rand(-0.1, 0.1)],
  vel: [rand(-0.001, 0.001), rand(-0.001, 0.001)]
}));

const b = new Behaviours({ dimensions: 2 });

const simulationStep = b.compose(
  b.repelPoint({
    maxDistance: 0.2,
    force: 0.005,
    position: [0.3, 0]
  }),
  b.repelPoint({
    maxDistance: 0.2,
    force: 0.005,
    position: [-0.3, 0]
  }),
  b.repelOthers({
    maxDistance: 0.001,
    force: 0.002
  }),
  b.attractOthers({
    minDistance: 0.001,
    maxDistance: 0.003,
    force: 0.001
  }),
  b.dampenVelocity({ dampening: 0.5 }),
  b.addVelocity()
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

  ctx.fillStyle = "#222";
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
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
  Array.from({ length: 100 }).forEach(() => {
    simulationStep(points);
  });

  setTimeout(() => {
    window.sketchbook.shot();
  }, 100);
}
