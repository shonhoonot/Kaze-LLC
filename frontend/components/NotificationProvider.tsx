"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Api, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Notification } from "@/lib/types";

interface NotificationState {
  items: Notification[];
  unread: number;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationState | null>(null);

const POLL_MS = 60_000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setItems([]);
      setUnread(0);
      return;
    }
    try {
      const n = await Api.notifications();
      setItems(n.items);
      setUnread(n.unread);
    } catch {
      /* ignore transient errors */
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!getToken()) return;
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [user, refresh]);

  const markRead = useCallback(async (id: number) => {
    const n = await Api.markNotificationRead(id);
    setItems(n.items);
    setUnread(n.unread);
  }, []);

  const markAllRead = useCallback(async () => {
    const n = await Api.markAllNotificationsRead();
    setItems(n.items);
    setUnread(n.unread);
  }, []);

  return (
    <NotificationContext.Provider value={{ items, unread, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationState {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
