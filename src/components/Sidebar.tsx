import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Code2, FolderKanban, Files, Bookmark,
  Star, Clock, Download, Search, Bell, User,
  ShieldCheck, Users, ScrollText, ChevronLeft, FileCode2
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useSetting } from "@/hooks/useSettings";

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/languages", label: "Languages", icon: Code2 },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/files", label: "Files", icon: Files },
  { to: "/snippets", label: "Snippets", icon: FileCode2 },
  { to: "/collections", label: "Collections", icon: Bookmark },
  { to: "/favorites", label: "Favorites", icon: Star },
  { to: "/recent", label: "Recent", icon: Clock },
  { to: "/downloads", label: "Downloads", icon: Download },
];

const utilityNav = [
  { to: "/search", label: "Search", icon: Search },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

const adminNav = [
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/logs", label: "Activity Logs", icon: ScrollText },
  { to: "/admin/settings", label: "System Settings", icon: ShieldCheck },
];

export function Sidebar({
  isAdmin = false,
  mobileOpen = false,
  onMobileClose,
}: {
  isAdmin?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: logoUrl } = useSetting<string>("logo_url");

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-border-subtle bg-bg-surface/95 backdrop-blur-xl transition-all duration-300",
          "fixed z-50 md:static md:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-[76px]" : "md:w-64",
          "w-64"
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-brand-gradient shadow-glow">
            {logoUrl && <img src={logoUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="text-base font-bold tracking-tight">CodeVault</span>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <NavSection items={mainNav} collapsed={collapsed} onNavigate={onMobileClose} />
          <div className="my-3 border-t border-border-subtle" />
          <NavSection items={utilityNav} collapsed={collapsed} onNavigate={onMobileClose} />
          {isAdmin && (
            <>
              <div className="my-3 border-t border-border-subtle" />
              {!collapsed && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Admin
                </p>
              )}
              <NavSection items={adminNav} collapsed={collapsed} onNavigate={onMobileClose} />
            </>
          )}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden items-center justify-center gap-2 border-t border-border-subtle py-3 text-text-muted hover:text-text-primary md:flex"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    </>
  );
}

function NavSection({
  items,
  collapsed,
  onNavigate,
}: {
  items: { to: string; label: string; icon: any }[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary",
              isActive && "bg-brand/10 text-brand"
            )
          }
        >
          <Icon className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>{label}</span>}
        </NavLink>
      ))}
    </>
  );
}
