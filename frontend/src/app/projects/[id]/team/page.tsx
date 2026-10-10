"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Guard } from "@/components/guard";
import { api, errorMessage, getData, Project, User } from "@/lib/api";
import { toast } from "sonner";

type Member = { id: string; projectRole: "MANAGER" | "MEMBER" | "VIEWER"; user: User };

export default function Team() {
  const { id } = useParams<{ id: string }>();
  const cache = useQueryClient();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Member["projectRole"]>("MEMBER");
  const me = useQuery({ queryKey: ["me"], queryFn: () => getData<User>("/auth/me") });
  const project = useQuery({ queryKey: ["project", id], queryFn: () => getData<Project>(`/projects/${id}`) });
  const members = useQuery({ queryKey: ["members", id], queryFn: () => getData<Member[]>(`/projects/${id}/members`) });
  const canManage = me.data?.role === "ADMIN" || project.data?.manager?.id === me.data?.id;
  const eligible = useQuery({
    queryKey: ["eligible-users", id],
    queryFn: () => getData<User[]>(`/projects/${id}/eligible-users`),
    enabled: canManage
  });
  const refresh = () => {
    cache.invalidateQueries({ queryKey: ["members", id] });
    cache.invalidateQueries({ queryKey: ["eligible-users", id] });
  };
  const add = useMutation({
    mutationFn: () => api.post(`/projects/${id}/members`, { userId, projectRole: role }),
    onSuccess: () => { refresh(); setUserId(""); toast.success("Member added"); },
    onError: error => toast.error(errorMessage(error))
  });
  const update = useMutation({
    mutationFn: ({ member, nextRole }: { member: Member; nextRole: Member["projectRole"] }) => api.patch(`/projects/${id}/members/${member.user.id}`, { projectRole: nextRole }),
    onSuccess: () => { refresh(); toast.success("Project role updated"); },
    onError: error => toast.error(errorMessage(error))
  });
  const remove = useMutation({
    mutationFn: (memberId: string) => api.delete(`/projects/${id}/members/${memberId}`),
    onSuccess: () => { refresh(); toast.success("Member removed"); },
    onError: error => toast.error(errorMessage(error))
  });

  return (
    <Guard>
      <div className="page-title"><div><p className="eyebrow">PROJECT ACCESS</p><h2>Team members</h2><p>{canManage ? "Manage project access and roles." : "View the project team and their roles."}</p></div></div>
      {canManage && (
        <form className="inline-form" onSubmit={event => { event.preventDefault(); if (userId) add.mutate(); }}>
          <select aria-label="Select active user" value={userId} onChange={event => setUserId(event.target.value)}>
            <option value="">Select an active user…</option>
            {eligible.data?.map(user => <option value={user.id} key={user.id}>{user.name} — {user.email}</option>)}
          </select>
          <select aria-label="New project role" value={role} onChange={event => setRole(event.target.value as Member["projectRole"])}>
            <option value="MEMBER">MEMBER</option><option value="VIEWER">VIEWER</option><option value="MANAGER">MANAGER</option>
          </select>
          <button className="primary" disabled={!userId || add.isPending}>Add member</button>
        </form>
      )}
      <section className="panel member-list">
        {members.data?.map(member => (
          <article key={member.id}>
            <div className="avatar">{member.user.name[0]}</div>
            <div><strong>{member.user.name}</strong><small>{member.user.email} · {member.user.role.replace("_", " ")}</small></div>
            {canManage
              ? <select aria-label={`Role for ${member.user.name}`} value={member.projectRole} onChange={event => update.mutate({ member, nextRole: event.target.value as Member["projectRole"] })}>
                  <option value="MANAGER">MANAGER</option><option value="MEMBER">MEMBER</option><option value="VIEWER">VIEWER</option>
                </select>
              : <span className="status active">{member.projectRole}</span>}
            {canManage && <button className="text-button" onClick={() => remove.mutate(member.user.id)}>Remove</button>}
          </article>
        ))}
        {!members.isPending && !members.data?.length && <div className="empty">No team members found.</div>}
      </section>
    </Guard>
  );
}
