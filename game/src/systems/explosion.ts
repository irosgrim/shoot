import { EntityManager } from "../entities/entityManager";
import { EventManager } from "../events/eventManager";
import { Vec2 } from "../lib/math";
import { socket } from "../socket/socket";

export class ExplosionSystem {
    entityManager: EntityManager;
    eventManager: EventManager;
    terrainCtx: CanvasRenderingContext2D;
    constructor(entityManager: EntityManager, eventManager: EventManager, terrainCtx: CanvasRenderingContext2D) {
        this.entityManager = entityManager;
        this.eventManager = eventManager;
        this.terrainCtx = terrainCtx;
        this.init();
    }
    
    init() {
        this.eventManager.listen("collision", this.handleCollision.bind(this));

    }

    createCircles(position: Vec2 | {x: number, y: number}) {
        const circles = [];
        const radiusOfEffect = 20; 
        const minRadius = 1; 
        const maxRadius = 10; 
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2; 
            const distance = (Math.random() * radiusOfEffect) + 10; 
            const circleX = position.x + distance * Math.cos(angle);
            const circleY = position.y + distance * Math.sin(angle);
            const circleRadius = minRadius + Math.random() * (maxRadius - minRadius); 
            circles.push({x: circleX, y: circleY, r: circleRadius})
        };
        return circles;
    }

    handleCollision({type, position, circles = [], otherPlayer = false }: {type: string, position: Vec2, circles: {x: number, y: number, r: number}[], otherPlayer: boolean}) {
        if (type === "terrain") {
            const smallCircles = circles.length > 0 ? circles : this.createCircles(position);
            if (!otherPlayer) {
                socket.emit("terrain-collision", {position, circles: smallCircles});
            }

            this.createExplosion(position);
            this.createHole(position, smallCircles);
        } 
        
         if (type === "target") {
            this.createExplosion(position);
        } 
    }

    createHole(position: Vec2, circles: {x: number, y: number, r: number}[] = []) {
        // paint and merge the hole with the terrain context
        this.terrainCtx.beginPath();
        this.terrainCtx.fillStyle = "red";
        this.terrainCtx.globalCompositeOperation = "destination-out";
        this.terrainCtx.arc(position.x, position.y, 20, 0, Math.PI * 2, false);
        this.terrainCtx.fill();
        const smallCircles = circles.length > 0 ? circles : this.createCircles(position);
        for (const circle of smallCircles) {
            this.terrainCtx.beginPath();
            this.terrainCtx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2, false);
            this.terrainCtx.fill();
        }

        this.terrainCtx.globalCompositeOperation = "source-over";
        this.terrainCtx.closePath();
    }

    createExplosion(position: Vec2) {
        // activate particles from entity pool
        this.entityManager.entities.forEach(entityId => {
            const tag = this.entityManager.getComponent(entityId, "Tag");
            if (tag && tag.tag === "particle") {
                const active = this.entityManager.getComponent(entityId, "Active");
                const alphaComponent = this.entityManager.getComponent(entityId, "Alpha");
                alphaComponent.alpha = 1;
                active.isActive = true;

                const xVel = (Math.random() - 0.5) * (Math.random() * 6);
                const yVel = (Math.random() - 1) * (Math.random() * 5);
                const particleRenderComponent = this.entityManager.getComponent(entityId, "RenderComponent");
                const particleVelocityComponent = this.entityManager.getComponent(entityId, "Velocity");
                particleVelocityComponent.vec2.x = xVel;
                particleVelocityComponent.vec2.y = yVel;
                particleRenderComponent.position.x = position.x;
                particleRenderComponent.position.y = position.y;
            }
        })
    }
}