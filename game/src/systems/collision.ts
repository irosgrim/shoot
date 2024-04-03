import { Active, RenderComponent } from "../components/components";
import { EntityManager } from "../entities/entityManager";
import { zoom } from "../events/eventListeners";
import { EventManager } from "../events/eventManager";
import { checkOverlap, randomRange } from "../lib/math";
import { GameState } from "../main";

export class CollisionDetectionStystem {
    gameState: GameState;
    entityManager: EntityManager;
    contexts: Map<string, CanvasRenderingContext2D>;
    eventManager: EventManager;
    gameCanvasBounds: {
        w: number,
        h: number,
    }

    constructor(gameState: GameState, entityManager: EntityManager, contexts: Map<string, CanvasRenderingContext2D>, eventManager: EventManager) {
        this.gameState = gameState;
        this.entityManager = entityManager;
        this.eventManager = eventManager;
        this.contexts = contexts;
        this.gameCanvasBounds = {
            w: 1445,
            h: 578,
        }
        // const gameCtx = this.contexts.get("gameCtx");    
        // this.gameCanvasBounds.w = gameCtx!.canvas.width;
        // this.gameCanvasBounds.h = gameCtx!.canvas.height;
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
                if (renderComponent &&  (renderComponent.position.x >= this.gameCanvasBounds.w * zoom || renderComponent.position.x <= -50 || renderComponent.position.y >= this.gameCanvasBounds.h * zoom)) {
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
                            const { data } = terrainCtx!.getImageData(currentBulletPosition.x, currentBulletPosition.y, 4, 4);
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
                        this.resetBullet(entityId, renderComponent);
                        this.eventManager.broadcast("collision", { entityId, type: isTargetCollision ? "target" : "terrain", position: currentBulletPosition, components: {renderComponent} });
                    }
                }
            }
        });
    }

    checkCollisionWithTargets(bulletRenderComponent: RenderComponent) {
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

    resetBullet(entityId: string, renderComponent: RenderComponent) {
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

    resetTarget(components: { activeComponent: Active, renderComponent: RenderComponent}) {
        const {activeComponent, renderComponent} = components;
        activeComponent.isActive = false;
        window.setTimeout(() => {
            renderComponent.position.x = randomRange(this.gameCanvasBounds.w/2, this.gameCanvasBounds.w - 10);
            renderComponent.position.y = randomRange(100, this.gameCanvasBounds.h - 100);
            activeComponent.isActive = true;
        }, 1000 + Math.random() * 2000)
    }
}