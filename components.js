import { Vec2 } from "./math.js";

class Component {
    constructor(name) {
        this.name = name;
    }
}

export class Position extends Component {
    constructor(x, y) {
        super("Position");
        this.vec2 = new Vec2(x, y);
    }
}

export class Rotation extends Component {
    constructor(angleRadians) {
        super("Rotation");
        this.radians = angleRadians;
    }
}

export class Velocity extends Component {
    constructor (x, y) {
        super("Velocity");
        this.vec2 = new Vec2(x, y);
    }
}

export class Gravity extends Component {
    constructor (x, y) {
        super("Gravity");
        this.vec2 = new Vec2(x, y);
    }
}

export class Size extends Component {
    constructor(w, h) {
        super("Size");
        this.w = w;
        this.h = h;
    }
}

export class MousePosition extends Component {
    constructor(x, y) {
        super("MousePosition");
        this.vec2 = new Vec2(x, y);
    }
}

export class Shape extends Component {
    constructor(type, size) {
        super("Shape");
        this.type = type;
        this.size = {
            r: size.r || null,
            w: size.w || null,
            h: size.h || null,
        }
    }
}

export class Tag extends Component {
  constructor(tag) {
    super("Tag");
    this.tag = tag;
  }
}


export class Color extends Component {
    constructor(color) {
        super("Color");
        this.color = color;
    }
}

export class RenderContext extends Component {
    constructor(contextKey) {
        super("RenderContext");
        this.contextKey = contextKey;
    }
}

export class EventListener extends Component{
    constructor(topic) {
        super("EventListener");
        this.listener = topic;
    }
}


export class RenderComponent extends Component {
  constructor(shape, position, color, size) {
    super("RenderComponent");
    this.position = new Vec2(position.x, position.y);
    this.color = color;
    this.shape = shape; 
    this.size = size;
  }
}

export class DamageOnCollisionComponent extends Component {
  constructor(damage) {
    super("DamageOnCollisionComponent");
    this.damage = damage;
  }
}

export class LifeComponent extends Component {
    constructor(lifeAmount = 100) {
        super("LifeComponent");
        this.life = lifeAmount;
    }
}

export class IsRemoved extends Component {
    constructor(removed) {
        super("IsRemoved");
        this.isRemoved = removed;
    }
}

export class Collider extends Component {
    constructor(width, height) {
        super("Collider");
        this.w = width;
        this.h = height;
    }
}