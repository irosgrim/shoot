import { EntityManager } from "./entityManager";
import { EventManager } from "./eventManager.js";
import { socket } from "./socket.js";

export class EventListeners {
    gameCanvas: HTMLCanvasElement;
    entityManager: EntityManager;
    eventManager: EventManager;
    startT: number;

    constructor(gameCanvas: HTMLCanvasElement, entityManager: EntityManager, eventManager: EventManager) {
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
    trackMouse(e: MouseEvent) {
        const rect = this.gameCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        this.eventManager.broadcast("mouse-rotation", {x: mouseX, y: mouseY})
    }
    setShootPower = (e: MouseEvent) => {
        if (e.button === 0) {
            this.startT = new Date().getTime();
        }
    }
    shoot(e: MouseEvent) {
        let endT = (new Date().getTime() - this.startT);
        this.startT = 0;
        if (endT >= 1500) {
            endT = 1500;
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
        const tankHeight = cannon.size.h + 10;
        const bulletSize = 10;

        // calculate distance from mouse click to player center
        const distX = mouseX - tankCenterX;
        const distY = mouseY - tankCenterY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        const bulletDirectionX = distX / distance; 
        const bulletDirectionY = distY / distance; 

        const bulletOffsetX = tankCenterX + bulletDirectionX * tankHeight - bulletSize / 2;
        const bulletOffsetY = tankCenterY + bulletDirectionY * tankHeight - bulletSize / 2;
        const payload = {position: {x: bulletOffsetX, y: bulletOffsetY}, velocity: {x: bulletDirectionX, y: bulletDirectionY}, speed: endT, rotation: rotation.radians};
        this.eventManager.broadcast("shoot", payload)
        socket.emit("update-entity", {
                    entityId: "bullet",
                    components: [
                        {
                            type: "Position",
                            data: {
                                position: {x: bulletOffsetX, y: bulletOffsetY},
                            }
                        },
                        {
                            type: "Velocity",
                            data: {x: bulletDirectionX, y: bulletDirectionY}
                        },
                        {
                            type: "Speed",
                            data: {
                                speed: endT,
                            }
                        },
                        {
                            type: "Rotation",
                            data: {
                                radians: rotation.radians,
                            }
                        }
                    ]
                })
    }
}
