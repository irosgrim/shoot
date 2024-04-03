import { 
    RenderComponent, 
    RenderContext, 
    Tag, 
    Active, 
    Velocity, 
    Rotation, 
    Gravity, 
    EventListener, 
    DamageOnCollisionComponent, 
    LifeComponent, 
    Alpha, 
    Component
} from "../components/components";
import { v4 as uuidv4 } from "uuid";
import { EventManager } from "../events/eventManager";
import groundImg from "../assets/ground.png";
import backgroundImg from "../assets/background.png";
import barrelImg from "../assets/barrel.png";
import tankImg from "../assets/snails.png";
import bulletImg from "../assets/bullet.png";
import gary from "../assets/gary.png";

export class EntityManager {
    entities: Set<string>;
    componentsByName: Map<string, any>;
    eventManager: EventManager;

    constructor(eventManager: EventManager) {
        this.entities = new Set();
        this.componentsByName = new Map();
        this.eventManager = eventManager;

        this.init();
    }

    init() {
        this.eventManager.listen("shoot", this.shoot.bind(this));
    }

    createEntity(id?: string) {
        if (id) {
            this.entities.add(id);
            return id;
        } else {
            const id = uuidv4();
            this.entities.add(id);
            return id;
        }
    }

    removeEntity(entityId: string) {
        this.entities.delete(entityId);
        for (const componentSet of this.componentsByName.values()) {
        componentSet.delete(entityId);
        }
    }

    addComponent(entityId: string, component: Component) {
        const componentName = component.name;
        if (!this.componentsByName.has(componentName)) {
            this.componentsByName.set(componentName, new Map());
        }
        this.componentsByName.get(componentName).set(entityId, component);
    }

    getComponent(entityId: string, componentClass: string) {
        return this.componentsByName.get(componentClass)?.get(entityId);
    }

    getAllComponents(entityId: string) {
        const components: Component[] = [];
        this.componentsByName.forEach(c => {
            const comp = c.get(entityId);
            if (comp) {
                components.push(comp);
            }
        })
        return components;
    }

    getEntitiesWithComponent(componentClass: string) {
        return this.componentsByName.get(componentClass) || new Map();
    }

    createTerrain(w: number, h: number) {
        const terrainEntityId = this.createEntity();
        this.addComponent(terrainEntityId, new RenderComponent("image", {x: 0, y: 0}, "", {w, h}, groundImg));
        this.addComponent(terrainEntityId, new RenderContext("gameCtx"));
        this.addComponent(terrainEntityId, new Tag("terrain"));
        this.addComponent(terrainEntityId, new Active(true));
    }

    createBg(w: number, h: number) {
        const bgEntityId = this.createEntity();
        this.addComponent(bgEntityId, new RenderComponent("image", {x: 0, y: 0}, "", {w, h}, backgroundImg));
        this.addComponent(bgEntityId, new RenderContext("gameCtx"));
        this.addComponent(bgEntityId, new Tag("bg"));
        this.addComponent(bgEntityId, new Active(true));
    }


    createPlayer(position: {x: number, y: number}, id?: string) {
        const cannonEntityId = this.createEntity(id);
        this.addComponent(cannonEntityId, new RenderComponent("image", {x: position.x + 40, y: position.y + 10}, "red", {w: 10, h: 40}, barrelImg));
        this.addComponent(cannonEntityId, new Rotation(2.5));
        this.addComponent(cannonEntityId, new EventListener("mouse-rotation"));
        this.addComponent(cannonEntityId, new EventListener("key-rotation"));

        this.addComponent(cannonEntityId, new RenderContext("gameCtx"));
        this.addComponent(cannonEntityId, new Tag("cannon"))
        this.addComponent(cannonEntityId, new Active(true));

        const tankBaseEntityId = this.createEntity();
        this.addComponent(tankBaseEntityId, new RenderComponent("image", {...position, x: position.x + 20}, "blue", {w: 80, h: 54}, tankImg, {x: 0, y: 0, w: 145, h: 98}));
        this.addComponent(tankBaseEntityId, new RenderContext("gameCtx"));
        this.addComponent(tankBaseEntityId, new Tag("tankbase"))
        this.addComponent(tankBaseEntityId, new Active(true));
    
        return [cannonEntityId, tankBaseEntityId];
    }

