import { Alpha, RenderComponent, Rotation, Tag, Velocity } from "../components";
import { EntityManager } from "../entityManager";
import { EventManager } from "../eventManager";

export class RenderSystem {
    gameState: any;
    entityManager: EntityManager;
    terrainCanvas: HTMLCanvasElement;
    contexts: Map<string, CanvasRenderingContext2D>;
    eventManager: EventManager;

    constructor(gameState: any, entityManager: EntityManager, terrainCanvas: HTMLCanvasElement, contexts: Map<string, CanvasRenderingContext2D>, eventManager: EventManager) {
        this.gameState = gameState;
        this.entityManager = entityManager;
        this.contexts = contexts;
        this.terrainCanvas = terrainCanvas
        this.eventManager = eventManager;
    }

    update() {
        const gameCtx = this.contexts.get("gameCtx");
        gameCtx!.clearRect(0, 0, gameCtx!.canvas.width, gameCtx!.canvas.height);
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
                        this.drawBullet(gameCtx!, {renderComponent, velocity});
                        
                    } else {
                        this.drawEntity(gameCtx!, {renderComponent, rotation, tag, alpha, velocity});
                    }
                }
            }
        })
    }

    drawBullet(ctx: CanvasRenderingContext2D, components: {renderComponent: RenderComponent, velocity: Velocity}) {
        const { renderComponent, velocity } = components;
        const newRotationRadians = Math.atan2(velocity.vec2.y, velocity.vec2.x);
        ctx.save();
        ctx.translate(renderComponent.position.x + renderComponent.size.w! / 2, renderComponent.position.y);
        ctx.rotate(newRotationRadians + Math.PI / 2);
        
        ctx.fillStyle = renderComponent.color;
        ctx.drawImage(renderComponent.image!, -renderComponent.size.w!/2, -renderComponent.size.h!/2, renderComponent.size.w!, renderComponent.size.h!);
        
        // get the coords of the bullet tip. This will be used for alpha detection against the terrain
        const matrix = ctx.getTransform(); 
        const tipPosition = matrix.transformPoint(new DOMPoint(0, -renderComponent.size.h!/2));
        this.gameState.updateBulletPosition(tipPosition);

        ctx.restore();
    }

    drawCannon(ctx: CanvasRenderingContext2D, components: { renderComponent: RenderComponent, rotation: Rotation}) {
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
            ctx.drawImage(renderComponent.image!, -size.w! / 2, -size.h!, renderComponent.size.w!, renderComponent.size.h!);
            ctx.restore();
        }
    }

    drawDefaultShape(ctx: CanvasRenderingContext2D, components: {renderComponent: RenderComponent, alpha: Alpha}) {
        const renderComponent = components.renderComponent;
        
        ctx.fillStyle = renderComponent.color;
        switch(renderComponent.shape) {
            case "circle":
                if (components.alpha) {
                    ctx.globalAlpha = components.alpha.alpha;
                }
                ctx.save();
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(renderComponent.position.x, renderComponent.position.y, renderComponent.size.r!, 0, 2 * Math.PI, false);
                ctx.fillStyle = renderComponent.color;
                ctx.fill();
                ctx.restore();
                break;
            case "rectangle":
                ctx.fillRect(renderComponent.position.x, renderComponent.position.y, renderComponent.size.w!, renderComponent.size.h!);
                break;
            case "image":
                ctx.drawImage(renderComponent.image!, renderComponent.position.x, renderComponent.position.y, renderComponent.size.w!, renderComponent.size.h!);
                break;
            }
        ctx.globalAlpha = 1;
    }
    
    drawTerrain(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.terrainCanvas, 0, 0);
    }

    drawEntity(ctx: CanvasRenderingContext2D, components: { tag: Tag, alpha: Alpha, renderComponent: RenderComponent, rotation: Rotation, velocity: Velocity}) {
        const { tag, alpha } = components;
        let globalAlpha = 1;
        if (alpha) {
            globalAlpha = alpha.alpha;
        }
        switch(tag && tag.tag) {
            case "cannon":
                this.drawCannon(ctx, components);
                break;
            case "terrain":
                this.drawTerrain(ctx);
                break;
          
            default:
                this.drawDefaultShape(ctx, components);
                break;
        }
    }
}