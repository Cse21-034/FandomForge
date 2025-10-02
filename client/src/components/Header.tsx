import { Link } from "wouter";
import { Search, Video, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  userRole?: "creator" | "consumer" | null;
  onSearch?: (query: string) => void;
}

export function Header({ userRole, onSearch }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover-elevate px-3 py-2 rounded-md" data-testid="link-home">
          <Video className="h-6 w-6 text-primary" />
          CreatorHub
        </Link>
        
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search creators or content..."
              className="pl-10"
              onChange={(e) => onSearch?.(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link href="/browse">
            <Button variant="ghost" data-testid="button-browse">
              Browse
            </Button>
          </Link>
          
          {userRole === "creator" && (
            <Link href="/creator/dashboard">
              <Button variant="ghost" data-testid="button-creator-dashboard">
                Dashboard
              </Button>
            </Link>
          )}
          
          {userRole === "consumer" && (
            <Link href="/consumer/dashboard">
              <Button variant="ghost" data-testid="button-consumer-dashboard">
                My Subscriptions
              </Button>
            </Link>
          )}
          
          {userRole && (
            <Badge variant="secondary" className="ml-2">
              {userRole === "creator" ? "Creator" : "Fan"}
            </Badge>
          )}
          
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" data-testid="button-profile">
            <User className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
