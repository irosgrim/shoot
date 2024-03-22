import { checkOverlap, randomRange, Vec2 } from "./math.js";

export class ExplosionSystem {
    constructor(entityManager, eventManager, terrainCtx) {
        this.entityManager = entityManager;
        this.eventManager = eventManager;
        this.terrainCtx = terrainCtx;
        this.init();
    }
    
    init() {
        this.eventManager.listen("collision", this.handleCollision.bind(this));

    }

    handleCollision({ entityId, type, position, components }) {
        if (type === "terrain") {
            this.createExplosion(position);
            this.createHole(position);
        } 
        
         if (type === "target") {
            this.createExplosion(position);
        } 
    }

    createHole(position) {
        // paint and merge the hole with the terrain context
        this.terrainCtx.beginPath();
        this.terrainCtx.fillStyle = "red";
        this.terrainCtx.globalCompositeOperation = "destination-out";
        this.terrainCtx.arc(position.x, position.y, 20, 0, Math.PI * 2, false);
        this.terrainCtx.fill();

        const radiusOfEffect = 20; 
        const minRadius = 1; 
        const maxRadius = 10; 

        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2; 
            const distance = (Math.random() * radiusOfEffect) + 10; 
            const smallCircleX = position.x + distance * Math.cos(angle);
            const smallCircleY = position.y + distance * Math.sin(angle);
            const smallCircleRadius = minRadius + Math.random() * (maxRadius - minRadius); 
            
            this.terrainCtx.beginPath();
            this.terrainCtx.arc(smallCircleX, smallCircleY, smallCircleRadius, 0, Math.PI * 2, false);
            this.terrainCtx.fill();
        }

        this.terrainCtx.globalCompositeOperation = "source-over";
        this.terrainCtx.closePath();
    }

    createExplosion(position) {
        // activate particles from entity pool
        this.entityManager.entities.forEach(entityId => {
            const tag = this.entityManager.getComponent(entityId, "Tag");
            if (tag && tag.tag === "particle") {
                const active = this.entityManager.getComponent(entityId, "Active");
                const alphaComponent = this.entityManager.getComponent(entityId, "Alpha");
                alphaComponent.alpha = 1;
                active.isActive = true;

                const xVel = (Math.random() - 0.5) * (Math.random() * 6);
                const yVel = (Math.random() - 1) * (Math.random() * 5);
                const particleRenderComponent = this.entityManager.getComponent(entityId, "RenderComponent");
                const particleVelocityComponent = this.entityManager.getComponent(entityId, "Velocity");
                particleVelocityComponent.vec2.x = xVel;
                particleVelocityComponent.vec2.y = yVel;
                particleRenderComponent.position.x = position.x;
                particleRenderComponent.position.y = position.y;
            }
        })
    }
}

export class MovementSystem {
    constructor (entityManager, eventManagerSystem) {
        this.entityManager = entityManager;
        this.eventManagerSystem = eventManagerSystem;
    }

    update (deltaTime) {
        this.entityManager.entities.forEach(entityId => {
            const renderComponent = this.entityManager.getComponent(entityId, "RenderComponent");
            const velocityComponent = this.entityManager.getComponent(entityId, "Velocity");
            const active = this.entityManager.getComponent(entityId, "Active");
            const tag = this.entityManager.getComponent(entityId, "Tag");
            const gravity = this.entityManager.getComponent(entityId, "Gravity");

            if (renderComponent && velocityComponent && (active && active.isActive === true)) {
                if (tag && tag.tag === "bullet") {
                    const tempVelocity = velocityComponent.vec2.scaleNew(deltaTime);
                    renderComponent.position.add(tempVelocity);
                    velocityComponent.vec2.add(gravity.vec2);
                    velocityComponent.vec2.x *= 0.999;
                }
                if (tag && tag.tag === "particle") {
                    const alphaComponent = this.entityManager.getComponent(entityId, "Alpha");
                    velocityComponent.vec2.add(gravity.vec2);

                    velocityComponent.vec2.x *= 0.99; // air resistance
                    renderComponent.position.x += velocityComponent.vec2.x;
                    renderComponent.position.y += velocityComponent.vec2.y;

                    // set alpha decay
                    alphaComponent.alpha -= 0.6 * deltaTime;
                    alphaComponent.alpha = Math.max(0, alphaComponent.alpha);

                    if (alphaComponent.alpha === 0) {
                        velocityComponent.vec2.scale(0);
                        active.isActive = false;
                    }
                }
               if (tag && tag.tag === "wind-particle") {
                    const dampeningFactor = 0.99;
                    const windStrength = -100;
                    const windDirection = 0;
                    const windVector = new Vec2(windStrength, windDirection);
                    velocityComponent.vec2.add(windVector.scaleNew(deltaTime));
                    const tempVelocity = velocityComponent.vec2.scaleNew(deltaTime);
                    renderComponent.position.add(tempVelocity);
                    velocityComponent.vec2.add(gravity.vec2); 
                    
                    velocityComponent.vec2.multiply(new Vec2(dampeningFactor, dampeningFactor));
                }

            }
        })
    }
}

