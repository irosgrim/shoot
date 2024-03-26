import './style.css'

import { EventManager } from "./eventManager";
import { Vec2 } from "./math";
import { EventListeners } from "./eventListeners";
import { EntityManager } from "./entityManager";
import { socket } from "./socket";
import groundImg from "./assets/ground.png";
import { ExplosionSystem } from './systems/explosion';
import { MovementSystem } from './systems/movement';
import { RenderSystem } from './systems/render';
import { MouseTrackingSystem } from './systems/mouseTracking';
import { CollisionDetectionStystem } from './systems/collision';

class GameState {
  currentBulletPosition: Vec2 | null;
    constructor() {
        this.currentBulletPosition = null;
    }

    updateBulletPosition(position: Vec2) {
        this.currentBulletPosition = position;
    }

    getBulletPosition() {
        return this.currentBulletPosition;
    }
}

const gameCanvas = document.getElementById("canvas") as HTMLCanvasElement;
const gameCtx = gameCanvas.getContext("2d", { willReadFrequently: true });
gameCanvas.width = 1200;
gameCanvas.height = 600;

const terrainCanvas = document.createElement("canvas") as HTMLCanvasElement;
const terrainCtx = terrainCanvas.getContext("2d", {willReadFrequently: true});
terrainCanvas.width = gameCanvas.width;
terrainCanvas.height = gameCanvas.height;

// const scale = window.devicePixelRatio;
const groundImage = new Image()
groundImage.src = groundImg;

groundImage.onload= (e) => {
    terrainCtx!.drawImage(groundImage, 0, 0)
}

class Power {
  position: Vec2;
  width: number;
  height: number;
  power: number;
  color: string;
  ctx: CanvasRenderingContext2D;

  constructor(x: number, y: number, ctx: CanvasRenderingContext2D) {
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

    setPower(current: number, total = 2000) {
        const currentPercentage = (current * 100) / total;
        const bit = this.width / 100;
        this.power = currentPercentage * bit;

    }
}

const power = new Power(10, 10, gameCtx!);

const loadGame = () => {
    const contexts = new Map();
    contexts.set("terrainCtx", terrainCtx);
    contexts.set("gameCtx", gameCtx);

    const eventManager = new EventManager();
    const gameState = new GameState();
    const entityManager = new EntityManager(eventManager);
    const explosionSystem = new ExplosionSystem(entityManager, eventManager, terrainCtx!);

    entityManager.createBg(gameCanvas.width, gameCanvas.height);
    entityManager.createWindParticles(gameCanvas.width, gameCanvas.height);
    entityManager.createTerrain({x: 0, y: 0}, gameCanvas.width, gameCanvas.height);
    let entities: string[] = [];
    if (socket.io === undefined) {
        const player = entityManager.createPlayer({x: 10, y: gameCanvas.height - 100});
        const bullet = entityManager.createBullet(100, 100, {x: 0, y: 0}, 0, 0, false);
        const t1 = entityManager.createTarget(400, 50, true);
        const t2 = entityManager.createTarget(600, 400, true);
        const t3 = entityManager.createTarget(740, 200, true);
        entities = [...player, ...bullet, ...t1, ...t2, ...t3];
    }

    entityManager.createExplosion(100, 100, false);

    socket.on("game-state", (gameState: any) =>  {
        const players = gameState.players;
        const targets = gameState.targets;
        const currPlayer = players[socket.getId()!];
        if (currPlayer) {}
        for (const entityId of entities) {
            entityManager.removeEntity(entityId);
        }
        entities = [];
        if (players) {
            for (const playerId in players) {
               const p = players[playerId]; 
               entityManager.createPlayer({x: p.position.x, y: gameCanvas.height - 100}, playerId);
            }
        }

        if (targets) {
            for (const targetId in targets) {
                const target = targets[targetId];
                entityManager.createTarget(target.x, target.y, target.active, targetId);
            }
        } 
        entityManager.createBullet(100, 100, {x: 0, y: 0}, 0, 0, false);

    } );


    socket.on("terrain-collision", (payload: any) => {
        explosionSystem.handleCollision({type: "terrain", position: payload.position, circles: payload.circles, otherPlayer: true});
    } );

    
    socket.on("update-entity", (payload: any) => {
        if (payload.entityId === "bullet") {
            const p = {position: payload.components[0].data.position, velocity: payload.components[1].data, speed: payload.components[2].data.speed, rotation: payload.components[3].data.radians};

            eventManager.broadcast("shoot", p)

        } else {
            for (const component of payload.components) {
                const comp = entityManager.getComponent(payload.entityId, component.type);
                switch (component.type) {
                    case "Position":
                        if (comp) {
                            const pos = component.data.position as {x: number, y: number}
                            comp.vec2 = new Vec2(pos.x, pos.y)
                        }
                        break;
                    case "Velocity":
                        if (comp) {
                            comp.vec2 = new Vec2(component.data.x, component.data.y)
                        }
                        break;
                    case "Rotation":
                        if (comp) {
                            comp.radians = component.data.radians;
                        }
                        break;
                    default:
                        break;
                }
    
            }
        }

    })

    const eventListeners = new EventListeners(gameCanvas, entityManager, eventManager);
    const movementSystem = new MovementSystem(entityManager, eventManager);
    const renderSystem = new RenderSystem(gameState, entityManager, terrainCanvas, contexts, eventManager);
    const mouseTrackingSystem = new MouseTrackingSystem(entityManager, eventManager);
    const collisionDetectionSystem = new CollisionDetectionStystem(gameState, entityManager, contexts, eventManager);
    
    const fixedDeltaTime = 1 / 60;
    let accumulator = 0.0;
    let oldTimeStamp = 0;

    const draw = (timeStamp: number) => {
        let deltaTime = (timeStamp - oldTimeStamp) / 1000;
        oldTimeStamp = timeStamp;

        accumulator += deltaTime;
        while (accumulator >= fixedDeltaTime) {
            movementSystem.update(fixedDeltaTime);
            collisionDetectionSystem.update(); 
            accumulator -= fixedDeltaTime;
        }
        renderSystem.update();
        
        window.requestAnimationFrame(draw);
    };

    window.requestAnimationFrame(draw);
}

window.addEventListener("load", loadGame);
