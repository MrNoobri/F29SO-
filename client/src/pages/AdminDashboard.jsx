import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  BarChart3,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CalendarDays,
  BellRing,
  UserCheck,
  UserX,
  AlertTriangle,
  ServerCog,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../api";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "audit", label: "Audit Logs", icon: ScrollText },
  { key: "metrics", label: "System Metrics", icon: BarChart3 },
];

/* ──────── KPI Card ──────── */
const KPICard = ({ icon: Icon, label, value, color = "primary", sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6"
  >
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          color === "primary" && "bg-primary/10",
          color === "success" && "bg-emerald-500/10",
          color === "warning" && "bg-amber-500/10",
          color === "danger" && "bg-red-500/10",
        )}
      >
        <Icon
          className={cn(
            "h-6 w-6",
            color === "primary" && "text-primary",
            color === "success" && "text-emerald-500",
            color === "warning" && "text-amber-500",
            color === "danger" && "text-red-500",
          )}
        />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  </motion.div>
);

/* ──────── Overview Tab ──────── */
const OverviewTab = ({ stats, systemMetrics }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        icon={Users}
        label="Total Users"
        value={stats?.totalUsers ?? "—"}
        sub={
          stats?.byRole
            ? `${stats.byRole.patient ?? 0}P / ${stats.byRole.provider ?? 0}D / ${stats.byRole.admin ?? 0}A`
            : undefined
        }
      />
      <KPICard
        icon={BellRing}
        label="Active Alerts"
        value={stats?.activeAlerts ?? "—"}
        color="danger"
      />
      <KPICard
        icon={CalendarDays}
        label="Appointments Today"
        value={stats?.todayAppointments ?? "—"}
        color="warning"
      />
      <KPICard
        icon={ServerCog}
        label="System Status"
        value="Operational"
        color="success"
        sub={`${stats?.totalMessages ?? 0} total messages`}
      />
    </div>

    {systemMetrics && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card/80 p-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" /> Users by Role
          </h3>
          <div className="space-y-3">
            {Object.entries(systemMetrics.usersByRole || {}).map(
              ([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{role}</span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Alerts by Severity
          </h3>
          <div className="space-y-3">
            {["critical", "high", "medium", "low"].map((sev) => (
              <div key={sev} className="flex justify-between items-center">
                <span
                  className={cn(
                    "text-sm capitalize",
                    sev === "critical" && "text-red-500",
                    sev === "high" && "text-orange-500",
                    sev === "medium" && "text-amber-500",
                    sev === "low" && "text-blue-500",
                  )}
                >
                  {sev}
                </span>
                <span className="text-sm font-bold">
                  {systemMetrics.alertsBySeverity?.[sev] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Appointments by Status
          </h3>
          <div className="space-y-3">
            {Object.entries(systemMetrics.appointmentsByStatus || {}).map(
              ([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm capitalize">
                    {status.replace(/-/g, " ")}
                  </span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);

/* ──────── Users Tab ──────── */
const UsersTab = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, roleFilter, searchTerm],
    queryFn: () =>
      adminAPI
        .getUsers({
          page,
          limit: 15,
          role: roleFilter || undefined,
          search: searchTerm || undefined,
        })
        .then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => adminAPI.updateUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  };

  const pagination = data?.pagination;
  const users = data?.users || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Search
          </button>
        </form>
        <div className="flex gap-2">
          {["", "patient", "provider", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRoleFilter(r);
                setPage(1);
              }}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                roleFilter === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {r || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Joined</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      {u.profile?.firstName} {u.profile?.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          u.role === "admin" &&
                            "bg-purple-500/10 text-purple-500",
                          u.role === "provider" &&
                            "bg-blue-500/10 text-blue-500",
                          u.role === "patient" &&
                            "bg-emerald-500/10 text-emerald-500",
                        )}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="flex items-center gap-1 text-emerald-500 text-xs">
                          <UserCheck className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-xs">
                          <UserX className="h-3.5 w-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              id: u._id,
                              body: { isActive: !u.isActive },
                            })
                          }
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            u.isActive
                              ? "hover:bg-amber-500/10 text-amber-500"
                              : "hover:bg-emerald-500/10 text-emerald-500",
                          )}
                          title={u.isActive ? "Deactivate" : "Activate"}
                        >
                          {u.isActive ? (
                            <ShieldAlert className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete ${u.profile?.firstName} ${u.profile?.lastName}? This will remove all their data.`,
                              )
                            ) {
                              deleteMutation.mutate(u._id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
              total)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
                disabled={page >= pagination.pages}
                className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────── Audit Logs Tab ──────── */
const AuditLogsTab = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", page, actionFilter],
    queryFn: () =>
      adminAPI
        .getAuditLogs({
          page,
          limit: 20,
          action: actionFilter || undefined,
        })
        .then((r) => r.data.data),
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const actionColors = {
    login: "text-emerald-500",
    "login-google": "text-emerald-500",
    logout: "text-muted-foreground",
    register: "text-blue-500",
    "create-appointment": "text-amber-500",
    "cancel-appointment": "text-red-500",
    "send-message": "text-primary",
    "user-updated": "text-purple-500",
    "user-deleted": "text-red-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          "",
          "login",
          "register",
          "logout",
          "create-appointment",
          "send-message",
          "user-updated",
          "user-deleted",
        ].map((a) => (
          <button
            key={a}
            onClick={() => {
              setActionFilter(a);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              actionFilter === a
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {a || "All Actions"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold">Timestamp</th>
                <th className="text-left px-4 py-3 font-semibold">Actor</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {log.actorId
                        ? `${log.actorId.profile?.firstName ?? ""} ${log.actorId.profile?.lastName ?? ""}`
                        : "System"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          actionColors[log.action] || "text-muted-foreground",
                        )}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                      {log.actorRole}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
              total)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
                disabled={page >= pagination.pages}
                className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────── System Metrics Tab ──────── */
const SystemMetricsTab = ({ systemMetrics, stats }) => {
  const { data: recentMetrics, isLoading } = useQuery({
    queryKey: ["admin-system-metrics-detail"],
    queryFn: () => adminAPI.getSystemMetrics().then((r) => r.data.data),
    refetchInterval: 60000,
  });

  const metrics = recentMetrics || systemMetrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total Users" value={stats?.totalUsers ?? "—"} />
        <KPICard icon={BellRing} label="Active Alerts" value={stats?.activeAlerts ?? "—"} color="danger" />
        <KPICard icon={CalendarDays} label="Today's Appointments" value={stats?.todayAppointments ?? "—"} color="warning" />
        <KPICard icon={ServerCog} label="Messages" value={stats?.totalMessages ?? "—"} color="success" />
      </div>

      {metrics && (
        <>
          <div className="rounded-2xl border border-border bg-card/80 p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              Recent Registrations (Last 7 Days)
            </h3>
            {metrics.recentRegistrations && metrics.recentRegistrations.length > 0 ? (
              <div className="flex items-end gap-2 h-32">
                {metrics.recentRegistrations.map((d) => {
                  const max = Math.max(...metrics.recentRegistrations.map((x) => x.count), 1);
                  return (
                    <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">{d.count}</span>
                      <div
                        className="w-full bg-primary/20 rounded-t-lg"
                        style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }}
                      />
                      <span className="text-[10px] text-muted-foreground">{d._id?.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No registrations in the last 7 days</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card/80 p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Users by Role</h3>
              <div className="space-y-3">
                {Object.entries(metrics.usersByRole || {}).map(([role, count]) => (
                  <div key={role} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{role}</span>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Alerts by Severity</h3>
              <div className="space-y-3">
                {["critical", "high", "medium", "low"].map((sev) => (
                  <div key={sev} className="flex justify-between items-center">
                    <span className={cn(
                      "text-sm capitalize",
                      sev === "critical" && "text-red-500",
                      sev === "high" && "text-orange-500",
                      sev === "medium" && "text-amber-500",
                      sev === "low" && "text-blue-500",
                    )}>{sev}</span>
                    <span className="text-sm font-bold">{metrics.alertsBySeverity?.[sev] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Appointments by Status</h3>
              <div className="space-y-3">
                {Object.entries(metrics.appointmentsByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{status.replace(/-/g, " ")}</span>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ──────── Main Admin Dashboard ──────── */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminAPI.getStats().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ["admin-system-metrics"],
    queryFn: () => adminAPI.getSystemMetrics().then((r) => r.data.data),
    refetchInterval: 60000,
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">MEDXI</h1>
            <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <OverviewTab stats={stats} systemMetrics={systemMetrics} />
            )}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "audit" && <AuditLogsTab />}
            {activeTab === "metrics" && (
              <SystemMetricsTab stats={stats} systemMetrics={systemMetrics} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
