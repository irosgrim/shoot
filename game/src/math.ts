import { RenderComponent } from "./components";

export const randomRange = (min: number, max: number) => {
  return min + Math.random() * (max - min);
}

export class Vec2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x || 0;
        this.y = y || 0;
    }
    // round to a specified number of decimal places
    round(decimals = 4) {
        this.x = parseFloat(this.x.toFixed(decimals));
        this.y = parseFloat(this.y.toFixed(decimals));
        return this;
    }
    set(v: {x: number, y: number}) {
        this.x = v.x;
        this.y = v.y;
        this.round();
    }
    add(v: {x?: number, y?: number}) {
        if (v.x !== undefined) {
            this.x += v.x;
        }
        if (v.y !== undefined) {
            this.y += v.y;
        }
        return this.round();
    }
    addNew(v: {x?: number, y?: number}) {
        const newVec2 = new Vec2(this.x, this.y);
        if (v.x !== undefined) {
            newVec2.x += v.x;
        }
        if (v.y !== undefined) {
            newVec2.y += v.y;
        }
        return newVec2.round();
    }
    subtract(v: {x?: number, y?: number}) {
        if (v.x !== undefined) {
            this.x -= v.x;
        }
        if (v.y !== undefined) {
            this.y -= v.y;
        }
        return this.round();
    }
    subtractNew(v: {x?: number, y?: number}) {
        const newVec2 = new Vec2(this.x, this.y);
        if (v.x !== undefined) {
            newVec2.x -= v.x;
        }
        if (v.y !== undefined) {
            newVec2.y -= v.y;
        }
        return newVec2.round();
    }
    multiply(v: {x?: number, y?: number}) {
        if (v.x !== undefined) {
            this.x *= v.x;
        }
        if (v.y !== undefined) {
            this.y *= v.y;
        }
        return this.round();
    }
    multiplyNew(v: {x?: number, y?: number}) {
        const newVec2 = new Vec2(this.x, this.y);
        if (v.x !== undefined) {
            newVec2.x *= v.x;
        }
        if (v.y !== undefined) {
            newVec2.y *= v.y;
        }
        return newVec2.round();
    }
    scale(times: number) {
        this.x *= times;
        this.y *= times;
        return this.round();
    }
    scaleNew(times: number) {
        return new Vec2(this.x * times, this.y * times).round();
    }
    dist(v: Vec2 | {x: number, y: number}) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return Math.sqrt((dx*dx) + (dy*dy)).toFixed(3);
    }
    length() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y)).toFixed(3);
    }
    isEqual(v: Vec2 | {x: number, y: number}) {
        return (this.x === v.x) && (this.y === v.y);
    }
}

export const checkOverlap = (b1: RenderComponent, b2: RenderComponent) => {
    if (b1.position.x + b1.size.w! < b2.position.x ||    
        b1.position.x > b2.position.x + b2.size.w! ||    
        b1.position.y + b1.size.h! < b2.position.y ||   
        b1.position.y > b2.position.y + b2.size.h!) {    
        return false;
    }
    return true;
}