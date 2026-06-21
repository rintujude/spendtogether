import React from "react";
import { Bell, CheckCheck, ChevronDown, Inbox, LogOut, MailPlus, Search, Trash2, UserCircle, X } from "lucide-react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
} from "../ui";
import { currencyLabel } from "../../lib/currencies";

export function Topbar({
  user,
  workspaces = [],
  workspaceId = "",
  activeWorkspace,
  notifications = [],
  unreadCount = 0,
  notificationActionId = "",
  onWorkspaceChange,
  onSignOut,
  onLoadNotifications,
  onMarkAllNotificationsRead,
  onNotificationClick,
  onAcceptInvitation,
  onDeclineInvitation,
  onDeleteNotification,
}) {
  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-5 md:px-8 md:py-4">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex items-center justify-between gap-3">
          <div className="grid min-w-0 shrink-0 grow basis-[min(56vw,300px)] gap-1.5 md:basis-72 md:grow-0">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Workspace</p>
            <div className="flex min-w-0 items-center gap-2">
              <Select
                aria-label="Workspace"
                className="min-w-0 flex-1"
                selectClassName="h-10 bg-white font-semibold"
                value={workspaceId}
                onChange={(event) => onWorkspaceChange?.(event.target.value)}
              >
                <option value="">Select workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </Select>
              {activeWorkspace && (
                <Badge className="shrink-0" title={currencyLabel(activeWorkspace.currencyCode)}>
                  {activeWorkspace.currencyCode || "GBP"}
                </Badge>
              )}
            </div>
          </div>
          <label className="hidden min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-white px-3 shadow-sm md:flex md:max-w-md">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              className="h-10 min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-slate-400"
              placeholder="Search SpendTogether"
              aria-label="Search SpendTogether"
            />
          </label>
          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu onOpenChange={(open) => open && onLoadNotifications?.()}>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="secondary" className="relative h-10 w-10 px-0" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold leading-5 text-white">
                      {badgeText}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-sm p-0">
                <div className="border-b border-border bg-slate-950 px-4 py-4 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-bold tracking-tight">Notifications</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">{unreadCount > 0 ? `${badgeText} unread updates` : "All caught up"}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10">
                      <Bell className="h-4 w-4" />
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <Button type="button" variant="secondary" className="mt-3 h-9 border-white/15 bg-white/10 px-3 text-xs text-white hover:bg-white/15" onClick={onMarkAllNotificationsRead}>
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-border bg-slate-50 p-5 text-center">
                      <div>
                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-muted shadow-sm">
                          <Inbox className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-bold text-foreground">No notifications</p>
                        <p className="mt-1 text-xs font-medium leading-5 text-muted">Workspace invitations and updates will appear here.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          busy={notificationActionId === notification.id}
                          onClick={onNotificationClick}
                          onAcceptInvitation={onAcceptInvitation}
                          onDeclineInvitation={onDeclineInvitation}
                          onDeleteNotification={onDeleteNotification}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="secondary" className="shrink-0 rounded-full pl-2.5 pr-3">
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.fullName ?? "User"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onSignOut}>
                  <LogOut className="mr-2 inline h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationItem({ notification, busy, onClick, onAcceptInvitation, onDeclineInvitation, onDeleteNotification }) {
  const unread = !notification.readAt;
  const isInvitation = notification.actionType === "ACCEPT_DECLINE_INVITATION" && notification.actionEntityType === "INVITATION";
  const Icon = isInvitation ? MailPlus : Bell;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`rounded-2xl border p-3 text-left transition ${unread ? "border-slate-200 bg-slate-50" : "border-border bg-white hover:bg-slate-50"}`}
      onClick={() => onClick?.(notification)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick?.(notification);
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isInvitation ? "bg-green-50 text-success" : "bg-slate-100 text-slate-950"}`}>
          <Icon className="h-4 w-4" />
          {unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{notification.title}</p>
              <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-muted">{notification.message}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-8 px-0 text-muted"
              aria-label="Delete notification"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteNotification?.(notification);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{formatNotificationTime(notification.createdAt)}</p>
          {isInvitation && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                className="h-9 px-3 text-xs"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation();
                  onAcceptInvitation?.(notification);
                }}
              >
                {busy ? "Working" : "Accept"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 px-3 text-xs"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeclineInvitation?.(notification);
                }}
              >
                <X className="h-3.5 w-3.5" />
                Decline
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatNotificationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
