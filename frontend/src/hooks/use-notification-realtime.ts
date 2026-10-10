"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
export function useNotificationRealtime(){const client=useQueryClient();useEffect(()=>{const socket=io(process.env.NEXT_PUBLIC_SOCKET_URL||"http://localhost:4000",{withCredentials:true});const refresh=()=>client.invalidateQueries({queryKey:["notifications"]});socket.on("notification:created",refresh);return()=>{socket.disconnect()}},[client])}
