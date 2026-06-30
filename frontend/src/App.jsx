import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, CheckCircle2, ChevronDown, Clock3, CreditCard, Inbox, Landmark, LogOut, MailPlus, Plus, ReceiptText, RefreshCcw, UserCircle, WalletCards } from "lucide-react";
import { Toaster, toast } from "sonner";
import { z } from "zod";
import { AppLayout, AuthLayout } from "./components/layout";
import { defaultPresetPeriod, periodQuery } from "./components/filters";
import { Badge, Button, Card, Dialog, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, EmptyState, Form, Input, PageHeader, Select } from "./components/ui";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { LandingPage } from "./pages/LandingPage";
import { AddCategoryDialog, AddSourceDialog, SetupPage } from "./pages/SetupPage";
import { useWorkspaceEvents } from "./hooks/useWorkspaceEvents";
import { queryKeys } from "./lib/queryKeys";
import "./styles.css";

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const queryClient = new QueryClient();
const tokenStorageKey = "sharedBudgetToken";
const refreshTokenStorageKey = "sharedBudgetRefreshToken";
const userStorageKey = "sharedBudgetUser";

function normalizeApiBaseUrl(value) {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed) return "/api";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const authSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Workspace name must be 100 characters or fewer"),
  currencyCode: z.string().length(3, "Currency code must be 3 characters"),
});

const categoryWithTypeSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  categoryType: z.string().min(1, "Category type is required"),
  monthlyBudgetAmount: z.coerce.number().min(0, "Monthly budget must be zero or more"),
});
const sourceSchema = z.object({
  name: z.string().min(1, "Payment source name is required"),
  type: z.string().min(1),
});
const budgetSchema = z.object({
  categoryId: z.string().min(1, "Choose a category"),
  limitAmount: z.coerce.number().min(0, "Budget must be zero or more"),
});
const totalBudgetSchema = z.object({
  amount: z.coerce.number().positive("Total budget must be more than zero"),
});
const expenseSchema = z.object({
  categoryId: z.string().min(1, "Choose a category"),
  paymentSourceId: z.string().min(1, "Choose a payment source"),
  amount: z.coerce.number().positive("Amount must be more than zero"),
  expenseDate: z.string().min(1, "Choose a date"),
  description: z.string().optional(),
});

function buildFilteredQuery(filters) {
  const params = periodQuery(filters);
  Object.entries(filters).forEach(([key, value]) => {
    if (value && !["periodPreset", "startDate", "endDate"].includes(key)) params.set(key, value);
  });
  return params.toString();
}

