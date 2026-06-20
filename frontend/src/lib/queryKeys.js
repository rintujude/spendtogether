export const queryKeys = {
  workspaces: ["workspaces"],
  workspace: (workspaceId) => ["workspace", workspaceId],
  dashboard: (workspaceId, periodKey = "") => ["dashboard", workspaceId, periodKey],
  transactions: (workspaceId, periodKey = "", filtersKey = "") => ["transactions", workspaceId, periodKey, filtersKey],
  categories: (workspaceId) => ["categories", workspaceId],
  accounts: (workspaceId) => ["accounts", workspaceId],
  budgets: (workspaceId, year = "", month = "") => ["budgets", workspaceId, year, month],
  members: (workspaceId) => ["members", workspaceId],
  notifications: ["notifications"],
  notificationUnreadCount: ["notificationUnreadCount"],
  pendingInvitations: ["pendingInvitations"],
};
