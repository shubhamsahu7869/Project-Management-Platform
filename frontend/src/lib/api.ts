import axios from "axios";
export const api=axios.create({baseURL:process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000/api",withCredentials:true});
export type Role="ADMIN"|"PROJECT_MANAGER"|"TEAM_MEMBER"|"VIEWER";
export type User={id:string;name:string;email:string;role:Role;avatarUrl?:string|null;isActive?:boolean};
export type Project={id:string;name:string;description:string;status:string;dueDate?:string|null;manager?:User|null;members?:{user:User;projectRole:string}[];_count?:{tasks:number}};
export type Task={id:string;projectId:string;title:string;description:string;status:"TODO"|"IN_PROGRESS"|"IN_REVIEW"|"DONE";priority:"LOW"|"MEDIUM"|"HIGH"|"URGENT";version:number;dueDate?:string|null;assignee?:User|null;project?:{id:string;name:string}};
export const getData=async<T>(url:string)=> (await api.get<{data:T}>(url)).data.data;
export const errorMessage=(e:unknown)=>{
  if (!axios.isAxiosError(e)) return "Something went wrong";
  if (!e.response) return "Cannot reach the API. Start PostgreSQL and the backend on port 4000.";
  return e.response.data?.error?.message || "Request failed";
};
