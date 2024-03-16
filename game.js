import { EventManager } from "./eventManager.js";
import { Vec2, checkOverlap, randomRange } from "./math.js";
import { RenderContext, RenderComponent, Position, Color, Velocity, Rotation, Gravity, Shape, Tag, EventListener, DamageOnCollisionComponent, IsRemoved, LifeComponent } from "./components.js";

// class MovementSystem {
//     constructor (entities) {
//         this.entities = entities;
//     }

//     update (deltaTime) {
//         this.entities.forEach(entity => {
//             const position = entity.getComponent("position");
//             const velocity = entity.getComponent("velocity");

//             if (position && velocity) {
//                 position.vec2.add(velocity.vec2).scale(deltaTime);
//             }
//         })
//     }
// }

class RenderSystem {
    constructor(entityManager, contexts, eventManagerSystem) {
        this.entityManager = entityManager;
        this.contexts = contexts;
        this.eventManagerSystem = eventManagerSystem;
    }

    update(deltaTime) {
        this.contexts.forEach((ctx ,ctxKey) => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            this.entityManager.entities.forEach(entityId => {
                const renderContext = this.entityManager.getComponent(entityId, "RenderContext");
                const tag = this.entityManager.getComponent(entityId, "Tag");
                const entityIsRemoved = this.entityManager.getComponent(entityId, "IsRemoved");

                const renderComponent = this.entityManager.getComponent(entityId, "RenderComponent");

                if (entityIsRemoved === undefined || entityIsRemoved.isRemoved === false) {
                    if (renderContext && renderContext.contextKey === ctxKey && renderComponent) {
                        const rotation = this.entityManager.getComponent(entityId, "Rotation");
                        if(tag.tag === "bullet") {
                            const velocity = this.entityManager.getComponent(entityId, "Velocity");
                            const gravity = this.entityManager.getComponent(entityId, "Gravity");
    
                            const tempVelocity = velocity.vec2.scaleNew(deltaTime);
                            renderComponent.position.add(tempVelocity);
                            velocity.vec2.add(gravity.vec2);
                            velocity.vec2.x *= 0.99; // air resistance
                            
                            this.drawBullet(ctx, renderComponent, velocity, gravity, rotation, deltaTime);
                            
                        } else {
                            this.drawEntity(ctx, {renderComponent, rotation, tag});
                        }
                    }
                }
            })
        })
    }

    drawBullet(ctx, renderComponent, velocity, gravity, rotation, deltaTime) {
        const tempVelocity = velocity.vec2.scaleNew(deltaTime);
        renderComponent.position.add(tempVelocity);
        velocity.vec2.add(gravity.vec2);
        const newRotationRadians = Math.atan2(velocity.vec2.y, velocity.vec2.x);
        ctx.save();
        ctx.translate(renderComponent.position.x + renderComponent.size.w / 2, renderComponent.position.y);
        ctx.rotate(newRotationRadians+ Math.PI / 2);
        
        ctx.fillStyle = renderComponent.color;
        ctx.beginPath();
        ctx.fillRect(-renderComponent.size.w/2, -renderComponent.size.h/2, renderComponent.size.w, renderComponent.size.h);
        ctx.fill();
        ctx.restore();
    }

    drawCannon(ctx, components) {
        const { renderComponent, rotation} = components;
        const {position, color, size} = renderComponent;
        if (rotation) {
            const rectBottomCenterX = position.x;
            const rectBottomCenterY = position.y;
            const angleDegrees = Math.round(rotation.radians * 180/Math.PI);
            ctx.save();
            ctx.translate(rectBottomCenterX, rectBottomCenterY)
            ctx.rotate(-Math.PI / 2)

            let adjustedAngleDegrees;
            if (angleDegrees > 270) {
                adjustedAngleDegrees = 0;
            } else if (angleDegrees > 180) {
                adjustedAngleDegrees = 180;
            } else {
                adjustedAngleDegrees = Math.max(0, angleDegrees);
            }

            // document.getElementById("debug").innerHTML = `
            // <p>Angle: ${adjustedAngleDegrees}</p>
            // `;
            const adjustedAngleRadians = adjustedAngleDegrees * (Math.PI / 180);
            ctx.rotate(adjustedAngleRadians);
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.fillRect(-size.w / 2, -size.h, size.w, size.h);
            ctx.restore();
            ctx.closePath();
        }
        ctx.fillRect(-size.w / 2, -size.h, size.w, size.h);
    }

    drawDefaultShape(ctx, components) {
        const { color, shape, position, size } = components.renderComponent;
        ctx.fillStyle = color;
        switch(shape) {
            case "circle":
                ctx.beginPath();
                ctx.arc(0, 0, size.size.r, 0, 2 * Math.PI);
                ctx.fill();
                break;
            case "rectangle":
                ctx.fillRect(position.x, position.y, size.w, size.h);
                break;
        }
    }

    drawEntity(ctx, components) {
        const { tag } = components;
        switch(tag && tag.tag) {
            case "cannon":
                this.drawCannon(ctx, components);
                break;
            default:
                this.drawDefaultShape(ctx, components);
                break;
        }
    }
}

