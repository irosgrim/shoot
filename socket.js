const currentUrl = window.location.href;
const url = new URL(currentUrl);
const queryParams = new URLSearchParams(url.search);
const token = queryParams.get("token");
const join = queryParams.get("join");
const create = queryParams.get("create");

export const socket = io("localhost:3000", {
    auth: {
        token: token || ""
    }
});

if (create) {
    socket.emit("create-game");
}

if (join) {
    socket.emit("join-game", join)
}

socket.on("room-id", (msg) => console.log("Room id: ", msg) );
socket.on("joined", (msg) => console.log("Joined: ", msg) );

