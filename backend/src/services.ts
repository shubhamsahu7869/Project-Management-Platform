import { ProjectRole, SystemRole } from "@prisma/client";
import { prisma } from "./db.js";
import type { AuthUser } from "./auth.js";
export const safeUser={id:true,name:true,email:true,role:true,avatarUrl:true,isActive:true,createdAt:true,updatedAt:true} as const;
export async function canAccessProject(user:AuthUser, projectId:string) { if(user.role===SystemRole.ADMIN)return true; const p=await prisma.project.findFirst({where:{id:projectId,OR:[{managerId:user.id},{members:{some:{userId:user.id}}}]},select:{id:true}}); return !!p; }
export async function canManageProject(user:AuthUser, projectId:string) { if(user.role===SystemRole.ADMIN)return true; const p=await prisma.project.findFirst({where:{id:projectId,managerId:user.id},select:{id:true}}); return !!p; }
export async function canEditTask(user:AuthUser, task:{projectId:string;assigneeId:string|null;createdById:string}) { if(await canManageProject(user,task.projectId))return true; return user.role===SystemRole.TEAM_MEMBER && task.assigneeId===user.id; }
export async function activity(actorId:string,action:string,entityType:string,entityId:string,projectId?:string,metadata?:object) { return prisma.activity.create({data:{actorId,action,entityType,entityId,projectId,metadata}}); }
export async function notify(userId:string,type:string,title:string,message:string,entityType?:string,entityId?:string) { return prisma.notification.create({data:{userId,type,title,message,entityType,entityId}}); }
export function visibleProjects(user:AuthUser) { return user.role===SystemRole.ADMIN ? {} : {OR:[{managerId:user.id},{members:{some:{userId:user.id}}}]}; }
export const validMemberRoles=[ProjectRole.MANAGER,ProjectRole.MEMBER,ProjectRole.VIEWER];
