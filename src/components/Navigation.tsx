import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/classes", label: "Classes" },
    { path: "/events", label: "Events" },
    { path: "/profile", label: "Profile" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-black tracking-tighter">
            ELIT<span className="inline-block scale-x-[-1]">E</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-foreground ${
                  isActive(link.path) ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-foreground ${
                  isActive("/admin") ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Admin
              </Link>
            )}
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="uppercase tracking-wider"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button size="sm" className="uppercase tracking-wider" onClick={() => navigate("/auth")}>
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-foreground ${
                    isActive(link.path) ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-foreground ${
                    isActive("/admin") ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Admin
                </Link>
              )}
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="w-full uppercase tracking-wider"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button size="sm" className="w-full uppercase tracking-wider" onClick={() => navigate("/auth")}>
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