export class RenderSystem {
    constructor(gameState, entityManager, terrainCanvas, contexts, eventManagerSystem) {
        this.gameState = gameState;
        this.entityManager = entityManager;
        this.contexts = contexts;
        this.terrainCanvas = terrainCanvas
        this.eventManagerSystem = eventManagerSystem;
    }

    update(deltaTime) {
        const gameCtx = this.contexts.get("gameCtx");
        gameCtx.clearRect(0, 0, gameCtx.canvas.width, gameCtx.canvas.height);
        this.entityManager.entities.forEach(entityId => {
            const renderContext = this.entityManager.getComponent(entityId, "RenderContext");
            const tag = this.entityManager.getComponent(entityId, "Tag");
            const active = this.entityManager.getComponent(entityId, "Active");

            const renderComponent = this.entityManager.getComponent(entityId, "RenderComponent");

            if (active !== undefined && active.isActive === true) {
                if (renderContext && renderContext.contextKey === "gameCtx" && renderComponent) {
                    const rotation = this.entityManager.getComponent(entityId, "Rotation");
                    const velocity = this.entityManager.getComponent(entityId, "Velocity");
                    const alpha = this.entityManager.getComponent(entityId, "Alpha");

                    if(tag.tag === "bullet") {
                        this.drawBullet(gameCtx, {renderComponent, velocity});
                        
                    } else {
                        this.drawEntity(gameCtx, {renderComponent, rotation, tag, alpha, velocity});
                    }
                }
            }
        })
    }

    drawBullet(ctx, components) {
        const { renderComponent, velocity } = components;
        const newRotationRadians = Math.atan2(velocity.vec2.y, velocity.vec2.x);
        ctx.save();
        ctx.translate(renderComponent.position.x + renderComponent.size.w / 2, renderComponent.position.y);
        ctx.rotate(newRotationRadians + Math.PI / 2);
        
        ctx.fillStyle = renderComponent.color;
        ctx.drawImage(renderComponent.image, -renderComponent.size.w/2, -renderComponent.size.h/2, renderComponent.size.w, renderComponent.size.h);
        
        // get the coords of the bullet tip. This will be used for alpha detection against the terrain
        const matrix = ctx.getTransform(); 
        const tipPosition = matrix.transformPoint(new DOMPoint(0, -renderComponent.size.h/2));
        this.gameState.updateBulletPosition(tipPosition);

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
            ctx.drawImage(renderComponent.image, -size.w / 2, -size.h, renderComponent.size.w, renderComponent.size.h);
            ctx.restore();
        }
    }

    drawDefaultShape(ctx, components) {
        const renderComponent = components.renderComponent;
        
        ctx.fillStyle = renderComponent.color;
        switch(renderComponent.shape) {
            case "circle":
                if (components.alpha) {
                    ctx.globalAlpha = components.alpha.alpha;
                }
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(renderComponent.position.x, renderComponent.position.y, renderComponent.size.r, 0, 2 * Math.PI, false);
                ctx.fillStyle = renderComponent.color;
                ctx.fill();
                ctx.restore();
                break;
            case "rectangle":
                ctx.fillRect(renderComponent.position.x, renderComponent.position.y, renderComponent.size.w, renderComponent.size.h);
                break;
            case "image":
                ctx.drawImage(renderComponent.image, renderComponent.position.x, renderComponent.position.y, renderComponent.size.w, renderComponent.size.h);
                break;
            }
        ctx.globalAlpha = 1;
    }
    
    drawTerrain(ctx, components) {
        ctx.drawImage(this.terrainCanvas, 0, 0);
    }

    drawEntity(ctx, components) {
        const { tag, alphaComponent } = components;
        let alpha = 1;
        if (alphaComponent) {
            alpha = alphaComponent.alpha;
        }
        switch(tag && tag.tag) {
            case "cannon":
                this.drawCannon(ctx, components);
                break;
            case "terrain":
                this.drawTerrain(ctx, components);
                break;
          
            default:
                this.drawDefaultShape(ctx, components);
                break;
        }
    }
}

