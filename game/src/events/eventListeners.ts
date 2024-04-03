import { EntityManager } from "../entities/entityManager.js";
import { EventManager } from "./eventManager.js";
import { socket } from "../socket/socket.js";
import { Vec2 } from "../lib/math.js";
const player1Power = document.getElementById("player1-power");


export let drag = {
    start: new Vec2(0, 0),
    end: new Vec2(0, 0),
    offset: new Vec2(0, 0),
    active: false,
};

let offset = new Vec2(0, 0);
export let tempOffset = new Vec2(0, 0);
export let zoom = 1;
let gameWidth = window.innerWidth;
const backgroundWidth = 1445;

function getMouse(e: MouseEvent)  {
    return new Vec2(e.offsetX * zoom, e.offsetY * zoom);
}

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
        // this.gameCanvas.addEventListener("mousedown", this.setShootPower.bind(this));
        window.addEventListener('keydown', this.keyDown.bind(this));
        window.addEventListener('keyup', this.keyUp.bind(this));
        // this.gameCanvas.addEventListener("mousedown", this.startPan.bind(this))
        // this.gameCanvas.addEventListener("mouseup", this.endPan.bind(this));
        // this.gameCanvas.addEventListener("mousemove", this.mouseMove.bind(this));
        // document.addEventListener("mousewheel", this.zoom.bind(this))
        window.addEventListener("resize", this.resizeCanvas.bind(this));

    }
    resizeCanvas() {
        const width = 1445;
        const height = 578;
        const aspectRatio = width/height;

        const windowWidth = window.innerWidth;
        if (windowWidth < width) {
            const windowHeight = windowWidth / aspectRatio;
            this.gameCanvas.width = windowWidth;
            this.gameCanvas.height = windowHeight;
            gameWidth = windowWidth;

            zoom = width / innerWidth;
        } else {
            this.gameCanvas.width = width;
            this.gameCanvas.height = height
        }
    }

    zoom(e: any) {
        e.preventDefault();
        const deltaY = e.deltaY;
        const dir = Math.sign(deltaY);
        const step = 0.1;
        zoom += dir * step;
        zoom = Math.max(1, Math.min(5, zoom))
    }

    startPan(e: MouseEvent) {
        drag.active = true;
        const mousePos = getMouse(e);
        drag.start = mousePos;
    }

    endPan(e: MouseEvent) {
        offset.x = Math.min(tempOffset.x, 0); // prevent panning too far to the left
        offset.x = Math.max(offset.x, gameWidth - backgroundWidth); // prevent panning too far to the right

        drag = {
            start: new Vec2(0,0),
            end: new Vec2(0, 0),
            offset: new Vec2(0, 0),
            active: false,
        }
    }

    mouseMove(e: MouseEvent) {
        if (drag.active) {
            
            const mousePos = getMouse(e);
            drag.end = mousePos;
            const newOffsetX = mousePos.x - drag.start.x;

            let tempOffsetX = offset.x + newOffsetX;
            tempOffsetX = Math.min(tempOffsetX, 0);
            tempOffsetX = Math.max(tempOffsetX, gameWidth - backgroundWidth);

            tempOffset = new Vec2(tempOffsetX, 0);
        }
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
