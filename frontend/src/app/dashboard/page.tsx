"use client";

import { Guard } from "@/components/guard";
import { getData, Project, User } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCircle2, FolderKanban, ListTodo } from "lucide-react";
import Link from "next/link";

type Stats = {
  projects: number;
  tasks: number;
  completedTasks: number;
  unreadNotifications: number;
};

export default function Dashboard() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => getData<User>("/auth/me") });
  const stats = useQuery({
    queryKey: ["stats", me.data?.id],
    enabled: !!me.data?.id,
    queryFn: () => getData<Stats>("/dashboard/stats")
  });
  const recentProjects = useQuery({
    queryKey: ["dashboard-projects", me.data?.id],
    enabled: !!me.data?.id,
    staleTime: 30_000,
    queryFn: () => getData<Project[]>("/projects?page=1&limit=5")
  });
  const cards = [
    { label: "Accessible projects", value: stats.data?.projects, icon: FolderKanban },
    { label: "Total accessible tasks", value: stats.data?.tasks, icon: ListTodo },
    { label: "Completed tasks", value: stats.data?.completedTasks, icon: CheckCircle2 },
    { label: "Unread notifications", value: stats.data?.unreadNotifications, icon: Bell }
  ];

  return (
    <Guard>
      <section className="hero">
        <div>
          <p className="eyebrow">PROJECT CONTROL CENTER</p>
          <h2>Keep every delivery decision connected.</h2>
          <p>Track the work across projects and move straight to what needs attention.</p>
        </div>
        <Link className="primary" href="/projects">Open projects</Link>
      </section>

      {stats.isError && <p className="form-error" role="alert">Unable to load dashboard statistics. Please refresh to try again.</p>}
      <section className="stat-grid" aria-label="Workspace statistics">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="stat" key={label}>
            <Icon size={19} />
            <span>{label}</span>
            <strong>{stats.isPending || stats.isError ? "—" : value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-projects">
        <div className="section-heading">
          <div><p className="eyebrow">YOUR WORKSPACE</p><h3>Recent projects</h3></div>
          <Link className="text-link" href="/projects">View all</Link>
        </div>
        {recentProjects.isPending && <p className="board-message">Loading your projects…</p>}
        {recentProjects.isError && <p className="form-error" role="alert">Unable to load recent projects. Please try again.</p>}
        {recentProjects.data?.length ? (
          <div className="project-grid">
            {recentProjects.data.map(project => (
              <Link className="project-card" href={`/projects/${project.id}`} key={project.id}>
                <div className="card-top">
                  <span className={`status ${project.status.toLowerCase()}`}>{project.status.replace("_", " ")}</span>
                  <span>{project._count?.tasks ?? 0} tasks</span>
                </div>
                <h3>{project.name}</h3>
                <p>{project.description || "No description provided."}</p>
                <footer><span>{project.manager?.name || "No project manager"}</span></footer>
              </Link>
            ))}
          </div>
        ) : !recentProjects.isPending && !recentProjects.isError ? (
          <div className="empty">No accessible projects are available yet.</div>
        ) : null}
      </section>
    </Guard>
  );
}
