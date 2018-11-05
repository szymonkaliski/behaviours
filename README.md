# Declarative library for describing behaviours

**Work in progress!**

This library is functional, although experimental, and has some performance issues.

## Installation

`npm install behaviours`

## Example

1000 points repelling / attracting each other:

```js
const Behaviours = require("behaviours");

const b = new Behaviours({ dimensions: 2 });

const simulationStep = b.compose(
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

const points = Array.from({ length: 1000 }).map(() => ({
  pos: [rand(-0.1, 0.1), rand(-0.1, 0.1)],
  vel: [rand(-0.001, 0.001), rand(-0.001, 0.001)]
}));


const loop = () => {
  simulationStep(points);

  // draw points

  requestAnimationFrame(loop);
}

loop();
```

## API

### Constructor

#### `const b = new Behaviours(options)` - creates new behaviours instance

- `options.dimensions`: `1`, `2`, `3` - how many dimensions the simulation is working against
- `options.getPos` - custom position getter (default `o => o.pos`)
- `options.getVel` - custom velocity getter (default `o => o.vel`)

### Functions

- `b.addVelocity()` - add velocity to position with each frame
- `b.limitVelocity(options)` - limit velocity of each point
  - `options.limit` - max velocity (default `1.0`)
- `b.repelOthers(options)` - float away from other points
  - `options.minDistance` - min distance for collision (default `0.0`)
  - `options.maxDistance` - max distance for collision (default `0.5`)
  - `options.force` - force of collision (default `0.1`)
- `b.repelPoint(options)` - repel from a custom point
  - `options.minDistance` - min distance for collision (default `0.0`)
  - `options.maxDistance` - max distance for collision (default `0.5`)
  - `options.force` - force of collision (default `0.1`)
  - `options.position` - position of repelling point (default `[0, 0, 0]`)
- `b.attractOthers(options)` - float towards other points
  - `options.minDistance` - min distance for attraction (default `0.0`)
  - `options.maxDistance` - max distance for attraction (default `0.5`)
  - `options.force` - force of attraction (default `0.1`)
- `b.attractPoint(options)` - attract from a custom point
  - `options.minDistance` - min distance for attraction (default `0.0`)
  - `options.maxDistance` - max distance for attraction (default `0.5`)
  - `options.force` - force of attraction (default `0.1`)
  - `options.position` - position of attracting point (default `[0, 0, 0]`)
- `b.collideOthers(options)` - collide with other points
  - `options.minDistance` - min distance for collision (default `0.0`)
  - `options.maxDistance` - max distance for collision (default `0.5`)
  - `options.onCollision(p1, p2, points)` - custom function to run on collision
- `b.nearestOther(options)` - collide with other points
  - `options.minDistance` - min distance for search (default `0.0`)
  - `options.maxDistance` - max distance for search (default `0.5`)
  - `options.onFound(p1, p2, points)` - custom function to run when nearest point is found
- `b.subset(options)` - filter points
  - `options.condition(p)` - condition for given point
  - `options.conditionOthers` - are subsequent operations compared against all other points, or all points matching `options.condition` (default `false`)
- `b.compose(functions)` - compose all given behaviour functions into single simulation step

## Future work

- [ ] optimization (ECS architecture?)
- [ ] springs
- [ ] flow fields

## Acknowledgments

This project was developed in part at Laboratory, an artist residency for interactive arts: [https://laboratoryspokane.com](https://laboratoryspokane.com).
