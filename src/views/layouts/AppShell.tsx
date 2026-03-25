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
  Settings,
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
  { href: "/profile", label: "Profile", icon: User, mobileHidden: true },
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
    <div className="flex flex-col min-h-dvh bg-white">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#f0f0f0] border-t-2 border-t-[#FF9012]">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <img src="/mykuya-logo.png" alt="mykuya" className="h-8 w-auto object-contain" />
          </Link>

          {/* Role switcher for 'both' users */}
          {user.role === "both" && (
            <div className="flex rounded-lg border border-[#d9d9d9] overflow-hidden text-xs font-medium">
              <Link
                href="/dashboard"
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  !pathname.startsWith("/provider")
                    ? "bg-[#0068C9] text-white"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                Client
              </Link>
              <Link
                href="/provider/dashboard"
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  pathname.startsWith("/provider")
                    ? "bg-[#0068C9] text-white"
                    : "text-gray-600 hover:bg-gray-50",
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
              className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {liveCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ff4d4f] text-white text-[10px] font-bold flex items-center justify-center">
                  {liveCount > 9 ? "9+" : liveCount}
                </span>
              )}
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar name={user.name} src={user.avatar_url} size="sm" />
                <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-[#f0f0f0] shadow-[0_6px_16px_rgba(0,0,0,0.08)] py-1 z-50">
                  <div className="px-3 py-2 border-b border-[#f0f0f0]">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  {isClient && (
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                  )}
                  {isProvider && (
                    <Link
                      href="/provider/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" /> Provider Profile
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#ff4d4f] hover:bg-gray-50 w-full text-left"
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
        <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-14 self-start h-[calc(100dvh-3.5rem)] border-r border-[#f0f0f0] bg-white px-3 py-5 gap-0.5">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-[#e8f2fb] text-[#0068C9]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    active ? "text-[#0068C9]" : "text-gray-400",
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.label}
              </Link>
            );
          })}

          {/* Sidebar footer */}
          <div className="mt-auto pt-4 border-t border-[#f0f0f0]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#ff4d4f] hover:bg-red-50 w-full transition-colors"
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#f0f0f0] safe-bottom">
        <div className="flex items-center justify-around px-2 h-14">
          {nav.filter((item) => !(item as any).mobileHidden).map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-all",
                  active ? "text-[#0068C9]" : "text-gray-400 hover:text-gray-600",
                  // @ts-expect-error accent property
                  item.accent && !active && "text-[#FF9012]",
                )}
              >
                <item.icon
                  className={cn("w-5 h-5", active ? "text-[#0068C9]" : "text-gray-400")}
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
