import {io} from "socket.io-client";

const buildId = process.argv[2];

if(!buildId){
    console.log("Usage: pnpm dev:socket -- <buildId>");
    process.exit(1);
}

const socket = io("http://localhost:4000", {
    transports: ["websocket"],
});

socket.on("connect_error", (err) => {
  console.log("connect_error:", err.message);
});

socket.on("connect", () => {
    console.log("connected:", socket.id);
    socket.emit("join:build", buildId);
    console.log("joined build room:", buildId);
});

socket.on("pit:update:new", (payload) => {
    console.log("🔥 realtime update:", payload)
});

socket.on("disconnect", () => {
    console.log("disconnected");
});