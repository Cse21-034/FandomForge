import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Video, Eye, EyeOff, Clapperboard, Users } from "lucide-react";

export default function AuthPage() {
  const { login, register, error, loading } = useAuth();
  const [_location, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "", email: "", password: "", role: "consumer",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await login(loginData.email, loginData.password); navigate("/"); }
    catch {}
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(registerData.username, registerData.email, registerData.password, registerData.role);
      navigate("/");
    } catch {}
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[80px] pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(350 100% 65% / 0.6) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full opacity-15 blur-[80px] pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(195 100% 50% / 0.5) 0%, transparent 70%)" }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(350,100%,65%)] to-[hsl(195,100%,50%)] shadow-2xl mb-4">
            <Video className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: "-0.02em" }}
          >
            Fandom<span style={{ color: "hsl(350,100%,65%)" }}>Forge</span>
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {tab === "login" ? "Welcome back" : "Join the community"}
          </p>
        </div>

        {/* Card */}
        <div className="glass-dark rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex rounded-2xl bg-white/5 p-1 mb-6">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                  tab === t
                    ? "bg-white/10 text-white shadow"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 rounded-2xl border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Login form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="bg-white/8 border-white/10 text-white placeholder:text-white/25 rounded-2xl h-11 focus:border-[hsl(350,100%,65%)] focus:ring-[hsl(350,100%,65%)/0.3]"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="bg-white/8 border-white/10 text-white placeholder:text-white/25 rounded-2xl h-11 pr-11"
                    style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-2xl font-bold text-sm mt-2 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))",
                  border: "none",
                  color: "white",
                }}
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          )}

          {/* Register form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">Username</label>
                <Input
                  type="text"
                  placeholder="coolcreator99"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  className="rounded-2xl h-11 text-white placeholder:text-white/25"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="rounded-2xl h-11 text-white placeholder:text-white/25"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="rounded-2xl h-11 pr-11 text-white placeholder:text-white/25"
                    style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" }}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">I am a…</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "consumer", label: "Fan", icon: Users, desc: "Watch content" },
                    { value: "creator", label: "Creator", icon: Clapperboard, desc: "Upload & earn" },
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRegisterData({ ...registerData, role: value })}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all ${
                        registerData.role === value
                          ? "border-[hsl(350,100%,65%)] bg-[hsl(350,100%,65%)/0.15] text-white"
                          : "border-white/10 bg-white/5 text-white/50 hover:border-white/25 hover:text-white/80"
                      }`}
                      style={registerData.role === value ? {
                        borderColor: "hsl(350,100%,65%)",
                        background: "hsl(350 100% 65% / 0.12)",
                      } : {}}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="text-xs opacity-60">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-2xl font-bold text-sm mt-1 shadow-lg border-none text-white"
                style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))" }}
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-white/25 mt-5">
            By continuing, you agree to our{" "}
            <a href="#" className="text-white/50 hover:text-white/80 underline">Terms</a>
            {" & "}
            <a href="#" className="text-white/50 hover:text-white/80 underline">Privacy</a>
          </p>
        </div>
      </div>
    </div>
  );
}