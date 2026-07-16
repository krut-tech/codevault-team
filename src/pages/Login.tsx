import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Mail, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, setRememberMe } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The auth store's `user` is set asynchronously by onAuthStateChange (in
  // authStore.ts) once Supabase confirms the session, which happens shortly
  // after signInWithPassword resolves. Nothing was previously watching that
  // state here, so a fully successful login (network requests 200 OK) left
  // the user stuck on the login screen forever — this effect is what
  // actually completes the sign-in flow. It also covers the case where
  // someone who's already logged in lands on /login directly.
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Must be set before signInWithPassword — the auth client reads this
    // preference to decide whether to persist the session in localStorage
    // (survives browser restart) or sessionStorage (cleared on tab close).
    setRememberMe(remember);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    // No navigate() call needed here on success — the useEffect above
    // handles it once the auth store's user state updates.
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-mesh-glow bg-bg-secondary px-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-1/4 h-72 w-72 animate-float rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute right-1/3 bottom-1/4 h-72 w-72 animate-float rounded-full bg-brand-to/20 blur-3xl [animation-delay:2s]" />
      </div>

      <Card className="w-full max-w-md p-8 glass">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-lg bg-brand-gradient shadow-glow" />
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to CodeVault Team</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="you@team.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-text-secondary">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-border-subtle accent-brand"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-medium text-brand hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
}
