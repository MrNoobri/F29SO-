import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Menu,
  X,
  Home,
  Activity,
  CalendarCheck,
  Pill,
  Bell,
  Trophy,
  BookOpen,
  HelpCircle,
  User,
  LogOut,
} from "lucide-react";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import { messagesAPI, authAPI } from "../api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import DashboardDock from "../components/patient/DashboardDock";

// Mirrors server-side Message.createConversationId
const createConversationId = (id1, id2) =>
  [id1.toString(), id2.toString()].sort().join("_");

const DRAWER_NAV = [
  { id: "overview", label: "Home", icon: Home, path: "/dashboard" },
  { id: "activity", label: "Activity", icon: Activity, path: "/dashboard", tab: "activity" },
  { id: "appointments", label: "Calendar", icon: CalendarCheck, path: "/appointments" },
  { id: "medications", label: "Meds", icon: Pill, path: "/dashboard", tab: "medications" },
  { id: "alerts", label: "Alerts", icon: Bell, path: "/alerts" },
  { id: "progress", label: "Progress", icon: Trophy, path: "/progress" },
  { id: "resources", label: "Learn", icon: BookOpen, path: "/resources" },
  { id: "help", label: "Help", icon: HelpCircle, path: "/help" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

const Messages = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showDoctorsList, setShowDoctorsList] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSidebarNav = (tabId) => {
    navigate("/dashboard", { state: { tab: tabId } });
  };

  const handleDrawerNav = (item) => {
    setDrawerOpen(false);
    if (item.tab) {
      navigate(item.path, { state: { tab: item.tab } });
    } else {
      navigate(item.path);
    }
  };

  // ── Data fetching ──

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await messagesAPI.getConversations();
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: messagesData } = useQuery({
    queryKey: ["messages", selectedConversation?.participant?._id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await messagesAPI.getMessages(
        selectedConversation.participant._id,
      );
      return response.data.data;
    },
    enabled: !!selectedConversation,
  });

  const { data: doctorsData } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await authAPI.getProviders();
      return response.data.data;
    },
  });

  // ── Socket ──

  useEffect(() => {
    if (!socket || !selectedConversation?.conversationId) return;
    socket.emit("join-conversation", selectedConversation.conversationId);
    return () => {
      socket.emit("leave-conversation", selectedConversation.conversationId);
    };
  }, [socket, selectedConversation?.conversationId]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (selectedConversation?.participant?._id) {
        queryClient.invalidateQueries({
          queryKey: ["messages", selectedConversation.participant._id],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    };
    const handleMessagesRead = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
    socket.on("new-message", handleNewMessage);
    socket.on("messages-read", handleMessagesRead);
    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("messages-read", handleMessagesRead);
    };
  }, [socket, selectedConversation, queryClient]);

  // ── Mutations & handlers ──

  const sendMessageMutation = useMutation({
    mutationFn: (content) =>
      messagesAPI.send({
        recipientId: selectedConversation.participant._id,
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedConversation?.participant?._id],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (showDoctorsList) setShowDoctorsList(false);
    },
  });

  const handleSendMessage = useCallback(
    (content) => {
      if (selectedConversation) sendMessageMutation.mutate(content);
    },
    [selectedConversation, sendMessageMutation],
  );

  const handleTyping = useCallback(() => {
    if (!socket || !selectedConversation) return;
    socket.emit("typing", {
      conversationId: selectedConversation.conversationId,
      recipientId: selectedConversation.participant._id,
    });
  }, [socket, selectedConversation]);

  const handleStopTyping = useCallback(() => {
    if (!socket || !selectedConversation) return;
    socket.emit("stop-typing", {
      conversationId: selectedConversation.conversationId,
      recipientId: selectedConversation.participant._id,
    });
  }, [socket, selectedConversation]);

  const handleStartConversation = (doctor) => {
    const convId = user?._id
      ? createConversationId(user._id, doctor._id)
      : null;
    setSelectedConversation({ conversationId: convId, participant: doctor });
    setShowDoctorsList(false);
    queryClient.invalidateQueries({ queryKey: ["messages", doctor._id] });
  };

  // ── Derived ──

  const participant = selectedConversation?.participant;
  const participantName = participant
    ? `${participant.profile?.firstName ?? ""} ${participant.profile?.lastName ?? ""}`.trim()
    : "";
  const participantInitials = participant
    ? `${participant.profile?.firstName?.[0] ?? ""}${participant.profile?.lastName?.[0] ?? ""}`.toUpperCase()
    : "";
  const participantRole =
    participant?.role === "provider"
      ? participant?.providerInfo?.specialization || "Healthcare Provider"
      : "Patient";

  const userInitials =
    `${(user?.profile?.firstName || "U")[0]}${(user?.profile?.lastName || "")[0] || ""}`.toUpperCase();

  // ─────────────────────────── RENDER ───────────────────────────
  //
  // Layout breakpoint: lg (1024px).
  //   < lg  → single-panel "phone" mode: show EITHER the contact list OR the chat thread, never both.
  //   >= lg → two-panel "desktop" mode: sidebar (320px) + thread side-by-side, with DashboardDock.
  //
  // Mobile gets its own bottom tab bar (Home, Calendar, Messages, Alerts, More).
  // The "More" button (or hamburger in top bar) opens a full-height slide-out drawer with all nav items.

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col">

      {/* ═══ Mobile nav drawer overlay ═══ */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ═══ Mobile nav drawer ═══ */}
      {drawerOpen && (
        <div
          className="fixed top-0 left-0 h-full w-72 z-[60] bg-card border-r border-border flex flex-col shadow-2xl lg:hidden"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {userInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {/* Active item */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-semibold">Messages</span>
            </div>
            {DRAWER_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleDrawerNav(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border p-2">
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-500 transition-colors rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MOBILE / TABLET ( < lg ):  single-panel mode
         ═══════════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-h-0 lg:hidden">

        {/* ── Mobile top bar ── */}
        <div className="flex-none flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
          <button
            onClick={() => {
              if (selectedConversation) setSelectedConversation(null);
              else setDrawerOpen(true);
            }}
            className="p-1.5 rounded-full hover:bg-muted transition-colors shrink-0"
            aria-label={selectedConversation ? "Back to conversations" : "Open menu"}
          >
            {selectedConversation
              ? <ArrowLeft className="w-5 h-5 text-foreground" />
              : <Menu className="w-5 h-5 text-foreground" />}
          </button>

          {selectedConversation ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                {participantInitials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate leading-tight">
                  {participantName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{participantRole}</p>
              </div>
            </div>
          ) : (
            <h1 className="flex-1 font-bold text-lg text-foreground truncate">
              {showDoctorsList ? "New Message" : "Messages"}
            </h1>
          )}

          {!selectedConversation && (
            <button
              onClick={() => setShowDoctorsList((v) => !v)}
              className={`p-2 rounded-full transition-colors shrink-0 ${
                showDoctorsList
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              aria-label="New message"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── Mobile body: either contact list OR chat thread ── */}
        <div className="flex-1 flex flex-col min-h-0 pb-14">
          {selectedConversation ? (
            /* ── Chat thread (full screen) ── */
            <MessageThread
              messages={messagesData}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
              conversationId={selectedConversation?.conversationId}
            />
          ) : showDoctorsList ? (
            /* ── Doctor picker list ── */
            <div className="flex-1 overflow-y-auto">
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border sticky top-0 bg-card z-10">
                Healthcare Providers
              </p>
              {doctorsData && doctorsData.length > 0 ? (
                doctorsData.map((doctor) => (
                  <button
                    key={doctor._id}
                    onClick={() => handleStartConversation(doctor)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                      {doctor.profile?.firstName?.[0]}
                      {doctor.profile?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {doctor.providerInfo?.specialization || "Healthcare Provider"}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex items-center justify-center p-8 text-muted-foreground text-sm text-center">
                  No providers available
                </div>
              )}
            </div>
          ) : (
            /* ── Conversation list ── */
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversationsData}
                selectedConversation={selectedConversation}
                onSelectConversation={(conv) => {
                  setSelectedConversation(conv);
                  setShowDoctorsList(false);
                }}
              />
            </div>
          )}
        </div>

        {/* ── Mobile bottom tab bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border">
          <div className="flex items-stretch h-14 max-w-lg mx-auto">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 text-muted-foreground active:text-foreground transition-colors"
              aria-label="Home"
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Home</span>
            </button>
            <button
              onClick={() => navigate("/appointments")}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 text-muted-foreground active:text-foreground transition-colors"
              aria-label="Calendar"
            >
              <CalendarCheck className="w-5 h-5" />
              <span className="text-[10px]">Calendar</span>
            </button>
            <button
              className="flex flex-col items-center justify-center flex-1 gap-0.5 text-primary"
              aria-label="Messages - Current page"
            >
              <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Messages</span>
            </button>
            <button
              onClick={() => navigate("/alerts")}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 text-muted-foreground active:text-foreground transition-colors"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="text-[10px]">Alerts</span>
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 text-muted-foreground active:text-foreground transition-colors"
              aria-label="More options"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px]">More</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          DESKTOP ( >= lg ):  two-panel sidebar + thread
         ═══════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 flex-col min-h-0">

        {/* ── Desktop top bar ── */}
        <div className="flex-none flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-1.5 rounded-full hover:bg-muted transition-colors shrink-0"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <h1 className="font-bold text-lg text-foreground">Messages</h1>

          <div className="flex-1" />

          {/* New conversation */}
          <button
            onClick={() => setShowDoctorsList((v) => !v)}
            className={`p-2 rounded-full transition-colors shrink-0 ${
              showDoctorsList
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
            aria-label="New message"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* ── Desktop two-panel body ── */}
        <div className="flex flex-1 min-h-0">

          {/* Sidebar — 320px */}
          <div className="w-80 flex-none border-r border-border flex flex-col min-h-0 bg-card">
            {showDoctorsList ? (
              <div className="flex-1 overflow-y-auto">
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border sticky top-0 bg-card z-10">
                  Healthcare Providers
                </p>
                {doctorsData && doctorsData.length > 0 ? (
                  doctorsData.map((doctor) => (
                    <button
                      key={doctor._id}
                      onClick={() => handleStartConversation(doctor)}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors text-left ${
                        selectedConversation?.participant?._id === doctor._id
                          ? "bg-primary/10"
                          : ""
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                        {doctor.profile?.firstName?.[0]}
                        {doctor.profile?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {doctor.providerInfo?.specialization || "Healthcare Provider"}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-8 text-muted-foreground text-sm text-center">
                    No providers available
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  conversations={conversationsData}
                  selectedConversation={selectedConversation}
                  onSelectConversation={(conv) => {
                    setSelectedConversation(conv);
                    setShowDoctorsList(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Thread panel */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {selectedConversation ? (
              <>
                {/* Participant header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-none">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                    {participantInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {participantName}
                    </p>
                    <p className="text-xs text-muted-foreground">{participantRole}</p>
                  </div>
                </div>

                <MessageThread
                  messages={messagesData}
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                  onStopTyping={handleStopTyping}
                  conversationId={selectedConversation?.conversationId}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 p-8">
                <MessageSquare className="w-14 h-14 opacity-20" />
                <p className="text-base text-center">
                  Select a conversation or click{" "}
                  <span className="text-primary font-medium">+</span> to start one
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop dock — only on lg+ to avoid overlapping mobile bottom bar ── */}
      <div className="hidden lg:block">
        <DashboardDock
          activeTab="messages"
          onTabChange={handleSidebarNav}
          role={user?.role || "patient"}
        />
      </div>
    </div>
  );
};

export default Messages;
