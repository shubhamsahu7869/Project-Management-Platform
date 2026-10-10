"use client";

import { Guard } from "@/components/guard";
import { api, errorMessage, getData, Project, User } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

export default function Projects() {
  const cache = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const me = useQuery({ queryKey: ["me"], queryFn: () => getData<User>("/auth/me") });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => getData<Project[]>("/projects") });
  const create = useMutation({
    mutationFn: () => api.post("/projects", { name, description, status: "PLANNING" }),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["projects"] });
      setCreating(false);
      setName("");
      setDescription("");
      toast.success("Project created");
    },
    onError: error => toast.error(errorMessage(error))
  });

  return (
    <Guard>
      <div className="page-title">
        <div><p className="eyebrow">PORTFOLIO</p><h2>Projects</h2><p>Every project you are authorized to access.</p></div>
        {me.data?.role === "ADMIN" && <button className="primary" onClick={() => setCreating(!creating)}>New project</button>}
      </div>
      {creating && me.data?.role === "ADMIN" && (
        <form className="inline-form" onSubmit={event => { event.preventDefault(); create.mutate(); }}>
          <input aria-label="Project name" placeholder="Project name" value={name} onChange={event => setName(event.target.value)} />
          <input aria-label="Description" placeholder="Short description" value={description} onChange={event => setDescription(event.target.value)} />
          <button className="primary" disabled={create.isPending || name.trim().length < 2}>Create</button>
        </form>
      )}
      <div className="project-grid">
        {projects.isPending && <p>Loading projects…</p>}
        {projects.isError && <p className="form-error">Unable to load projects.</p>}
        {projects.data?.map(project => (
          <Link className="project-card" href={`/projects/${project.id}`} key={project.id}>
            <div className="card-top"><span className={`status ${project.status.toLowerCase()}`}>{project.status.replace("_", " ")}</span><span>{project._count?.tasks || 0} tasks</span></div>
            <h3>{project.name}</h3><p>{project.description || "No description provided."}</p>
            <footer><span>{project.manager?.name || "No project manager"}</span><span>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "No due date"}</span></footer>
          </Link>
        ))}
        {!projects.isPending && !projects.data?.length && <div className="empty">No projects are available to you yet.</div>}
      </div>
    </Guard>
  );
}
