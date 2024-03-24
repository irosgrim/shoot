import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { v4 } from "uuid";
import { GameState, games } from "./gameState.js";

const app = express();
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: "*", // change
        methods: ["GET", "POST"]
    }
});


app.get("/", (req, res) => {
    return res.send("Hello xxxxx")
})

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === "xxx") {
    next();
  } else {
    next(new Error("Authentication error"));
  };
});

io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    socket.on("create-game", () => {
        if (socket.rooms.size > 1) {
            socket.emit("error", "You already created a game!");
            return;
        }

        const gameId = v4();
        console.log({rooms: socket.rooms})
        socket.join(gameId);
        socket.data.gameId = gameId;

        const gameState = new GameState();
        gameState.addPlayer(socket.id, {name: "God", life: 100, position: {x: 10, y: 200}, rotation: 0});
        gameState.gameId = gameId;
        games.createGame(gameId, gameState);

        socket.emit("game-id", gameId);
    });

    socket.on("join-game", (gameId) => {
        if (socket.rooms.size > 1) {
            socket.emit("error", "You already joined a game!");
            return;
        }
        const game = games.getGameState(gameId);
        if (game) {
            if (Object.entries(game.players).length < 2) {
                socket.join(gameId);
                socket.data.gameId = gameId;

                game.addPlayer(socket.id, {name: "Not God", life: 100, position: {x: 1050, y: 200}, rotation: 0});
                socket.emit("game-state", game.serialize());
                socket.to(gameId).emit("game-state", game.serialize());
            }
        } else {
            socket.emit("invalid-game", "Game room doesn't exist");
        }
    })

    socket.on("shoot", (payload) => {
        console.log(payload);
        // socket.broadcast.emit("update-entity", update);
    });

    socket.on("update-entity", (update) => {
        socket.to(socket.data.gameId).emit("update-entity", update);
    });

    socket.on("terrain-collision", (payload) => {
        socket.to(socket.data.gameId).emit("terrain-collision", payload);
    })

    socket.on("message", (msg) => {
        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected: ", socket.id);
        for (const gameId of socket.rooms) {
            const game = games.getGameState(gameId);
            if (game) {
                game.players[socket.id]!.disconnected = true;
            }
        }
    });
});



server.listen(3000, () => console.log("server running on 3000"));