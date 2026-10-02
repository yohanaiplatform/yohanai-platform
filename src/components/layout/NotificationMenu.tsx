"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

/**
 * Render ringan buat body notifikasi follow-up gabungan (lihat
 * followUpFormatting.ts) -- cuma dukung subset kecil yang sama dengan
 * WhatsApp (*bold*, baris "- " jadi bullet, baris kosong jadi jarak),
 * bukan markdown penuh. Sengaja tanpa library markdown baru -- cakupannya
 * kecil, cukup ditulis manual.
 */
function renderLightFormatting(text: string) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        if (line.trim() === "") return <br key={i} />;

        const isBullet = line.startsWith("- ");
        const content = isBullet ? line.slice(2) : line;
        const parts = content.split(/\*([^*]+)\*/g);

        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
        );

        return (
          <span key={i} className="block">
            {isBullet ? "• " : ""}
            {rendered}
          </span>
        );
      })}
    </>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

/**
 * Notifikasi in-app pertama di project ini yang beneran nyambung ke data
 * (core.notifications, migration 048) -- sebelumnya komponen ini cuma 2
 * item dummy hardcode. Dipakai sekarang khusus alur "Permintaan akses
 * Google Contacts" (admin dapat notifikasi + tombol Setujui inline), tapi
 * ditulis generik supaya fitur lain bisa kirim notifikasi lewat
 * createNotification() tanpa ubah komponen ini lagi.
 */
export function NotificationMenu() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  // Approve request cuma update status di auth_ext.google_contacts_access_requests,
  // bukan field di notifikasi ini -- jadi tombol "Setujui" dilacak lokal per sesi
  // (bukan dari read_at, supaya tidak hilang begitu dropdown dibuka & item ke-mark-read).
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  async function loadNotifications() {
    const supabase = createClient();
    const { data } = await supabase
      .schema("core")
      .from("notifications")
      .select("id, type, title, body, link, metadata, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    setNotifications((data as NotificationRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await loadNotifications();
    })();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function handleOpenChange(open: boolean) {
    if (!open || unreadCount === 0) return;
    const supabase = createClient();
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    await supabase.schema("core").from("notifications").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n)));
  }

  async function handleApprove(notification: NotificationRow) {
    const requestingUserId = notification.metadata?.requestingUserId as string | undefined;
    if (!requestingUserId) return;

    setResolvingId(notification.id);
    const res = await fetch("/api/google-contacts/approve-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: requestingUserId }),
    });
    setResolvingId(null);

    if (res.ok) {
      setResolvedIds((prev) => new Set(prev).add(notification.id));
    }
  }

  function handleItemClick(notification: NotificationRow) {
    if (notification.link) router.push(notification.link);
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600" />}
        <span className="sr-only">Toggle notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">Memuat...</div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">Belum ada notifikasi.</div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 py-3"
              onSelect={(e) => {
                if (n.type === "google_contacts_access_request") e.preventDefault();
                else handleItemClick(n);
              }}
            >
              <span className={`font-medium ${n.read_at ? "" : "text-foreground"}`}>{n.title}</span>
              {n.body && (
                <span className="text-xs text-muted-foreground">
                  {n.type === "ai_agent_needs_follow_up" ? renderLightFormatting(n.body) : n.body}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
              {n.type === "google_contacts_access_request" &&
                (resolvedIds.has(n.id) ? (
                  <span className="text-xs text-green-600">Disetujui</span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-1"
                    disabled={resolvingId === n.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(n);
                    }}
                  >
                    {resolvingId === n.id ? "Memproses..." : "Setujui"}
                  </Button>
                ))}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