    createBullet(x: number, y: number, velocity: {x: number, y: number}, speed = 1, radians: number, active = false) {
        const bulletEntityId = this.createEntity();

        this.addComponent(bulletEntityId, new RenderComponent("image", {x, y}, "black", {w: 12, h:26}, bulletImg));
        this.addComponent(bulletEntityId, new EventListener("key-rotation"));

        this.addComponent(bulletEntityId, new Rotation(radians));
        this.addComponent(bulletEntityId, new Velocity(velocity.x * speed, velocity.y * speed));
        this.addComponent(bulletEntityId, new Gravity(0, 8));
        this.addComponent(bulletEntityId, new RenderContext("gameCtx"));
        this.addComponent(bulletEntityId, new Tag("bullet"))
        this.addComponent(bulletEntityId, new Active(active));

        return [bulletEntityId];
    }

    createTarget(x: number, y: number, active = false, targetId?: string) {
        const targetEntity = this.createEntity(targetId);
        this.addComponent(targetEntity, new RenderComponent("image", {x, y}, "red", {w: 100, h:88}, tankImg, {x: 0, y: 98, w: 145, h: 98}));
        this.addComponent(targetEntity, new RenderContext("gameCtx"));
        this.addComponent(targetEntity, new Tag("target"));
        this.addComponent(targetEntity, new DamageOnCollisionComponent(100));
        this.addComponent(targetEntity, new LifeComponent(100));
        this.addComponent(targetEntity, new Active(active));
        return [targetEntity];
    }
    createWindParticles(w: number, h: number) {
        for(let i=0; i<30; i++) {
            const windParticleEntity = this.createEntity();
            this.addComponent(windParticleEntity, new RenderComponent("circle", {x: Math.round(Math.random() * w), y: Math.round(Math.random() * -500)}, "pink", {r: Math.round(Math.random() * 10)}));
            this.addComponent(windParticleEntity, new RenderContext("gameCtx"));
            this.addComponent(windParticleEntity, new Tag("wind-particle"));
            this.addComponent(windParticleEntity, new Velocity(Math.random() * 2, Math.random() * 2));
            this.addComponent(windParticleEntity, new Gravity(0, 0.4));
            this.addComponent(windParticleEntity, new Alpha(1));
            this.addComponent(windParticleEntity, new Active(true));
        }
    }

    createExplosion(x: number, y: number, active = false,) {
        for (let i = 0; i < 40; i++) {
            const particleEntity = this.createEntity();
            this.addComponent(particleEntity, new RenderComponent("circle", {x, y}, "red", {r: Math.random() * 3}));
            this.addComponent(particleEntity, new RenderContext("gameCtx"));
            this.addComponent(particleEntity, new Tag("particle"))
            this.addComponent(particleEntity, new Velocity(0, 0));
            this.addComponent(particleEntity, new Gravity(0, 0.1));
            this.addComponent(particleEntity, new Alpha(1));
            this.addComponent(particleEntity, new Active(active));
        }
    }

    shoot(data: any) {
        for (const entityId of this.entities) {
            const tagComponent = this.getComponent(entityId, "Tag");
            if (tagComponent && tagComponent.tag === "bullet") {
                const activeComponent = this.getComponent(entityId, "Active");
                if (!activeComponent.isActive) {
                    const {position, velocity, speed, rotation} = data;
                    const renderComponent = this.getComponent(entityId, "RenderComponent");
                    const velocityComponent = this.getComponent(entityId, "Velocity");
                    const rotationComponent = this.getComponent(entityId, "Rotation");
                    renderComponent.position.x = position.x;
                    renderComponent.position.y = position.y;
    
                    velocityComponent.vec2.x = velocity.x * speed;
                    velocityComponent.vec2.y = velocity.y * speed;
                    rotationComponent.radians = rotation;
                    activeComponent.isActive = true;
                }
                break;
            }
        }
    }
}