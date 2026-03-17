import { Link, useLocation } from "wouter";
import { Search, Video, User, LogOut, Home, Compass, LayoutDashboard, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  userRole?: "creator" | "consumer" | null;
  username?: string;
  isAuthenticated?: boolean;
  onSearch?: (query: string) => void;
  onLogout?: () => void;
}

export function Header({ userRole, username, isAuthenticated, onSearch, onLogout }: HeaderProps) {
  const [location, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    onLogout?.();
    navigate("/");
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : "?";

  const mobileNavItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/browse", icon: Compass, label: "Browse" },
    ...(isAuthenticated && userRole === "creator"
      ? [{ href: "/creator/dashboard", icon: LayoutDashboard, label: "Studio" }]
      : isAuthenticated
      ? [{ href: "/consumer/dashboard", icon: LayoutDashboard, label: "Library" }]
      : []),
    ...(isAuthenticated
      ? [{ href: "/profile", icon: User, label: "Profile" }]
      : [{ href: "/auth", icon: User, label: "Sign In" }]),
  ];

  return (
    <>
      {/* ── Desktop / Top Header ── */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-xl border-b border-border/60 shadow-sm"
            : "bg-background/70 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex h-16 items-center gap-3 px-4 sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
            data-testid="link-home"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Video className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="font-display font-800 text-xl tracking-tight hidden sm:block"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Fandom<span className="text-[hsl(var(--primary))]">Forge</span>
            </span>
          </Link>

          {/* Search bar — expands on mobile tap */}
          <div
            className={`flex-1 transition-all duration-300 ${
              searchOpen ? "max-w-full" : "max-w-md hidden sm:block"
            }`}
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                type="search"
                placeholder="Search creators, videos…"
                className="pl-10 pr-4 h-9 bg-muted/60 border-transparent focus:border-primary/50 focus:bg-background rounded-full text-sm input-focus-ring"
                onChange={(e) => onSearch?.(e.target.value)}
                onBlur={() => setSearchOpen(false)}
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Mobile search toggle */}
          <button
            className="sm:hidden p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            <Link href="/browse">
              <Button variant="ghost" size="sm" className="rounded-full font-medium" data-testid="button-browse">
                Browse
              </Button>
            </Link>

            {isAuthenticated && userRole === "creator" && (
              <Link href="/creator/dashboard">
                <Button variant="ghost" size="sm" className="rounded-full font-medium" data-testid="button-creator-dashboard">
                  Studio
                </Button>
              </Link>
            )}
            {isAuthenticated && userRole === "consumer" && (
              <Link href="/consumer/dashboard">
                <Button variant="ghost" size="sm" className="rounded-full font-medium" data-testid="button-consumer-dashboard">
                  Library
                </Button>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 ml-auto md:ml-0">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                {/* Role pill */}
                <div
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    userRole === "creator"
                      ? "bg-[hsl(var(--primary))/0.12] text-[hsl(var(--primary))]"
                      : "bg-[hsl(var(--accent))/0.12] text-[hsl(var(--accent))]"
                  }`}
                  style={{
                    background: userRole === "creator"
                      ? "hsl(var(--primary) / 0.12)"
                      : "hsl(var(--accent) / 0.12)",
                    color: userRole === "creator"
                      ? "hsl(var(--primary))"
                      : "hsl(195 100% 42%)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current live-dot" />
                  {userRole === "creator" ? "Creator" : "Fan"}
                </div>

                {/* Avatar dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group"
                      data-testid="button-profile"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-background shadow-md group-hover:ring-primary/50 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-xl p-2">
                    <div className="px-2 py-2 mb-1">
                      <p className="text-sm font-semibold truncate">{username}</p>
                      <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {userRole === "creator" ? (
                      <DropdownMenuItem asChild>
                        <Link href="/creator/dashboard" className="cursor-pointer rounded-xl">
                          <LayoutDashboard className="h-4 w-4 mr-2" /> Studio
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/consumer/dashboard" className="cursor-pointer rounded-xl">
                          <LayoutDashboard className="h-4 w-4 mr-2" /> My Library
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive rounded-xl cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth">
                  <Button variant="ghost" size="sm" className="rounded-full" data-testid="button-login">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    size="sm"
                    className="rounded-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-white shadow-md"
                    data-testid="button-signup"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search expanded overlay */}
        {searchOpen && (
          <div className="sm:hidden px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                type="search"
                autoFocus
                placeholder="Search creators, videos…"
                className="pl-10 h-10 bg-muted/60 border-transparent focus:border-primary/50 rounded-2xl text-sm w-full"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          </div>
        )}
      </header>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-nav md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <button
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all tap-highlight ${
                    isActive
                      ? "text-[hsl(var(--primary))]"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl transition-all ${
                      isActive
                        ? "bg-[hsl(var(--primary)/0.12)]"
                        : ""
                    }`}
                    style={{
                      background: isActive ? "hsl(var(--primary) / 0.12)" : undefined,
                    }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                    {label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}