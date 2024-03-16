
export const randomRange = (min, max) => {
  return min + Math.random() * (max - min);
}

export class Vec2 {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    set(v) {
        this.x = v.x;
        this.y = v.y;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    addNew(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    subtractNew(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }
    multiplyNew(v) {
        return new Vec2(this.x * v.x, this.y * v.y);
    }
    scale(times) {
        this.x *= times;
        this.y *= times;
        return this;
    }
    scaleNew(times) {
        return new Vec2(this.x * times, this.y * times);
    }
    dist(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return Math.sqrt((dx*dx) + (dy*dy)).toFixed(3);
    }
    length() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y)).toFixed(3);
    }
    isEqual(v) {
        return (this.x === v.x) && (this.y === v.y);
    }
}

export const checkOverlap = (b1, b2) => {
    if (b1.position.x + b1.size.w < b2.position.x ||    
        b1.position.x > b2.position.x + b2.size.w ||    
        b1.position.y + b1.size.h < b2.position.y ||   
        b1.position.y > b2.position.y + b2.size.h) {    
        return false;
    }
    return true;
}