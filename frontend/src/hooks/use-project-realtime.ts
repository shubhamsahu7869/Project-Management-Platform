"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { api, Project } from "@/lib/api";

type ProjectPage = { data: Project[]; pagination: { pages: number } };
export type RealtimeStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export function useProjectRealtime(userId?: string): RealtimeStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const projects = useQuery({
    queryKey: ["projects", "realtime", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const firstPage = await api.get<ProjectPage>("/projects?page=1&limit=100");
      const accessibleProjects = [...firstPage.data.data];
      for (let page = 2; page <= firstPage.data.pagination.pages; page += 1) {
        const result = await api.get<ProjectPage>(`/projects?page=${page}&limit=100`);
        accessibleProjects.push(...result.data.data);
      }
      return accessibleProjects;
    }
  });
  const socketRef = useRef<Socket | null>(null);
  const joinedProjects = useRef(new Set<string>());
  const accessibleProjectIds = projects.data?.map(project => project.id) ?? [];

  const refreshProjectData = () => {
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    void queryClient.invalidateQueries({ queryKey: ["task"] });
    void queryClient.invalidateQueries({ queryKey: ["project"] });
    void queryClient.invalidateQueries({ queryKey: ["activity"] });
    void queryClient.invalidateQueries({ queryKey: ["comments"] });
    void queryClient.invalidateQueries({ queryKey: ["members"] });
    void queryClient.invalidateQueries({ queryKey: ["eligible-users"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-projects"] });
  };

  useEffect(() => {
    if (!userId) {
      setStatus("disconnected");
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      withCredentials: true,
      reconnection: true
    });
    socketRef.current = socket;

    const onConnect = () => {
      setStatus("connected");
      joinedProjects.current.clear();
      refreshProjectData();
    };
    const onDisconnect = () => {
      joinedProjects.current.clear();
      setStatus(socket.active ? "reconnecting" : "disconnected");
    };
    const onConnectError = (error: Error) => {
      console.error("Project real-time connection failed:", error.message);
      setStatus(socket.active ? "reconnecting" : "disconnected");
    };
    const onReconnectAttempt = () => setStatus("reconnecting");
    const onReconnectFailed = () => setStatus("disconnected");
    const onNotification = () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    };
    const onProjectAccessChanged = () => {
      refreshProjectData();
      void queryClient.invalidateQueries({ queryKey: ["projects", "realtime", userId] });
    };

    const taskEvents = ["task:created", "task:updated", "task:deleted", "task:statusChanged", "comment:created", "comment:deleted", "activity:created"];
    const projectEvents = ["project:created", "project:updated", "project:deleted", "project:memberAdded", "project:memberUpdated", "project:memberRemoved", "project:accessGranted", "project:accessRevoked"];
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect_failed", onReconnectFailed);
    taskEvents.forEach(event => socket.on(event, refreshProjectData));
    projectEvents.forEach(event => socket.on(event, onProjectAccessChanged));
    socket.on("notification:created", onNotification);
    socket.on("notification:updated", onNotification);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect_failed", onReconnectFailed);
      taskEvents.forEach(event => socket.off(event, refreshProjectData));
      projectEvents.forEach(event => socket.off(event, onProjectAccessChanged));
      socket.off("notification:created", onNotification);
      socket.off("notification:updated", onNotification);
      socket.disconnect();
      joinedProjects.current.clear();
      socketRef.current = null;
    };
  }, [queryClient, userId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    const nextProjects = new Set(accessibleProjectIds);
    joinedProjects.current.forEach(projectId => {
      if (!nextProjects.has(projectId)) {
        socket.emit("project:leave", projectId);
        joinedProjects.current.delete(projectId);
      }
    });
    nextProjects.forEach(projectId => {
      if (!joinedProjects.current.has(projectId)) {
        socket.emit("project:join", projectId, (result: { ok: boolean }) => {
          if (result.ok) joinedProjects.current.add(projectId);
        });
      }
    });
  }, [accessibleProjectIds.join(","), status]);

  return status;
}
