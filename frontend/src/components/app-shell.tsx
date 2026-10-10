"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, FolderKanban, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { api, User } from "@/lib/api";
import { useProjectRealtime } from "@/hooks/use-project-realtime";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/users", label: "People", icon: Users, admin: true },
  { href: "/profile", label: "Profile", icon: Settings }
];

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const cache = useQueryClient();
  const realtimeStatus = useProjectRealtime(user.id);
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<{ unreadCount: number }>("/notifications")).data,
    staleTime: 30_000
  });
  const visibleLinks = links.filter(link => !link.admin || user.role === "ADMIN");
  const logout = async () => {
    try {
      await api.post("/auth/logout");
      cache.clear();
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not log out");
    }
  };
  const navigation = (
    <nav>
      {visibleLinks.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={path.startsWith(href) ? "active" : ""} aria-current={path.startsWith(href) ? "page" : undefined}>
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="shell">
      <aside>
        <Link href="/dashboard" className="brand"><span>N</span>NeoStats</Link>
        <p className="workspace">WORKSPACE</p>
        {navigation}
        <div className="account">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <div><strong>{user.name}</strong><small>{user.role.replace("_", " ")}</small></div>
          <button aria-label="Log out" onClick={logout}><LogOut size={17} /></button>
        </div>
      </aside>
      <main>
        <header>
          <div><p className="eyebrow">COLLABORATIVE DELIVERY</p><h1>{links.find(link => path.startsWith(link.href))?.label || "NeoStats"}</h1></div>
          <div className="header-actions">
            <span className={`realtime-status ${realtimeStatus}`} role="status" aria-live="polite" aria-label={`Real-time ${realtimeStatus}`}>
              <span className="realtime-dot" />
              {realtimeStatus === "connected" ? "Connected" : realtimeStatus === "reconnecting" ? "Reconnecting" : realtimeStatus === "connecting" ? "Connecting" : "Disconnected"}
            </span>
            <Link href="/notifications" className="bell" aria-label={notifications.data?.unreadCount ? `Notifications, ${notifications.data.unreadCount} unread` : "Notifications"}>
              <Bell size={20} />
              {!!notifications.data?.unreadCount && <span className="unread-badge">{notifications.data.unreadCount > 99 ? "99+" : notifications.data.unreadCount}</span>}
            </Link>
          </div>
        </header>
        <div className="mobile-navigation">
          {navigation}
          <button aria-label="Log out" onClick={logout}><LogOut size={18} /></button>
        </div>
        {children}
      </main>
    </div>
  );
}
