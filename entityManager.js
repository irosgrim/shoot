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
    Alpha 
} from "./components.js";

export class EntityManager {
    constructor(eventManager) {
        this.nextEntityId = 0;
        this.entities = new Set();
        this.componentsByName = new Map();
        this.eventManager = eventManager;

        this.init();
    }

    init() {
        this.eventManager.listen("shoot", this.shoot.bind(this));
    }

    createEntity() {
        const id = this.nextEntityId++;
        this.entities.add(id);
        return id;
    }

    removeEntity(entityId) {
        this.entities.delete(entityId);
        for (const componentSet of this.componentsByName.values()) {
        componentSet.delete(entityId);
        }
    }

    addComponent(entityId, component) {
        const componentName = component.name;
        if (!this.componentsByName.has(componentName)) {
            this.componentsByName.set(componentName, new Map());
        }
        this.componentsByName.get(componentName).set(entityId, component);
    }

    getComponent(entityId, componentClass) {
        return this.componentsByName.get(componentClass)?.get(entityId);
    }

    getAllComponents(entityId) {
        const components = [];
        this.componentsByName.forEach(c => {
            const comp = c.get(entityId);
            if (comp) {
                components.push(comp);
            }
        })
        return components;
    }

    getEntitiesWithComponent(componentClass) {
        return this.componentsByName.get(componentClass) || new Map();
    }

    createTerrain(position, w, h) {
        const terrainEntityId = this.createEntity();
        this.addComponent(terrainEntityId, new RenderComponent("image", position, "", {w, h}, "./ground.png"));
        this.addComponent(terrainEntityId, new RenderContext("gameCtx"));
        this.addComponent(terrainEntityId, new Tag("terrain"));
        this.addComponent(terrainEntityId, new Active(true));
    }

    createBg(w, h) {
        const bgEntityId = this.createEntity();
        this.addComponent(bgEntityId, new RenderComponent("image", {x: 0, y: 0}, "", {w, h}, "./mountains.png"));
        this.addComponent(bgEntityId, new RenderContext("gameCtx"));
        this.addComponent(bgEntityId, new Tag("bg"));
        this.addComponent(bgEntityId, new Active(true));
    }


    createPlayer(position) {
        const tankBaseEntityId = this.createEntity();
        this.addComponent(tankBaseEntityId, new RenderComponent("rectangle", {...position, x: position.x + 20}, "blue", {w: 60, h: 20}));
        this.addComponent(tankBaseEntityId, new RenderContext("gameCtx"));
        this.addComponent(tankBaseEntityId, new Tag("tankbase"))
        this.addComponent(tankBaseEntityId, new Active(true));
    
        const cannonEntityId = this.createEntity();
        this.addComponent(cannonEntityId, new RenderComponent("rectangle", {x: position.x + 50, y: position.y - 5}, "red", {w: 10, h: 40}));
        this.addComponent(cannonEntityId, new Rotation(0));
        this.addComponent(cannonEntityId, new EventListener("mouse-rotation"));
        this.addComponent(cannonEntityId, new RenderContext("gameCtx"));
        this.addComponent(cannonEntityId, new Tag("cannon"))
        this.addComponent(cannonEntityId, new Active(true));

    }

    createBullet(x, y, velocity, speed = 1, radians, active = false) {
        const bulletEntityId = this.createEntity();

        this.addComponent(bulletEntityId, new RenderComponent("rectangle", {x, y}, "white", {w: 10, h:20}));
        this.addComponent(bulletEntityId, new Rotation(radians));
        this.addComponent(bulletEntityId, new Velocity(velocity.x * speed, velocity.y * speed));
        this.addComponent(bulletEntityId, new Gravity(0, 8));
        this.addComponent(bulletEntityId, new RenderContext("gameCtx"));
        this.addComponent(bulletEntityId, new Tag("bullet"))
        this.addComponent(bulletEntityId, new Active(active));
    }

    createTarget(x, y, active = false) {
        const targetEntity = this.createEntity();
        this.addComponent(targetEntity, new RenderComponent("rectangle", {x, y}, "red", {w: 10, h:100}));
        this.addComponent(targetEntity, new RenderContext("gameCtx"));
        this.addComponent(targetEntity, new Tag("target"))
        this.addComponent(targetEntity, new DamageOnCollisionComponent(100));
        this.addComponent(targetEntity, new LifeComponent(100));
        this.addComponent(targetEntity, new Active(active));
    }

    createExplosion(x, y, active = false,) {
        for (let i = 0; i < 60; i++) {
            const particleEntity = this.createEntity();
            this.addComponent(particleEntity, new RenderComponent("circle", {x, y}, "red", {r: Math.random() * 3}));
            this.addComponent(particleEntity, new RenderContext("gameCtx"));
            this.addComponent(particleEntity, new Tag("particle"))
            this.addComponent(particleEntity, new Velocity(0, 0));
            this.addComponent(particleEntity, new Gravity(0, 0.05));
            this.addComponent(particleEntity, new Alpha(1));
            this.addComponent(particleEntity, new Active(active));
        }
    }

    shoot(data) {
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