const gameCanvas = document.getElementById("canvas");
const gameCtx = gameCanvas.getContext("2d", { willReadFrequently: true });
gameCanvas.width = 1200;
gameCanvas.height = 600;

const terrainCanvas = document.createElement("canvas");
const terrainCtx = terrainCanvas.getContext("2d", {willReadFrequently: true});
terrainCanvas.width = gameCanvas.width;
terrainCanvas.height = gameCanvas.height;

const scale = window.devicePixelRatio;

const groundImage = new Image()
groundImage.src = "./ground.png";

groundImage.onload= (e) => {
    terrainCtx.drawImage(groundImage, 0, 0);
}

let holes = [];

class Hole {
    constructor(x, y, width, height, shape, ctx) {
        this.position = new Vec2(x, y);
        this.width = width;
        this.height = height;
        this.shape = shape || "circle";
        this.ctx = ctx;
    }
    draw() {
        // paint and merge the hole with the terrain context
        terrainCtx.beginPath();
        terrainCtx.globalCompositeOperation = "destination-out";
        terrainCtx.fillStyle = "rgba(0, 0, 0, 255)";
        terrainCtx.arc(this.position.x, this.position.y, 20, 0, Math.PI * 2, false);
        terrainCtx.fill();
        terrainCtx.globalCompositeOperation = "source-over";
        terrainCtx.closePath();
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
        this.color = "#0480e8";
        this.ctx = ctx;
    }

    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.position.x, this.position.y, this.power, this.height);

        this.ctx.strokeStyle = "#000000";
        this.ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
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

const power = new Power(10, 10, gameCtx);

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
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
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
        this.ctx.closePath();
        this.ctx.fill();


        this.ctx.beginPath();
        this.ctx.fillStyle = "green";
        this.ctx.moveTo(this.position.x + 30, this.position.y);
        this.ctx.lineTo(this.position.x + 30, this.position.y + 20);
        this.ctx.lineTo(this.position.x + 40, this.position.y + 20);
        this.ctx.closePath();
        this.ctx.fill();
        
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
        // ctx.save();
        gameCtx.fillStyle = this.color;
        gameCtx.fillRect(this.position.x, this.position.y, this.width, this.height);
        // ctx.restore();
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
    gameCtx.save();
    gameCtx.globalAlpha = this.alpha;
    gameCtx.beginPath();
    gameCtx.arc(this.position.x, this.position.y, this.width, 0, Math.PI * 2, false);
    gameCtx.fillStyle = this.color;
    gameCtx.fill();
    gameCtx.restore();
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
    return this.position.y < gameCanvas.height + this.width*2;
  }
}

const targets = [new Target(500, 20), new Target(600, 300), new Target(250, 525)];

class Bullet {
    constructor(x, y, velocity, speed = 1, ctx) {
        this.position = new Vec2(x, y);
        this.gravity = new Vec2(0, 8);
        this.speed = speed || 0.5;
        this.velocity = velocity.scale(this.speed);
        this.ctx = ctx;
        this.width = 10;
        this.height = 20;
        this.color = "red";
        this.exploded = false;
        this.isAlive = true;
        this.particles = [];
    }

    get rotationRadians() {
        return Math.atan2(this.velocity.y, this.velocity.x);
    }

    draw() {
       if (!this.exploded) {
            gameCtx.save();
            gameCtx.translate(this.position.x + this.width / 2, this.position.y);
            gameCtx.rotate(this.rotationRadians + Math.PI / 2);
            
            gameCtx.fillStyle = this.color;
            gameCtx.beginPath();
            // ctx.arc(this.position.x + this.width/2, this.position.y, this.width/2, 0, Math.PI * 2, false);
            gameCtx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            gameCtx.fill();
            gameCtx.restore();
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
        // terrain collision check
        const checkWidth = 10; 
        const checkHeight = 1;

        const tipX = Math.floor(this.position.x + this.width / 2);
        const tipY = Math.floor(this.position.y);

        // get pixels at the tip of bullet
        const { data } = terrainCtx.getImageData(tipX, tipY, checkWidth, checkHeight);

        let collisionDetected = false;
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3] / 255;
            if (alpha === 1) {
                collisionDetected = true;
                break;
            }
        }

