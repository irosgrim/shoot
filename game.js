import { Vec2, checkOverlap, randomRange } from "./math.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
canvas.width = 1200;
canvas.height = 600;


const groundImage = new Image()
groundImage.src = "./ground.png";

groundImage.onload= (e) => {
    console.log("loaded ground");
    
    ctx.drawImage(groundImage, 0, 0, canvas.width, canvas.height);
    // const d = ctx.getImageData(0, 550, 1200, 600);
    // const pixelData = d.data;
    // console.log(`RGBA at (${0}, ${550}):`, pixelData[0], pixelData[1], pixelData[2], pixelData[3]);
    
}

const groundPosition = new Vec2(0, canvas.height - 100);
const holes = [];

class Hole {
    constructor(x, y, width, height, shape, ctx) {
        this.position = new Vec2(x, y);
        this.width = width;
        this.height = height;
        this.shape = shape || "circle";
        this.ctx = ctx;
    }
    draw() {
        this.ctx.beginPath();

        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.fillStyle = "rgba(0, 0, 0, 255)";
        // this.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        this.ctx.arc(this.position.x, this.position.y, 20, 0, Math.PI * 2, false);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.closePath();
    }
    update() {
        this.draw();
    }
}
class Ground {
    constructor(ctx) {
        this.ctx = ctx;
        this.position = new Vec2(0, canvas.height - 100);
        this.color = "pink";
        this.width = canvas.width;
        this.height = 100;
    }

    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        this.ctx.fill();

        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(this.position.x, this.position.y, 50, 50);

        this.ctx.globalCompositeOperation = "source-over";

    }
    update() {
        this.draw();
    }
}
class Power {
    constructor(x, y, ctx) {
        this.position = new Vec2(x, y);
        this.width = 200;
        this.height = 20;
        this.power = 0;
        this.color = "red";
        this.ctx = ctx;
    }

    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.position.x, this.position.y, this.power, this.height);
        this.ctx.fill();

        this.ctx.rect(this.position.x, this.position.y, this.width, this.height);
        this.ctx.strokeStyle = "#000000";
        this.ctx.stroke();
    }
    update() {
        this.draw();
    }

    setPower(current, total = 2000) {
        const currentPercentage = (current * 100) / total;
        const bit = this.width / 100;
        this.power = currentPercentage * bit;

    }
}

const power = new Power(10, 10, ctx);

class Tank {
    constructor(x, y, ctx, eventManager) {
        this.position = new Vec2(x, y);
        this.ctx = ctx;
        this.eventManager = eventManager;
        this.mousePosition = new Vec2(0,0);
        this.height = 40;
        this.width = 10;
        this.angleDegrees = 0;
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
        this.angleDegrees = Math.round(angleRadians * 180/Math.PI);
        this.ctx.save();
        // translate and rotate the canvas
        this.ctx.translate(rectBottomCenterX, rectBottomCenterY);
        this.ctx.rotate(-Math.PI / 2);

        let adjustedAngleDegrees;
        if (this.angleDegrees > 270) {
            adjustedAngleDegrees = 0;
        } else if (this.angleDegrees > 180) {
            adjustedAngleDegrees = 180;
        } else {
            adjustedAngleDegrees = Math.max(0, this.angleDegrees);
        }

        document.getElementById("debug").innerHTML = `
        <p>Angle: ${adjustedAngleDegrees}</p>
        `;

        const adjustedAngleRadians = adjustedAngleDegrees * (Math.PI / 180);

        this.ctx.rotate(adjustedAngleRadians);

        this.ctx.beginPath();
        this.ctx.rect(-this.width / 2, -this.height, this.width, this.height);
        this.ctx.fillStyle = 'blue';
        this.ctx.fill();
        this.ctx.restore();
        this.ctx.closePath();

        // touret 
        this.ctx.beginPath();
        this.ctx.fillStyle = "green";
        this.ctx.arc(this.position.x, this.position.y, 20, 0, 2*Math.PI);
        this.ctx.fill();

        // touret 
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(this.position.x - 30, this.position.y, 60, 20);

        this.ctx.beginPath();
        this.ctx.fillStyle = "green";
        this.ctx.moveTo(this.position.x - 30, this.position.y);
        this.ctx.lineTo(this.position.x - 30, this.position.y + 20);
        this.ctx.lineTo(this.position.x - 40, this.position.y + 20);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.fillStyle = "green";
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
        this.color = "red";
        this.isAlive = true;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
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

  update(deltaTime) {
   if (this.isAlive()) {
        this.velocity.x *= 0.99; // air resistance
        this.velocity.y += this.gravity;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.alpha -= 0.005;
        this.alpha = Math.max(0, this.alpha);
        
        this.draw();
   }
  }

  isAlive() {
    return this.position.y < canvas.height + this.width*2;
  }
}

const targets = [new Target(500, 20), new Target(800, 200)];

class Bullet {
    constructor(x, y, velocity, speed = 1, groundPosition, ctx) {
        this.position = new Vec2(x, y);
        this.gravity = new Vec2(0, 8);
        this.speed = speed || 0.5;
        this.velocity = velocity.scale(this.speed);
        this.ctx = ctx;
        this.width = 10;
        this.height = 10;
        this.color = "red";
        this.exploded = false;
        this.isAlive = true;
        this.particles = [];
        this.groundPosition = new Vec2(groundPosition.x, groundPosition.y)
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

    update(deltaTime) {
        this.checkCollision();
        this.draw();
        this.updateParticles(deltaTime);

        let tempVelocity = new Vec2(this.velocity.x, this.velocity.y).scale(deltaTime);
        this.position.add(tempVelocity);
        this.velocity.add(this.gravity);
    }


    explode() {
        if(!this.exploded) {
            for (let i = 0; i < 60; i++) {
               this.particles.push(new Particle(this.position.x, this.position.y, Math.random() * 3, 'red', {
                    x: (Math.random() - 0.5) * (Math.random() * 6),
                    y: (Math.random() - 1) * Math.random() * 5,
                }));
            }
        }
        this.exploded = true;
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => particle.isAlive());
        if (this.exploded && !this.particles.length) {
            this.isAlive = false;
        } else {
            this.particles.forEach(particle => {
                particle.update(deltaTime);
            });
        }
    }

