import { EntityManager } from "../entities/entityManager.js";
import { EventManager } from "./eventManager.js";
import { socket } from "../socket/socket.js";
const player1Power = document.getElementById("player1-power");

export class EventListeners {
    gameCanvas: HTMLCanvasElement;
    entityManager: EntityManager;
    eventManager: EventManager;
    startT: number = 0;
    powerIncreaseInterval: number | null;

    constructor(gameCanvas: HTMLCanvasElement, entityManager: EntityManager, eventManager: EventManager) {
        this.gameCanvas = gameCanvas;
        this.entityManager = entityManager;
        this.eventManager = eventManager;
        this.powerIncreaseInterval = null;
        this.init();
    }
    init() {
        // this.gameCanvas.addEventListener("mousemove", this.trackMouse.bind(this));
        // this.gameCanvas.addEventListener("mousedown", this.setShootPower.bind(this));
        // this.gameCanvas.addEventListener("mouseup", this.shoot.bind(this));
        document.addEventListener('keydown', this.keyDown.bind(this));
        document.addEventListener('keyup', this.keyUp.bind(this));
    }

    keyDown(e: KeyboardEvent) {
        e.preventDefault();
        const key = e.code;
        if (key === "ArrowLeft" || key === "ArrowRight") {
            this.eventManager.broadcast("key-rotation", key === "ArrowLeft" ? "LEFT" : "RIGHT");
        }

        if (key === "Space" && !this.powerIncreaseInterval) {
           e.preventDefault();
            this.startT = new Date().getTime();
            this.powerIncreaseInterval = setInterval(() => {
                let currentTime = new Date().getTime();
                let duration = currentTime - this.startT;
                this.updatePowerDisplay(duration);
            }, 50);
        }
    }

    keyUp(e: KeyboardEvent) {
        const key = e.code;
            if (key === "Space" && this.powerIncreaseInterval) {
                clearInterval(this.powerIncreaseInterval);
                this.powerIncreaseInterval = null;
                this.finalizePower(); 
                this.shoot();
            }
    }

    updatePowerDisplay(duration: number) {
        // TODO: don't use hardcoded values
        const maxPower = 450;
        const maxPowerDuration = 2000;
        let power = Math.min(duration, maxPowerDuration) / maxPowerDuration * maxPower;
        player1Power!.style.width = `${(power / maxPower) * 100}%`;
    }

    finalizePower() {
        setTimeout(() => player1Power!.style.width = "0%", 3000);
    }

    trackMouse(e: MouseEvent) {
        const rect = this.gameCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        this.eventManager.broadcast("mouse-rotation", {x: mouseX, y: mouseY})
    }
    setShootPower = () => {
        if (this.startT === 0) {
            this.startT = new Date().getTime();
        }
    }
    shoot() {
        if (this.startT !== 0) {
            let endT = (new Date().getTime() - this.startT);
            this.startT = 0;

            const maxPower = 450;
            const maxPowerDuration = 2000;
            if (endT > maxPowerDuration) {
                endT = maxPowerDuration;
            }
            let power = (endT / maxPowerDuration) * maxPower;

            let cannon, rotation;
            for (const entityId of this.entityManager.entities) {
                const tag = this.entityManager.getComponent(entityId, "Tag");
                if (tag.tag === "cannon") {
                    cannon = this.entityManager.getComponent(entityId, "RenderComponent");
                    rotation = this.entityManager.getComponent(entityId, "Rotation");
                    break;
                }
            }

            // invert bullet direction
            const bulletDirectionX = -Math.cos(rotation.radians);
            const bulletDirectionY = -Math.sin(rotation.radians);

            const tankCenterX = cannon.position.x;
            const tankCenterY = cannon.position.y;
            const tankHeight = cannon.size.h + 10;
            const bulletSize = 10;
            const bulletSpeedFactor = 3;

            // set bullet position at end of barrel
            const bulletOffsetX = tankCenterX + bulletDirectionX * tankHeight - bulletSize / 2;
            const bulletOffsetY = tankCenterY + bulletDirectionY * tankHeight - bulletSize / 2;

            const payload = {
                position: {x: bulletOffsetX, y: bulletOffsetY},
                velocity: {x: bulletDirectionX * 5, y: bulletDirectionY * bulletSpeedFactor},
                speed: power,
                rotation: rotation.radians
            };
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
                                    speed: power,
                                }
                            },
                            {
                                type: "Rotation",
                                data: {
                                    radians: -rotation.radians,
                                }
                            }
                        ]
                    })
        }
    }
        
}
