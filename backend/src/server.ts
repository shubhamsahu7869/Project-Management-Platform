import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app.js";
import { env } from "./config.js";
import { configureSockets } from "./socket.js";
const http=createServer(app); const io=new Server(http,{cors:{origin:env.FRONTEND_URLS,credentials:true}}); configureSockets(io);
http.listen(env.PORT,()=>console.log(`NeoStats API listening on http://localhost:${env.PORT}`));
