const createTree = require("static-kdtree");
const v = require("@thi.ng/vectors");

const prop = key => o => o[key];

const KNN_COUNT = 5;

class Behaviours {
  constructor({
    dimensions = 3,
    getPos = prop("pos"),
    getVel = prop("vel")
  } = {}) {
    this.dimensions = dimensions;
    this.getPos = getPos;
    this.getVel = getVel;

    this.v = ["add", "sub", "distSq", "normalize", "limit", "mulN"].reduce(
      (memo, key) => Object.assign(memo, { [key]: v[`${key}${dimensions}`] }),
      { clone: v => v.slice(0) }
    );
  }

  addVelocity() {
    return () => p => this.v.add(this.getPos(p), this.getVel(p));
  }

  limitVelocity({ limit = 1.0 }) {
    return () => p => this.v.limit(this.getVel(p), limit);
  }

  dampenVelocity({ dampening = 0.99 } = {}) {
    return () => p => this.v.mulN(this.getVel(p), dampening);
  }

  repelOthers({ minDistance = 0.0, maxDistance = 0.5, force = 0.1 }) {
    const { sub, add, clone, mulN, normalize, distSq } = this.v;
    const { getPos, getVel } = this;

    return (tree, points) => p => {
      const vel = getVel(p);
      const pos = getPos(p);

      const nearest = tree.knn(pos, KNN_COUNT, maxDistance);

      for (let i = 0; i < nearest.length; i++) {
        const otherPoint = points[nearest[i]];
        const d = distSq(pos, getPos(otherPoint));

        if (p.idx !== otherPoint.idx && minDistance < d) {
          add(vel, mulN(normalize(sub(clone(pos), getPos(otherPoint))), force));
        }
      }
    };
  }

  repelPoint({
    minDistance = 0.0,
    maxDistance = 0.5,
    force = 0.1,
    position = [0, 0]
  }) {
    const { sub, add, clone, mulN, normalize, distSq } = this.v;
    const { getPos, getVel } = this;

    return () => p => {
      const vel = getVel(p);
      const pos = getPos(p);
      const d = distSq(pos, position);

      if (minDistance < d && d < maxDistance) {
        add(vel, mulN(normalize(sub(clone(pos), position)), force));
      }
    };
  }

  attractOthers({ minDistance = 0.0, maxDistance = 0.5, force = 0.1 }) {
    const { sub, clone, mulN, normalize, distSq } = this.v;
    const { getPos, getVel } = this;

    return (tree, points) => p => {
      const vel = getVel(p);
      const pos = getPos(p);

      const nearest = tree.knn(pos, KNN_COUNT, maxDistance);

      for (let i = 0; i < nearest.length; i++) {
        const otherPoint = points[nearest[i]];
        const d = distSq(pos, getPos(otherPoint));

        if (p.idx !== otherPoint.idx && minDistance < d) {
          sub(vel, mulN(normalize(sub(clone(getPos(otherPoint)), pos)), force));
        }
      }
    };
  }

  attractPoint({
    minDistance = 0.0,
    maxDistance = 0.5,
    force = 0.1,
    position = [0, 0]
  }) {
    const { sub, clone, mulN, normalize, distSq } = this.v;
    const { getPos, getVel } = this;

    return () => p => {
      const vel = getVel(p);
      const pos = getPos(p);
      const d = distSq(pos, position);

      if (minDistance < d && d < maxDistance) {
        sub(vel, mulN(normalize(sub(clone(pos), position)), force));
      }
    };
  }

  collideOthers({
    minDistance = 0.0,
    maxDistance = 0.5,
    onCollision = () => {}
  } = {}) {
    const { distSq } = this.v;
    const { getPos } = this;

    return (tree, points) => p => {
      const pos = getPos(p);

      const nearest = tree.knn(pos, KNN_COUNT, maxDistance);

      for (let i = 0; i < nearest.length; i++) {
        const otherPoint = points[nearest[i]];
        const d = distSq(pos, getPos(otherPoint));

        if (p.idx !== otherPoint.idx && minDistance < d) {
          onCollision(p, otherPoint, points);
        }
      }
    };
  }

  nearestOther({
    minDistance = 0.0,
    maxDistance = 0.5,
    onFound = () => {}
  } = {}) {
    const { distSq } = this.v;
    const { getPos } = this;

    return (tree, points) => p => {
      const pos = getPos(p);

      const nearest = tree.knn(pos, KNN_COUNT, maxDistance);

      let nearestPoint = undefined;

      for (let i = 0; i < nearest.length; i++) {
        const otherPoint = points[nearest[i]];
        const d = distSq(pos, getPos(otherPoint));

        if (p.idx !== otherPoint.idx && minDistance < d && !nearestPoint) {
          nearestPoint = otherPoint;
        }
      }

      if (nearestPoint) {
        onFound(p, nearestPoint, points);
      }
    };
  }

  subset({ condition = () => false, conditionOthers } = {}, ...behaviours) {
    return (tree, points) => {
      let subsetTree;
      let subsetPoints;

      if (conditionOthers === false) {
        subsetTree = tree;
        subsetPoints = points;
      } else {
        subsetPoints = [];
        conditionOthers = conditionOthers || condition;

        for (let i = 0; i < points.length; i++) {
          if (conditionOthers(points[i])) {
            subsetPoints.push(points[i]);
          }
        }

        subsetTree = this.genTree(subsetPoints);
      }

      return p => {
        if (!condition(p)) {
          return;
        }

        let b;

        for (let j = 0; j < behaviours.length; j++) {
          b = behaviours[j](subsetTree, subsetPoints);
          b(p);
        }
      };
    };
  }

  genTree(points) {
    const treePoints = [];
    let i;

    for (i = 0; i < points.length; i++) {
      treePoints[i] = this.getPos(points[i]);
      treePoints[i].idx = points[i].idx || i;
    }

    return createTree(treePoints);
  }

  compose(...behaviours) {
    return points => {
      let i, j;
      let p, b;

      const tree = this.genTree(points);

      for (j = 0; j < behaviours.length; j++) {
        b = behaviours[j](tree, points);

        for (i = 0; i < points.length; i++) {
          p = points[i];
          p.idx = i;

          b(p);
        }
      }

      tree.dispose();
    };
  }
}

module.exports = Behaviours;
