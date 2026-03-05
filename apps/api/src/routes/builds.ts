import {Router} from "express";
import {prisma} from "../db";

export const buildsRouter = Router(); //mini express app holding routes

buildsRouter.get("/", async (_req, res) => {
    const builds = await prisma.build.findMany({
        orderBy: { createdAt: "desc" },
    });

    res.json(builds);
});

buildsRouter.post("/", async (_req, res) => {
    const {name} = _req.body ?? {}; //json sent from the client

    if(!name || typeof name !== "string") {     //here we are validating the name
        return res.status(400).json( {error: "name is required!" });
    }

    //creating the build object from the name
    const build = await prisma.build.create({
        data: {name},
    });
 
    res.status(201).json(build);
})

buildsRouter.get("/:buildId", async (req, res) => {
    const {buildId} = req.params;

    const build = await prisma.build.findUnique({
        where: {id: buildId},
        include: {
            updates: { orderBy: { createdAt: "desc" } },
        },
    });
    if(!build) return res.status(404).json({ error: "Build not found" });
    res.json(build);
})