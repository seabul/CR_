"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  BookOpen,
  History,
  Settings,
  UserCircle,
  User,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Calendar,
  GraduationCap,
} from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session, isPending } = useSession();
  const [currentDate, setCurrentDate] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [studentCount, setStudentCount] = useState(30);
  const [courseCount, setCourseCount] = useState(3);
  const [userPhoto, setUserPhoto] = useState<string>("");

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setStudentCount(d.length);
      })
      .catch(() => {});

    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCourseCount(d.length);
      })
      .catch(() => {});

    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.image) setUserPhoto(d.image);
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      toast.success("🌙 Dark Mode Activated");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      toast.success("☀️ Light Mode Activated");
    }
  };

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      toast.error("Error signing out");
    }
  };

  // Restored original attendance domain names
  const mainMenuNav = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Take Attendance",
      href: "/attendance/take",
      icon: ClipboardCheck,
      badge: "FAST",
      badgeColor: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50",
    },
    {
      name: "Students",
      href: "/students",
      icon: Users,
      badge: String(studentCount),
      badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    },
    {
      name: "Course Management",
      href: "/courses",
      icon: BookOpen,
      badge: String(courseCount),
      badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    },
    {
      name: "Attendance History",
      href: "/attendance/history",
      icon: History,
    },
  ];

  const settingsNav = [
    {
      name: "Profile",
      href: "/profile",
      icon: UserCircle,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const getBreadcrumbs = () => {
    if (pathname === "/") return { section: "Portal", title: "Dashboard Overview" };
    if (pathname.startsWith("/attendance/take"))
      return { section: "Attendance", title: "Take Attendance" };
    if (pathname.startsWith("/attendance/history"))
      return { section: "Attendance", title: "Attendance History" };
    if (pathname.startsWith("/students"))
      return { section: "Class Roster", title: "Students" };
    if (pathname.startsWith("/courses"))
      return { section: "Curriculum", title: "Course Management" };
    if (pathname.startsWith("/profile"))
      return { section: "Account", title: "CR Profile" };
    if (pathname.startsWith("/settings"))
      return { section: "Preferences", title: "Settings" };
    return { section: "Portal", title: "Dashboard" };
  };

  const breadcrumbs = getBreadcrumbs();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090e17]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading CR Workspace...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user as unknown as {
    name?: string;
    email?: string;
  };

  const userName = user?.name || "Class Representative";
  const userEmail = user?.email || "cr@miu.edu.bd";

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#090e17] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0c1322] border-r border-slate-200/80 dark:border-slate-800 transition-all duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-[72px]" : "w-[248px]"}`}
      >
        {/* Brand Header */}
        <div className="flex h-[64px] items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/80">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-bold text-sm shadow-xs transition group-hover:scale-105">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold tracking-tight text-slate-900 dark:text-white truncate">
                    CR Attendance
                  </span>
                  <span className="rounded-md bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.2 text-[9px] font-bold text-teal-700 dark:text-teal-300 border border-teal-200/50">
                    B-66
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Manarat Int. University
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle / Close */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto overflow-x-hidden p-3 space-y-6">
          <div className="space-y-5">
            {/* MAIN MENU */}
            <div>
              {!isCollapsed && (
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                  Main Menu
                </p>
              )}
              <nav className="space-y-1">
                {mainMenuNav.map((item) => {
                  const Icon = item.icon;
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      title={isCollapsed ? item.name : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 transition ${
                          active
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                        }`}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span
                              className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                item.badgeColor ||
                                "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* SETTINGS */}
            <div>
              {!isCollapsed && (
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                  Settings & Tools
                </p>
              )}
              <nav className="space-y-1">
                {settingsNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      title={isCollapsed ? item.name : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 transition ${
                          active
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div
              className={`flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Link
                href="/profile"
                title="View & Edit CR Profile"
                className="flex items-center gap-2.5 flex-1 min-w-0 group"
              >
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-xs ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs transition group-hover:scale-105 overflow-hidden">
                  {userPhoto ? (
                    <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{userName.charAt(0).toUpperCase()}</span>
                  )}
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>

                {!isCollapsed && (
                  <div className="flex flex-1 flex-col min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {userName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                      {userEmail}
                    </p>
                  </div>
                )}
              </Link>

              {!isCollapsed && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={toggleTheme}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Minimal Bar */}
        <header className="sticky top-0 z-30 w-full border-b border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-[#0c1322]/90 backdrop-blur-xl px-3 py-2.5 sm:px-6 lg:px-8 transition-colors">
          <div className="mx-auto flex min-h-11 max-w-[1360px] items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:border-teal-300 hover:text-teal-600 dark:hover:border-teal-700 dark:hover:text-teal-400 lg:hidden"
                aria-label="Toggle Menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-3 py-2 text-xs">
                <span className="font-medium text-slate-400 dark:text-slate-500">
                  {breadcrumbs.section}
                </span>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {breadcrumbs.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {currentDate && (
                <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl px-3 py-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{currentDate}</span>
                </div>
              )}

              <Link
                href="/attendance/take"
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-sm shadow-teal-600/20"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Take Attendance</span>
              </Link>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-300 hover:text-teal-600 dark:hover:border-teal-700 dark:hover:text-teal-400 transition"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Profile Icon Button */}
              <Link
                href="/profile"
                title="View & Edit Profile"
                className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 pl-1.5 pr-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-300 hover:bg-teal-50/50 dark:hover:border-teal-700 dark:hover:bg-teal-950/20 transition shadow-sm group"
              >
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-bold text-[10px] shadow-xs ring-2 ring-teal-100 dark:ring-teal-950 group-hover:scale-105 transition overflow-hidden">
                  {userPhoto ? (
                    <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{userName.charAt(0).toUpperCase()}</span>
                  )}
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-1 ring-white dark:ring-slate-900" />
                </div>
                <span className="hidden sm:inline truncate max-w-[120px]">{userName}</span>
                <User className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1360px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
