"use client";

import { Guard } from "@/components/guard";
import { api, errorMessage, getData, User } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

type UserResponse = { data: User[] };

export default function Users() {
  const cache = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("TEAM_MEMBER");
  const [createErrors, setCreateErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [editing, setEditing] = useState<{ id: string; name: string; email: string } | null>(null);
  const me = useQuery({ queryKey: ["me"], queryFn: () => getData<User>("/auth/me") });
  const users = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get<UserResponse>("/users")).data });
  const refresh = () => cache.invalidateQueries({ queryKey: ["users"] });
  const add = useMutation({
    mutationFn: () => api.post("/users", { name, email, password, role }),
    onSuccess: () => {
      toast.success("User created");
      setName("");
      setEmail("");
      setPassword("");
      setCreateErrors({});
      refresh();
    },
    onError: error => toast.error(errorMessage(error))
  });
  const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: typeof createErrors = {};
    if (name.trim().length < 2) errors.name = "Enter a name with at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";
    if (password.length < 10) errors.password = "Password must be at least 10 characters.";
    setCreateErrors(errors);
    if (!Object.keys(errors).length && !add.isPending) add.mutate();
  };
  const update = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: { role?: User["role"]; isActive?: boolean } }) => api.patch(`/users/${id}`, changes),
    onSuccess: () => { refresh(); toast.success("User updated"); },
    onError: error => toast.error(errorMessage(error))
  });
  const saveDetails = useMutation({
    mutationFn: (details: { id: string; name: string; email: string }) => api.patch(`/users/${details.id}`, { name: details.name, email: details.email }),
    onSuccess: () => { setEditing(null); refresh(); toast.success("User details updated"); },
    onError: error => toast.error(errorMessage(error))
  });

  return (
    <Guard>
      <div className="page-title"><div><p className="eyebrow">ADMINISTRATION</p><h2>People</h2><p>Manage access to the NeoStats workspace.</p></div></div>
      {me.data?.role === "ADMIN" && (
        <form className="inline-form user-form" onSubmit={submitCreate} noValidate>
          <label>
            <input aria-label="Full name" placeholder="Full name" value={name} autoComplete="name" aria-invalid={!!createErrors.name} aria-describedby={createErrors.name ? "create-user-name-error" : undefined} onChange={event => { setName(event.target.value); setCreateErrors(current => ({ ...current, name: undefined })); }} />
            {createErrors.name && <small id="create-user-name-error" role="alert">{createErrors.name}</small>}
          </label>
          <label>
            <input aria-label="Email address" type="email" placeholder="Email address" value={email} autoComplete="email" aria-invalid={!!createErrors.email} aria-describedby={createErrors.email ? "create-user-email-error" : undefined} onChange={event => { setEmail(event.target.value); setCreateErrors(current => ({ ...current, email: undefined })); }} />
            {createErrors.email && <small id="create-user-email-error" role="alert">{createErrors.email}</small>}
          </label>
          <label>
            <input aria-label="Temporary password" type="password" autoComplete="new-password" placeholder="Temporary password (10+ characters)" value={password} aria-invalid={!!createErrors.password} aria-describedby={createErrors.password ? "create-user-password-error" : undefined} onChange={event => { setPassword(event.target.value); setCreateErrors(current => ({ ...current, password: undefined })); }} />
            {createErrors.password && <small id="create-user-password-error" role="alert">{createErrors.password}</small>}
          </label>
          <select aria-label="System role" value={role} onChange={event => setRole(event.target.value as User["role"])}>
            <option value="TEAM_MEMBER">TEAM_MEMBER</option><option value="PROJECT_MANAGER">PROJECT_MANAGER</option><option value="VIEWER">VIEWER</option><option value="ADMIN">ADMIN</option>
          </select>
          <button className="primary" disabled={add.isPending}>{add.isPending ? "Creating…" : "Create user"}</button>
        </form>
      )}
      <section className="panel table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>System role</th><th>Status</th>{me.data?.role === "ADMIN" && <th>Actions</th>}</tr></thead>
          <tbody>{users.data?.data.map(user => (
            <tr key={user.id}>
              <td>{editing?.id === user.id
                ? <input aria-label={`Name for ${user.email}`} value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} />
                : user.name}</td>
              <td>{editing?.id === user.id
                ? <input aria-label={`Email for ${user.name}`} type="email" value={editing.email} onChange={event => setEditing({ ...editing, email: event.target.value })} />
                : user.email}</td>
              <td>
                {me.data?.role === "ADMIN"
                  ? <select aria-label={`Role for ${user.name}`} value={user.role} onChange={event => update.mutate({ id: user.id, changes: { role: event.target.value as User["role"] } })}>
                      <option value="ADMIN">ADMIN</option><option value="PROJECT_MANAGER">PROJECT_MANAGER</option><option value="TEAM_MEMBER">TEAM_MEMBER</option><option value="VIEWER">VIEWER</option>
                    </select>
                  : <span className="status active">{user.role.replace("_", " ")}</span>}
              </td>
              <td>
                {me.data?.role === "ADMIN"
                  ? <button className="secondary" disabled={user.id === me.data.id && user.isActive} onClick={() => update.mutate({ id: user.id, changes: { isActive: !user.isActive } })}>{user.isActive ? "Deactivate" : "Reactivate"}</button>
                  : user.isActive ? "Active" : "Inactive"}
              </td>
              {me.data?.role === "ADMIN" && <td>
                {editing?.id === user.id
                  ? <><button className="secondary" disabled={saveDetails.isPending || editing.name.trim().length < 2} onClick={() => { if (editing) saveDetails.mutate(editing); }}>Save</button>{" "}<button className="secondary" onClick={() => setEditing(null)}>Cancel</button></>
                  : <button className="secondary" onClick={() => setEditing({ id: user.id, name: user.name, email: user.email })}>Edit</button>}
              </td>}
            </tr>
          ))}</tbody>
        </table>
        {users.isPending && <p className="board-message">Loading people…</p>}
        {users.isError && <p className="form-error" role="alert">Unable to load people. Check your administrator access and try again.</p>}
        {!users.isPending && !users.isError && !users.data?.data.length && <div className="empty">No people found in this workspace yet.</div>}
      </section>
    </Guard>
  );
}
