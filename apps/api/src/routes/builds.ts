import {Router} from "express";
import {prisma} from "../db";

export const buildsRouter = Router(); //mini express app holding routes

buildsRouter.get("/", async (_req, res) => {  //fetch all builds
    const builds = await prisma.build.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: {select: { updates: true}}, updates: {select: {status: true, archivedAt: true}}}
    });

    res.json(builds);
});

buildsRouter.post("/", async (_req, res) => {   //create new build
    const {name, make, model} = _req.body ?? {}; //json sent from the client

    if(!make || typeof make !== "string") {     //here we are validating the name
        return res.status(400).json( {error: "Make is required!" });
    }

    if(!model || typeof model !== "string") {     //here we are validating the name
        return res.status(400).json( {error: "Model is required!" });
    }

    const existing = await prisma.build.findFirst({
        where: {
            make,
            model,
            name: name ?? ""
        },
    });

    if(existing){
        return res.status(409).json({error: "A build with this make ,model, and owner already exists."});
    }

    //creating the build object from the name
    const build = await prisma.build.create({
        data: {
                name: name ?? "",
                make,
                model,
            },
    });
 
    res.status(201).json(build);
});

buildsRouter.get("/:buildId", async (req, res) => { //grabs a single build and all its updates
    const {buildId} = req.params;

    const build = await prisma.build.findUnique({
        where: {id: buildId},
        include: {
            updates: { orderBy: { createdAt: "desc" } },
        },
    });
    if(!build) return res.status(404).json({ error: "Build not found" });
    res.json(build);
});

buildsRouter.delete("/:buildId", async (req, res) => {
    const {buildId} = req.params;

    const build = await prisma.build.findUnique({
        where: {id: buildId}
    });

    await prisma.build.delete({
        where: {id: buildId}
    });
    res.status(200).json({ message: "Build deleted"});
});