function App() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => localStorage.getItem(tokenStorageKey) ?? "");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(userStorageKey);
    return saved ? JSON.parse(saved) : null;
  });
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("");
  const [categories, setCategories] = useState([]);
  const [paymentSources, setPaymentSources] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationActionId, setNotificationActionId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [dashboardCards, setDashboardCards] = useState({
    remaining: null,
    categorySpending: null,
    dailyTrend: null,
    accountSpending: null,
  });
  const [expenses, setExpenses] = useState([]);
  const [summaryPeriod, setSummaryPeriod] = useState(defaultPresetPeriod);
  const [remainingPeriod, setRemainingPeriod] = useState(defaultPresetPeriod);
  const [spendingPeriod, setSpendingPeriod] = useState(defaultPresetPeriod);
  const [trendPeriod, setTrendPeriod] = useState(defaultPresetPeriod);
  const [accountPeriod, setAccountPeriod] = useState(defaultPresetPeriod);
  const [transactionFilters, setTransactionFilters] = useState({ ...defaultPresetPeriod, categoryId: "", paymentSourceId: "", memberId: "" });
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false);
  const [returnToExpenseAfterSetup, setReturnToExpenseAfterSetup] = useState(false);
  const [totalBudgetDialogOpen, setTotalBudgetDialogOpen] = useState(false);
  const [totalBudgetSaving, setTotalBudgetSaving] = useState(false);

  const authForm = useForm({ resolver: zodResolver(authSchema), defaultValues: { fullName: "", email: "", password: "" } });
  const workspaceForm = useForm({ resolver: zodResolver(workspaceSchema), defaultValues: { name: "", currencyCode: "GBP" } });
  const editWorkspaceForm = useForm({ resolver: zodResolver(workspaceSchema), defaultValues: { name: "", currencyCode: "GBP" } });
  const categoryForm = useForm({ resolver: zodResolver(categoryWithTypeSchema), defaultValues: { name: "", categoryType: "EXPENSE", monthlyBudgetAmount: "" } });
  const sourceForm = useForm({ resolver: zodResolver(sourceSchema), defaultValues: { name: "", type: "CURRENT_ACCOUNT" } });
  const budgetForm = useForm({ resolver: zodResolver(budgetSchema), defaultValues: { categoryId: "", limitAmount: "" } });
  const totalBudgetForm = useForm({ resolver: zodResolver(totalBudgetSchema), defaultValues: { amount: "" } });
  const expenseForm = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: "",
      paymentSourceId: "",
      amount: "",
      expenseDate: new Date().toISOString().slice(0, 10),
      description: "",
    },
  });
  const editExpenseForm = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: "",
      paymentSourceId: "",
      amount: "",
      expenseDate: new Date().toISOString().slice(0, 10),
      description: "",
    },
  });

  const summaryPeriodKey = useMemo(() => JSON.stringify(summaryPeriod), [summaryPeriod]);
  const remainingPeriodKey = useMemo(() => JSON.stringify(remainingPeriod), [remainingPeriod]);
  const spendingPeriodKey = useMemo(() => JSON.stringify(spendingPeriod), [spendingPeriod]);
  const trendPeriodKey = useMemo(() => JSON.stringify(trendPeriod), [trendPeriod]);
  const accountPeriodKey = useMemo(() => JSON.stringify(accountPeriod), [accountPeriod]);
  const filtersKey = useMemo(() => JSON.stringify(transactionFilters), [transactionFilters]);
  const budgetPeriod = useMemo(() => {
    const source = dashboard ?? dashboardCards.remaining;
    return { year: source?.year ?? new Date().getFullYear(), month: source?.month ?? new Date().getMonth() + 1 };
  }, [dashboard, dashboardCards.remaining]);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);
  const currencyCode = dashboard?.currencyCode ?? activeWorkspace?.currencyCode ?? "GBP";
  const currencySymbol = getCurrencySymbol(currencyCode);
  const selectedPaymentSourceId = expenseForm.watch("paymentSourceId");
  const selectedEditPaymentSourceId = editExpenseForm.watch("paymentSourceId");

  function storeAuthSession(result) {
    localStorage.setItem(tokenStorageKey, result.token);
    if (result.refreshToken) {
      localStorage.setItem(refreshTokenStorageKey, result.refreshToken);
    }
    localStorage.setItem(userStorageKey, JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  }

  function redirectToLogin(message = "Please sign in again.") {
    clearSession();
    toast.error(message);
    navigate("/login", { replace: true });
  }

  async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(refreshTokenStorageKey);
    if (!refreshToken) return "";

    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return "";

    const result = await response.json();
    storeAuthSession(result);
    return result.token;
  }

  async function api(path, options = {}, retryOnUnauthorized = true) {
    let response;
    const activeToken = localStorage.getItem(tokenStorageKey) ?? token;
    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          ...(options.headers ?? {}),
        },
      });
    } catch {
      throw new Error("We could not connect to SpendTogether right now. Please check your internet connection and try again in a moment.");
    }

    if (!response.ok) {
      const body = await response.text();
      let message = "";

      try {
        const parsed = JSON.parse(body);
        message = parsed.message || parsed.error || parsed.detail || "";
      } catch {
        message = body;
      }

      if (!path.startsWith("/auth/") && response.status === 401 && retryOnUnauthorized) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          return api(path, options, false);
        }
        redirectToLogin("Your session expired. Please sign in again.");
        throw new Error("Your session expired. Please sign in again.");
      }

      if (path === "/auth/login" && response.status === 401) {
        message = "Incorrect email or password.";
      }

      if (!path.startsWith("/auth/") && response.status === 401) {
        redirectToLogin("Your session expired. Please sign in again.");
        throw new Error("Your session expired. Please sign in again.");
      }

      if (!path.startsWith("/auth/") && response.status === 403) {
        message = message || "You do not have permission to do this action.";
      }

      throw new Error(message || "Something went wrong. Please try again.");
    }

    return response.status === 204 ? null : response.json();
  }

  async function submitAuth(values) {
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login" ? { email: values.email, password: values.password } : values;
      const result = await api(path, { method: "POST", body: JSON.stringify(payload) });
      storeAuthSession(result);
      toast.success(`Signed in as ${result.user.fullName}`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkspaces() {
    if (!token) return;
    setWorkspacesLoaded(false);
    try {
      const result = await api("/workspaces");
      setWorkspaces(result);
      queryClient.setQueryData(queryKeys.workspaces, result);
      if (!workspaceId && result.length > 0) setWorkspaceId(result[0].id);
      if (result.length === 0) navigate("/manage-workspace", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorkspacesLoaded(true);
    }
  }

  async function loadNotifications() {
    if (!token) return;
    try {
      const result = await api("/notifications?status=all&limit=20&offset=0");
      setNotifications(result.items ?? []);
      setNotificationUnreadCount(result.unreadCount ?? 0);
      queryClient.setQueryData(queryKeys.notifications, result.items ?? []);
      queryClient.setQueryData(queryKeys.notificationUnreadCount, result.unreadCount ?? 0);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function loadNotificationUnreadCount() {
    if (!token) return;
    try {
      const result = await api("/notifications/unread-count");
      setNotificationUnreadCount(result.unreadCount ?? 0);
      queryClient.setQueryData(queryKeys.notificationUnreadCount, result.unreadCount ?? 0);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function loadWorkspaceData(id = workspaceId) {
    if (!id) return;
    setLoading(true);
    try {
      const transactionQuery = buildFilteredQuery(transactionFilters);
      const [categoryResult, sourceResult, summaryResult, remainingResult, categorySpendingResult, dailyTrendResult, accountSpendingResult, expenseResult, memberResult] = await Promise.all([
        api(`/workspaces/${id}/categories`),
        api(`/workspaces/${id}/payment-sources`),
        api(`/workspaces/${id}/dashboard/summary?${periodQuery(summaryPeriod)}`),
        api(`/workspaces/${id}/dashboard/remaining-by-category?${periodQuery(remainingPeriod)}`),
        api(`/workspaces/${id}/dashboard/spending-by-category?${periodQuery(spendingPeriod)}`),
        api(`/workspaces/${id}/dashboard/daily-spending-trend?${periodQuery(trendPeriod)}`),
        api(`/workspaces/${id}/dashboard/account-spending?${periodQuery(accountPeriod)}`),
        api(`/workspaces/${id}/expenses?${transactionQuery}`),
        api(`/workspaces/${id}/members`),
      ]);
      const budgetResult = await api(`/workspaces/${id}/budgets?year=${budgetPeriod.year}&month=${budgetPeriod.month}`);
      setCategories(categoryResult);
      setPaymentSources(sourceResult);
      setBudgets(budgetResult);
      setDashboard(summaryResult);
      setDashboardCards({
        remaining: remainingResult,
        categorySpending: categorySpendingResult,
        dailyTrend: dailyTrendResult,
        accountSpending: accountSpendingResult,
      });
      setExpenses(expenseResult);
      setMembers(memberResult.members ?? []);
      setPendingInvitations(memberResult.pendingInvitations ?? []);
      queryClient.setQueryData(queryKeys.categories(id), categoryResult);
      queryClient.setQueryData(queryKeys.accounts(id), sourceResult);
      queryClient.setQueryData(queryKeys.budgets(id, budgetPeriod.year, budgetPeriod.month), budgetResult);
      queryClient.setQueryData(["dashboardSummary", id, summaryPeriodKey], summaryResult);
      queryClient.setQueryData(["remainingByCategory", id, remainingPeriodKey], remainingResult);
      queryClient.setQueryData(["spendingByCategory", id, spendingPeriodKey], categorySpendingResult);
      queryClient.setQueryData(["dailyTrend", id, trendPeriodKey], dailyTrendResult);
      queryClient.setQueryData(["accountSpending", id, accountPeriodKey], accountSpendingResult);
      queryClient.setQueryData(queryKeys.transactions(id, "", filtersKey), expenseResult);
      queryClient.setQueryData(queryKeys.members(id), memberResult);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboardSummary(id = workspaceId) {
    if (!id) return;
    try {
      const result = await api(`/workspaces/${id}/dashboard/summary?${periodQuery(summaryPeriod)}`);
      setDashboard(result);
      queryClient.setQueryData(["dashboardSummary", id, summaryPeriodKey], result);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function loadDashboardCard(cardKey, endpoint, periodValue, periodCacheKey) {
    if (!workspaceId) return;
    try {
      const result = await api(`/workspaces/${workspaceId}/dashboard/${endpoint}?${periodQuery(periodValue)}`);
      setDashboardCards((current) => ({ ...current, [cardKey]: result }));
      queryClient.setQueryData([cardKey, workspaceId, periodCacheKey], result);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function loadTransactions(id = workspaceId) {
    if (!id) return;
    try {
      const result = await api(`/workspaces/${id}/expenses?${buildFilteredQuery(transactionFilters)}`);
      setExpenses(result);
      queryClient.setQueryData(queryKeys.transactions(id, "", filtersKey), result);
    } catch (err) {
      toast.error(err.message);
    }
  }

  useEffect(() => {
    loadWorkspaces();
    loadNotifications();
  }, [token]);

  useEffect(() => {
    loadWorkspaceData(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    loadDashboardSummary();
  }, [workspaceId, summaryPeriodKey]);

  useEffect(() => {
    loadDashboardCard("remaining", "remaining-by-category", remainingPeriod, remainingPeriodKey);
  }, [workspaceId, remainingPeriodKey]);

  useEffect(() => {
    loadDashboardCard("categorySpending", "spending-by-category", spendingPeriod, spendingPeriodKey);
  }, [workspaceId, spendingPeriodKey]);

  useEffect(() => {
    loadDashboardCard("dailyTrend", "daily-spending-trend", trendPeriod, trendPeriodKey);
  }, [workspaceId, trendPeriodKey]);

  useEffect(() => {
    loadDashboardCard("accountSpending", "account-spending", accountPeriod, accountPeriodKey);
  }, [workspaceId, accountPeriodKey]);

  useEffect(() => {
    loadTransactions();
  }, [workspaceId, filtersKey]);

  useEffect(() => {
    if (!token) return undefined;
    const onFocus = () => {
      loadNotificationUnreadCount();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [token]);

  const refreshWorkspaceSlices = useCallback(async (event) => {
    if (!workspaceId) return;

    const eventType = event.eventType;
    const requests = [];

    const fetchCategories = () => api(`/workspaces/${workspaceId}/categories`).then((result) => {
      setCategories(result);
      queryClient.setQueryData(queryKeys.categories(workspaceId), result);
    });
    const fetchAccounts = () => api(`/workspaces/${workspaceId}/payment-sources`).then((result) => {
      setPaymentSources(result);
      queryClient.setQueryData(queryKeys.accounts(workspaceId), result);
    });
    const transactionQuery = buildFilteredQuery(transactionFilters);

    const fetchDashboard = () => api(`/workspaces/${workspaceId}/dashboard/summary?${periodQuery(summaryPeriod)}`).then((result) => {
      setDashboard(result);
      queryClient.setQueryData(["dashboardSummary", workspaceId, summaryPeriodKey], result);
    });
    const fetchDashboardCards = () => Promise.all([
      api(`/workspaces/${workspaceId}/dashboard/remaining-by-category?${periodQuery(remainingPeriod)}`),
      api(`/workspaces/${workspaceId}/dashboard/spending-by-category?${periodQuery(spendingPeriod)}`),
      api(`/workspaces/${workspaceId}/dashboard/daily-spending-trend?${periodQuery(trendPeriod)}`),
      api(`/workspaces/${workspaceId}/dashboard/account-spending?${periodQuery(accountPeriod)}`),
    ]).then(([remaining, categorySpending, dailyTrend, accountSpending]) => {
      setDashboardCards({ remaining, categorySpending, dailyTrend, accountSpending });
      queryClient.setQueryData(["remainingByCategory", workspaceId, remainingPeriodKey], remaining);
      queryClient.setQueryData(["spendingByCategory", workspaceId, spendingPeriodKey], categorySpending);
      queryClient.setQueryData(["dailyTrend", workspaceId, trendPeriodKey], dailyTrend);
      queryClient.setQueryData(["accountSpending", workspaceId, accountPeriodKey], accountSpending);
    });
    const fetchTransactions = () => api(`/workspaces/${workspaceId}/expenses?${transactionQuery}`).then((result) => {
      setExpenses(result);
      queryClient.setQueryData(queryKeys.transactions(workspaceId, "", filtersKey), result);
    });
    const fetchBudgets = () => api(`/workspaces/${workspaceId}/budgets?year=${budgetPeriod.year}&month=${budgetPeriod.month}`).then((result) => {
      setBudgets(result);
      queryClient.setQueryData(queryKeys.budgets(workspaceId, budgetPeriod.year, budgetPeriod.month), result);
    });
    const fetchMembers = () => api(`/workspaces/${workspaceId}/members`).then((result) => {
      setMembers(result.members ?? []);
      setPendingInvitations(result.pendingInvitations ?? []);
      queryClient.setQueryData(queryKeys.members(workspaceId), result);
    });

    if (eventType?.startsWith("EXPENSE_")) {
      requests.push(fetchDashboard(), fetchDashboardCards(), fetchTransactions(), fetchBudgets());
    } else if (eventType?.startsWith("CATEGORY_")) {
      requests.push(fetchDashboard(), fetchDashboardCards(), fetchCategories(), fetchBudgets());
    } else if (eventType?.startsWith("ACCOUNT_")) {
      requests.push(fetchAccounts(), fetchDashboard(), fetchDashboardCards(), fetchTransactions());
    } else if (eventType === "MONTHLY_BUDGET_UPDATED") {
      requests.push(fetchDashboard(), fetchDashboardCards(), fetchBudgets());
    } else if (eventType === "WORKSPACE_UPDATED") {
      requests.push(loadWorkspaces(), fetchMembers(), fetchDashboard());
    } else {
      requests.push(fetchDashboard());
    }

    try {
      await Promise.all(requests);
    } catch (err) {
      toast.error(err.message);
    }
  }, [workspaceId, summaryPeriod, remainingPeriod, spendingPeriod, trendPeriod, accountPeriod, summaryPeriodKey, remainingPeriodKey, spendingPeriodKey, trendPeriodKey, accountPeriodKey, filtersKey, transactionFilters, budgetPeriod.year, budgetPeriod.month, queryClient]);

  useWorkspaceEvents({
    token: workspaceId ? token : "",
    workspaceId,
    user,
    onWorkspaceEvent: refreshWorkspaceSlices,
    onNotificationEvent: loadNotifications,
  });

  async function createWorkspace(values) {
    try {
      const workspace = await api("/workspaces", { method: "POST", body: JSON.stringify(values) });
      workspaceForm.reset({ name: "", currencyCode: "GBP" });
      setWorkspaceId(workspace.id);
      setWorkspaces((current) => [workspace, ...current.filter((item) => item.id !== workspace.id)]);
      toast.success("Workspace created");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function updateWorkspace(values) {
    if (!workspaceId) return;
    try {
      const workspace = await api("/workspaces/current", {
        method: "PUT",
        headers: { "X-Workspace-Id": workspaceId },
        body: JSON.stringify(values),
      });
      setWorkspaces((current) => current.map((item) => item.id === workspace.id ? workspace : item));
      await loadWorkspaceData(workspace.id);
      toast.success("Workspace updated");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function createCategory(values) {
    try {
      const category = await api(`/workspaces/${workspaceId}/categories`, { method: "POST", body: JSON.stringify(values) });
      categoryForm.reset({ name: "", categoryType: "EXPENSE", monthlyBudgetAmount: "" });
      await loadWorkspaceData();
      toast.success("Category added");
      return category;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function updateCategory(categoryId, values) {
    try {
      await api(`/workspaces/${workspaceId}/categories/${categoryId}`, { method: "PUT", body: JSON.stringify(values) });
      await loadWorkspaceData();
      toast.success("Category updated");
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function deactivateCategory(categoryId) {
    try {
      await api(`/workspaces/${workspaceId}/categories/${categoryId}/deactivate`, { method: "PATCH" });
      await loadWorkspaceData();
      toast.success("Category deactivated");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function createPaymentSource(values) {
    try {
      const source = await api(`/workspaces/${workspaceId}/payment-sources`, { method: "POST", body: JSON.stringify(values) });
      sourceForm.reset({ name: "", type: "CURRENT_ACCOUNT" });
      await loadWorkspaceData();
      toast.success("Payment source added");
      return source;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function updatePaymentSource(sourceId, values) {
    try {
      await api(`/workspaces/${workspaceId}/payment-sources/${sourceId}`, { method: "PUT", body: JSON.stringify(values) });
      await loadWorkspaceData();
      toast.success("Payment source updated");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function deactivatePaymentSource(sourceId) {
    try {
      await api(`/workspaces/${workspaceId}/payment-sources/${sourceId}/deactivate`, { method: "PATCH" });
      await loadWorkspaceData();
      toast.success("Payment source deactivated");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function inviteMember(values) {
    try {
      await api(`/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      const result = await api(`/workspaces/${workspaceId}/members`);
      setMembers(result.members ?? []);
      setPendingInvitations(result.pendingInvitations ?? []);
      queryClient.setQueryData(queryKeys.members(workspaceId), result);
      toast.success("Invitation created");
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function markNotificationClicked(notification) {
    if (!notification?.id) return;
    try {
      await api(`/notifications/${notification.id}/clicked`, { method: "PATCH" });
      await loadNotifications();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function markAllNotificationsRead() {
    try {
      await api("/notifications/read-all", { method: "PATCH" });
      await loadNotifications();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function deleteNotification(notification) {
    if (!notification?.id) return;
    try {
      await api(`/notifications/${notification.id}`, { method: "DELETE" });
      await loadNotifications();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function acceptInvitationFromNotification(notification) {
    if (!notification?.actionEntityId) return;
    setNotificationActionId(notification.id);
    try {
      const result = await api(`/invitations/${notification.actionEntityId}/accept`, { method: "POST" });
      await loadNotifications();
      await loadWorkspaces();
      setWorkspaceId(result.workspaceId);
      await loadWorkspaceData(result.workspaceId);
      navigate("/dashboard", { replace: true });
      toast.success(`You joined ${result.workspaceName}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setNotificationActionId("");
    }
  }

  async function declineInvitationFromNotification(notification) {
    if (!notification?.actionEntityId) return;
    setNotificationActionId(notification.id);
    try {
      await api(`/invitations/${notification.actionEntityId}/decline`, { method: "POST" });
      await loadNotifications();
      toast.success("Invitation declined");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setNotificationActionId("");
    }
  }

  async function createBudget(values) {
    try {
      await api(`/workspaces/${workspaceId}/budgets`, {
        method: "POST",
        body: JSON.stringify({
          categoryId: values.categoryId,
          budgetYear: budgetPeriod.year,
          budgetMonth: budgetPeriod.month,
          limitAmount: values.limitAmount,
        }),
      });
      budgetForm.reset({ categoryId: "", limitAmount: "" });
      await loadWorkspaceData();
      toast.success("Monthly budget added");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function updateBudget(budgetId, values) {
    try {
      await api(`/workspaces/${workspaceId}/budgets/${budgetId}`, {
        method: "PUT",
        body: JSON.stringify({
          categoryId: values.categoryId,
          budgetYear: budgetPeriod.year,
          budgetMonth: budgetPeriod.month,
          limitAmount: values.limitAmount,
        }),
      });
      await loadWorkspaceData();
      toast.success("Budget updated");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function deactivateBudget(budgetId) {
    try {
      await api(`/workspaces/${workspaceId}/budgets/${budgetId}/deactivate`, { method: "PATCH" });
      await loadWorkspaceData();
      toast.success("Budget deactivated");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function createExpense(values) {
    try {
      await api(`/workspaces/${workspaceId}/expenses`, { method: "POST", body: JSON.stringify(values) });
      expenseForm.reset({
        categoryId: "",
        paymentSourceId: "",
        amount: "",
        expenseDate: new Date().toISOString().slice(0, 10),
        description: "",
      });
      setExpenseDialogOpen(false);
      await loadWorkspaceData();
      toast.success("Expense added");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openCategorySetupFromExpense() {
    setExpenseDialogOpen(false);
    setReturnToExpenseAfterSetup(true);
    setAddCategoryDialogOpen(true);
  }

  function openPaymentSourceSetupFromExpense() {
    setExpenseDialogOpen(false);
    setReturnToExpenseAfterSetup(true);
    setAddSourceDialogOpen(true);
  }

  async function createCategoryFromExpense(values) {
    const category = await createCategory(values);
    if (category?.id) {
      expenseForm.setValue("categoryId", category.id, { shouldDirty: true, shouldValidate: true });
    }
    setReturnToExpenseAfterSetup(false);
    setExpenseDialogOpen(true);
    return category;
  }

  async function createPaymentSourceFromExpense(values) {
    const source = await createPaymentSource(values);
    if (source?.id) {
      expenseForm.setValue("paymentSourceId", source.id, { shouldDirty: true, shouldValidate: true });
    }
    setReturnToExpenseAfterSetup(false);
    setExpenseDialogOpen(true);
    return source;
  }

  function openEditExpense(expense) {
    const matchedCategory = categories.find((category) => category.name === expense.categoryName);
    const matchedPaymentSource = paymentSources.find((source) => source.name === expense.paymentSourceName);
    setEditingExpense(expense);
    editExpenseForm.reset({
      categoryId: expense.categoryId ?? matchedCategory?.id ?? "",
      paymentSourceId: expense.paymentSourceId ?? matchedPaymentSource?.id ?? "",
      amount: expense.amount ?? "",
      expenseDate: expense.expenseDate ?? new Date().toISOString().slice(0, 10),
      description: expense.description ?? "",
    });
    setEditExpenseDialogOpen(true);
  }

  async function updateExpense(values) {
    if (!workspaceId || !editingExpense?.id) return;
    try {
      await api(`/workspaces/${workspaceId}/expenses/${editingExpense.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      setEditExpenseDialogOpen(false);
      setEditingExpense(null);
      await loadWorkspaceData();
      toast.success("Expense updated");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function updateTotalBudget(values) {
    if (!workspaceId) return;
    setTotalBudgetSaving(true);
    try {
      await api(`/budgets/current-month/total?year=${budgetPeriod.year}&month=${budgetPeriod.month}`, {
        method: "PUT",
        headers: { "X-Workspace-Id": workspaceId },
        body: JSON.stringify({ amount: values.amount }),
      });
      setTotalBudgetDialogOpen(false);
      await loadWorkspaceData();
      toast.success("Total budget updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTotalBudgetSaving(false);
    }
  }

  function clearSession() {
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(refreshTokenStorageKey);
    localStorage.removeItem(userStorageKey);
    setToken("");
    setUser(null);
    setWorkspaceId("");
    setWorkspaces([]);
    setWorkspacesLoaded(false);
    setDashboard(null);
    setBudgets([]);
    setMembers([]);
    setPendingInvitations([]);
    setNotifications([]);
    setNotificationUnreadCount(0);
    setNotificationActionId("");
    setCategories([]);
    setPaymentSources([]);
    setExpenses([]);
    setSummaryPeriod(defaultPresetPeriod);
    setRemainingPeriod(defaultPresetPeriod);
    setSpendingPeriod(defaultPresetPeriod);
    setTrendPeriod(defaultPresetPeriod);
    setAccountPeriod(defaultPresetPeriod);
    setTransactionFilters({ ...defaultPresetPeriod, categoryId: "", paymentSourceId: "", memberId: "" });
  }

  function signOut() {
    clearSession();
    toast("Signed out");
    navigate("/login", { replace: true });
  }

  function renderSetupPage(initialTab = "details", options = {}) {
    return (
      <SetupPage
        activeWorkspace={activeWorkspace}
        workspaceForm={workspaceForm}
        editWorkspaceForm={editWorkspaceForm}
        categoryForm={categoryForm}
        sourceForm={sourceForm}
        categories={categories}
        paymentSources={paymentSources}
        budgets={budgets}
        members={members}
        pendingInvitations={pendingInvitations}
        dashboard={dashboard}
        currencyCode={currencyCode}
        initialTab={initialTab}
        settingsOnly={Boolean(options.settingsOnly)}
        categoryBudgetStatus={dashboardCards.remaining?.categories ?? []}
        onCreateWorkspace={createWorkspace}
        onUpdateWorkspace={updateWorkspace}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
        onDeactivateCategory={deactivateCategory}
        onCreatePaymentSource={createPaymentSource}
        onUpdatePaymentSource={updatePaymentSource}
        onDeactivatePaymentSource={deactivatePaymentSource}
        onInviteMember={inviteMember}
      />
    );
  }

  if (!token) {
    return (
      <>
        <Toaster richColors closeButton position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthScreen mode={mode} setMode={setMode} authForm={authForm} loading={loading} onSubmit={submitAuth} />} />
          <Route path="/register" element={<AuthScreen mode={mode} setMode={setMode} authForm={authForm} loading={loading} onSubmit={submitAuth} />} />
          <Route path="/invitations/accept" element={<InvitationAcceptScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  if (!workspacesLoaded) {
    return (
      <>
        <Toaster richColors closeButton position="top-right" />
        <div className="grid min-h-screen place-items-center bg-background px-4 text-center text-foreground">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
            <p className="font-display text-xl font-bold tracking-tight">Loading SpendTogether</p>
            <p className="mt-2 text-sm font-semibold text-muted">Preparing your workspace...</p>
          </div>
        </div>
      </>
    );
  }

  if (workspaces.length === 0) {
    return (
      <>
        <Toaster richColors closeButton position="top-right" />
        <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 md:px-8">
          <div className="mx-auto grid w-full max-w-[980px] gap-6">
            <header className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-white px-4 py-3 shadow-card">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                  <Landmark className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">SpendTogether</p>
                  <p className="truncate text-xs font-semibold text-muted">Create your first workspace</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="secondary" className="shrink-0 rounded-full pl-2.5 pr-3">
                    <UserCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.fullName ?? "User"}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={signOut}>
                    <LogOut className="mr-2 inline h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            {renderSetupPage("details")}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Toaster richColors closeButton position="top-right" />
      <AppLayout
        user={user}
        workspaces={workspaces}
        workspaceId={workspaceId}
        notifications={notifications}
        unreadCount={notificationUnreadCount}
        notificationActionId={notificationActionId}
        onWorkspaceChange={setWorkspaceId}
        onSignOut={signOut}
        onLoadNotifications={loadNotifications}
        onMarkAllNotificationsRead={markAllNotificationsRead}
        onNotificationClick={markNotificationClicked}
        onAcceptInvitation={acceptInvitationFromNotification}
        onDeclineInvitation={declineInvitationFromNotification}
        onDeleteNotification={deleteNotification}
        onAddExpense={() => setExpenseDialogOpen(true)}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                summary={dashboard}
                cards={dashboardCards}
                periods={{ summaryPeriod, remainingPeriod, spendingPeriod, trendPeriod, accountPeriod }}
                onPeriodChange={{
                  summary: setSummaryPeriod,
                  remaining: setRemainingPeriod,
                  spending: setSpendingPeriod,
                  trend: setTrendPeriod,
                  account: setAccountPeriod,
                }}
                currencyCode={currencyCode}
                loading={loading}
                recentExpenses={expenses}
                onRefresh={() => loadWorkspaceData()}
                onAddExpense={() => setExpenseDialogOpen(true)}
                onEditTotalBudget={() => {
                  totalBudgetForm.reset({ amount: dashboard?.totalBudget ?? "" });
                  setTotalBudgetDialogOpen(true);
                }}
              />
            }
          />
          <Route
            path="/manage-workspace"
            element={renderSetupPage("details")}
          />
          <Route path="/setup" element={<Navigate to="/manage-workspace" replace />} />
          <Route path="/categories" element={renderSetupPage("categories")} />
          <Route path="/payment-sources" element={renderSetupPage("sources")} />
          <Route path="/members" element={renderSetupPage("members")} />
          <Route path="/settings" element={renderSetupPage("details", { settingsOnly: true })} />
          <Route
            path="/notifications"
            element={
              <NotificationsScreen
                notifications={notifications}
                unreadCount={notificationUnreadCount}
                onRefresh={loadNotifications}
                onMarkAllRead={markAllNotificationsRead}
                onNotificationClick={markNotificationClicked}
              />
            }
          />
          <Route path="/invitations/accept" element={<InvitationAcceptScreen />} />
          <Route
            path="/expenses"
            element={
              <ExpensesPage
                expenses={expenses}
                currencyCode={currencyCode}
                filters={transactionFilters}
                onFiltersChange={setTransactionFilters}
                categories={categories}
                paymentSources={paymentSources}
                members={members}
                onAddExpense={() => setExpenseDialogOpen(true)}
                onEditExpense={openEditExpense}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Dialog
          title="Add Expense"
          description="Record a workspace expense in the selected base currency."
          open={expenseDialogOpen}
          onOpenChange={setExpenseDialogOpen}
          contentClassName="max-sm:left-0 max-sm:top-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0 max-sm:p-4"
        >
          <Form onSubmit={expenseForm.handleSubmit(createExpense)} className="gap-5 max-sm:min-h-[calc(100dvh-7.5rem)] max-sm:pb-2">
            <div className="rounded-3xl border border-border bg-slate-50 p-4 text-center sm:p-5">
              <label className="mx-auto flex max-w-xs items-center justify-center gap-2">
                <span className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{currencySymbol}</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-center font-display text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-slate-300 sm:text-5xl"
                  placeholder="0.00"
                  type="number"
                  min="0.01"
                  step="0.01"
                  aria-label={`Amount in ${currencyCode}`}
                  {...expenseForm.register("amount")}
                />
              </label>
              {expenseForm.formState.errors.amount?.message && (
                <p className="mt-2 text-xs font-semibold text-danger">{expenseForm.formState.errors.amount.message}</p>
              )}
              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-bold text-muted shadow-sm">
                <Landmark className="h-3.5 w-3.5" />
                {activeWorkspace?.name ?? "Workspace"} • {currencyCode}
              </div>
            </div>

            <div className="grid gap-4">
              <Input label="Description" placeholder="What was this for?" {...expenseForm.register("description")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Select
                  label="Category"
                  error={expenseForm.formState.errors.categoryId?.message}
                  {...expenseForm.register("categoryId", {
                    onChange: (event) => {
                      if (event.target.value === "__add_category__") {
                        event.target.value = "";
                        expenseForm.setValue("categoryId", "", { shouldDirty: true, shouldValidate: true });
                        openCategorySetupFromExpense();
                      }
                    },
                  })}
                >
                  <option value="">Choose category</option>
                  <option value="__add_category__">+ Add new category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
                {categories.length === 0 && (
                  <p className="text-xs font-semibold text-muted">Add a category before saving expenses.</p>
                )}
              </div>
              <Input label="Date" type="date" error={expenseForm.formState.errors.expenseDate?.message} {...expenseForm.register("expenseDate")} />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <WalletCards className="h-4 w-4 text-muted" />
                Payment source
              </div>
              {expenseForm.formState.errors.paymentSourceId?.message && (
                <p className="mb-2 text-xs font-semibold text-danger">{expenseForm.formState.errors.paymentSourceId.message}</p>
              )}
              {paymentSources.length > 6 && (
                <p className="mb-2 text-xs font-semibold text-muted">
                  Showing {paymentSources.length} sources. Scroll inside this list to choose one.
                </p>
              )}
              <div className={`grid gap-2 sm:grid-cols-2 lg:grid-cols-3 ${paymentSources.length > 6 ? "max-h-64 overflow-y-auto rounded-2xl border border-border bg-slate-50 p-2" : ""}`}>
                {paymentSources.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4 text-sm font-semibold text-muted sm:col-span-2">
                    Add a payment source before saving expenses.
                  </div>
                ) : paymentSources.map((source) => {
                  const selected = selectedPaymentSourceId === source.id;
                  return (
                    <button
                      key={source.id}
                      type="button"
                      className={`flex min-h-14 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${selected ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-border bg-white text-foreground hover:bg-slate-50"}`}
                      onClick={() => expenseForm.setValue("paymentSourceId", source.id, { shouldDirty: true, shouldValidate: true })}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-950"}`}>
                          {source.type?.includes("CARD") ? <CreditCard className="h-3.5 w-3.5" /> : <WalletCards className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{source.name}</span>
                          <span className={`block truncate text-[11px] font-semibold ${selected ? "text-slate-300" : "text-muted"}`}>{source.type ?? "Payment source"}</span>
                        </span>
                      </span>
                      {selected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-slate-50 px-3 py-2 text-sm font-bold text-foreground transition hover:border-slate-300 hover:bg-white sm:col-span-2 lg:col-span-3"
                  onClick={openPaymentSourceSetupFromExpense}
                >
                  <Plus className="h-4 w-4" />
                  Add new payment source
                </button>
              </div>
            </div>

            <div className="max-sm:sticky max-sm:bottom-0 max-sm:-mx-4 max-sm:mt-auto max-sm:border-t max-sm:border-border max-sm:bg-white max-sm:px-4 max-sm:py-3">
              <Button type="submit" className="h-12 w-full rounded-2xl bg-emerald-700 hover:bg-emerald-800">
                <ReceiptText className="h-4 w-4" />
                Save Expense
              </Button>
            </div>
          </Form>
          </Dialog>

        <AddCategoryDialog
          open={addCategoryDialogOpen}
          onOpenChange={(open) => {
            setAddCategoryDialogOpen(open);
            if (!open && returnToExpenseAfterSetup) {
              setReturnToExpenseAfterSetup(false);
              setExpenseDialogOpen(true);
            }
          }}
          categoryForm={categoryForm}
          monthlyBudgetLabel={`Monthly Budget (${currencySymbol})`}
          activeWorkspace={activeWorkspace}
          onCreateCategory={createCategoryFromExpense}
        />

        <AddSourceDialog
          open={addSourceDialogOpen}
          onOpenChange={(open) => {
            setAddSourceDialogOpen(open);
            if (!open && returnToExpenseAfterSetup) {
              setReturnToExpenseAfterSetup(false);
              setExpenseDialogOpen(true);
            }
          }}
          sourceForm={sourceForm}
          activeWorkspace={activeWorkspace}
          onCreatePaymentSource={createPaymentSourceFromExpense}
        />

        <Dialog
          title="Edit Expense"
          description="Update the amount, description, category, date, or payment source."
          open={editExpenseDialogOpen}
          onOpenChange={(open) => {
            setEditExpenseDialogOpen(open);
            if (!open) setEditingExpense(null);
          }}
          contentClassName="max-sm:left-0 max-sm:top-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0 max-sm:p-4"
        >
          <Form onSubmit={editExpenseForm.handleSubmit(updateExpense)} className="gap-5 max-sm:min-h-[calc(100dvh-7.5rem)] max-sm:pb-2">
            <div className="rounded-3xl border border-border bg-slate-50 p-4 text-center sm:p-5">
              <label className="mx-auto flex max-w-xs items-center justify-center gap-2">
                <span className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{currencySymbol}</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-center font-display text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-slate-300 sm:text-5xl"
                  placeholder="0.00"
                  type="number"
                  min="0.01"
                  step="0.01"
                  aria-label={`Amount in ${currencyCode}`}
                  {...editExpenseForm.register("amount")}
                />
              </label>
              {editExpenseForm.formState.errors.amount?.message && (
                <p className="mt-2 text-xs font-semibold text-danger">{editExpenseForm.formState.errors.amount.message}</p>
              )}
              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-bold text-muted shadow-sm">
                <Landmark className="h-3.5 w-3.5" />
                {activeWorkspace?.name ?? "Workspace"} • {currencyCode}
              </div>
            </div>

            <div className="grid gap-4">
              <Input label="Description" placeholder="What was this for?" {...editExpenseForm.register("description")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Category" error={editExpenseForm.formState.errors.categoryId?.message} {...editExpenseForm.register("categoryId")}>
                <option value="">Choose category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </Select>
              <Input label="Date" type="date" error={editExpenseForm.formState.errors.expenseDate?.message} {...editExpenseForm.register("expenseDate")} />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <WalletCards className="h-4 w-4 text-muted" />
                Payment source
              </div>
              {editExpenseForm.formState.errors.paymentSourceId?.message && (
                <p className="mb-2 text-xs font-semibold text-danger">{editExpenseForm.formState.errors.paymentSourceId.message}</p>
              )}
              {paymentSources.length > 6 && (
                <p className="mb-2 text-xs font-semibold text-muted">
                  Showing {paymentSources.length} sources. Scroll inside this list to choose one.
                </p>
              )}
              <div className={`grid gap-3 sm:grid-cols-2 ${paymentSources.length > 6 ? "max-h-72 overflow-y-auto rounded-2xl border border-border bg-slate-50 p-2" : ""}`}>
                {paymentSources.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4 text-sm font-semibold text-muted sm:col-span-2">
                    Add a payment source before saving expenses.
                  </div>
                ) : paymentSources.map((source) => {
                  const selected = selectedEditPaymentSourceId === source.id;
                  return (
                    <button
                      key={source.id}
                      type="button"
                      className={`flex min-h-20 items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${selected ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-border bg-white text-foreground hover:bg-slate-50"}`}
                      onClick={() => editExpenseForm.setValue("paymentSourceId", source.id, { shouldDirty: true, shouldValidate: true })}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${selected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-950"}`}>
                          {source.type?.includes("CARD") ? <CreditCard className="h-4 w-4" /> : <WalletCards className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{source.name}</span>
                          <span className={`mt-0.5 block truncate text-xs font-semibold ${selected ? "text-slate-300" : "text-muted"}`}>{source.type ?? "Payment source"}</span>
                        </span>
                      </span>
                      {selected && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 max-sm:sticky max-sm:bottom-0 max-sm:-mx-4 max-sm:mt-auto max-sm:border-t max-sm:border-border max-sm:bg-white max-sm:px-4 max-sm:py-3">
              <Button type="button" variant="secondary" className="h-12 flex-1 rounded-2xl" onClick={() => setEditExpenseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-12 flex-1 rounded-2xl bg-emerald-700 hover:bg-emerald-800">
                <ReceiptText className="h-4 w-4" />
                Save
              </Button>
            </div>
          </Form>
        </Dialog>

        <Dialog title="Edit Total Budget" description="Set the total monthly budget for the selected workspace." open={totalBudgetDialogOpen} onOpenChange={setTotalBudgetDialogOpen}>
          <Form onSubmit={totalBudgetForm.handleSubmit(updateTotalBudget)}>
            <Input
              label="New total budget amount"
              type="number"
              min="0.01"
              step="0.01"
              error={totalBudgetForm.formState.errors.amount?.message}
              {...totalBudgetForm.register("amount")}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setTotalBudgetDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={totalBudgetSaving}>{totalBudgetSaving ? "Updating" : "Update"}</Button>
            </div>
          </Form>
        </Dialog>
      </AppLayout>
    </>
  );
}

function AuthScreen({ mode, setMode, authForm, loading, onSubmit }) {
  const navigate = useNavigate();
  const location = useLocation();
  const targetMode = location.pathname === "/register" ? "register" : "login";
  const isLogin = mode === "login";

  useEffect(() => {
    if (mode !== targetMode) {
      setMode(targetMode);
      authForm.clearErrors();
    }
  }, [authForm, mode, setMode, targetMode]);

  return (
    <AuthLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Badge tone="primary">SpendTogether</Badge>
        <Link to="/" className="text-sm font-semibold text-muted transition hover:text-foreground">
          Home
        </Link>
      </div>
      <PageHeader
        title={isLogin ? "Welcome back" : "Create your account"}
        description={isLogin ? "Sign in to continue to your shared budget workspace." : "Start a workspace for shared budgeting, expenses, members, and categories."}
      />
      <Form onSubmit={authForm.handleSubmit(onSubmit)} className="mt-6">
        {mode === "register" && (
          <Input label="Full name" error={authForm.formState.errors.fullName?.message} {...authForm.register("fullName")} />
        )}
        <Input label="Email" type="email" error={authForm.formState.errors.email?.message} {...authForm.register("email")} />
        <Input label="Password" type="password" error={authForm.formState.errors.password?.message} {...authForm.register("password")} />
        <Button type="submit" disabled={loading} className="mt-1 w-full">{loading ? "Please wait" : isLogin ? "Sign in" : "Create account"}</Button>
      </Form>
      <div className="mt-5 rounded-2xl border border-border bg-slate-50 p-4 text-center">
        <p className="text-sm font-medium text-muted">
          {isLogin ? "New to SpendTogether?" : "Already have an account?"}
        </p>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full"
          onClick={() => {
            const nextMode = isLogin ? "register" : "login";
            setMode(nextMode);
            navigate(nextMode === "login" ? "/login" : "/register");
          }}
        >
          {isLogin ? "Create an account" : "Sign in instead"}
        </Button>
      </div>
    </AuthLayout>
  );
}

function InvitationAcceptScreen() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Badge tone="primary">SpendTogether</Badge>
        <Link to="/" className="text-sm font-semibold text-muted transition hover:text-foreground">
          Home
        </Link>
      </div>
      <PageHeader
        eyebrow="Workspace invitation"
        title="You have been invited to join this workspace"
        description="Sign in or create an account first. After that, open your notifications and accept the invitation from SpendTogether."
      />
      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-slate-50 p-4">
        <p className="text-sm font-bold text-foreground">How to accept</p>
        <ol className="grid gap-2 text-sm font-medium leading-6 text-muted">
          <li>1. Sign in with the invited email address.</li>
          <li>2. Open the notification bell in the top bar.</li>
          <li>3. Choose Accept on the workspace invitation.</li>
        </ol>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={() => navigate("/login")}>Sign in</Button>
        <Button type="button" variant="secondary" onClick={() => navigate("/register")}>Create account</Button>
      </div>
    </AuthLayout>
  );
}

function NotificationsScreen({ notifications = [], unreadCount = 0, onRefresh, onMarkAllRead, onNotificationClick }) {
  const invitations = notifications.filter((notification) => notification.actionType === "ACCEPT_DECLINE_INVITATION" || notification.actionEntityType === "INVITATION");
  const readCount = Math.max(notifications.length - unreadCount, 0);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Review workspace invitations and SpendTogether updates."
        actions={
          <div className="flex flex-wrap gap-3">
            {unreadCount > 0 && (
              <Button type="button" variant="secondary" onClick={onMarkAllRead}>
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onRefresh}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <NotificationStat className="col-span-2 md:col-span-1" title="Unread" value={unreadCount} description="Need attention" icon={Bell} tone="primary" />
        <NotificationStat title="Invitations" value={invitations.length} description="Workspace invites" icon={MailPlus} tone="success" />
        <NotificationStat title="Read" value={readCount} description="Already reviewed" icon={CheckCircle2} tone="neutral" />
      </section>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-slate-950 p-5 text-white sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-300">Workspace updates</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Notifications inbox</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">Invitations, member activity, and workspace changes appear here.</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
        </div>
        {notifications.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState title="No notifications yet" description="Workspace invitations and updates will appear here." />
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:p-5">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onClick={onNotificationClick} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function NotificationStat({ title, value, description, icon: Icon, tone, className = "" }) {
  const toneClass = {
    primary: "bg-slate-950 text-white",
    success: "bg-green-50 text-success",
    neutral: "bg-slate-100 text-slate-950",
  }[tone] ?? "bg-slate-100 text-slate-950";

  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-xs font-semibold text-muted sm:text-sm">{title}</p>
          <p className="mt-2 font-display text-lg font-bold tracking-tight text-foreground sm:text-2xl">{value}</p>
          <p className="mt-1 text-xs font-semibold text-muted">{description}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11 ${toneClass}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}

function NotificationRow({ notification, onClick }) {
  const unread = !notification.readAt;
  const invitation = notification.actionType === "ACCEPT_DECLINE_INVITATION" || notification.actionEntityType === "INVITATION";
  const Icon = invitation ? MailPlus : Bell;

  return (
    <button
      type="button"
      className={`flex min-w-0 items-start gap-3 rounded-2xl border p-4 text-left transition hover:bg-white hover:shadow-sm ${unread ? "border-slate-300 bg-slate-50" : "border-border bg-white"}`}
      onClick={() => onClick?.(notification)}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${invitation ? "bg-green-50 text-success" : "bg-slate-100 text-slate-950"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="min-w-0 truncate text-sm font-bold text-foreground">{notification.title}</p>
          {unread && <Badge tone="primary">New</Badge>}
          {invitation && <Badge tone="success">Invitation</Badge>}
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-muted">{notification.message}</p>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted">
          <Clock3 className="h-3.5 w-3.5" />
          {formatNotificationAge(notification.createdAt)}
        </div>
      </div>
    </button>
  );
}

function formatNotificationAge(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

function getCurrencySymbol(currencyCode) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode || "GBP",
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value || currencyCode || "GBP";
}

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-background px-4 text-center text-foreground">
          <div className="max-w-md rounded-3xl border border-border bg-white p-6 shadow-card">
            <p className="font-display text-xl font-bold tracking-tight">SpendTogether could not load</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              Something went wrong while opening this page. Please refresh and try again.
            </p>
            <Button type="button" className="mt-5" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(<Root />);
