// import { canvas, ctx } from "./canvas.js";
// import { Vec2, checkCollision } from "./math.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight / 2;

const randomRange = (min, max) => {
  return min + Math.random() * (max - min);
}

class Vec2 {
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

const checkOverlap = (b1, b2) => {
    if (b1.position.x + b1.width < b2.position.x ||    
        b1.position.x > b2.position.x + b2.width ||    
        b1.position.y + b1.height < b2.position.y ||   
        b1.position.y > b2.position.y + b2.height) {    
        return false;
    }
    return true;
}

class Tank {
    constructor(x, y, ctx, eventManager) {
        this.position = new Vec2(x, y);
        this.ctx = ctx;
        this.eventManager = eventManager;
        this.mousePosition = new Vec2(0,0);
        this.height = 40;
        this.width = 10;
    }

    update () {
        this.draw();

    }

    draw() {
      
        const rectBottomCenterX = this.position.x;
        const rectBottomCenterY = this.position.y;

        // cannon
        // calculate the angle to rotate
        const angleRadians = Math.atan2(this.mousePosition.y - rectBottomCenterY, this.mousePosition.x - rectBottomCenterX) + Math.PI;
        this.ctx.save();
        // translate and rotate the canvas
        this.ctx.translate(rectBottomCenterX, rectBottomCenterY);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.rotate(angleRadians)

        this.ctx.beginPath();
        this.ctx.rect(-this.width / 2, -this.height, this.width, this.height);
        this.ctx.fillStyle = 'blue';
        this.ctx.fill();
        this.ctx.restore();
        this.ctx.closePath();

        // touret 
        this.ctx.beginPath();
        this.ctx.arc(this.position.x, this.position.y, 20, 90, 2*Math.PI);
        this.ctx.fillStyle = "green";
        this.ctx.fill();

        // touret 
        this.ctx.beginPath();
        this.ctx.fillRect(this.position.x - 30, this.position.y, 60, 20);
        this.ctx.fillStyle = "blue";
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(this.position.x - 30, this.position.y);
        this.ctx.lineTo(this.position.x - 30, this.position.y + 20);
        this.ctx.lineTo(this.position.x - 40, this.position.y + 20);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(this.position.x + 30, this.position.y);
        this.ctx.lineTo(this.position.x + 30, this.position.y + 20);
        this.ctx.lineTo(this.position.x + 40, this.position.y + 20);
        this.ctx.fill();
        this.ctx.closePath();
        
    }
}

class Target {
    constructor(x, y) {
        this.position = new Vec2(x, y);
        this.height = 50;
        this.width = 10;
        this.color = "green";
        this.isAlive = true;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    update() {

    }
}

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.position = new Vec2(x, y);
    this.width = radius;
    this.height = radius;
    this.color = color;
    this.velocity = new Vec2(velocity.x, velocity.y);
    this.gravity = 0.05;
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.width, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
   if (this.isAlive()) {
        this.velocity.x *= 0.99; // air resistance
        this.velocity.y += this.gravity;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.alpha -= 0.005;
        this.draw();
   }
  }

  isAlive() {
    return this.position.y < canvas.height + this.width*2;
  }
}

const targets = [new Target(500, 20), new Target(800, 200)];

class Bullet {
    constructor(x, y, velocity, speed = 1, ctx) {
        this.position = new Vec2(x, y);
        this.gravity = new Vec2(0, 0.1);
        this.speed = speed || 0.5;
        this.velocity = velocity.scale(this.speed);
        this.ctx = ctx;
        this.width = 10;
        this.height = 10;
        this.color = "red";
        this.exploded = false;
        this.isAlive = true;
        this.particles = [];
    }

    draw() {
       if (!this.exploded) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.position.x + this.width/2, this.position.y, this.width/2, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
       } 
    }

    update (deltaTime) {
        console.log(`deltaTime: ${deltaTime}`);
        this.draw();
        this.updateParticles();
        this.velocity.add(this.gravity);
        this.position.add(this.velocity);
        this.checkCollision();
    }

    explode() {
        if(!this.exploded) {
            for (let i = 0; i < 30; i++) {
               this.particles.push(new Particle(this.position.x, this.position.y, Math.random() * 3, 'red', {
                    x: (Math.random() - 0.5) * (Math.random() * 6),
                    y: (Math.random() - 1) * Math.random() * 5,
                }));
            }
        }
        this.exploded = true;
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => particle.isAlive());
        if (this.exploded && !this.particles.length) {
            this.isAlive = false;
        } else {
            this.particles.forEach(particle => {
                particle.update();
            });
        }
    }

    checkCollision() {
        // ground collision
        if (this.position.y >= canvas.height - this.width/2) {
            this.velocity.scale(0);
            this.gravity.scale(0);
            this.explode();
        }

        for (const target of targets) {
            if (checkOverlap(this, target)) {
                target.isAlive = false;
                targets.push(new Target(Math.random() * canvas.width - target.width, Math.random() * canvas.height - target.height));
                this.velocity.scale(0);
                this.gravity.scale(0);
                this.explode();
            }
        }
    }
}

const bullets = [];
const tank = new Tank(100, window.innerHeight / 2 - 20, ctx);



const trackMouse = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    tank.mousePosition = new Vec2(mouseX, mouseY);
}

let canShoot = true;
let startT = 0;
const setShootPower = () => {
    startT = new Date().getTime();
}

const shoot = (e) => {
    let endT = (new Date().getTime() - startT) / 100;
    
    if (endT >= 15) {

        endT = 15;
    }
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const tankCenterX = tank.position.x;
    const tankCenterY = tank.position.y;
    const tankHeight = tank.height;
    const bulletSize = 10;

    // calculate distance from mouse click to player center
    const distX = mouseX - tankCenterX;
    const distY = mouseY - tankCenterY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    const bulletDirectionX = distX / distance; 
    const bulletDirectionY = distY / distance; 

    const bulletOffsetX = tankCenterX + bulletDirectionX * tankHeight - bulletSize / 2;
    const bulletOffsetY = tankCenterY + bulletDirectionY * tankHeight - bulletSize / 2;

    if (canShoot) {
        canShoot = false;
        bullets.push(new Bullet(bulletOffsetX, bulletOffsetY, new Vec2(bulletDirectionX, bulletDirectionY), endT, ctx));
        setTimeout(() => {
            canShoot = true;
        }, 1500)
    }
}

canvas.addEventListener("mousemove", trackMouse);
canvas.addEventListener("mousedown", setShootPower);
canvas.addEventListener("mouseup", shoot)

let lastTime = 0;
const loadGame = () => {
    const draw = (timeStamp) => {
        const now = window.performance.now();
        const deltaTime = (now - lastTime) / 1000; // convert milliseconds to seconds
        lastTime = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        tank.update();
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            bullet.update(deltaTime);
            if (!bullet.isAlive) {
                bullets.splice(i, 1);
            }
        }

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            if (target.isAlive) {
                target.draw();
            } else {
                targets.splice(i, 1);
            }
        }
        window.requestAnimationFrame(draw);
    };

    draw();
}
window.addEventListener("load", loadGame);