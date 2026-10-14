"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
  Check,
  LogOut,
  ExternalLink,
  ChevronRight,
  Database,
  Building,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Sparkles,
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
  const { user: authUser, logout } = useAuth();

  const [section, setSection] = useState<Section>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const adminName = authUser?.firstName
    ? `${authUser.firstName} ${authUser.lastName || ""}`.trim()
    : authUser?.email
    ? authUser.email.split("@")[0]
    : "Aiman Ayyaz";

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

  // Data states (100% Real Database Records from MongoDB)
  const [overview, setOverview] = useState<any>(null);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  // Providers
  const [providers, setProviders] = useState<any[]>([]);
  const [providerSearch, setProviderSearch] = useState("");

  // Services
  const [services, setServices] = useState<any[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("60");
  const [newServiceDesc, setNewServiceDesc] = useState("");

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

  // Custom In-App Modal Dialog States
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [resolveModal, setResolveModal] = useState<{
    isOpen: boolean;
    complaintId: string;
    userName: string;
    reason: string;
  } | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [modalActionLoading, setModalActionLoading] = useState(false);

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
      alert("Error updating user status: " + err.message);
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

  const handleDeleteUser = (userId: string, userName?: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete User Account",
      message: `Are you sure you want to permanently delete ${userName ? `"${userName}"` : "this user account"}? This will permanently remove their profile and data from MongoDB.`,
      confirmLabel: "Delete User",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE}/api/admin/users/${userId}`, { method: "DELETE" });
          setRefreshKey((k) => k + 1);
        } catch (err: any) {
          alert("Error deleting user: " + err.message);
        }
      },
    });
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
      alert("Error updating provider verification: " + err.message);
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

  const handleDeleteCategory = (id: string, name?: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Service Category",
      message: `Are you sure you want to delete category ${name ? `"${name}"` : "this category"}? Associated services and filters may be affected.`,
      confirmLabel: "Delete Category",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE}/api/admin/categories/${id}`, { method: "DELETE" });
          setRefreshKey((k) => k + 1);
        } catch (err: any) {
          alert("Error deleting category: " + err.message);
        }
      },
    });
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
          duration: Number(newServiceDuration || 60),
          description: newServiceDesc,
        }),
      });
      setNewServiceName("");
      setNewServicePrice("");
      setNewServiceCategory("");
      setNewServiceDuration("60");
      setNewServiceDesc("");
      setShowAddService(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error adding service: " + err.message);
    }
  };

  const handleDeleteService = (id: string, name?: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Service Offering",
      message: `Are you sure you want to delete service ${name ? `"${name}"` : "this service"} from the platform catalog?`,
      confirmLabel: "Delete Service",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE}/api/admin/services/${id}`, { method: "DELETE" });
          setRefreshKey((k) => k + 1);
        } catch (err: any) {
          alert("Error deleting service: " + err.message);
        }
      },
    });
  };

  const handleToggleServiceStatus = async (serviceId: string, currentActive: boolean) => {
    try {
      await fetch(`${API_BASE}/api/admin/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error updating service status: " + err.message);
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
      alert("Error updating booking status: " + err.message);
    }
  };

  const handleToggleReviewModeration = async (reviewId: string, currentHidden: boolean) => {
    try {
      await fetch(`${API_BASE}/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !currentHidden }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error updating review visibility: " + err.message);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Customer Review",
      message: "Are you sure you want to permanently delete this customer review from the database?",
      confirmLabel: "Delete Review",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE}/api/admin/reviews/${reviewId}`, { method: "DELETE" });
          setRefreshKey((k) => k + 1);
        } catch (err: any) {
          alert("Error deleting review: " + err.message);
        }
      },
    });
  };

  const handleResolveComplaint = (complaint: any) => {
    setResolutionNotes("Complaint investigated and resolved by Admin.");
    setResolveModal({
      isOpen: true,
      complaintId: complaint._id,
      userName: complaint.userName || "Customer",
      reason: complaint.reason || "Service Dispute",
    });
  };

  const handleConfirmResolveTicket = async () => {
    if (!resolveModal) return;
    setModalActionLoading(true);
    try {
      await fetch(`${API_BASE}/api/admin/complaints/${resolveModal.complaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", notes: resolutionNotes }),
      });
      setResolveModal(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error resolving complaint: " + err.message);
    } finally {
      setModalActionLoading(false);
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

  const filteredProviders = providers.filter((p) => {
    if (!providerSearch) return true;
    const q = providerSearch.toLowerCase();
    return (
      (p.businessName && p.businessName.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.bio && p.bio.toLowerCase().includes(q))
    );
  });

  return (
    <div
      data-lenis-prevent="true"
      className="h-screen w-full bg-background text-foreground flex flex-col lg:flex-row font-sans antialiased selection:bg-primary/20 selection:text-primary overflow-hidden"
    >
      {/* SIDEBAR (Prism Theme - Fixed Height / No Stretching) */}
      <aside
        data-lenis-prevent="true"
        className="w-full lg:w-64 h-auto lg:h-screen bg-card/90 lg:bg-[#070913] text-muted-foreground lg:text-slate-300 border-r border-border/60 lg:border-slate-800/80 flex flex-col justify-between p-5 flex-shrink-0 backdrop-blur-xl z-30 lg:overflow-y-auto"
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-foreground lg:text-white font-extrabold tracking-tight text-xl">
                Service<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Hub</span>
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-3 pt-4 pb-1">
                      {item.group}
                    </p>
                  )}
                  <button
                    onClick={() => setSection(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.id === "complaints" && complaints.filter((c) => c.status !== "resolved").length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {complaints.filter((c) => c.status !== "resolved").length}
                      </span>
                    )}
                    {item.id === "providers" && providers.filter((p) => !p.isVerified).length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {providers.filter((p) => !p.isVerified).length}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Admin Profile Badge & Logout */}
        <div className="border-t border-border/60 lg:border-slate-800/80 pt-4 mt-6 space-y-3 px-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-inner border border-white/20">
              {adminInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground lg:text-white truncate">{adminName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{authUser?.email || "Platform Admin"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-accent/40 dark:bg-slate-800/80 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 border border-border/60 dark:border-slate-700/60 hover:border-rose-500/30 text-xs font-medium transition"
            title="Log out of ServiceHub Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (Scrolls independently with native mouse wheel) */}
      <div
        data-lenis-prevent="true"
        className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto"
      >
        {/* Top Header */}
        <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border/60 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span>Admin</span>
            <span>/</span>
            <span className="text-foreground font-semibold capitalize">{section}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Real Database Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">MongoDB Atlas Live</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* Refresh Button */}
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition"
              title="Refresh Data from Database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 text-xs font-medium transition"
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
              <h1 className="text-2xl font-bold text-foreground tracking-tight capitalize flex items-center gap-2.5">
                {section === "overview" ? "Dashboard Overview" : `${section} Management`}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold uppercase tracking-wider">
                  Admin Scope
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Real database records synced directly with MongoDB Atlas & backend services.
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}. Ensure your backend server is running on port 4000.</span>
            </div>
          )}

          {/* 1. OVERVIEW */}
          {section === "overview" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl hover:border-primary/40 transition">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Total Registered Users</span>
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-foreground mt-3">
                    {overview ? overview.totalUsers : "…"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground">{overview?.customersCount ?? 0}</span> customers ·{" "}
                    <span className="font-semibold text-foreground">{overview?.providersCount ?? 0}</span> providers
                  </p>
                </div>

                <div className="p-5 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl hover:border-primary/40 transition">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Active Providers</span>
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-foreground mt-3">
                    {overview ? overview.providersCount : "…"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground">{overview?.providersCount ?? 0}</span> profile(s) listed
                  </p>
                </div>

                <div className="p-5 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl hover:border-primary/40 transition">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Total Bookings</span>
                    <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-foreground mt-3">
                    {overview ? overview.totalBookings : "…"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-emerald-500">{overview?.confirmedBookings ?? 0}</span> confirmed ·{" "}
                    <span className="font-semibold text-amber-500">{overview?.pendingBookings ?? 0}</span> pending
                  </p>
                </div>

                <div className="p-5 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl hover:border-primary/40 transition">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Gross Volume (PKR)</span>
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-foreground mt-3">
                    {overview ? `Rs. ${(overview.totalRevenue ?? 0).toLocaleString()}` : "…"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Confirmed booking transactions</p>
                </div>
              </div>

              {/* Monthly Trend & Attention Queue */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Booking Activity */}
                <div className="lg:col-span-2 p-6 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl">
                  <h2 className="text-sm font-bold text-foreground">Monthly Booking Activity</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Real bookings logged by month</p>

                  <div className="mt-8 flex items-end justify-between gap-3 h-48 border-b border-border/40 pb-3">
                    {overview?.monthlyBookings?.length === 0 ? (
                      <p className="text-xs text-muted-foreground mx-auto my-auto">No historical booking records yet.</p>
                    ) : (
                      overview?.monthlyBookings?.map((mb: any, idx: number) => {
                        const maxVal = Math.max(...overview.monthlyBookings.map((b: any) => b.count || 1));
                        const heightPct = Math.max(15, Math.round((mb.count / maxVal) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-[11px] font-semibold text-primary">{mb.count}</span>
                            <div className="w-full max-w-[48px] bg-primary/10 rounded-t-lg flex items-end justify-center h-32">
                              <div
                                className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-600 rounded-t-lg transition-all"
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium">{mb.month}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Moderation Queue */}
                <div className="p-6 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Attention & Moderation Queue</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Pending items requiring admin action</p>

                    <div className="mt-4 space-y-3">
                      {overview?.pendingApprovals?.length === 0 && overview?.pendingBookings === 0 && (
                        <div className="p-4 rounded-xl bg-accent/20 border border-border/40 text-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-foreground">All caught up!</p>
                          <p className="text-[11px] text-muted-foreground">Zero pending approval items.</p>
                        </div>
                      )}

                      {overview?.pendingApprovals?.map((p: any) => (
                        <div
                          key={p._id}
                          onClick={() => setSection("providers")}
                          className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-foreground">{p.businessName || "Provider Profile"}</p>
                            <p className="text-[11px] text-amber-500 font-medium">Pending Verification Badge</p>
                          </div>
                          <span className="text-xs font-semibold text-primary">Review →</span>
                        </div>
                      ))}

                      {overview?.recentBookings
                        ?.filter((b: any) => b.status === "pending")
                        ?.map((b: any) => (
                          <div
                            key={b._id}
                            onClick={() => setSection("bookings")}
                            className="p-3 rounded-xl border border-border/60 hover:border-primary/40 bg-accent/20 cursor-pointer transition flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-foreground">{b.bookingId}</p>
                              <p className="text-[11px] text-muted-foreground">Date: {b.date} · Rs. {b.price}</p>
                            </div>
                            <span className="text-xs font-semibold text-primary">Manage →</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/40 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Database: MongoDB Atlas (live connected)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS */}
          {section === "users" && (
            <div className="bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/30">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      placeholder="Search users by name or email…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border/60 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="text-xs bg-background border border-border/60 rounded-xl px-2.5 py-1.5 text-foreground outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="provider">Provider</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="text-xs bg-background border border-border/60 rounded-xl px-2.5 py-1.5 text-foreground outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <span className="text-xs text-muted-foreground font-medium">{users.length} live user(s)</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Joined</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-muted-foreground">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id} className="hover:bg-muted/20 transition">
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            {u.firstName || u.name ? `${u.firstName ?? u.name} ${u.lastName ?? ""}` : "Unnamed"}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              u.role === "admin"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                : u.role === "provider"
                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                : "bg-muted text-muted-foreground border-border/60"
                            }`}>
                              {u.role ?? "CUSTOMER"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              u.isActive !== false
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}>
                              {u.isActive !== false ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleToggleUserStatus(u._id, u.isActive !== false)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                u.isActive !== false
                                  ? "border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                  : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                              }`}
                            >
                              {u.isActive !== false ? "Deactivate" : "Activate"}
                            </button>
                            <select
                              value={u.role || "customer"}
                              onChange={(e) => handleChangeUserRole(u._id, e.target.value)}
                              className="text-xs bg-background border border-border/60 rounded-lg px-2 py-1 text-foreground outline-none font-medium"
                            >
                              <option value="customer">Customer</option>
                              <option value="provider">Provider</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleDeleteUser(u._id, u.firstName || u.name)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* 3. PROVIDERS */}
          {section === "providers" && (
            <div className="bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/30">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    placeholder="Search provider business or email…"
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border/60 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{filteredProviders.length} provider profile(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-5 py-3.5">Business / Name</th>
                      <th className="px-5 py-3.5">Categories</th>
                      <th className="px-5 py-3.5">Rating</th>
                      <th className="px-5 py-3.5">Hourly Rate</th>
                      <th className="px-5 py-3.5">Verification</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredProviders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-muted-foreground">
                          No provider profiles found.
                        </td>
                      </tr>
                    ) : (
                      filteredProviders.map((p) => (
                        <tr key={p._id} className="hover:bg-muted/20 transition">
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-foreground">{p.businessName || "Unnamed Business"}</div>
                            <span className="text-[11px] text-muted-foreground font-mono">{p.email}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {(p.categories || []).map((cat: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border/60">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-amber-500 font-bold">
                            ★ {p.rating ? Number(p.rating).toFixed(1) : "New"} ({p.reviewCount ?? 0})
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            {p.hourlyRate ? `Rs. ${p.hourlyRate}/hr` : "Custom"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              p.isVerified
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}>
                              {p.isVerified ? "✓ Verified" : "Pending"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/60">
                              {p.status || "active"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleToggleProviderVerification(p._id, Boolean(p.isVerified))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                p.isVerified
                                  ? "border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                  : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                              }`}
                            >
                              {p.isVerified ? "Revoke Badge" : "Verify Badge"}
                            </button>
                            <select
                              value={p.status || "approved"}
                              onChange={(e) => handleChangeProviderStatus(p._id, e.target.value)}
                              className="text-xs bg-background border border-border/60 rounded-lg px-2 py-1 text-foreground font-medium outline-none"
                            >
                              <option value="approved">Approved</option>
                              <option value="pending">Pending</option>
                              <option value="rejected">Rejected</option>
                              <option value="suspended">Suspended</option>
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

          {/* 4. SERVICES */}
          {section === "services" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{services.length} active service(s)</span>
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Service</span>
                </button>
              </div>

              {/* Add Service Card */}
              {showAddService && (
                <div className="p-5 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl">
                  <h3 className="text-sm font-bold text-foreground mb-3">Create Platform Service</h3>
                  <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      placeholder="Service Name (e.g. AC Jet Cleaning)"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="text-xs p-2.5 bg-background border border-border/60 rounded-xl outline-none text-foreground"
                      required
                    />
                    <select
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                      className="text-xs p-2.5 bg-background border border-border/60 rounded-xl outline-none text-foreground"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.icon || "🛠️"} {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Price in PKR"
                      type="number"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className="text-xs p-2.5 bg-background border border-border/60 rounded-xl outline-none text-foreground"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                      >
                        Save Service
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddService(false)}
                        className="px-3 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Services Table */}
              <div className="bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60">
                      <tr>
                        <th className="px-5 py-3.5">Service</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Base Price</th>
                        <th className="px-5 py-3.5">Duration</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {services.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-muted-foreground">
                            No services found in database.
                          </td>
                        </tr>
                      ) : (
                        services.map((s) => {
                          const cat = categories.find((c) => String(c._id) === String(s.categoryId));
                          return (
                            <tr key={s._id} className="hover:bg-muted/20 transition">
                              <td className="px-5 py-3.5 font-semibold text-foreground">{s.name}</td>
                              <td className="px-5 py-3.5 text-muted-foreground">
                                {cat ? `${cat.icon || "🛠️"} ${cat.name}` : "General"}
                              </td>
                              <td className="px-5 py-3.5 font-bold text-foreground">
                                Rs. {Number(s.price || 0).toLocaleString()}
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground">{s.duration || 60} mins</td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  s.isActive !== false
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                }`}>
                                  {s.isActive !== false ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right space-x-2">
                                <button
                                  onClick={() => handleToggleServiceStatus(s._id, s.isActive !== false)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                    s.isActive !== false
                                      ? "border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                      : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                  }`}
                                >
                                  {s.isActive !== false ? "Disable" : "Enable"}
                                </button>
                                <button
                                  onClick={() => handleDeleteService(s._id, s.name)}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition"
                                  title="Delete Service"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. CATEGORIES */}
          {section === "categories" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{categories.length} category definition(s)</span>
                <button
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              </div>

              {/* Add Category Form */}
              {showAddCat && (
                <div className="p-5 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl">
                  <h3 className="text-sm font-bold text-foreground mb-3">Create Service Category</h3>
                  <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      placeholder="Category Name (e.g. Carpentry)"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="text-xs p-2.5 bg-background border border-border/60 rounded-xl outline-none text-foreground"
                      required
                    />
                    <input
                      placeholder="Icon Emoji (e.g. 🪚, ⚡)"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="text-xs p-2.5 bg-background border border-border/60 rounded-xl outline-none text-foreground"
                    />
                    <input
                      placeholder="Description"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="text-xs p-2.5 bg-background border border-border/60 rounded-xl outline-none text-foreground"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                      >
                        Save Category
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCat(false)}
                        className="px-3 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Categories Table */}
              <div className="bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60">
                      <tr>
                        <th className="px-5 py-3.5">Icon & Name</th>
                        <th className="px-5 py-3.5">Slug</th>
                        <th className="px-5 py-3.5">Description</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-muted-foreground">
                            No categories created yet.
                          </td>
                        </tr>
                      ) : (
                        categories.map((c) => (
                          <tr key={c._id} className="hover:bg-muted/20 transition">
                            <td className="px-5 py-3.5 font-semibold text-foreground flex items-center gap-2">
                              <span className="text-lg">{c.icon || "🛠️"}</span>
                              <span>{c.name}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">{c.slug}</td>
                            <td className="px-5 py-3.5 text-muted-foreground max-w-xs truncate">{c.description || "N/A"}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                c.isActive !== false
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              }`}>
                                {c.isActive !== false ? "Active" : "Hidden"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right space-x-2">
                              <button
                                onClick={() => handleToggleCategoryVisibility(c._id, c.isActive !== false)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                  c.isActive !== false
                                    ? "border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                    : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                }`}
                              >
                                {c.isActive !== false ? "Hide" : "Show"}
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(c._id, c.name)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. BOOKINGS */}
          {section === "bookings" && (
            <div className="bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/30">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      placeholder="Search booking ID or customer…"
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border/60 rounded-xl outline-none text-foreground focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="text-xs bg-background border border-border/60 rounded-xl px-2.5 py-1.5 text-foreground outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No-show</option>
                  </select>
                </div>

                <span className="text-xs text-muted-foreground font-medium">{bookings.length} real booking(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-5 py-3.5">Booking Code</th>
                      <th className="px-5 py-3.5">Date & Slot</th>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Price & Payment</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-muted-foreground">
                          No bookings found in database.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b._id} className="hover:bg-muted/20 transition">
                          <td className="px-5 py-3.5 font-mono font-bold text-foreground">{b.bookingId}</td>
                          <td className="px-5 py-3.5 text-foreground">
                            <div>{b.date}</div>
                            <span className="text-[11px] text-muted-foreground">{b.startTime} - {b.endTime}</span>
                          </td>
                          <td className="px-5 py-3.5 text-foreground">
                            <div>{b.details?.name || "Customer"}</div>
                            <span className="text-[11px] text-muted-foreground">{b.details?.phone || ""}</span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            <div>Rs. {Number(b.price || 0).toLocaleString()}</div>
                            <span className={`inline-block px-1.5 py-0.5 mt-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              b.paymentStatus === "paid"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : b.paymentStatus === "refunded"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                : b.paymentStatus === "failed"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}>
                              Payment: {b.paymentStatus || "PENDING"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              b.status === "confirmed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : b.status === "completed"
                                ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                : b.status === "pending"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : b.status === "no_show"
                                ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}>
                              {b.status === "no_show" ? "NO-SHOW" : (b.status || "PENDING").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateBookingStatus(b._id, e.target.value)}
                              className="text-xs bg-background border border-border/60 rounded-lg px-2 py-1 text-foreground font-medium outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="no_show">No-show</option>
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
            <div className="bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/30">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Customer Reviews & Ratings</h2>
                  <p className="text-xs text-muted-foreground">Audit ratings submitted by customers & moderate public visibility</p>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{reviews.length} review(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Booking / Ref</th>
                      <th className="px-5 py-3.5">Rating</th>
                      <th className="px-5 py-3.5">Review Comment</th>
                      <th className="px-5 py-3.5">Visibility Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-muted-foreground">
                          <Star className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-foreground">No reviews submitted yet</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Customer ratings and reviews will appear here once bookings are completed.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      reviews.map((r) => (
                        <tr key={r._id} className="hover:bg-muted/20 transition">
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            <div>{r.userName || "Customer"}</div>
                            <span className="text-[11px] text-muted-foreground">{r.userEmail || ""}</span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-foreground">
                            {r.bookingId || "General"}
                          </td>
                          <td className="px-5 py-3.5 text-amber-500 font-bold whitespace-nowrap">
                            {"★".repeat(r.rating || 5)}{"☆".repeat(Math.max(0, 5 - (r.rating || 5)))} ({r.rating ?? 5}/5)
                          </td>
                          <td className="px-5 py-3.5 text-foreground max-w-xs">
                            <p className="line-clamp-2">{r.comment || "No comment provided."}</p>
                            <span className="text-[10px] text-muted-foreground mt-1 block">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              r.isHidden
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}>
                              {r.isHidden ? "Hidden from Public" : "Publicly Visible"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleToggleReviewModeration(r._id, r.isHidden)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                r.isHidden
                                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                  : "border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                              }`}
                            >
                              {r.isHidden ? "Publish Review" : "Hide Review"}
                            </button>
                            <button
                              onClick={() => handleDeleteReview(r._id)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Delete Review"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* 8. COMPLAINTS */}
          {section === "complaints" && (
            <div className="bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/30">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Customer Complaints & Disputes</h2>
                  <p className="text-xs text-muted-foreground">Service quality disputes, delay escalations & resolution</p>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{complaints.length} complaint(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-5 py-3.5">Complainant</th>
                      <th className="px-5 py-3.5">Booking</th>
                      <th className="px-5 py-3.5">Issue Reason</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Resolution Notes</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {complaints.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-muted-foreground">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-foreground">No active complaints</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Customer support tickets and escalated complaints will appear here when submitted.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c._id} className="hover:bg-muted/20 transition">
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            <div>{c.userName || "Customer"}</div>
                            <span className="text-[11px] text-muted-foreground">{c.userEmail || ""}</span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-foreground">
                            {c.bookingId || "General"}
                          </td>
                          <td className="px-5 py-3.5 text-foreground max-w-xs">
                            <p className="font-semibold text-rose-500">{c.reason}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              c.status === "resolved"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : c.status === "under_investigation"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}>
                              {c.status ? c.status.toUpperCase() : "OPEN"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-foreground max-w-xs">
                            {c.resolutionNotes ? (
                              <p className="text-[11px] text-emerald-400 font-medium">✓ {c.resolutionNotes}</p>
                            ) : (
                              <span className="text-muted-foreground italic">Pending investigation</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {c.status !== "resolved" ? (
                              <button
                                onClick={() => handleResolveComplaint(c)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                              >
                                Resolve Ticket
                              </button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-medium">Closed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. REPORTS */}
          {section === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl hover:border-primary/40 transition">
                  <p className="text-xs text-muted-foreground font-medium">Completion Rate</p>
                  <p className="text-3xl font-extrabold text-foreground mt-2">
                    {reports?.fulfillmentRate ?? 0}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Completed vs total bookings</p>
                </div>

                <div className="p-5 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl hover:border-primary/40 transition">
                  <p className="text-xs text-muted-foreground font-medium">Platform Users</p>
                  <p className="text-3xl font-extrabold text-foreground mt-2">
                    {overview?.totalUsers ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Live customer & provider accounts</p>
                </div>

                <div className="p-5 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl hover:border-primary/40 transition">
                  <p className="text-xs text-muted-foreground font-medium">Confirmed Volume</p>
                  <p className="text-3xl font-extrabold text-foreground mt-2">
                    Rs. {(overview?.totalRevenue ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Total confirmed bookings</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="p-6 bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl">
                <h2 className="text-sm font-bold text-foreground">Category Demand Distribution</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Booking volume share per service category</p>

                <div className="mt-6 space-y-4">
                  {reports?.categoryDistribution?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No categories created yet.</p>
                  ) : (
                    reports?.categoryDistribution?.map((cd: any, idx: number) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{cd.name}</span>
                          <span className="font-semibold text-primary">{cd.share}% ({cd.count} bookings)</span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
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
            <div className="bg-card/75 border border-border/60 shadow-sm backdrop-blur-sm rounded-2xl max-w-2xl p-6">
              <h2 className="text-base font-bold text-foreground">Platform Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Global configurations for ServiceHub commissions, policies, and operations.
              </p>

              <form onSubmit={handleSaveSettings} className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Platform Commission Fee (%)
                  </label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.commissionRate ?? 10}
                      onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 bg-background border border-border/60 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                    <span className="text-xs font-medium text-muted-foreground">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Support Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail ?? ""}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full max-w-md text-xs p-2.5 bg-background border border-border/60 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Cancellation Notice Window (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.cancellationWindowHours ?? 24}
                    onChange={(e) => setSettings({ ...settings, cancellationWindowHours: Number(e.target.value) })}
                    className="w-full max-w-xs text-xs p-2.5 bg-background border border-border/60 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>

                <div className="pt-3 border-t border-border/40 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.autoConfirmBookings)}
                      onChange={(e) => setSettings({ ...settings, autoConfirmBookings: e.target.checked })}
                      className="w-4 h-4 text-primary rounded border-border/60 focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Auto-Confirm Bookings</p>
                      <p className="text-[11px] text-muted-foreground">Bypass manual provider acceptance for instant confirmation.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.maintenanceMode)}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-4 h-4 text-primary rounded border-border/60 focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Maintenance Mode</p>
                      <p className="text-[11px] text-muted-foreground">Temporarily pause public search and checkout for platform updates.</p>
                    </div>
                  </label>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
                  >
                    Save Platform Settings
                  </button>
                  {settingsSaved && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-4 h-4" /> Settings updated successfully!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* 1. Custom In-App Centered Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border/80 shadow-2xl rounded-2xl p-6 text-foreground relative z-10 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/10">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-foreground text-center">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={modalActionLoading}
                className="px-4 py-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setModalActionLoading(true);
                  try {
                    await confirmModal.onConfirm();
                    setConfirmModal(null);
                  } finally {
                    setModalActionLoading(false);
                  }
                }}
                disabled={modalActionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-md shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {modalActionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{confirmModal.confirmLabel || "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Custom In-App Centered Resolve Complaint Modal */}
      {resolveModal && resolveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card border border-border/80 shadow-2xl rounded-2xl p-6 text-foreground relative z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Resolve Customer Dispute
                </h3>
                <p className="text-xs text-muted-foreground">
                  Customer: <span className="font-semibold text-foreground">{resolveModal.userName}</span> · Ticket #{resolveModal.complaintId.slice(-6)}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs mb-4">
              <span className="font-bold text-rose-400 block mb-0.5">Reported Issue:</span>
              <p className="text-muted-foreground">{resolveModal.reason}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Official Resolution Notes / Settlement
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter details of customer communication, refund status, or resolution steps..."
                className="w-full p-3 text-xs bg-background border border-border/60 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                These notes will be permanently logged in MongoDB and marked as resolved.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={() => setResolveModal(null)}
                disabled={modalActionLoading}
                className="px-4 py-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolveTicket}
                disabled={modalActionLoading || !resolutionNotes.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {modalActionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm Resolution & Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
