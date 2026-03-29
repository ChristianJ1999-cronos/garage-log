import {Router} from "express";
import {prisma} from "../db";
import { io } from "../index";

export const updatesRouter = Router();

updatesRouter.get("/builds/:buildId/updates", async (req, res) => { //fetch all tasks for a build
    const {buildId} = req.params;

    const updates = await prisma.pitUpdate.findMany({
        where: {buildId},
        orderBy: { createdAt: "desc" },
    });
    res.json(updates);
});

updatesRouter.post("/builds/:buildId/updates", async (req, res) => {  //creating a new tasks for the build then emits the task
    const { buildId } = req.params;
    const { message, severity } = req.body ?? {};

    //basic validation
    if(!message || typeof message !== "string"){
        return res.status(400).json({   error: "a message is required (string)"});
    }

    const created = await prisma.pitUpdate.create({
        data: {
            buildId,
            message,
            severity: typeof severity == "string" ? severity : "info",
        },
    });

    io.to(buildId).emit("pit:update:new", created); //emitting the new task to everyone in that same room so UI updates real time using buildId here because its in the params

    res.status(201).json(created);
});

updatesRouter.patch("/updates/:updateId", async (req, res) => { //update a tasks status then also emit
    const { updateId } = req.params;
    const { status } = req.body ?? {};

    const allowed = ["TODO", "IN_PROGRESS", "DONE"] as const;
    if(!allowed.includes(status)){
        return res.status(400).json({ error: "status must be TODO | IN_PROGRSS | DONE" });
    }

    const updated = await prisma.pitUpdate.update({
        where: {id: updateId },
        data: {status},
        // include: {build: true},
    });

    io.to(updated.buildId).emit("pit:update:status", updated); //emmiting update to everyone in the same builds room using updated.buildId to get the appropriate room
    res.json(updated);
});

updatesRouter.delete("/updates/:updateId", async (req, res) => {
    const {updateId} = req.params;

    const update = await prisma.pitUpdate.findUnique({
        where: {id: updateId}
    });

    if (!update) return res.status(404).json({ error: "not found" });

    await prisma.pitUpdate.delete({
        where: {id: updateId}
    });
    io.to(update.buildId).emit("pit:update:deleted", { id: updateId });
    res.status(200).json({ message: "Update deleted"});
});

updatesRouter.patch("/updates/:updateId/archived", async(req, res) => {
    const {updateId} = req.params;

    const update = await prisma.pitUpdate.findUnique({
        where: {id: updateId}
    });

    if(!update) return res.status(404).json({ error: "Task not found."})

    const archived = await prisma.pitUpdate.update({
        where: {id: updateId},
        data: { archivedAt: new Date()}
    });

    io.to(archived.buildId).emit("pit:update:archived", archived);
    res.json(archived);
})