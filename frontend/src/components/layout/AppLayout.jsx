import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileBottomNav } from "./MobileBottomNav";

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
  onAddExpense,
}) {
  const activeWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar
        onAddExpense={onAddExpense}
      />
      <div className="min-w-0 pb-32 lg:pb-0">
        <Topbar
          user={user}
          workspaces={workspaces}
          workspaceId={workspaceId}
          activeWorkspace={activeWorkspace}
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
        <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-5 sm:px-5 md:px-8 md:py-8">
          {children}
        </main>
        <MobileBottomNav onAddExpense={onAddExpense} />
      </div>
    </div>
  );
}
