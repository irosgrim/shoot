import { EntityManager } from "../entityManager";
import { EventManager } from "../eventManager";
import { socket } from "../socket";

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