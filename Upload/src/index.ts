import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { createClient } from "redis";

const subscriber = createClient();
subscriber.connect();
// uploadFile("aryan/setting.py", "/Users/ARYAN/Desktop/StackOverFlow/Vercle/dist/output/875yz/setting.py");

const publisher = createClient();
publisher.connect();

const app = express();
app.use(cors())
app.use(express.json());

// POSTMAN
app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate(); // asd12
    await simpleGit().clone(repoUrl, `dist/output/${id}`);

    const files = getAllFiles(path.join(__dirname,`output/${id}`));
    console.log(files);


files.forEach(async file => {
    await uploadFile(file.slice(__dirname.length + 1), file);
})

publisher.lPush("build-queue", id);
publisher.hSet("status", id, "uploaded");

    res.json({
        id: id
    })
});

app.get("/status", async (req, res) => {
    const id = req.query.id;
    const response = await subscriber.hGet("status", id as string);
    res.json({
        status: response
    })
})
app.listen(3000);
console.log("hi")
