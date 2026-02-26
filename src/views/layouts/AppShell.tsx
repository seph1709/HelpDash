"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Briefcase,
  Bell,
  User,
  PlusCircle,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/views/components/shared/Avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { User as UserType } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  user: UserType;
  notificationCount?: number;
}

const clientNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/post-job", label: "Post Job", icon: PlusCircle, accent: true },
  { href: "/bookings", label: "Bookings", icon: Briefcase },
  { href: "/providers", label: "Providers", icon: MapPin },
];

const providerNav = [
  { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/provider/job-feed", label: "Job Feed", icon: ListOrdered },
  { href: "/provider/bookings", label: "Bookings", icon: Briefcase },
  { href: "/provider/profile", label: "Profile", icon: User },
];

export function AppShell({
  children,
  user,
  notificationCount = 0,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [liveCount, setLiveCount] = useState(notificationCount);

  useEffect(() => {
    if (pathname === '/notifications') {
      setLiveCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`user-notifs:${user.id}`)
      .on("broadcast", { event: "notification" }, ({ payload }) => {
        setLiveCount((c) => c + 1);
        toast.info(payload.message as string);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const isProvider = user.role === "provider" || user.role === "both";
  const isClient = user.role === "client" || user.role === "both";
  const nav = pathname.startsWith("/provider")
    ? providerNav
    : isClient
      ? clientNav
      : providerNav;

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col min-h-dvh bg-slate-50">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">
              HelpDash
            </span>
          </Link>

          {/* Role switcher for 'both' users */}
          {user.role === "both" && (
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
              <Link
                href="/dashboard"
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  !pathname.startsWith("/provider")
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                Client
              </Link>
              <Link
                href="/provider/dashboard"
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  pathname.startsWith("/provider")
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                Provider
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {liveCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {liveCount > 9 ? "9+" : liveCount}
                </span>
              )}
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Avatar name={user.name} src={user.avatar_url} size="sm" />
                <span className="hidden lg:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-100 shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-50">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  {isProvider && (
                    <Link
                      href="/provider/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-4 h-4" /> Provider Profile
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-14 self-start h-[calc(100dvh-3.5rem)] border-r border-slate-100 bg-white px-3 py-6 gap-1">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <item.icon
                  className={cn(
                    "w-4.5 h-4.5 shrink-0",
                    active ? "text-indigo-600" : "text-slate-400",
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.label}
              </Link>
            );
          })}

          {/* Sidebar footer */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 pb-24 lg:pb-8 animate-fade-in">
          <div className="max-w-3xl">{children}</div>
        </main>
      </div>

      {/* Bottom navigation — mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 safe-bottom">
        <div className="flex items-center justify-around px-2 h-16">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors",
                  active
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-700",
                  // @ts-expect-error accent property
                  item.accent && !active && "text-indigo-500",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    active && "fill-current opacity-20 stroke-current",
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
