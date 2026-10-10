"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

export function useProjectRealtime(projectId?: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!projectId) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", { withCredentials: true });
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity", projectId] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    };
    socket.on("connect", () => socket.emit("project:join", projectId));
    ["task:created", "task:updated", "task:deleted", "task:statusChanged", "comment:created", "comment:deleted", "project:updated", "project:memberAdded", "project:memberUpdated"].forEach(event => socket.on(event, refresh));
    return () => { socket.emit("project:leave", projectId); socket.disconnect(); };
  }, [projectId, queryClient]);
}
