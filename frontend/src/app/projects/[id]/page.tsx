"use client";

import { Guard } from "@/components/guard";
import { ProjectRealtime } from "@/components/project-realtime";
import { api, errorMessage, getData, Project, Task, User } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

const columns: Task["status"][] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const cache = useQueryClient();
  const [title, setTitle] = useState("");
  const project = useQuery({ queryKey: ["project", id], queryFn: () => getData<Project>(`/projects/${id}`) });
  const tasks = useQuery({ queryKey: ["tasks", id], queryFn: () => getData<Task[]>(`/tasks?projectId=${id}&limit=100`) });
  const me = useQuery({ queryKey: ["me"], queryFn: () => getData<User>("/auth/me") });
  const canManage = me.data?.role === "ADMIN" || project.data?.manager?.id === me.data?.id;
  const create = useMutation({
    mutationFn: () => api.post("/tasks", { projectId: id, title, priority: "MEDIUM" }),
    onSuccess: () => {
      setTitle("");
      cache.invalidateQueries({ queryKey: ["tasks", id] });
      toast.success("Task created");
    },
    onError: error => toast.error(errorMessage(error))
  });
  const move = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: Task["status"] }) => api.patch(`/tasks/${task.id}`, { status, version: task.version }),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["tasks", id] }),
    onError: error => {
      cache.invalidateQueries({ queryKey: ["tasks", id] });
      toast.error(errorMessage(error));
    }
  });

  return (
    <Guard>
      <ProjectRealtime projectId={id} />
      {project.isPending ? <p>Loading project…</p> : (
        <>
          <div className="page-title">
            <div><p className="eyebrow">PROJECT BOARD</p><h2>{project.data?.name}</h2><p>{project.data?.description}</p></div>
            <div className="team">{project.data?.members?.map(member => <span title={member.user.name} key={member.user.id}>{member.user.name[0]}</span>)}</div>
          </div>
          <div className="subnav"><Link href={`/projects/${id}/team`}>Team</Link><Link href={`/projects/${id}/activity`}>Activity</Link></div>
          {canManage && (
            <form className="inline-form" onSubmit={event => { event.preventDefault(); if (title.trim()) create.mutate(); }}>
              <input aria-label="New task title" placeholder="Add a task to this project" value={title} onChange={event => setTitle(event.target.value)} />
              <button className="primary" disabled={create.isPending}>Add task</button>
            </form>
          )}
          <div className="kanban">
            {columns.map(column => (
              <section key={column}>
                <header><h3>{column.replace("_", " ")}</h3><span>{tasks.data?.filter(task => task.status === column).length || 0}</span></header>
                {tasks.data?.filter(task => task.status === column).map(task => {
                  const canEdit = canManage || (me.data?.role === "TEAM_MEMBER" && task.assignee?.id === me.data.id);
                  return (
                    <Link className="task" href={`/tasks/${task.id}`} key={task.id}>
                      <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <h4>{task.title}</h4><p>{task.description}</p>
                      <footer>
                        <span>{task.assignee?.name || "Unassigned"}</span>
                        {canEdit
                          ? <select aria-label={`Change status for ${task.title}`} value={task.status} onClick={event => event.preventDefault()} onChange={event => { event.preventDefault(); move.mutate({ task, status: event.target.value as Task["status"] }); }}>{columns.map(status => <option key={status} value={status}>{status}</option>)}</select>
                          : <span>{task.status.replace("_", " ")}</span>}
                      </footer>
                    </Link>
                  );
                })}
                {!tasks.data?.filter(task => task.status === column).length && <div className="column-empty">Nothing here</div>}
              </section>
            ))}
          </div>
        </>
      )}
    </Guard>
  );
}
