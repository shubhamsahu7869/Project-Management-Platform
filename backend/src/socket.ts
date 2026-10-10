import type { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./config.js";
import { prisma } from "./db.js";
import { canAccessProject } from "./services.js";
import type { AuthUser } from "./auth.js";
export let io:Server;
export function configureSockets(server:Server) {
  io=server;
  io.use(async(socket,next)=>{
    try {
      const cookie=socket.handshake.headers.cookie?.match(/(?:^|;\s*)neostats_session=([^;]+)/)?.[1];
      const authorization=socket.handshake.headers.authorization?.replace(/^Bearer\s+/i,"");
      const token=cookie||authorization||socket.handshake.auth.token;
      if(typeof token!=="string"||!token)return next(new Error("Unauthorized"));
      const claims=jwt.verify(token,env.JWT_SECRET) as AuthUser;
      const active=await prisma.user.findUnique({where:{id:claims.id},select:{id:true,name:true,role:true,isActive:true}});
      if(!active?.isActive)return next(new Error("Unauthorized"));
      socket.data.user=active;
      next();
    }catch{
      next(new Error("Unauthorized"));
    }
  });
  io.on("connection",socket=>{
    const user=socket.data.user as AuthUser;
    socket.join(`user:${user.id}`);
    socket.on("project:join",(id:unknown,acknowledge?:(result:{ok:boolean})=>void)=>{
      void (async()=>{
        if(typeof id!=="string"||id.length<1){acknowledge?.({ok:false});return;}
        try {
          if(!await canAccessProject(user,id)){acknowledge?.({ok:false});return;}
          await socket.join(`project:${id}`);
          if(!await canAccessProject(user,id)){
            await socket.leave(`project:${id}`);
            acknowledge?.({ok:false});
            return;
          }
          acknowledge?.({ok:true});
        }catch(error){
          console.error("Socket project room authorization failed",error);
          acknowledge?.({ok:false});
        }
      })();
    });
    socket.on("project:leave",(id:unknown)=>{
      if(typeof id==="string")void socket.leave(`project:${id}`);
    });
  });
}
export const emitProject=(projectId:string,event:string,data:unknown)=>io.to(`project:${projectId}`).emit(event,data);
export const emitUser=(userId:string,event:string,data:unknown)=>io.to(`user:${userId}`).emit(event,data);
export const revokeProjectRoom=(projectId:string,userId:string)=>io.in(`user:${userId}`).socketsLeave(`project:${projectId}`);
