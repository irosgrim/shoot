import { EntityManager } from "../entities/entityManager";
import { EventManager } from "../events/eventManager";
import { socket } from "../socket/socket";

export class MouseTrackingSystem {
    entityManager: EntityManager;
    eventManager: EventManager;
    constructor(entityManager: EntityManager, eventManager: EventManager) {
        this.entityManager = entityManager;
        this.eventManager = eventManager;
        this.init();
    }

    init() {
        this.eventManager.listen("mouse-rotation", this.handleMouseMove.bind(this));
        this.eventManager.listen("key-rotation", this.updateEntityRotation.bind(this))
    }

    updateEntityRotation(rotate: "LEFT" | "RIGHT") {
        this.entityManager.entities.forEach(entityId => {
            const eventListener = this.entityManager.getComponent(entityId, "EventListener");
            if (eventListener && eventListener.listener === "key-rotation") {
                const eId = socket.getId() ?? entityId;
                const rotation = this.entityManager.getComponent(eId, "Rotation");
                if (!rotation) return;
            
                const rotationSpeed = 0.05;
            
                if (rotate === "LEFT") {
                    rotation.radians -= rotationSpeed;
                } 
                if (rotate === "RIGHT") {
                    rotation.radians += rotationSpeed;
                }
            }

        });
    }

  handleMouseMove(data: any) {
    this.entityManager.entities.forEach(entityId => {
        const eventListener = this.entityManager.getComponent(entityId, "EventListener");
        if (eventListener && eventListener.listener === "mouse-rotation") {
            const eId = socket.getId() ?? entityId;
            const { position } = this.entityManager.getComponent(eId, "RenderComponent");
            const rotation = this.entityManager.getComponent(eId, "Rotation");
            const rectBottomCenterX = position.x;
            const rectBottomCenterY = position.y;
            const angleRadians = Math.atan2(data.y - rectBottomCenterY, data.x - rectBottomCenterX) + Math.PI;
            if (rotation) {
                rotation.radians = angleRadians;
                socket.emit("update-entity", {
                    entityId: eId,
                    components: [
                        {
                            type: "Rotation",
                            data: {
                                radians: angleRadians,
                            }
                        }
                    ]
                })
            }
        }
        });
  }
}