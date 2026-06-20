import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout({
  children,
  user,
  workspaces,
  workspaceId,
  notifications,
  unreadCount,
  notificationActionId,
  onWorkspaceChange,
  onSignOut,
  onLoadNotifications,
  onMarkAllNotificationsRead,
  onNotificationClick,
  onAcceptInvitation,
  onDeclineInvitation,
  onDeleteNotification,
}) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar />
      <div className="min-w-0">
        <Topbar
          user={user}
          workspaces={workspaces}
          workspaceId={workspaceId}
          notifications={notifications}
          unreadCount={unreadCount}
          notificationActionId={notificationActionId}
          onWorkspaceChange={onWorkspaceChange}
          onSignOut={onSignOut}
          onLoadNotifications={onLoadNotifications}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          onNotificationClick={onNotificationClick}
          onAcceptInvitation={onAcceptInvitation}
          onDeclineInvitation={onDeclineInvitation}
          onDeleteNotification={onDeleteNotification}
        />
        <main className="mx-auto grid max-w-[1200px] gap-6 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
