import type { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./config.js";
import { prisma } from "./db.js";
import { canAccessProject } from "./services.js";
import type { AuthUser } from "./auth.js";
export let io:Server;
export function configureSockets(server:Server) { io=server; io.use(async(socket,next)=>{try {const raw=socket.handshake.headers.cookie?.match(/neostats_session=([^;]+)/)?.[1]||socket.handshake.auth.token; const user=jwt.verify(raw,env.JWT_SECRET) as AuthUser; const active=await prisma.user.findUnique({where:{id:user.id},select:{id:true,name:true,role:true,isActive:true}}); if(!active?.isActive)return next(new Error("Unauthorized")); socket.data.user=active; next();}catch{return next(new Error("Unauthorized"));}}); io.on("connection",socket=>{const user=socket.data.user as AuthUser; socket.join(`user:${user.id}`); socket.on("project:join",async(id:string)=>{if(await canAccessProject(user,id))socket.join(`project:${id}`);}); socket.on("project:leave",(id:string)=>socket.leave(`project:${id}`));}); }
export const emitProject=(projectId:string,event:string,data:unknown)=>io.to(`project:${projectId}`).emit(event,data);
export const emitUser=(userId:string,event:string,data:unknown)=>io.to(`user:${userId}`).emit(event,data);
