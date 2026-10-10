"use client";

import { Guard } from "@/components/guard";
import { api, errorMessage, getData, Project, Task, User } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

const columns: Task["status"][] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
type ProjectMember = { id: string; projectRole: "MANAGER" | "MEMBER" | "VIEWER"; user: User };
type ProjectPage = { data: Project[]; pagination: { pages: number } };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const cache = useQueryClient();
  const [title, setTitle] = useState("");
  const project = useQuery({ queryKey: ["project", id], queryFn: () => getData<Project>(`/projects/${id}`) });
  const members = useQuery({ queryKey: ["members", id], queryFn: () => getData<ProjectMember[]>(`/projects/${id}/members`) });
  const tasks = useQuery({ queryKey: ["tasks", id], queryFn: () => getData<Task[]>(`/tasks?projectId=${id}&limit=100`) });
  const me = useQuery({ queryKey: ["me"], queryFn: () => getData<User>("/auth/me") });
  const accessibleProjects = useQuery({
    queryKey: ["projects", "navigation", me.data?.id],
    enabled: !!me.data?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const firstPage = await api.get<ProjectPage>("/projects?page=1&limit=100");
      const projects = [...firstPage.data.data];
      for (let page = 2; page <= firstPage.data.pagination.pages; page += 1) {
        const result = await api.get<ProjectPage>(`/projects?page=${page}&limit=100`);
        projects.push(...result.data.data);
      }
      return projects;
    }
  });
  const projectIndex = accessibleProjects.data?.findIndex(item => item.id === id) ?? -1;
  const previousProject = projectIndex > 0 ? accessibleProjects.data?.[projectIndex - 1] : undefined;
  const nextProject = projectIndex >= 0 ? accessibleProjects.data?.[projectIndex + 1] : undefined;
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
  const assign = useMutation({
    mutationFn: ({ task, assigneeId }: { task: Task; assigneeId: string | null }) =>
      api.patch(`/tasks/${task.id}`, { assigneeId, version: task.version }),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["tasks", id] });
      toast.success("Task assignment updated");
    },
    onError: error => {
      cache.invalidateQueries({ queryKey: ["tasks", id] });
      toast.error(errorMessage(error));
    }
  });

  return (
    <Guard>
      {project.isPending ? <p className="board-message">Loading project…</p> : project.isError || !project.data ? (
        <p className="form-error" role="alert">This project could not be loaded. It may have been deleted or you may no longer have access.</p>
      ) : (
        <>
          <div className="page-title">
            <div><p className="eyebrow">PROJECT BOARD</p><h2>{project.data.name}</h2><p>{project.data.description}</p></div>
            <div className="team">{project.data?.members?.map(member => <span title={member.user.name} key={member.user.id}>{member.user.name[0]}</span>)}</div>
          </div>
          <div className="project-navigation" aria-label="Project navigation">
            <button
              type="button"
              className="secondary"
              aria-label={previousProject ? `Previous project: ${previousProject.name}` : "No previous project"}
              disabled={!previousProject || accessibleProjects.isPending || accessibleProjects.isError}
              onClick={() => previousProject && router.push(`/projects/${previousProject.id}`)}
            >
              ← Previous Project
            </button>
            <button
              type="button"
              className="secondary"
              aria-label={nextProject ? `Next project: ${nextProject.name}` : "No next project"}
              disabled={!nextProject || accessibleProjects.isPending || accessibleProjects.isError}
              onClick={() => nextProject && router.push(`/projects/${nextProject.id}`)}
            >
              Next Project →
            </button>
            {accessibleProjects.isError && <small className="form-error" role="alert">Project navigation is unavailable. Reload the page to retry.</small>}
          </div>
          <div className="subnav"><Link href={`/projects/${id}/team`}>Team</Link><Link href={`/projects/${id}/activity`}>Activity</Link></div>
          {canManage && (
            <form className="inline-form" onSubmit={event => { event.preventDefault(); if (title.trim()) create.mutate(); }}>
              <input aria-label="New task title" placeholder="Add a task to this project" value={title} onChange={event => setTitle(event.target.value)} />
              <button className="primary" disabled={create.isPending}>Add task</button>
            </form>
          )}
          {tasks.isPending ? <p className="board-message">Loading tasks…</p> : tasks.isError ? (
            <p className="form-error" role="alert">Unable to load tasks. Please refresh and try again.</p>
          ) : !tasks.data?.length ? (
            <p className="board-message">No tasks have been added to this project yet.</p>
          ) : (
            <div className="kanban">
              {columns.map(column => {
                const columnTasks = tasks.data.filter(task => task.status === column);
                return (
                  <section key={column} aria-label={`${column.replace("_", " ")} tasks`}>
                    <header><h3>{column.replace("_", " ")}</h3><span>{columnTasks.length}</span></header>
                    {columnTasks.map(task => {
                      const canEdit = canManage || (me.data?.role === "TEAM_MEMBER" && task.assignee?.id === me.data.id);
                      const isMoving = move.isPending && move.variables?.task.id === task.id;
                      const isAssigning = assign.isPending && assign.variables?.task.id === task.id;
                      const activeMembers = members.data?.filter(member => member.user.isActive !== false) || [];
                      const currentAssigneeIsNotMember = task.assignee && !activeMembers.some(member => member.user.id === task.assignee?.id);
                      return (
                        <article className="task" key={task.id}>
                          <div className="task-top">
                            <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                            {task.dueDate && <time dateTime={task.dueDate}>Due {new Date(task.dueDate).toLocaleDateString()}</time>}
                          </div>
                          <h4><Link href={`/tasks/${task.id}`}>{task.title}</Link></h4>
                          {task.description && <p>{task.description}</p>}
                          <footer>
                            {canManage ? (
                              <select
                                className="task-assignee-select"
                                aria-label={`Assign ${task.title}`}
                                value={task.assignee?.id || ""}
                                disabled={isAssigning || members.isPending || members.isError}
                                onChange={event => assign.mutate({ task, assigneeId: event.target.value || null })}
                              >
                                <option value="">Unassigned</option>
                                {members.isPending && <option value="__loading" disabled>Loading team members…</option>}
                                {members.isError && <option value="__unavailable" disabled>Team members unavailable</option>}
                                {currentAssigneeIsNotMember && <option value={task.assignee!.id}>{task.assignee!.name} (current)</option>}
                                {activeMembers.map(member => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
                              </select>
                            ) : <span className="task-assignee">{task.assignee?.name || "Unassigned"}</span>}
                            {canEdit
                              ? <select aria-label={`Change status for ${task.title}`} value={task.status} disabled={isMoving} onChange={event => move.mutate({ task, status: event.target.value as Task["status"] })}>{columns.map(status => <option key={status} value={status}>{status.replace("_", " ")}</option>)}</select>
                              : <span>{task.status.replace("_", " ")}</span>}
                          </footer>
                          {canManage && members.isError && <small className="form-error" role="alert">Unable to load project members. Refresh to try again.</small>}
                          {canManage && !members.isPending && !members.isError && !activeMembers.length && <small className="muted">Add active members on the Team page to assign this task.</small>}
                        </article>
                      );
                    })}
                    {!columnTasks.length && <div className="column-empty">No tasks in this status</div>}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </Guard>
  );
}
