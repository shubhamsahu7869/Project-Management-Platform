"use client";
import { useProjectRealtime } from "@/hooks/use-project-realtime";
export function ProjectRealtime({projectId}:{projectId:string}) { useProjectRealtime(projectId); return null; }
