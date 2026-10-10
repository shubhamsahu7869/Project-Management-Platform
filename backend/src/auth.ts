import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SystemRole } from "@prisma/client";
import { env } from "./config.js";
import { prisma } from "./db.js";
export type AuthUser={id:string; role:SystemRole; name:string};
declare global { namespace Express { interface Request { user?:AuthUser } } }
export const tokenFor=(user:AuthUser)=>jwt.sign(user,env.JWT_SECRET,{expiresIn:"8h"});
export async function authenticate(req:Request,res:Response,next:NextFunction) {
  try { const token=req.cookies?.neostats_session || req.headers.authorization?.replace(/^Bearer\s+/i,""); if(!token) return res.status(401).json({error:{code:"UNAUTHORIZED",message:"Authentication required"}}); const data=jwt.verify(token,env.JWT_SECRET) as AuthUser; const user=await prisma.user.findUnique({where:{id:data.id},select:{id:true,name:true,role:true,isActive:true}}); if(!user||!user.isActive)return res.status(401).json({error:{code:"UNAUTHORIZED",message:"Session is no longer valid"}}); req.user={id:user.id,name:user.name,role:user.role}; next(); } catch { res.status(401).json({error:{code:"UNAUTHORIZED",message:"Invalid or expired session"}}); }
}
export const allow=(...roles:SystemRole[]) => (req:Request,res:Response,next:NextFunction)=> !req.user ? res.status(401).end() : roles.includes(req.user.role) ? next() : res.status(403).json({error:{code:"FORBIDDEN",message:"Insufficient permission"}});
export const isAdmin=(u:AuthUser)=>u.role===SystemRole.ADMIN;
