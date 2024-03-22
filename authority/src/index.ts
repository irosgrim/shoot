import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { v4 } from "uuid";

const app = express();
const server = http.createServer(app);
const activeGames = new Map();

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
  }
});

io.on('connection', (socket) => {
    console.log("A user connected");

    socket.on("create-game", () => {
        const roomId = v4();
        socket.join(roomId);
        activeGames.set(roomId, {admin: socket.id, players: [socket.id]});
        socket.emit("room-id", roomId);
    });

    socket.on("join-game", (gameId) => {
        const game = activeGames.get(gameId);
        if (game) {
            if (game.players.indexOf(socket.id) < 0) {
                socket.join(gameId);
                activeGames.set(gameId, {...game, players: [...game.players, socket.id]});
                socket.emit("joined", activeGames.get(gameId));
            }
        } else {
            socket.emit("invalid-game", "Game room doesn't exist");
        }
    })

    socket.on('shoot', (msg) => {
        console.log(msg);
        socket.send("message", "welcome home")
    });

    socket.on('message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log("A user disconnected");
    });
});



server.listen(3000, () => console.log("server running on 3000"));