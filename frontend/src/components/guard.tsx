"use client";
import {useQuery} from "@tanstack/react-query";import {getData,User} from "@/lib/api";import {useRouter} from "next/navigation";import {useEffect} from "react";import {AppShell} from "./app-shell";
export function Guard({children}:{children:React.ReactNode}){const r=useRouter();const q=useQuery({queryKey:["me"],queryFn:()=>getData<User>("/auth/me"),retry:false});useEffect(()=>{if(q.isError)r.replace("/login")},[q.isError,r]);if(q.isPending)return <div className="center">Loading your workspace…</div>;if(!q.data)return null;return <AppShell user={q.data}>{children}</AppShell>}
