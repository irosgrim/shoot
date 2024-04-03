import { Gravity, RenderComponent, Velocity } from "../components/components";
import { EntityManager } from "../entities/entityManager";
import { EventManager } from "../events/eventManager";
import { Vec2 } from "../lib/math";

export class MovementSystem {
    entityManager: EntityManager;
    eventManager: EventManager;
    constructor (entityManager: EntityManager, eventManager: EventManager) {
        this.entityManager = entityManager;
        this.eventManager = eventManager;
    }

    update (deltaTime: number) {
        this.entityManager.entities.forEach(entityId => {
            const renderComponent: RenderComponent = this.entityManager.getComponent(entityId, "RenderComponent");
            const velocityComponent: Velocity = this.entityManager.getComponent(entityId, "Velocity");
            const active = this.entityManager.getComponent(entityId, "Active");
            const tag = this.entityManager.getComponent(entityId, "Tag");
            const gravity: Gravity = this.entityManager.getComponent(entityId, "Gravity");

            if (renderComponent && velocityComponent && (active && active.isActive === true)) {
                if (tag && tag.tag === "bullet") {
                    const tempVelocity = velocityComponent.vec2.scaleNew(deltaTime);
                    renderComponent.position.add(tempVelocity);
                    velocityComponent.vec2.add(gravity.vec2);
                    velocityComponent.vec2.multiply({x: 0.999}).round();

                    const wind = {x: -12, y: 1}; // wind vector: moderate wind blowing to the left
                    
                    velocityComponent.vec2.add(wind).round();
                    
                    // air resistance/friction 
                    velocityComponent.vec2.multiply({x: 0.999, y: 0.999}).round();
                    
                }
                if (tag && tag.tag === "particle") {
                    const alphaComponent = this.entityManager.getComponent(entityId, "Alpha");
                    velocityComponent.vec2.add(gravity.vec2);
                    velocityComponent.vec2.multiply({x: 0.99})
                    renderComponent.position.add(velocityComponent.vec2);

                    // set alpha decay
                    alphaComponent.alpha -= 0.3 * deltaTime;
                    alphaComponent.alpha = Math.max(0, alphaComponent.alpha);

                    if (alphaComponent.alpha === 0) {
                        velocityComponent.vec2.scale(0);
                        active.isActive = false;
                    }
                }
               if (tag && tag.tag === "wind-particle") {
                    const dampeningFactor = 0.99;
                    const windStrength = -100;
                    const windDirection = 10;
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