import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Code2, Lock, Zap, Users, GitBranch, Search,
  ArrowRight, Github
} from "lucide-react";

// TODO: point this at the team's actual GitHub repo URL.
const GITHUB_REPO_URL = "https://github.com/krut-tech/codevault-team";

const features = [
  { icon: Lock, title: "Private & Secure", desc: "Supabase-backed auth and row-level security — only your team gets in." },
  { icon: Zap, title: "Realtime Everywhere", desc: "Every upload, edit, and delete syncs instantly across the whole team." },
  { icon: Code2, title: "Monaco Code Editor", desc: "Full VS Code-grade editing, right in the browser, with autosave." },
  { icon: GitBranch, title: "Version History", desc: "Every save is a version. Compare, restore, never lose work." },
  { icon: Search, title: "Instant Search", desc: "Find any file, folder, or snippet across every language in ms." },
  { icon: Users, title: "Shared Ownership", desc: "No silos — any team member can organize, edit, and manage anything." },
];

const stats = [
  { value: "4", label: "Team Members" },
  { value: "∞", label: "Languages Supported" },
  { value: "100%", label: "Realtime Sync" },
  { value: "0", label: "Page Refreshes" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden bg-bg-secondary">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border-subtle/60 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-gradient shadow-glow" />
            <span className="text-lg font-bold">CodeVault Team</span>
          </div>
          <nav className="hidden gap-8 text-sm font-medium text-text-secondary md:flex">
            <a href="#features" className="hover:text-text-primary">Features</a>
            <a href="#team" className="hover:text-text-primary">Team</a>
            <a href="#stats" className="hover:text-text-primary">Stats</a>
          </nav>
          <Button size="sm" onClick={() => navigate("/login")}>Sign In</Button>
        </div>
      </header>

      <main>
      {/* Hero */}
      <section className="relative bg-mesh-glow px-6 pb-32 pt-24 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 top-10 h-72 w-72 animate-float rounded-full bg-brand/20 blur-3xl" />
          <div className="absolute right-1/4 top-40 h-72 w-72 animate-float rounded-full bg-brand-to/20 blur-3xl [animation-delay:2s]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-4 py-1.5 text-xs font-medium text-text-secondary shadow-card">
            🚀 Built for our 4-person dev team
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">
            Your team's{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              private code universe
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-text-secondary">
            Upload, organize, edit, and search every project your team has ever built —
            all in one premium, realtime workspace.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/dashboard")}>
              Enter Vault <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => window.open(GITHUB_REPO_URL, "_blank", "noopener,noreferrer")}
            >
              <Github className="h-4 w-4" /> View Repo
            </Button>
          </div>
        </motion.div>

        {/* Screenshot mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="glass rounded-2xl p-2 shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-danger/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
            </div>
            <div className="grid grid-cols-4 gap-4 p-6">
              {[..."ABCD"].map((k) => (
                <div key={k} className="h-32 animate-pulse rounded-lg bg-bg-secondary" />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-border-subtle bg-bg-surface px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="bg-brand-gradient bg-clip-text text-4xl font-bold text-transparent">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Everything your team needs</h2>
          <p className="mt-3 text-text-secondary">
            Not a GitHub clone — a purpose-built internal knowledge vault.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gradient shadow-glow">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section id="team" className="bg-bg-surface px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold">The team behind the vault</h2>
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { name: "Krut", role: "Admin" },
              { name: "Fenil", role: "Member" },
              { name: "Het", role: "Member" },
              { name: "Ishant", role: "Member" },
            ].map((m) => (
              <Card key={m.name} className="p-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-brand-gradient" />
                <p className="mt-3 font-semibold">{m.name}</p>
                <p className="text-xs text-text-secondary">{m.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-brand-gradient p-12 text-center text-white shadow-glow">
          <h2 className="text-3xl font-bold">Ready to organize everything?</h2>
          <p className="mt-3 text-white/80">Sign in and start uploading your first project.</p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-6 bg-white text-brand-hover hover:bg-white/90"
            onClick={() => navigate("/dashboard")}
          >
            Enter Vault <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
      </main>

      <footer className="border-t border-border-subtle px-6 py-8 text-center text-sm text-text-muted">
        © {new Date().getFullYear()} CodeVault Team — Internal use only.
      </footer>
    </div>
  );
}