export class CollisionDetectionStystem {
    constructor(gameState, entityManager, contexts, eventManager) {
        this.gameState = gameState;
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

    update () {
        this.entityManager.entities.forEach(entityId => {
            const tag = this.entityManager.getComponent(entityId, "Tag");
            const active = this.entityManager.getComponent(entityId, "Active");
            const renderComponent = this.entityManager.getComponent(entityId, "RenderComponent");
             if (tag.tag === "wind-particle" && active.isActive) {
                if (renderComponent &&  (renderComponent.position.x >= this.gameCanvasBounds.w || renderComponent.position.x <= -50 || renderComponent.position.y >= this.gameCanvasBounds.h)) {
                    renderComponent.position.x = Math.round(Math.random() * this.gameCanvasBounds.w);
                    renderComponent.position.y = Math.round(Math.random() * -100);

                }
             }
            if (tag.tag === "bullet" && active.isActive) {
                // check out of bounds
                if (renderComponent &&  (renderComponent.position.x >= this.gameCanvasBounds.w || renderComponent.position.x <= -50 || renderComponent.position.y >= this.gameCanvasBounds.h)) {
                    this.resetBullet(entityId, renderComponent);
                }
                if (renderComponent) {
                    // check collision with targets
                    const isTargetCollision = this.checkCollisionWithTargets(renderComponent);

                    // check collision with terrain
                    let terrainCollision = false;
                    const currentBulletPosition = this.gameState.getBulletPosition();
                    if (!isTargetCollision) {
                        // get pixels at the tip of bullet
                        if (currentBulletPosition) {
                            const terrainCtx = this.contexts.get("terrainCtx");
                            const { data } = terrainCtx.getImageData(currentBulletPosition.x, currentBulletPosition.y, 1, 1);
                            // if alpha 1, then collide
                            for (let i = 0; i < data.length; i += 4) {
                                const alpha = data[i + 3] / 255;
                                if (alpha === 1) {
                                    terrainCollision = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (isTargetCollision || terrainCollision) {
                        this.eventManager.broadcast("collision", { entityId, type: isTargetCollision ? "target" : "terrain", position: currentBulletPosition, components: {renderComponent} });
                        this.resetBullet(entityId, renderComponent);
                    }
                }
            }
        });
    }

    checkCollisionWithTargets(bulletRenderComponent) {
        const tags = this.entityManager.getEntitiesWithComponent("Tag");
        for (const [targetEntityId, value] of tags)  {
            if (value.tag === "target") {
                const targetRenderComponent = this.entityManager.getComponent(targetEntityId, "RenderComponent");
                const active = this.entityManager.getComponent(targetEntityId, "Active");
                if (active !== undefined && active.isActive === true) {
                    const overlaps = checkOverlap(bulletRenderComponent, targetRenderComponent);
                    if (overlaps) {
                        this.resetTarget({renderComponent: targetRenderComponent, activeComponent: active});
                        return true;
                    }
                }
            }
        };
        return false;
    }

    resetBullet(entityId, renderComponent) {
        const active = this.entityManager.getComponent(entityId, "Active");
        const velocity = this.entityManager.getComponent(entityId, "Velocity");
        const rotation = this.entityManager.getComponent(entityId, "Rotation");

        renderComponent.position.x = 0;
        renderComponent.position.y = 0;
        velocity.vec2.x = 0;
        velocity.vec2.y = 0;
        rotation.radians = 0;
        active.isActive = false;
        this.gameState.updateBulletPosition(null);
    }

    resetTarget(components) {
        const {activeComponent, renderComponent} = components;
        activeComponent.isActive = false;
        window.setTimeout(() => {
            renderComponent.position.x = randomRange(this.gameCanvasBounds.w/2, this.gameCanvasBounds.w - 10);
            renderComponent.position.y = randomRange(100, this.gameCanvasBounds.h - 100);
            activeComponent.isActive = true;
        }, 1000 + Math.random() * 15000)
    }
}

export class MouseTrackingSystem {
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