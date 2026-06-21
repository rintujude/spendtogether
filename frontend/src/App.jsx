import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { z } from "zod";
import { AppLayout, AuthLayout } from "./components/layout";
import { defaultPresetPeriod, periodQuery } from "./components/filters";
import { Badge, Button, Dialog, Form, Input, PageHeader, Select } from "./components/ui";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { LandingPage } from "./pages/LandingPage";
import { SetupPage } from "./pages/SetupPage";
import { useWorkspaceEvents } from "./hooks/useWorkspaceEvents";
import { queryKeys } from "./lib/queryKeys";
import "./styles.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
const queryClient = new QueryClient();
const tokenStorageKey = "sharedBudgetToken";
const userStorageKey = "sharedBudgetUser";

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

  async function api(path, options = {}) {
    let response;
    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

      if (path === "/auth/login" && response.status === 401) {
        message = "Incorrect email or password.";
      }

      if (!path.startsWith("/auth/") && response.status === 401) {
        message = message || "We could not verify this request. Please try again.";
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
      localStorage.setItem(tokenStorageKey, result.token);
      localStorage.setItem(userStorageKey, JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
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
    try {
      const result = await api("/workspaces");
      setWorkspaces(result);
      queryClient.setQueryData(queryKeys.workspaces, result);
      if (!workspaceId && result.length > 0) setWorkspaceId(result[0].id);
    } catch (err) {
      toast.error(err.message);
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
    token,
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
      await api(`/workspaces/${workspaceId}/categories`, { method: "POST", body: JSON.stringify(values) });
      categoryForm.reset({ name: "", categoryType: "EXPENSE", monthlyBudgetAmount: "" });
      await loadWorkspaceData();
      toast.success("Category added");
    } catch (err) {
      toast.error(err.message);
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
      await api(`/workspaces/${workspaceId}/payment-sources`, { method: "POST", body: JSON.stringify(values) });
      sourceForm.reset({ name: "", type: "CURRENT_ACCOUNT" });
      await loadWorkspaceData();
      toast.success("Payment source added");
    } catch (err) {
      toast.error(err.message);
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
    localStorage.removeItem(userStorageKey);
    setToken("");
    setUser(null);
    setWorkspaceId("");
    setWorkspaces([]);
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
    setSummaryPeriod(defaultPresetPeriod());
    setRemainingPeriod(defaultPresetPeriod());
    setSpendingPeriod(defaultPresetPeriod());
    setTrendPeriod(defaultPresetPeriod());
    setAccountPeriod(defaultPresetPeriod());
    setTransactionFilters({ ...defaultPresetPeriod, categoryId: "", paymentSourceId: "", memberId: "" });
  }

  function signOut() {
    clearSession();
    toast("Signed out");
    navigate("/login", { replace: true });
  }

  if (!token) {
    return (
      <>
        <Toaster richColors position="top-right" />
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

  return (
    <>
      <Toaster richColors position="top-right" />
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
            element={
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
            }
          />
          <Route path="/setup" element={<Navigate to="/manage-workspace" replace />} />
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
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Dialog title="Add expense" description="Record a manual expense in the workspace base currency." open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
          <Form onSubmit={expenseForm.handleSubmit(createExpense)}>
            <Select label="Category" error={expenseForm.formState.errors.categoryId?.message} {...expenseForm.register("categoryId")}>
              <option value="">Choose category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
            <Select label="Payment source" error={expenseForm.formState.errors.paymentSourceId?.message} {...expenseForm.register("paymentSourceId")}>
              <option value="">Choose payment source</option>
              {paymentSources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
            </Select>
            <Input label={`Amount (${currencyCode})`} type="number" min="0.01" step="0.01" error={expenseForm.formState.errors.amount?.message} {...expenseForm.register("amount")} />
            <Input label="Date" type="date" error={expenseForm.formState.errors.expenseDate?.message} {...expenseForm.register("expenseDate")} />
            <Input label="Description" {...expenseForm.register("description")} />
            <Button type="submit">Save expense</Button>
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
  return (
    <AuthLayout>
      <PageHeader
        eyebrow="Workspace invitation"
        title="You have been invited to join this workspace"
        description="Sign in or create an account to continue with the invitation."
      />
    </AuthLayout>
  );
}

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
