"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Wrench,
  FolderTree,
  CalendarCheck,
  Star,
  AlertTriangle,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  RefreshCw,
  Filter,
  Check,
  LogOut,
} from "lucide-react";

type Section =
  | "overview"
  | "users"
  | "providers"
  | "services"
  | "categories"
  | "bookings"
  | "reviews"
  | "complaints"
  | "reports"
  | "settings";

const navigation: { id: Section; label: string; icon: any; group: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Workspace" },
  { id: "users", label: "Users", icon: Users, group: "Management" },
  { id: "providers", label: "Providers", icon: Briefcase, group: "Management" },
  { id: "services", label: "Services", icon: Wrench, group: "Management" },
  { id: "categories", label: "Categories", icon: FolderTree, group: "Management" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, group: "Operations" },
  { id: "reviews", label: "Reviews", icon: Star, group: "Operations" },
  { id: "complaints", label: "Complaints", icon: AlertTriangle, group: "Operations" },
  { id: "reports", label: "Reports", icon: TrendingUp, group: "Workspace" },
  { id: "settings", label: "Settings", icon: Sliders, group: "Workspace" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: authUser, logout, isAuthenticated } = useAuth();

  const [section, setSection] = useState<Section>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const adminName = authUser?.firstName
    ? `${authUser.firstName} ${authUser.lastName || ""}`.trim()
    : authUser?.email
    ? authUser.email.split("@")[0]
    : "Aiman";

  const adminInitials = authUser?.firstName
    ? `${authUser.firstName[0]}${authUser.lastName ? authUser.lastName[0] : ""}`.toUpperCase()
    : "AM";

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  // Data states (100% Real Database Records)
  const [overview, setOverview] = useState<any>(null);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  // Providers
  const [providers, setProviders] = useState<any[]>([]);

  // Services
  const [services, setServices] = useState<any[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("");

  // Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🛠️");

  // Bookings
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");

  // Reviews & Complaints
  const [reviews, setReviews] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  // Reports & Settings
  const [reports, setReports] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    commissionRate: 10,
    supportEmail: "support@servicehub.pk",
    cancellationWindowHours: 24,
    autoConfirmBookings: false,
    maintenanceMode: false,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Fetch Section Data
  const loadSectionData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (section === "overview") {
        const res = await fetch(`${API_BASE}/api/admin/overview`);
        const json = await res.json();
        if (json.status === "ok") setOverview(json.data);
      } else if (section === "users") {
        const params = new URLSearchParams();
        if (userSearch) params.append("search", userSearch);
        if (userRoleFilter !== "all") params.append("role", userRoleFilter);
        if (userStatusFilter !== "all") params.append("status", userStatusFilter);
        const res = await fetch(`${API_BASE}/api/admin/users?${params}`);
        const json = await res.json();
        if (json.status === "ok") setUsers(json.data);
      } else if (section === "providers") {
        const res = await fetch(`${API_BASE}/api/admin/providers`);
        const json = await res.json();
        if (json.status === "ok") setProviders(json.data);
      } else if (section === "services") {
        const [servRes, catRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/services`),
          fetch(`${API_BASE}/api/admin/categories`),
        ]);
        const servJson = await servRes.json();
        const catJson = await catRes.json();
        if (servJson.status === "ok") setServices(servJson.data);
        if (catJson.status === "ok") setCategories(catJson.data);
      } else if (section === "categories") {
        const res = await fetch(`${API_BASE}/api/admin/categories`);
        const json = await res.json();
        if (json.status === "ok") setCategories(json.data);
      } else if (section === "bookings") {
        const params = new URLSearchParams();
        if (bookingStatusFilter !== "all") params.append("status", bookingStatusFilter);
        if (bookingSearch) params.append("search", bookingSearch);
        const res = await fetch(`${API_BASE}/api/admin/bookings?${params}`);
        const json = await res.json();
        if (json.status === "ok") setBookings(json.data);
      } else if (section === "reviews") {
        const res = await fetch(`${API_BASE}/api/admin/reviews`);
        const json = await res.json();
        if (json.status === "ok") setReviews(json.data);
      } else if (section === "complaints") {
        const res = await fetch(`${API_BASE}/api/admin/complaints`);
        const json = await res.json();
        if (json.status === "ok") setComplaints(json.data);
      } else if (section === "reports") {
        const res = await fetch(`${API_BASE}/api/admin/reports`);
        const json = await res.json();
        if (json.status === "ok") setReports(json.data);
      } else if (section === "settings") {
        const res = await fetch(`${API_BASE}/api/admin/settings`);
        const json = await res.json();
        if (json.status === "ok") setSettings(json.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load admin data from server");
    } finally {
      setLoading(false);
    }
  }, [section, userSearch, userRoleFilter, userStatusFilter, bookingStatusFilter, bookingSearch]);

  useEffect(() => {
    void loadSectionData();
  }, [loadSectionData, refreshKey]);

  // Actions
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error updating user: " + err.message);
    }
  };

  const handleChangeUserRole = async (userId: string, role: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error updating user role: " + err.message);
    }
  };

  const handleToggleProviderVerification = async (providerId: string, currentVerified: boolean) => {
    try {
      await fetch(`${API_BASE}/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !currentVerified }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error updating provider: " + err.message);
    }
  };

  const handleChangeProviderStatus = async (providerId: string, status: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error updating provider status: " + err.message);
    }
  };

  const handleToggleCategoryVisibility = async (categoryId: string, currentActive: boolean) => {
    try {
      await fetch(`${API_BASE}/api/admin/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error updating category visibility: " + err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await fetch(`${API_BASE}/api/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, description: newCatDesc, icon: newCatIcon }),
      });
      setNewCatName("");
      setNewCatDesc("");
      setNewCatIcon("🛠️");
      setShowAddCat(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error adding category: " + err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await fetch(`${API_BASE}/api/admin/categories/${id}`, { method: "DELETE" });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error deleting category: " + err.message);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrice) return;
    try {
      await fetch(`${API_BASE}/api/admin/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newServiceName,
          price: Number(newServicePrice),
          categoryId: newServiceCategory || undefined,
        }),
      });
      setNewServiceName("");
      setNewServicePrice("");
      setNewServiceCategory("");
      setShowAddService(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error adding service: " + err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await fetch(`${API_BASE}/api/admin/services/${id}`, { method: "DELETE" });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error deleting service: " + err.message);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error updating booking: " + err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 antialiased">
      {/* SIDEBAR (BRAND DARK - ServiceHub) */}
      <aside className="w-full lg:w-64 bg-[#0B0E1B] text-slate-300 border-r border-slate-800 flex flex-col justify-between p-5 flex-shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-extrabold tracking-tight text-xl">
                Service<span className="text-indigo-400">Hub</span>
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigation.map((item, idx) => {
              const Icon = item.icon;
              const isActive = section === item.id;
              const isNewGroup = idx === 0 || navigation[idx - 1].group !== item.group;

              return (
                <div key={item.id}>
                  {isNewGroup && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-4 pb-1">
                      {item.group}
                    </p>
                  )}
                  <button
                    onClick={() => setSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Admin User Badge & Logout */}
        <div className="border-t border-slate-800/80 pt-4 mt-6 space-y-3 px-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-inner">
              {adminInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <p className="text-[11px] text-slate-400 truncate">{authUser?.email || "Platform Admin"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-800/60 text-xs font-medium transition"
            title="Log out of ServiceHub Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold capitalize">{section}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected</span>
            </div>

            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition"
              title="Log out of ServiceHub"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight capitalize">
                {section === "overview" ? "Dashboard Overview" : `${section} Management`}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time data synced directly with the ServiceHub database.
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{error}. Ensure your backend server is running on port 4000.</span>
            </div>
          )}

          {/* 1. OVERVIEW */}
          {section === "overview" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Total Registered Users</span>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mt-3">
                    {overview ? overview.totalUsers : "…"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{overview?.customersCount ?? 0}</span> customers ·{" "}
                    <span className="font-semibold text-slate-700">{overview?.providersCount ?? 0}</span> providers
                  </p>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Active Providers</span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mt-3">
                    {overview ? overview.providersCount : "…"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{overview?.providersCount ?? 0}</span> profile(s) listed
                  </p>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Total Bookings</span>
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mt-3">
                    {overview ? overview.totalBookings : "…"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-emerald-600">{overview?.confirmedBookings ?? 0}</span> confirmed ·{" "}
                    <span className="font-semibold text-amber-600">{overview?.pendingBookings ?? 0}</span> pending
                  </p>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Gross Volume (PKR)</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mt-3">
                    {overview ? `Rs. ${(overview.totalRevenue ?? 0).toLocaleString()}` : "…"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Confirmed booking transactions</p>
                </div>
              </div>

              {/* Monthly Trend & Attention Queue */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Booking Activity */}
                <div className="lg:col-span-2 p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900">Monthly Booking Activity</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real bookings logged by month</p>

                  <div className="mt-8 flex items-end justify-between gap-3 h-48 border-b border-slate-100 pb-3">
                    {overview?.monthlyBookings?.length === 0 ? (
                      <p className="text-xs text-slate-400 mx-auto my-auto">No historical booking records yet.</p>
                    ) : (
                      overview?.monthlyBookings?.map((mb: any, idx: number) => {
                        const maxVal = Math.max(...overview.monthlyBookings.map((b: any) => b.count || 1));
                        const heightPct = Math.max(15, Math.round((mb.count / maxVal) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-[11px] font-semibold text-indigo-600">{mb.count}</span>
                            <div className="w-full max-w-[48px] bg-indigo-50 rounded-t-lg flex items-end justify-center h-32">
                              <div
                                className="w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-lg transition-all"
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">{mb.month}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Moderation Queue */}
                <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Attention & Moderation Queue</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Pending items in the system</p>

                    <div className="mt-4 space-y-3">
                      {overview?.pendingApprovals?.length === 0 && overview?.pendingBookings === 0 && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                          <p className="text-[11px] text-slate-400">Zero pending approval items.</p>
                        </div>
                      )}

                      {overview?.pendingApprovals?.map((p: any) => (
                        <div
                          key={p._id}
                          onClick={() => setSection("providers")}
                          className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{p.businessName || "Provider Profile"}</p>
                            <p className="text-[11px] text-amber-700 font-medium">Pending Verification Badge</p>
                          </div>
                          <span className="text-xs font-semibold text-indigo-600">Review →</span>
                        </div>
                      ))}

                      {overview?.recentBookings
                        ?.filter((b: any) => b.status === "pending")
                        ?.map((b: any) => (
                          <div
                            key={b._id}
                            onClick={() => setSection("bookings")}
                            className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{b.bookingId}</p>
                              <p className="text-[11px] text-slate-500">Date: {b.date} · Rs. {b.price}</p>
                            </div>
                            <span className="text-xs font-semibold text-indigo-600">Manage →</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">Database: MongoDB Atlas (vendorhub-ai)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS */}
          {section === "users" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      placeholder="Search users by name or email…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  >
                    <option value="all">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="provider">Provider</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <span className="text-xs text-slate-500 font-medium">{users.length} live user(s)</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Joined</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5 font-semibold text-slate-900">
                            {u.firstName || u.name ? `${u.firstName ?? u.name} ${u.lastName ?? ""}` : "Unnamed"}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : u.role === "provider"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {u.role ?? "CUSTOMER"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.isActive !== false
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}>
                              {u.isActive !== false ? "Active" : "Suspended"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={u.role || "customer"}
                                onChange={(e) => handleChangeUserRole(u._id, e.target.value)}
                                className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium"
                                title="Change User Role"
                              >
                                <option value="customer">Customer</option>
                                <option value="provider">Provider</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                onClick={() => handleToggleUserStatus(u._id, u.isActive !== false)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                                  u.isActive !== false
                                    ? "border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100"
                                    : "border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
                                }`}
                                title={u.isActive !== false ? "Block user from logging in" : "Allow user to log in"}
                              >
                                {u.isActive !== false ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PROVIDERS */}
          {section === "providers" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Registered Providers</h2>
                  <p className="text-xs text-slate-500">Provider profiles and verification controls</p>
                </div>
                <span className="text-xs text-slate-500 font-medium">{providers.length} provider(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5">Business / Service</th>
                      <th className="px-5 py-3.5">Owner Email</th>
                      <th className="px-5 py-3.5">Rating</th>
                      <th className="px-5 py-3.5">Reviews</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {providers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">
                          No provider profiles registered yet.
                        </td>
                      </tr>
                    ) : (
                      providers.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5 font-semibold text-slate-900">
                            {p.businessName || "Unnamed Business"}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">{p.email}</td>
                          <td className="px-5 py-3.5 font-medium text-amber-600">⭐ {p.rating ?? 0}/5</td>
                          <td className="px-5 py-3.5 text-slate-600">{p.reviewCount ?? 0}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-0.5 w-fit rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                p.status === "approved" || (!p.status && p.isVerified)
                                  ? "bg-emerald-100 text-emerald-700"
                                  : p.status === "suspended"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {p.status ? p.status.toUpperCase() : "APPROVED"}
                              </span>
                              <span className={`text-[10px] font-semibold ${p.isVerified ? "text-indigo-600" : "text-slate-400"}`}>
                                {p.isVerified ? "✓ Verified Badge" : "Unverified"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={p.status || "approved"}
                                onChange={(e) => handleChangeProviderStatus(p._id, e.target.value)}
                                className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium"
                                title="Change Provider Public Visibility"
                              >
                                <option value="approved">Approved (Public on /search)</option>
                                <option value="pending">Pending (Hidden)</option>
                                <option value="suspended">Suspended (Blocked)</option>
                              </select>
                              <button
                                onClick={() => handleToggleProviderVerification(p._id, p.isVerified)}
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition ${
                                  p.isVerified
                                    ? "border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100"
                                    : "border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                                }`}
                              >
                                {p.isVerified ? "Revoke Badge" : "Verify Badge"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. SERVICES */}
          {section === "services" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Platform Services</h2>
                  <p className="text-xs text-slate-500">Service listings offered across categories</p>
                </div>
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddService ? "Cancel" : "Add Service"}</span>
                </button>
              </div>

              {showAddService && (
                <form onSubmit={handleAddService} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900">Create New Service</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      placeholder="Service Name (e.g. AC Deep Cleaning)"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Base Price (PKR)"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      required
                    />
                    <select
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">Select Category (Optional)</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700">
                    Save Service
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5">Service</th>
                      <th className="px-5 py-3.5">Price</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Created</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {services.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400">
                          No services created yet in database. Click &quot;Add Service&quot; above to create one.
                        </td>
                      </tr>
                    ) : (
                      services.map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5 font-semibold text-slate-900">{s.name}</td>
                          <td className="px-5 py-3.5 font-medium text-slate-700">Rs. {Number(s.price || 0).toLocaleString()}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              ACTIVE
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteService(s._id)}
                              className="text-rose-600 hover:text-rose-700 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CATEGORIES */}
          {section === "categories" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Service Categories</h2>
                  <p className="text-xs text-slate-500">Categories stored in MongoDB Atlas</p>
                </div>
                <button
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddCat ? "Cancel" : "Add Category"}</span>
                </button>
              </div>

              {showAddCat && (
                <form onSubmit={handleAddCategory} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900">Create New Category</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      placeholder="Icon Emoji (e.g. 🛠️, ⚡, 🧹)"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none w-24"
                    />
                    <input
                      placeholder="Category Name (e.g. Electrician, Plumbing)"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none flex-1"
                      required
                    />
                    <input
                      placeholder="Description (Optional)"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none flex-1"
                    />
                  </div>
                  <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700">
                    Save Category
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5">Category Name</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Customer Visibility</th>
                      <th className="px-5 py-3.5">Created</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400">
                          No categories found in database.
                        </td>
                      </tr>
                    ) : (
                      categories.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                            <span className="text-base">{c.icon || "🛠️"}</span>
                            <span>{c.name}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">{c.description || "—"}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              c.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {c.isActive !== false ? "Visible on /categories" : "Hidden from App"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleCategoryVisibility(c._id, c.isActive !== false)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                                  c.isActive !== false
                                    ? "border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100"
                                    : "border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
                                }`}
                                title={c.isActive !== false ? "Hide this category from customer browsing" : "Show this category on customer browsing"}
                              >
                                {c.isActive !== false ? "Hide from App" : "Show on App"}
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(c._id)}
                                className="text-rose-600 hover:text-rose-700 p-1 rounded"
                                title="Delete Category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. BOOKINGS */}
          {section === "bookings" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      placeholder="Search booking ID or customer…"
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>

                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <span className="text-xs text-slate-500 font-medium">{bookings.length} real booking(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5">Booking Code</th>
                      <th className="px-5 py-3.5">Date & Slot</th>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Price</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">
                          No bookings found in database.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b._id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{b.bookingId}</td>
                          <td className="px-5 py-3.5 text-slate-700">
                            <div>{b.date}</div>
                            <span className="text-[11px] text-slate-400">{b.startTime} - {b.endTime}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            <div>{b.details?.name || "Customer"}</div>
                            <span className="text-[11px] text-slate-400">{b.details?.phone || ""}</span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-900">
                            Rs. {Number(b.price || 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-700"
                                : b.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {b.status || "PENDING"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateBookingStatus(b._id, e.target.value)}
                              className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-medium"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. REVIEWS */}
          {section === "reviews" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Customer Reviews</h2>
                  <p className="text-xs text-slate-500">Audit ratings submitted by customers</p>
                </div>
                <span className="text-xs text-slate-500 font-medium">{reviews.length} review(s)</span>
              </div>

              <div className="p-8 text-center">
                {reviews.length === 0 ? (
                  <div className="max-w-sm mx-auto">
                    <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No reviews submitted yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Customer ratings and reviews will appear here once bookings are completed and rated.
                    </p>
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r._id} className="p-3 border-b text-left">
                      <p className="font-bold text-xs">{r.userName}</p>
                      <p className="text-xs text-slate-600">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 8. COMPLAINTS */}
          {section === "complaints" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Customer Complaints & Disputes</h2>
                  <p className="text-xs text-slate-500">Service quality and refund dispute tickets</p>
                </div>
                <span className="text-xs text-slate-500 font-medium">{complaints.length} complaint(s)</span>
              </div>

              <div className="p-8 text-center">
                {complaints.length === 0 ? (
                  <div className="max-w-sm mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No active complaints</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Customer support tickets and escalated complaints will appear here when submitted.
                    </p>
                  </div>
                ) : (
                  complaints.map((c) => (
                    <div key={c._id} className="p-3 border-b text-left">
                      <p className="font-bold text-xs">{c.userName}</p>
                      <p className="text-xs text-slate-600">{c.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 9. REPORTS */}
          {section === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Completion Rate</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2">
                    {reports?.fulfillmentRate ?? 0}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Completed vs total bookings</p>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Platform Users</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2">
                    {overview?.totalUsers ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Live customer & provider accounts</p>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Confirmed Volume</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2">
                    Rs. {(overview?.totalRevenue ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Total confirmed bookings</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900">Category Demand Distribution</h2>
                <p className="text-xs text-slate-500 mt-0.5">Booking volume share per service category</p>

                <div className="mt-6 space-y-4">
                  {reports?.categoryDistribution?.length === 0 ? (
                    <p className="text-xs text-slate-400">No categories created yet.</p>
                  ) : (
                    reports?.categoryDistribution?.map((cd: any, idx: number) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{cd.name}</span>
                          <span className="font-semibold text-indigo-600">{cd.share}% ({cd.count} bookings)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${cd.share}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 10. SETTINGS */}
          {section === "settings" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm max-w-2xl p-6">
              <h2 className="text-base font-bold text-slate-900">Platform Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Global configurations for ServiceHub commissions, policies, and operations.
              </p>

              <form onSubmit={handleSaveSettings} className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Platform Commission Fee (%)
                  </label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.commissionRate ?? 10}
                      onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Support Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail ?? ""}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full max-w-md text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Cancellation Notice Window (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.cancellationWindowHours ?? 24}
                    onChange={(e) => setSettings({ ...settings, cancellationWindowHours: Number(e.target.value) })}
                    className="w-full max-w-xs text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.autoConfirmBookings)}
                      onChange={(e) => setSettings({ ...settings, autoConfirmBookings: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Auto-Confirm Bookings</p>
                      <p className="text-[11px] text-slate-500">Bypass manual provider acceptance for instant confirmation.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.maintenanceMode)}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Maintenance Mode</p>
                      <p className="text-[11px] text-slate-500">Temporarily pause public search and checkout for platform updates.</p>
                    </div>
                  </label>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    Save Platform Settings
                  </button>
                  {settingsSaved && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-4 h-4" /> Settings updated successfully!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