        if (collisionDetected || this.position.y > gameCanvas.height || this.position.x < -50 || this.position.x >= gameCanvas.width + 50) {
            this.velocity.scale(0);
            this.gravity.scale(0);
            this.makeHole();
            this.explode();
        }


        for (const target of targets) {
            if (checkOverlap(this, target)) {
                target.isAlive = false;
                targets.push(new Target(randomRange(gameCanvas.width/2, gameCanvas.width - target.width), randomRange(target.height, gameCanvas.height - target.height)));
                this.velocity.scale(0);
                this.gravity.scale(0);
                this.explode();
            }
        }
    }

     makeHole() {
        holes.push(new Hole(this.position.x, this.position.y, this.width, this.height, "circle", this.ctx));
    }
}

const bullets = [];
const tank = new Tank(80, 500, gameCtx);
const eventManager = new EventManager();


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
    const rect = gameCanvas.getBoundingClientRect();
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
        bullets.push(new Bullet(bulletOffsetX, bulletOffsetY, new Vec2(bulletDirectionX, bulletDirectionY), endT, gameCtx));
        setTimeout(() => {
            canShoot = true;
        }, 1500)
    }
}

let deltaTime;
let oldTimeStamp;
let fps;




class EventManagerSystem {
  constructor(eventManager) {
    this.eventManager = eventManager;
  }
}

class MouseTrackingSystem {
  constructor(entityManager, eventManager) {
    this.entityManager = entityManager;
    this.eventManager = eventManager;
    this.init();
  }

  init() {
    this.eventManager.listen("mouse-rotation", this.handleMouseMove.bind(this));
  }

  handleMouseMove(data) {
    this.entityManager.entities.forEach(entityId => {
        const eventListener = this.entityManager.getComponent(entityId, "EventListener");
        if (eventListener && eventListener.listener === "mouse-rotation") {
            const { position } = this.entityManager.getComponent(entityId, "RenderComponent");
            const rotation = this.entityManager.getComponent(entityId, "Rotation");
            const rectBottomCenterX = position.x;
            const rectBottomCenterY = position.y;
            const angleRadians = Math.atan2(data.y - rectBottomCenterY, data.x - rectBottomCenterX) + Math.PI;
            if (rotation) {
                rotation.radians = angleRadians;
            }
        }
        });
  }
}

class EntityManager {
    constructor() {
        this.nextEntityId = 0;
        this.entities = new Set();
        this.componentsByName = new Map();
    }

    createEntity() {
        const id = this.nextEntityId++;
        this.entities.add(id);
        return id;
    }

    removeEntity(entityId) {
        this.entities.delete(entityId);
        for (const componentSet of this.componentsByName.values()) {
        componentSet.delete(entityId);
        }
    }

    addComponent(entityId, component) {
        const componentName = component.name;
        if (!this.componentsByName.has(componentName)) {
            this.componentsByName.set(componentName, new Map());
        }
        this.componentsByName.get(componentName).set(entityId, component);
    }

    getComponent(entityId, componentClass) {
        return this.componentsByName.get(componentClass)?.get(entityId);
    }

    getAllComponents(entityId) {
        const components = [];
        this.componentsByName.forEach(c => {
            const comp = c.get(entityId);
            if (comp) {
                components.push(comp);
            }
        })
        return components;
    }

    getEntitiesWithComponent(componentClass) {
        return this.componentsByName.get(componentClass) || new Map();
    }


    createPlayer(position) {
        const tankBaseEntityId = this.createEntity();
        this.addComponent(tankBaseEntityId, new RenderComponent("rectangle", position, "blue", {w: 100, h: 50}));
        this.addComponent(tankBaseEntityId, new RenderContext("gameCtx"));
        this.addComponent(tankBaseEntityId, new Tag("tankbase"))

    
        const turretEntityId = this.createEntity();
        this.addComponent(turretEntityId, new RenderComponent("rectangle", {x: position.x + 50, y: position.y - 10}, "red", {w: 10, h: 40}));
        this.addComponent(turretEntityId, new Rotation(0));
        this.addComponent(turretEntityId, new EventListener("mouse-rotation"));
        this.addComponent(turretEntityId, new RenderContext("gameCtx"));
        this.addComponent(turretEntityId, new Tag("cannon"))
    }

