import {Router} from "express";
import {prisma} from "../db";
import { io } from "../index";

export const updatesRouter = Router();

updatesRouter.get("/builds/:buildId/updates", async (req, res) => {
    const {buildId} = req.params;

    const updates = await prisma.pitUpdate.findMany({
        where: {buildId},
        orderBy: { createdAt: "desc" },
    });
    res.json(updates);
});

updatesRouter.post("/builds/:buildId/updates", async (req, res) => {
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

    io.to(buildId).emit("pit:update:new", created);

    res.status(201).json(created);
});

updatesRouter.patch("/updates/:updateId", async (req, res) => {
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

    io.to(updated.buildId).emit("pit:update:status", updated);
    res.json(updated);
});