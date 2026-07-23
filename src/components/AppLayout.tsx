import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { type ReactNode, useState } from "react";

export function AppLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg-secondary">
      <Sidebar isAdmin={isAdmin} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-bg-surface/80 px-4 py-3 backdrop-blur-xl sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-md p-1.5 hover:bg-bg-secondary md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <motion.h1
                key={title}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="text-lg font-bold sm:text-xl"
              >
                {title}
              </motion.h1>
              {subtitle && <p className="hidden text-sm text-text-secondary sm:block">{subtitle}</p>}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-initial sm:gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) navigate(`/search?q=${encodeURIComponent(q)}`);
              }}
              className="hidden sm:block"
            >
              <Input
                placeholder="Search everything..."
                icon={<Search className="h-4 w-4" />}
                className="w-56 md:w-72"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </form>
            <Button variant="secondary" size="icon" className="sm:hidden" aria-label="Search" onClick={() => navigate("/search")}>
              <Search className="h-4 w-4" />
            </Button>
            {actions}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/profile")}
              className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-brand-gradient"
              title={user?.full_name}
              aria-label="Open profile"
            >
              {user?.avatar_url && (
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              )}
            </motion.button>
          </div>
        </header>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-4 sm:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}