    createBullet(x, y, velocity, speed = 1, radians, removed = false) {
        const bulletEntityId = this.createEntity();
        this.addComponent(bulletEntityId, new RenderComponent("rectangle", {x, y}, "pink", {w: 10, h:20}));
        this.addComponent(bulletEntityId, new Rotation(radians));
        this.addComponent(bulletEntityId, new Velocity(velocity.x * speed, velocity.y * speed));
        this.addComponent(bulletEntityId, new Gravity(0, 2));
        this.addComponent(bulletEntityId, new RenderContext("gameCtx"));
        this.addComponent(bulletEntityId, new Tag("bullet"))
        this.addComponent(bulletEntityId, new IsRemoved(removed));
    }

    createTarget(x, y, removed = false) {
        const targetEntity = this.createEntity();
        this.addComponent(targetEntity, new RenderComponent("rectangle", {x, y}, "red", {w: 10, h:100}));
        this.addComponent(targetEntity, new RenderContext("gameCtx"));
        this.addComponent(targetEntity, new Tag("target"))
        this.addComponent(targetEntity, new DamageOnCollisionComponent(100));
        this.addComponent(targetEntity, new LifeComponent(100));
        this.addComponent(targetEntity, new IsRemoved(removed));
    }
}

class EventListeners {
    constructor(gameCanvas, entityManager, eventManager) {
        this.gameCanvas = gameCanvas;
        this.entityManager = entityManager;
        this.eventManager = eventManager;
        this.startT = 0;
        this.init();
    }
    init() {
        this.gameCanvas.addEventListener("mousemove", this.trackMouse.bind(this));
        this.gameCanvas.addEventListener("mousedown", this.setShootPower.bind(this));
        this.gameCanvas.addEventListener("mouseup", this.shoot.bind(this));
    }
    trackMouse(e) {
        const rect = this.gameCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        this.eventManager.broadcast("mouse-rotation", {x: mouseX, y: mouseY})
    }
    setShootPower = (e) => {
        if (e.button === 0) {
            this.startT = new Date().getTime();
        }
    }
    shoot(e) {
        let endT = (new Date().getTime() - this.startT);
        this.startT = 0;
        if (endT >= 1000) {
            endT = 1000;
        }
        const rect = this.gameCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        let cannon;
        let rotation;
        for (const entityId of this.entityManager.entities ) {
            const tag = this.entityManager.getComponent(entityId, "Tag");
            if (tag.tag === "cannon") {
                cannon = this.entityManager.getComponent(entityId, "RenderComponent");
                rotation = this.entityManager.getComponent(entityId, "Rotation");
                break;
            }
        }
        const tankCenterX = cannon.position.x;
        const tankCenterY = cannon.position.y;
        const tankHeight = cannon.size.h + 20;
        const bulletSize = 10;

        // calculate distance from mouse click to player center
        const distX = mouseX - tankCenterX;
        const distY = mouseY - tankCenterY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        const bulletDirectionX = distX / distance; 
        const bulletDirectionY = distY / distance; 

        const bulletOffsetX = tankCenterX + bulletDirectionX * tankHeight - bulletSize / 2;
        const bulletOffsetY = tankCenterY + bulletDirectionY * tankHeight - bulletSize / 2;

        // if (canShoot) {
            // canShoot = false;
            // bullets.push(new Bullet(bulletOffsetX, bulletOffsetY, new Vec2(bulletDirectionX, bulletDirectionY), endT, gameCtx));
            this.entityManager.createBullet(bulletOffsetX, bulletOffsetY, {x: bulletDirectionX, y: bulletDirectionY}, endT, rotation.radians);
            // setTimeout(() => {
            //     canShoot = true;
            // }, 1500)
        // }
    }
}


class CollisionDetectionStystem {
    constructor(entityManager, contexts, eventManager) {
        this.entityManager = entityManager;
        this.eventManager = eventManager;
        this.contexts = contexts;
        this.gameCanvasBounds = {
            w: 0,
            h: 0,
        }
        const gameCtx = this.contexts.get("gameCtx");
        this.gameCanvasBounds.w = gameCtx.canvas.width;
        this.gameCanvasBounds.h = gameCtx.canvas.height;
    }

    init () {}

    checkBulletCollision() {}

