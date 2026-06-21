import React from "react";
import { Bell, CheckCheck, ChevronDown, LogOut, Trash2, UserCircle, X } from "lucide-react";
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
  workspaces,
  workspaceId,
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
  const activeWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);
  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-5 md:px-8 md:py-4">
      <div className="mx-auto grid w-full max-w-[1200px] gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{activeWorkspace?.name ?? "No workspace selected"}</p>
              <p className="hidden text-xs font-medium text-muted sm:block">Shared budget workspace</p>
            </div>
            {activeWorkspace && <div className="hidden sm:block"><Badge>{currencyLabel(activeWorkspace.currencyCode)}</Badge></div>}
          </div>
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
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">Notifications</p>
                    <p className="text-xs font-medium text-muted">{unreadCount > 0 ? `${badgeText} unread` : "All caught up"}</p>
                  </div>
                  {unreadCount > 0 && (
                    <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={onMarkAllNotificationsRead}>
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all
                    </Button>
                  )}
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-border p-4 text-center">
                      <div>
                        <p className="text-sm font-semibold text-foreground">No notifications</p>
                        <p className="mt-1 text-xs font-medium text-muted">Workspace updates and reminders will appear here.</p>
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
        <div className="flex items-end gap-3">
          <Select
            label="Workspace"
            className="w-full sm:max-w-sm"
            value={workspaceId}
            onChange={(event) => onWorkspaceChange(event.target.value)}
          >
            <option value="">Select workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
            ))}
          </Select>
          {activeWorkspace && <div className="pb-1 sm:hidden"><Badge>{activeWorkspace.currencyCode}</Badge></div>}
        </div>
      </div>
    </header>
  );
}

function NotificationItem({ notification, busy, onClick, onAcceptInvitation, onDeclineInvitation, onDeleteNotification }) {
  const unread = !notification.readAt;
  const isInvitation = notification.actionType === "ACCEPT_DECLINE_INVITATION" && notification.actionEntityType === "INVITATION";

  return (
    <div
      role="button"
      tabIndex={0}
      className={`rounded-xl border p-3 text-left transition ${unread ? "border-blue-100 bg-blue-50/70" : "border-border bg-white hover:bg-slate-50"}`}
      onClick={() => onClick?.(notification)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick?.(notification);
      }}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 rounded-full ${unread ? "bg-primary" : "bg-transparent"}`} />
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
                variant="secondary"
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
