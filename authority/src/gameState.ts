import { v4 } from "uuid";

type Vector = {
    x: number;
    y: number;
}

type PlayerProperties = {life: number, name: string, position: Vector, rotation: number, disconnected?: boolean};

class Games {
    games: Map<string, GameState> = new Map();
    constructor() {
    }

    createGame(gameId: string, game: GameState) {
        this.games.set(gameId, game);
    }

    getGameState(gameId: string) {
        return this.games.get(gameId);
    }
}

export const games = new Games();

export class GameState {
    targets: Record<string, {x: number, y: number, active: boolean}>;
    gameId: string = "";
    players: Record<string, PlayerProperties> = {};
    currentTurn = "";

    constructor() {
        this.targets = {
            [v4()]: {x: 100, y: 100, active: true},
            [v4()]: {x: 300, y: 100, active: true},
            [v4()]: {x: 500, y: 100, active: true},
        };
    }

    nextTurn() {
        const playerKeys = Object.keys(this.players);
        if (playerKeys.length === 0) {
            this.currentTurn = "";
            return;
        }
        
        const currentIndex = playerKeys.indexOf(this.currentTurn);
        const nextIndex = (currentIndex + 1) % playerKeys.length;
        
        this.currentTurn = playerKeys[nextIndex]!;
    }

    addPlayer(id: string, player: PlayerProperties) {
        this.players[id] = new Player(player.name, player.position);
        if (this.currentTurn === "") {
            this.currentTurn = id;
        }
    }

    updatePlayer(id: string, playerProperties: {name?: string, position?: Vector, rotation?: number}) {
        let currentPlayer = this.players[id];
        if (currentPlayer) {
            this.players[id] = {...currentPlayer, ...playerProperties};
        }
    }

    serialize() {
        const state = {
            targets: this.targets,
            gameId: this.gameId,
            players: this.players,
            currentTurn: this.currentTurn,
        };
        return state;
    }
}

export class Player {
    name: string;
    life: number;
    position: Vector;
    inventory: Inventory;
    rotation = 0;
    disconnected = false;
    constructor(name: string, position: Vector) {
        this.name = name;
        this.life = 100;
        this.position = position;
        this.inventory = new Inventory();
    }

    addWeapon(id: string, amount: number) {
        this.inventory.addWeapon(id, amount);
    }

    updateLife(amount: number) {
        const total = this.life + amount;
        if (total > 0) {
            this.life = total;
        } else {
            this.life = 0;
        }
    }

    updatePosition(position: Vector) {
        this.position = position;
    }

    updateRotation(angleRadians: number) {
        this.rotation = angleRadians;
    }

}

class Inventory {
    weapons: Record<string, number>;
    constructor() {
        this.weapons = {
            "bullet": -1,
            "slime": 5,
            "heal": 2,
        };
    };

    addWeapon(id: string, amount: number) {
        let currentWeapon = this.weapons[id];
        if (currentWeapon) {
            currentWeapon += amount;
            this.weapons = {...this.weapons, [id]: currentWeapon};
        } else {
            this.weapons[id] = amount;
        }
    }

}
