import express from "express";
import cors from "cors";
import { buildsRouter } from "./routes/builds.js";
import { updatesRouter } from "./routes/updates.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

const app = express();

app.use(express.json()); // lets us read JSON bodies later
app.use(cors()); // allows cross-origin requests (tighten this later)

// testing backend route 4000/heaalth
app.get("/health", (_req, res) => { 
    res.json({ ok: true, service: "garage-log-api" });
});

app.use("/api/builds", buildsRouter);
app.use("/api", updatesRouter);


const PORT = 4000;


const server = http.createServer(app); //allowing socket.io to work
const io = new SocketIOServer(server, { //this is where we attach Socket.io to the server
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {  //fires whenever a user connects via websocket -> socket representing clients connection
    console.log("socket connected:", socket.id);

    socket.on("join:build", (buildId: string) => {  //connects the user to the room in which its joining so they can now see any events in that room
        socket.join(buildId);
        console.log(`socket ${socket.id} joined build ${buildId}`);
    });

    socket.on("disconnect", () => { //when user leaves tab or closes. disconnects in gen then run this
        console.log("socket disconnected:", socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`API is listening on http://localhost:${PORT}`);
});

export { io };