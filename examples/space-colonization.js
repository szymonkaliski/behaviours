const Behaviours = require("../");

const NUM_PARTICLES = 20000;

const rand = (min, max) => min + Math.random() * (max - min);

const points = Array.from({ length: NUM_PARTICLES }).map((_, i) => ({
  pos: [rand(-1, 1), rand(-1, 1)],
  static: i === 0,
  active: true,
  children: []
}));

const b = new Behaviours({ dimensions: 2 });

const simulationStep = b.compose(
  b.subset(
    {
      condition: p => p.static && p.active,
      conditionOthers: p => !p.static && p.active
    },

    b.nearestOther({
      maxDistance: 0.0005,
      onFound: (a, b) => {
        b.static = true;
        a.children.push(b);
      }
    }),

    b.collideOthers({
      maxDistance: 0.0002,
      onCollision: (a, b) => {
        b.active = false;
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
  simulationStep(points);

  ctx.fillStyle = "#EEEEEE";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#333333";

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];

    if (p1.active && p1.static && p1.children) {
      ctx.beginPath();

      ctx.moveTo(
        (p1.pos[0] * k) / 2 + width / 2,
        (p1.pos[1] * k) / 2 + height / 2
      );

      for (let j = 0; j < p1.children.length; j++) {
        const p2 = p1.children[j];

        if (p2.active && p2.static) {
          ctx.lineTo(
            (p2.pos[0] * k) / 2 + width / 2,
            (p2.pos[1] * k) / 2 + height / 2
          );
        }
      }

      ctx.stroke();
    }
  }

  requestAnimationFrame(loop);
};

loop();

if (window.sketchbook) {
  Array.from({ length: 50 }).forEach(() => {
    simulationStep(points);
  });

  setTimeout(() => {
    window.sketchbook.shot();
  }, 100);
}
