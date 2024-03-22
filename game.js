import { EventManager } from "./eventManager.js";
import { Vec2 } from "./math.js";
import { ExplosionSystem, MovementSystem, CollisionDetectionStystem, RenderSystem, MouseTrackingSystem } from "./systems.js";
import { EventListeners } from "./eventListeners.js";
import { EntityManager } from "./entityManager.js";

class GameState {
    constructor() {
        this.currentBulletPosition = null;
    }

    updateBulletPosition(position) {
         this.currentBulletPosition = position;
    }

    getBulletPosition() {
        return this.currentBulletPosition;
    }
}

const gameCanvas = document.getElementById("canvas");
const gameCtx = gameCanvas.getContext("2d", { willReadFrequently: true });
gameCanvas.width = 1200;
gameCanvas.height = 600;

const terrainCanvas = document.createElement("canvas");
const terrainCtx = terrainCanvas.getContext("2d", {willReadFrequently: true});
terrainCanvas.width = gameCanvas.width;
terrainCanvas.height = gameCanvas.height;

// const scale = window.devicePixelRatio;
const groundImage = new Image()
groundImage.src = "./ground.png";

groundImage.onload= (e) => {
    terrainCtx.drawImage(groundImage, 0, 0)
}

class Power {
    constructor(x, y, ctx) {
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

    setPower(current, total = 2000) {
        const currentPercentage = (current * 100) / total;
        const bit = this.width / 100;
        this.power = currentPercentage * bit;

    }
}

const power = new Power(10, 10, gameCtx);

let deltaTime;
let oldTimeStamp;
let fps;

const loadGame = () => {
    const contexts = new Map();
    contexts.set("terrainCtx", terrainCtx);
    contexts.set("gameCtx", gameCtx);

    const eventManager = new EventManager();
    const gameState = new GameState();
    const entityManager = new EntityManager(eventManager);
    const explosionSystem = new ExplosionSystem(entityManager, eventManager, terrainCtx);

    entityManager.createBg(gameCanvas.width, gameCanvas.height);
    entityManager.createWindParticles(gameCanvas.width, gameCanvas.height);
    entityManager.createTerrain({x: 0, y: 0}, gameCanvas.width, gameCanvas.height);
    entityManager.createPlayer({x: 10, y: gameCanvas.height - 100});
    entityManager.createBullet(100, 100, 0, 0, 0, false);
    entityManager.createTarget(400, 50, true);
    entityManager.createTarget(600, 400, true);
    entityManager.createTarget(740, 200, true);
    entityManager.createExplosion(100, 100, false);

    const eventListeners = new EventListeners(gameCanvas, entityManager, eventManager);
    const movementSystem = new MovementSystem(entityManager, eventManager);
    const renderSystem = new RenderSystem(gameState, entityManager, terrainCanvas, contexts, eventManager);
    const mouseTrackingSystem = new MouseTrackingSystem(entityManager, eventManager);
    const collisionDetectionSystem = new CollisionDetectionStystem(gameState, entityManager, contexts, eventManager);

    const draw = (timeStamp) => {
        deltaTime = (timeStamp - oldTimeStamp) / 1000;
        oldTimeStamp = timeStamp;

        fps = Math.round(1 / deltaTime);
        movementSystem.update(deltaTime);
        renderSystem.update(deltaTime);
        collisionDetectionSystem.update();
        window.requestAnimationFrame(draw);
    };

    draw();
}

window.addEventListener("load", loadGame);