    checkCollision() {
        // ground collision
        const x = Math.floor(this.position.x - this.width/2);
        const y = Math.floor(this.position.y + this.height);
        const { data } = ctx.getImageData(x, y, 1, 1);
        const alpha =  data[3] / 255;

        if (alpha === 1 || this.position.y > canvas.height || this.position.x < -50 || this.position.x >= canvas.width + 50) {
            this.velocity.scale(0);
            this.gravity.scale(0);
            this.makeHole();
            this.explode();

        }

        for (const target of targets) {
            if (checkOverlap(this, target)) {
                target.isAlive = false;
                targets.push(new Target(randomRange(canvas.width/2, canvas.width - target.width), randomRange(target.height, this.groundPosition.y - target.height)));
                this.velocity.scale(0);
                this.gravity.scale(0);
                this.explode();
            }
        }
    }

     makeHole() {
        const { data } = ctx.getImageData(this.position.x - this.width/2, this.position.y + this.height, 1, 1);
        const alpha =  data[3] / 255;
        
        if (alpha > 0) {
            holes.push(new Hole(this.position.x, this.position.y, this.width, this.height, "circle", this.ctx));
        }

    }
}

const bullets = [];
const tank = new Tank(100, 500, ctx);

const trackMouse = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    tank.mousePosition = new Vec2(mouseX, mouseY);
}


let canShoot = true;
let startT = 0;

const setShootPower = (e) => {
    if (e.button === 0) {
        startT = new Date().getTime();
    }
}



const shoot = (e) => {
    let endT = (new Date().getTime() - startT);
    startT = 0;
    if (endT >= 2000) {
        
        endT = 2000;
    }
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const tankCenterX = tank.position.x;
    const tankCenterY = tank.position.y;
    const tankHeight = tank.height + 20;
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
        bullets.push(new Bullet(bulletOffsetX, bulletOffsetY, new Vec2(bulletDirectionX, bulletDirectionY), endT, groundPosition, ctx));
        setTimeout(() => {
            canShoot = true;
        }, 1500)
    }
}
const ground = new Ground(ctx);

let deltaTime;
let oldTimeStamp;
let fps;

const loadGame = () => {


    canvas.addEventListener("mousemove", trackMouse);
    canvas.addEventListener("mousedown", setShootPower);
    canvas.addEventListener("mouseup", shoot);

    const draw = (timeStamp) => {
        deltaTime = (timeStamp - oldTimeStamp) / 1000;
        oldTimeStamp = timeStamp;

        fps = Math.round(1 / deltaTime);
        if (startT) {
            const t = (new Date().getTime() - startT);
            if (t <= 2000) {
                power.setPower((new Date().getTime() - startT));
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(groundImage, 0, 0);
        // ground.update();
        for (const hole of holes) {
            hole.update();
        }
        tank.update(deltaTime);
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            // bullet.checkCollision();
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
        power.update();
        window.requestAnimationFrame(draw);
    };

    draw();
}
window.addEventListener("load", loadGame);