    update () {
        this.entityManager.entities.forEach(entityId => {
            const tag = this.entityManager.getComponent(entityId, "Tag");
            const componentIsRemoved = this.entityManager.getComponent(entityId, "IsRemoved");

            if (tag.tag === "bullet" && !componentIsRemoved.isRemoved) {
                const renderComponent = this.entityManager.getComponent(entityId, "RenderComponent");
                // check out of bounds
                if (renderComponent &&  (renderComponent.position.x >= this.gameCanvasBounds.w || renderComponent.position.x <= -50 || renderComponent.position.y >= this.gameCanvasBounds.h)) {
                    this.resetBullet(entityId, renderComponent);
                }
                // check collision with targets
                if (renderComponent) {
                    const isRemoved = this.checkCollisionWithTargets(renderComponent);
                    if (isRemoved) {
                        this.resetBullet(entityId, renderComponent);
                        // create explosion
                    }
                }

                // check collision with terrain
                console.log("here")
            }
        });
    }

    checkCollisionWithTargets(bulletRenderComponent) {
        const tags = this.entityManager.getEntitiesWithComponent("Tag");
        for (const [targetEntityId, value] of tags)  {
            if (value.tag === "target") {
                const targetRenderComponent = this.entityManager.getComponent(targetEntityId, "RenderComponent");
                const componentIsRemoved = this.entityManager.getComponent(targetEntityId, "IsRemoved");
                if (componentIsRemoved === undefined || componentIsRemoved.isRemoved === false) {
                    const overlaps = checkOverlap(bulletRenderComponent, targetRenderComponent);
                    if (overlaps) {
                        this.resetTarget(targetEntityId, targetRenderComponent);
                        return true;
                    }
                }
            }
        };
        return false;
    }

    resetBullet(entityId, renderComponent) {
        const isRemovedComponent = this.entityManager.getComponent(entityId, "IsRemoved");
        const velocity = this.entityManager.getComponent(entityId, "Velocity");
        const rotation = this.entityManager.getComponent(entityId, "Rotation");

        renderComponent.position.x = 0;
        renderComponent.position.y = 0;
        velocity.vec2.x = 0;
        velocity.vec2.y = 0;
        rotation.radians = 0;
        isRemovedComponent.isRemoved = true;
    }

    resetTarget(entityId, renderComponent) {
        const isRemovedComponent = this.entityManager.getComponent(entityId, "IsRemoved");
        isRemovedComponent.isRemoved = true;
        
    }

    createExplosion() {}
}

const loadGame = () => {
    const contexts = new Map();
    contexts.set("terrainCtx", terrainCtx);
    contexts.set("gameCtx", gameCtx);

    const entityManager = new EntityManager();

    entityManager.createPlayer({x: 10, y: gameCanvas.height - 100});
    entityManager.createBullet(100, 0, 0, 0, 0, true);
    entityManager.createTarget(400, 50);
    entityManager.createTarget(600, 400);
    entityManager.createTarget(740, 200);



    const eventListeners = new EventListeners(gameCanvas, entityManager, eventManager);

    const renderSystem = new RenderSystem(entityManager, contexts, eventManager);
    const mouseTrackingSystem = new MouseTrackingSystem(entityManager, eventManager);
    const collisionDetectionSystem = new CollisionDetectionStystem(entityManager, contexts, eventManager);

    // gameCanvas.addEventListener("mousemove", trackMouse);
    // gameCanvas.addEventListener("mousedown", setShootPower);
    // gameCanvas.addEventListener("mouseup", shoot);

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
        renderSystem.update(deltaTime);
        collisionDetectionSystem.update();
        // gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        // // terrain layer copied from other canvas for alpha detection
        // gameCtx.drawImage(terrainCanvas, 0, 0);
        // for (const hole of holes) {
        //     hole.update();
        // }
        // // delete the "holes" after being painted to canvas
        // holes = [];
        // tank.update(deltaTime);
        // for (let i = 0; i < bullets.length; i++) {
        //     const bullet = bullets[i];
        //     // bullet.checkCollision();
        //     bullet.update(deltaTime);
        //     if (!bullet.isAlive) {
        //         bullets.splice(i, 1);
        //     }
        // }

        // for (let i = 0; i < targets.length; i++) {
        //     const target = targets[i];
        //     if (target.isAlive) {
        //         target.draw();
        //     } else {
        //         targets.splice(i, 1);
        //     }
        // }
        // power.update();
        window.requestAnimationFrame(draw);
    };

    draw();
}
window.addEventListener("load", loadGame);
