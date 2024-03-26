import { Vec2 } from "./math";

export class Component {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

export class Position extends Component {
    vec2: Vec2;
    constructor(x: number, y: number) {
        super("Position");
        this.vec2 = new Vec2(x, y);
    }
}

export class Rotation extends Component {
    radians: number;
    constructor(angleRadians: number) {
        super("Rotation");
        this.radians = angleRadians;
    }
}

export class Velocity extends Component {
    vec2: Vec2;
    constructor (x: number, y: number) {
        super("Velocity");
        this.vec2 = new Vec2(x, y);
    }
}

export class Gravity extends Component {
    vec2: Vec2;
    constructor (x: number, y: number) {
        super("Gravity");
        this.vec2 = new Vec2(x, y);
    }
}

export class Size extends Component {
    w: number;
    h: number;
    constructor(w: number, h: number) {
        super("Size");
        this.w = w;
        this.h = h;
    }
}

export class MousePosition extends Component {
    vec2: Vec2;
    constructor(x: number, y: number) {
        super("MousePosition");
        this.vec2 = new Vec2(x, y);
    }
}

export class Shape extends Component {
    type: string;
    size: {
        r: number | null,
        w: number | null,
        h: number | null,
    }
    constructor(type: string, size: {
        r?: number,
        w?: number,
        h?: number,
    }) {
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
    tag: string;
    constructor(tag: string) {
        super("Tag");
        this.tag = tag;
    }
}


export class Color extends Component {
    color: string;
    constructor(color: string) {
        super("Color");
        this.color = color;
    }
}

export class Alpha extends Component {
    alpha: number;
    constructor(alphaValue: number) {
        super("Alpha");
        this.alpha = alphaValue;
    }
}

export class RenderContext extends Component {
    contextKey: string;
    constructor(contextKey: string) {
        super("RenderContext");
        this.contextKey = contextKey;
    }
}

export class EventListener extends Component{
    listener: string;
    constructor(topic: string) {
        super("EventListener");
        this.listener = topic;
    }
}


export class RenderComponent extends Component {
    shape: "rectangle" | "circle" | "image";
    position: Vec2;
    color: string;
    size: {
        r: number | null,
        w: number | null,
        h: number | null,
    }
    image: HTMLImageElement | null;
  constructor(shape: "rectangle" | "circle" | "image", position: {x: number, y: number} | Vec2, color: string, size: {
        r?: number,
        w?: number,
        h?: number,
    }, imagePath: string | null = null) {
    super("RenderComponent");
    this.position = new Vec2(position.x, position.y);
    this.color = color;
    this.shape = shape; 
    this.size = {
        w: size.w ?? null,
        h: size.h ?? null,
        r: size.r ?? null, 
    };
    this.image = null;
    if (imagePath) {
        this.image = new Image(this.size.w!, this.size.h!);
        this.image.src = imagePath;
    }
  }
}

export class DamageOnCollisionComponent extends Component {
    damage: number;
    constructor(damage: number) {
        super("DamageOnCollisionComponent");
        this.damage = damage;
    }
}

export class LifeComponent extends Component {
    life: number;
    constructor(lifeAmount = 100) {
        super("LifeComponent");
        this.life = lifeAmount;
    }
}

export class Active extends Component {
    isActive: boolean;
    constructor(removed: boolean) {
        super("Active");
        this.isActive = removed;
    }
}

export class Collider extends Component {
    w: number;
    h: number;
    constructor(width: number, height: number) {
        super("Collider");
        this.w = width;
        this.h = height;
    }
}