
export const randomRange = (min, max) => {
  return min + Math.random() * (max - min);
}

export class Vec2 {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }
    scale(times) {
        this.x *= times;
        this.y *= times;
        return this;
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
    if (b1.position.x + b1.width < b2.position.x ||    
        b1.position.x > b2.position.x + b2.width ||    
        b1.position.y + b1.height < b2.position.y ||   
        b1.position.y > b2.position.y + b2.height) {    
        return false;
    }
    return true;
}