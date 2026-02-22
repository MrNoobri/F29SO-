import React, { useEffect, useState } from "react";
import { googleFitAPI } from "../api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "../context/ToastContext";

export default function GoogleFitConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleFitState = params.get("googlefit");

    if (googleFitState === "connected") {
      setIsConnected(true);
      toast.success("Google Fit connected");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (googleFitState === "error") {
      toast.error("Google Fit connection was not completed");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      setIsLoading(true);
      const response = await googleFitAPI.getStatus();
      setIsConnected(Boolean(response?.data?.data?.connected));
      setLastSyncedAt(response?.data?.data?.lastSyncedAt || null);
    } catch (_error) {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect() {
    try {
      const response = await googleFitAPI.getAuthUrl();
      const authUrl = response?.data?.data?.authUrl;

      if (authUrl) {
        window.location.href = authUrl;
        return;
      }

      throw new Error("Missing auth URL");
    } catch (_error) {
      toast.error("Could not start Google Fit connection");
    }
  }

  async function handleSync() {
    try {
      setIsSyncing(true);
      const response = await googleFitAPI.sync();
      const syncedAt = response?.data?.data?.syncedAt || new Date().toISOString();
      setLastSyncedAt(syncedAt);
      toast.success("Wearable data synced");
    } catch (_error) {
      toast.error("Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDisconnect() {
    try {
      await googleFitAPI.disconnect();
      setIsConnected(false);
      setLastSyncedAt(null);
      toast.info("Google Fit disconnected");
    } catch (_error) {
      toast.error("Disconnect failed");
    }
  }

  return (
    <Card className="rounded-[1.75rem] border-slate-200">
      <CardHeader>
        <CardTitle>Google Fit connection</CardTitle>
        <CardDescription>
          Early integration panel for connecting a wearable source and manually syncing health data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {isLoading
            ? "Checking connection status..."
            : isConnected
              ? "Google Fit is connected. You can run a manual sync for the latest wearable data."
              : "Google Fit is not connected yet. Link it to start pulling activity and wellness signals."}
        </div>

        <div className="flex flex-wrap gap-3">
          {!isConnected ? (
            <Button onClick={handleConnect} disabled={isLoading}>
              Connect Google Fit
            </Button>
          ) : (
            <>
              <Button onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? "Syncing..." : "Sync now"}
              </Button>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {isConnected ? "Connected" : "Not connected"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Last synced</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Not yet synced"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
