import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";

const eventInvalidations = {
  EXPENSE_CREATED: ["dashboard", "transactions", "budgets"],
  EXPENSE_UPDATED: ["dashboard", "transactions", "budgets"],
  EXPENSE_DELETED: ["dashboard", "transactions", "budgets"],
  CATEGORY_CREATED: ["dashboard", "categories", "budgets"],
  CATEGORY_UPDATED: ["dashboard", "categories", "budgets"],
  CATEGORY_DELETED: ["dashboard", "categories", "budgets"],
  CATEGORY_BUDGET_UPDATED: ["dashboard", "categories", "budgets"],
  ACCOUNT_CREATED: ["accounts", "dashboard", "transactions"],
  ACCOUNT_UPDATED: ["accounts", "dashboard", "transactions"],
  ACCOUNT_DELETED: ["accounts", "dashboard", "transactions"],
  MONTHLY_BUDGET_UPDATED: ["dashboard", "budgets"],
  WORKSPACE_UPDATED: ["workspace", "workspaces", "dashboard", "members"],
  MEMBER_JOINED: ["workspace", "workspaces", "dashboard", "members"],
  INVITATION_DECLINED: ["members"],
};

export function useWorkspaceEvents({ token, workspaceId, user, onWorkspaceEvent, onNotificationEvent }) {
  const queryClient = useQueryClient();
  const lastEventRef = useRef("");

  useEffect(() => {
    if (!token || (!workspaceId && !user?.id)) return undefined;

    const client = new Client({
      brokerURL: websocketUrl("/ws"),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (workspaceId) {
          client.subscribe(`/topic/workspaces/${workspaceId}`, (message) => {
            const event = JSON.parse(message.body);
            const fingerprint = `${event.eventType}:${event.entityId}:${event.occurredAt}`;
            if (lastEventRef.current === fingerprint) return;
            lastEventRef.current = fingerprint;

            invalidateWorkspaceCaches(queryClient, workspaceId, event.eventType);
            onWorkspaceEvent?.(event);

            if (event.changedBy && event.changedBy !== user?.id) {
              toast.info("Workspace updated by another member");
            }
          });
        }

        if (user?.id) {
          client.subscribe(`/topic/users/${user.id}/notifications`, (message) => {
            const event = JSON.parse(message.body);
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
            queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount });
            onNotificationEvent?.(event);
            if (event.eventType === "NOTIFICATION_CREATED") {
              toast.info("New notification");
            }
          });
        }
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [token, workspaceId, user?.id, queryClient, onWorkspaceEvent, onNotificationEvent]);
}

function invalidateWorkspaceCaches(queryClient, workspaceId, eventType) {
  const groups = eventInvalidations[eventType] ?? ["dashboard"];
  groups.forEach((group) => {
    if (group === "dashboard") queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(workspaceId) });
    if (group === "transactions") queryClient.invalidateQueries({ queryKey: queryKeys.transactions(workspaceId) });
    if (group === "budgets") queryClient.invalidateQueries({ queryKey: queryKeys.budgets(workspaceId) });
    if (group === "categories") queryClient.invalidateQueries({ queryKey: queryKeys.categories(workspaceId) });
    if (group === "accounts") queryClient.invalidateQueries({ queryKey: queryKeys.accounts(workspaceId) });
    if (group === "workspace") queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    if (group === "workspaces") queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    if (group === "members") queryClient.invalidateQueries({ queryKey: queryKeys.members(workspaceId) });
  });
}

function websocketUrl(path) {
  const baseUrl = import.meta.env.VITE_WS_BASE_URL;
  if (baseUrl) return `${baseUrl}${path}`;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}
