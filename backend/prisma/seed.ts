import { PrismaClient, ProjectRole, ProjectStatus, Priority, SystemRole, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash("DemoPass123!", 12);
  const users = await Promise.all([
    ["Aarav Shah", "admin@neostats.local", SystemRole.ADMIN],
    ["Meera Nair", "manager@neostats.local", SystemRole.PROJECT_MANAGER],
    ["Kabir Singh", "member@neostats.local", SystemRole.TEAM_MEMBER],
    ["Isha Rao", "viewer@neostats.local", SystemRole.VIEWER]
  ].map(([name, email, role]) => prisma.user.upsert({ where:{email: email as string}, update:{}, create:{name:name as string,email:email as string,role:role as SystemRole,passwordHash} })));
  const [admin, manager, member, viewer] = users;
  const project = await prisma.project.upsert({ where:{id:"demo-launch"}, update:{}, create:{id:"demo-launch",name:"NeoStats Launch",description:"Collaborative delivery plan for the NeoStats platform.",status:ProjectStatus.ACTIVE,createdById:admin.id,managerId:manager.id,dueDate:new Date("2026-12-20")} });
  await Promise.all([[manager,ProjectRole.MANAGER],[member,ProjectRole.MEMBER],[viewer,ProjectRole.VIEWER]].map(([user,projectRole])=>prisma.projectMember.upsert({where:{projectId_userId:{projectId:project.id,userId:(user as typeof manager).id}},update:{},create:{projectId:project.id,userId:(user as typeof manager).id,projectRole:projectRole as ProjectRole}})));
  await prisma.task.upsert({where:{id:"demo-task"},update:{},create:{id:"demo-task",projectId:project.id,title:"Validate executive dashboard",description:"Review metrics, permissions and empty states before the stakeholder review.",priority:Priority.HIGH,status:TaskStatus.IN_PROGRESS,assigneeId:member.id,createdById:manager.id,dueDate:new Date("2026-10-20")}});
}
main().finally(()=>prisma.$disconnect());
