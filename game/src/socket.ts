import { Socket as SocketIo, io } from "socket.io-client";

class Socket {
    io: SocketIo | undefined;
    eventQueue: {type: string, eventName: string, cb?: any, payload?: any}[]; 
    constructor() {
        this.io = undefined;
        this.eventQueue = [];
        this.connect();
    }
    connect() {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) return;
        const tempIo = io("localhost:3000", {
            auth: {
                token: token || ""
            }
        });
        tempIo.on("connect", () => {
            console.log("Connected!", tempIo.id);
            this.io = tempIo;
            this.processQueue();

            const create = new URLSearchParams(window.location.search).get("create");
            const join = new URLSearchParams(window.location.search).get("join");
            if (create) this.emit("create-game", "");
            if (join) this.emit("join-game", join);
        });

        tempIo.on("connect_error", (error) => {
            console.log("Connection failed: ", error.message);
        });
    }

    on(eventName: string, cb: any) {
        if (this.io) {
            this.io.on(eventName, cb);
        } else {
            this.eventQueue.push({ type: 'on', eventName, cb });
        }
    }

    emit(eventName: string, payload: any) {
        if (this.io) {
            this.io.emit(eventName, payload);
        }  else {
            this.eventQueue.push({ type: 'emit', eventName, payload });
        }
    }

    getId() {
        if (this.io) {
            return this.io.id;
        }
        return null;
    }

    processQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            const ev = event!;
            if (event!.type === 'on') {
                this.on(ev.eventName, ev.cb);
            } else if (ev.type === 'emit') {
                this.emit(ev.eventName, ev.payload);
            }
        }
    }
}

export const socket = new Socket();

socket.on("game-id", (msg: string) => console.log("Game id: ", msg) );