import React, { useEffect, useState } from "react";
import { AlertTriangle, Banknote, Building2, Clock3, CreditCard, Crown, Eye, FolderKanban, Home, Landmark, Mail, Pencil, Plane, Plus, ReceiptText, Settings, ShieldCheck, ShoppingBag, ShoppingCart, Smartphone, Tag, Trash2, UserPlus, UsersRound, WalletCards } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  EmptyState,
  Form,
  Input,
  PageHeader,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui";
import { currencies, formatMoney } from "../lib/currencies";

const paymentSourceTypes = [
  ["CASH", "Cash"],
  ["BANK_ACCOUNT", "Bank account"],
  ["CURRENT_ACCOUNT", "Current account"],
  ["CREDIT_CARD", "Credit card"],
  ["DEBIT_CARD", "Debit card"],
  ["UPI_WALLET", "UPI / Online wallet"],
  ["SAVINGS", "Savings"],
  ["OTHER", "Other"],
];

export function SetupPage({
  activeWorkspace,
  workspaceForm,
  editWorkspaceForm,
  categoryForm,
  sourceForm,
  categories,
  paymentSources,
  members,
  pendingInvitations,
  dashboard,
  currencyCode,
  initialTab = "details",
  settingsOnly = false,
  categoryBudgetStatus = [],
  onCreateWorkspace,
  onUpdateWorkspace,
  onCreateCategory,
  onUpdateCategory,
  onDeactivateCategory,
  onCreatePaymentSource,
  onUpdatePaymentSource,
  onDeactivatePaymentSource,
  onInviteMember,
}) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSource, setEditingSource] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const currencySymbol = getCurrencySymbol(currencyCode);
  const monthlyBudgetLabel = `Monthly Budget (${currencySymbol})`;
  const dedicatedPage = initialTab !== "details" || settingsOnly;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeWorkspace) {
      editWorkspaceForm.reset({
        name: activeWorkspace.name,
        currencyCode: activeWorkspace.currencyCode || "GBP",
      });
    }
  }, [activeWorkspace?.id, activeWorkspace?.name, activeWorkspace?.currencyCode]);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title={settingsOnly ? "Workspace Settings" : sectionTitle(initialTab)}
        description={settingsOnly ? "Update the selected workspace name and base currency." : sectionDescription(initialTab)}
        actions={initialTab === "categories" ? (
          <Button type="button" onClick={() => setAddCategoryOpen(true)} disabled={!activeWorkspace}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        ) : initialTab === "sources" ? (
          <Button type="button" onClick={() => setAddSourceOpen(true)} disabled={!activeWorkspace}>
            <Plus className="h-4 w-4" />
            Add Source
          </Button>
        ) : null}
      />

      {!dedicatedPage && (
        <section className="grid gap-4 md:grid-cols-4">
          <WorkspaceStat title="Workspace" value={activeWorkspace?.name ?? "Not created"} description={activeWorkspace ? `${activeWorkspace.currencyCode || "GBP"} base currency` : "Create one to begin"} icon={Settings} />
          <WorkspaceStat title="Categories" value={categories.length.toString()} description="Income and expense groups" icon={FolderKanban} />
          <WorkspaceStat title="Sources" value={paymentSources.length.toString()} description="Cash, bank, cards, wallets" icon={WalletCards} />
          <WorkspaceStat title="Members" value={members.length.toString()} description="Owners, contributors, viewers" icon={UsersRound} />
        </section>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="grid gap-5">
        {!dedicatedPage && (
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="details">Workspace</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="sources">Payment Sources</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="details" className="grid gap-5">
          {(!settingsOnly || !activeWorkspace) && (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border bg-slate-950 p-5 text-white sm:p-6">
                <p className="text-sm font-semibold text-slate-300">Workspace details</p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">{activeWorkspace?.name ?? "Create your first workspace"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">Choose a workspace name and base currency for shared budget tracking.</p>
              </div>
              <div className="grid gap-5 p-5 sm:p-6">
                {activeWorkspace && (
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="success">{activeWorkspace.currencyCode || "GBP"} selected</Badge>
                    <Badge>Shared budget workspace</Badge>
                  </div>
                )}
                <Form onSubmit={workspaceForm.handleSubmit(onCreateWorkspace)} className="grid gap-4 md:grid-cols-[1fr_260px_auto] md:items-end">
                  <Input label="Workspace name" placeholder="Trip budget" error={workspaceForm.formState.errors.name?.message} {...workspaceForm.register("name")} />
                  <Select label="Currency" {...workspaceForm.register("currencyCode")}>
                    {currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} - {currency.label}</option>)}
                  </Select>
                  <Button type="submit"><Plus className="h-4 w-4" />Create workspace</Button>
                </Form>
              </div>
            </Card>
          )}

          {activeWorkspace ? (
            <Card>
            <CardHeader>
              <div>
                  <CardTitle>Edit workspace</CardTitle>
                  <CardDescription>Update the workspace name and selected base currency.</CardDescription>
              </div>
                <Badge tone="warning">Use caution changing currency after transactions exist</Badge>
            </CardHeader>
              <Form onSubmit={editWorkspaceForm.handleSubmit(onUpdateWorkspace)} className="grid gap-4 md:grid-cols-[1fr_260px_auto] md:items-end">
                <Input label="Workspace name" error={editWorkspaceForm.formState.errors.name?.message} {...editWorkspaceForm.register("name")} />
                <Select label="Currency" error={editWorkspaceForm.formState.errors.currencyCode?.message} {...editWorkspaceForm.register("currencyCode")}>
                {currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} - {currency.label}</option>)}
              </Select>
                <Button type="submit"><Pencil className="h-4 w-4" />Save changes</Button>
            </Form>
          </Card>
          ) : (
            <EmptyState title="Create a workspace in SpendTogether" description="Workspace setup unlocks categories, payment sources, budgets, members, and expenses." />
          )}
        </TabsContent>

        <TabsContent value="categories" className="grid gap-5">
          <CategoryOverview categories={categories} budgetStatus={categoryBudgetStatus} currencyCode={currencyCode} />
          <Card className={initialTab === "categories" ? "hidden" : ""}>
            <CardHeader>
              <div>
                <CardTitle>Add category</CardTitle>
                <CardDescription>Create a category and monthly budget together.</CardDescription>
              </div>
              <Badge>{categories.length} active</Badge>
            </CardHeader>
            <Form onSubmit={categoryForm.handleSubmit(onCreateCategory)} className="grid gap-4 md:grid-cols-[1fr_160px_180px_auto] md:items-end">
              <Input label="Category name" placeholder="Groceries" error={categoryForm.formState.errors.name?.message} {...categoryForm.register("name")} />
              <Select label="Type" error={categoryForm.formState.errors.categoryType?.message} {...categoryForm.register("categoryType")}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </Select>
              <Input
                label={monthlyBudgetLabel}
                type="number"
                min="0"
                step="0.01"
                error={categoryForm.formState.errors.monthlyBudgetAmount?.message}
                {...categoryForm.register("monthlyBudgetAmount")}
              />
              <Button type="submit" disabled={!activeWorkspace}><Plus className="h-4 w-4" />Add category</Button>
            </Form>
          </Card>
          {categories.length === 0 ? (
            <EmptyState title="No categories yet in SpendTogether" description="Add income or expense categories for this workspace." />
          ) : (
            <ResponsiveCategoryList categories={categories} budgetStatus={categoryBudgetStatus} currencyCode={currencyCode} onEdit={setEditingCategory} onDeactivate={onDeactivateCategory} />
          )}
        </TabsContent>

        <TabsContent value="sources" className="grid gap-5">
          <PaymentSourceOverview sources={paymentSources} />
          <Card className={initialTab === "sources" ? "hidden" : ""}>
            <CardHeader>
              <div>
                <CardTitle>Add payment source</CardTitle>
                <CardDescription>Add the accounts and wallets used for workspace spending.</CardDescription>
              </div>
              <Badge>{paymentSources.length} active</Badge>
            </CardHeader>
            <Form onSubmit={sourceForm.handleSubmit(onCreatePaymentSource)} className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <Input label="Source name" placeholder="Cash" error={sourceForm.formState.errors.name?.message} {...sourceForm.register("name")} />
              <Select label="Type" {...sourceForm.register("type")}>
                {paymentSourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Button type="submit" disabled={!activeWorkspace}><Plus className="h-4 w-4" />Add source</Button>
            </Form>
          </Card>
          {paymentSources.length === 0 ? (
            <EmptyState title="No payment sources yet in SpendTogether" description="Add cash, bank, cards, or online wallets." />
          ) : (
            <ResponsiveSourceList sources={paymentSources} onEdit={setEditingSource} onDeactivate={onDeactivatePaymentSource} />
          )}
        </TabsContent>

        <TabsContent value="members" className="grid gap-5">
          <MemberOverview members={members} pendingInvitations={pendingInvitations} />
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Active members</CardTitle>
                <CardDescription>Manage active members and pending invitations for this workspace.</CardDescription>
              </div>
              <Button type="button" onClick={() => setInviteOpen(true)} disabled={!activeWorkspace}><UserPlus className="h-4 w-4" />Invite member</Button>
            </CardHeader>
            {members.length === 0 ? (
              <EmptyState title="No members yet in SpendTogether" description="Invite contributors or viewers to collaborate in this workspace." />
            ) : (
              <MemberList members={members} />
            )}
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Pending invitations</CardTitle>
                <CardDescription>Invitations waiting for a response.</CardDescription>
              </div>
              <Badge tone={pendingInvitations.length > 0 ? "warning" : "neutral"}>{pendingInvitations.length} pending</Badge>
            </CardHeader>
            {pendingInvitations.length === 0 ? (
              <EmptyState title="No pending invitations in SpendTogether" description="Invitations you send will appear here until they are accepted or cancelled." />
            ) : (
              <InvitationList invitations={pendingInvitations} />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <EditCategoryDialog category={editingCategory} currencyCode={currencyCode} onClose={() => setEditingCategory(null)} onSave={onUpdateCategory} />
      <EditSourceDialog source={editingSource} onClose={() => setEditingSource(null)} onSave={onUpdatePaymentSource} />
      <AddSourceDialog
        open={addSourceOpen}
        onOpenChange={setAddSourceOpen}
        sourceForm={sourceForm}
        activeWorkspace={activeWorkspace}
        onCreatePaymentSource={onCreatePaymentSource}
      />
      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        categoryForm={categoryForm}
        monthlyBudgetLabel={monthlyBudgetLabel}
        activeWorkspace={activeWorkspace}
        onCreateCategory={onCreateCategory}
      />
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} onInviteMember={onInviteMember} />
    </>
  );
}

function WorkspaceStat({ title, value, description, icon: Icon, className = "" }) {
  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted sm:text-sm">{title}</p>
          <p className="mt-2 truncate font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">{value}</p>
          <p className="mt-1 truncate text-xs font-semibold text-muted">{description}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-950 sm:h-11 sm:w-11">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}

function sectionTitle(tab) {
  if (tab === "categories") return "Budget Categories";
  if (tab === "sources") return "Payment Sources";
  if (tab === "members") return "Members";
  return "Manage Workspace";
}

function sectionDescription(tab) {
  if (tab === "categories") return "Create, edit, and review category budgets for this workspace.";
  if (tab === "sources") return "Manage the accounts, cards, cash, and wallets used for expenses.";
  if (tab === "members") return "Review workspace members and pending invitations.";
  return "Manage workspace details, categories, payment sources, and members from one place.";
}

function CategoryOverview({ categories, budgetStatus = [], currencyCode }) {
  const statusByCategory = new Map(budgetStatus.map((item) => [item.categoryId, item]));
  const allocatedBudget = categories.reduce((total, category) => {
    const status = statusByCategory.get(category.id);
    return total + Number(status?.budgetAmount ?? category.monthlyBudgetAmount ?? 0);
  }, 0);
  const overBudgetCount = categories.filter((category) => {
    const status = statusByCategory.get(category.id);
    if (!status) return false;
    return Boolean(status.overBudget) || Number(status.remainingAmount ?? 0) < 0;
  }).length;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <WorkspaceStat className="col-span-2 sm:col-span-1" title="Total categories" value={categories.length.toString()} description="Active budget groups" icon={FolderKanban} />
      <WorkspaceStat title="Allocated budget" value={formatMoney(allocatedBudget, currencyCode)} description="Across all categories" icon={WalletCards} />
      <WorkspaceStat title="Over budget" value={overBudgetCount.toString()} description="Need attention" icon={AlertTriangle} />
    </section>
  );
}

function MemberOverview({ members, pendingInvitations }) {
  const owners = members.filter((member) => member.role === "OWNER").length;
  const contributors = members.filter((member) => member.role === "CONTRIBUTOR").length;
  const viewers = members.filter((member) => member.role === "VIEWER").length;

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <WorkspaceStat title="Active members" value={members.length.toString()} description="Can access workspace" icon={UsersRound} />
      <WorkspaceStat title="Owners" value={owners.toString()} description="Full workspace control" icon={Crown} />
      <WorkspaceStat title="Contributors" value={contributors.toString()} description="Can add expenses" icon={ShieldCheck} />
      <WorkspaceStat title="Pending" value={pendingInvitations.length.toString()} description="Awaiting response" icon={Clock3} />
    </section>
  );
}

function MemberList({ members }) {
  return (
    <div className="grid gap-3">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}

function MemberCard({ member }) {
  const role = roleTheme(member.role);
  const Icon = role.icon;
  const name = member.fullName || member.name || member.email || "Workspace member";
  const initials = getInitials(name);

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 font-display text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="break-words font-display text-base font-bold tracking-tight text-foreground">{name}</p>
          <p className="mt-1 break-all text-sm font-medium text-muted">{member.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Badge tone={role.tone} className="gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {formatRole(member.role)}
        </Badge>
        <Badge tone={member.status === "ACTIVE" ? "success" : "neutral"}>{formatStatus(member.status)}</Badge>
      </div>
    </div>
  );
}

function InvitationList({ invitations }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {invitations.map((invitation) => (
        <InvitationCard key={invitation.id} invitation={invitation} />
      ))}
    </div>
  );
}

function InvitationCard({ invitation }) {
  const role = roleTheme(invitation.role);
  const Icon = role.icon;

  return (
    <div className="rounded-2xl border border-border bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="break-all font-display text-base font-bold tracking-tight text-foreground">{invitation.email}</p>
            <p className="mt-1 text-xs font-semibold text-muted">Invited by {invitation.invitedBy || "workspace owner"}</p>
          </div>
        </div>
        <Badge tone="warning">{formatStatus(invitation.status)}</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={role.tone} className="gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {formatRole(invitation.role)}
        </Badge>
      </div>
    </div>
  );
}

function roleTheme(role) {
  if (role === "OWNER") return { icon: Crown, tone: "primary" };
  if (role === "VIEWER") return { icon: Eye, tone: "neutral" };
  return { icon: ShieldCheck, tone: "success" };
}

function ResponsiveCategoryList({ categories, budgetStatus = [], currencyCode, onEdit, onDeactivate }) {
  const statusByCategory = new Map(budgetStatus.map((item) => [item.categoryId, item]));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => {
        const status = statusByCategory.get(category.id) ?? {};
        const budgetAmount = Number(status.budgetAmount ?? category.monthlyBudgetAmount ?? 0);
        const spentAmount = Number(status.spentAmount ?? 0);
        const remainingAmount = Number(status.remainingAmount ?? budgetAmount - spentAmount);
        const percentageUsed = budgetAmount > 0 ? Math.min((spentAmount / budgetAmount) * 100, 100) : 0;
        const theme = categoryTheme(category.name, category.categoryType);
        const Icon = theme.icon;

        return (
          <Card key={category.id} className="group p-0 transition hover:-translate-y-0.5 hover:shadow-elevated">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.className}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold tracking-tight text-foreground">{category.name}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">{formatCategoryType(category.categoryType)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100">
                  <Button type="button" variant="ghost" className="h-9 w-9 px-0" aria-label={`Edit ${category.name}`} onClick={() => onEdit(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" className="h-9 w-9 px-0" aria-label={`Deactivate ${category.name}`} onClick={() => window.confirm("Deactivate this category?") && onDeactivate(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted">Spent</p>
                  <p className="mt-1 font-display text-xl font-bold tracking-tight text-foreground">{formatMoney(spentAmount, currencyCode)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted">Budget</p>
                  <p className="mt-1 font-display text-xl font-bold tracking-tight text-foreground">{formatMoney(budgetAmount, currencyCode)}</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-muted">
                  <span>{percentageUsed.toFixed(0)}% used</span>
                  <span className={remainingAmount < 0 ? "text-danger" : "text-success"}>
                    {remainingAmount < 0 ? "Over" : "Left"} {formatMoney(Math.abs(remainingAmount), currencyCode)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${percentageUsed}%`, backgroundColor: budgetColor(percentageUsed, remainingAmount < 0) }} />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function AddCategoryDialog({ open, onOpenChange, categoryForm, monthlyBudgetLabel, activeWorkspace, onCreateCategory }) {
  async function submit(values) {
    await onCreateCategory(values);
    onOpenChange(false);
  }

  return (
    <Dialog title="Add Category" description="Create a category and its monthly budget together." open={open} onOpenChange={onOpenChange}>
      <Form onSubmit={categoryForm.handleSubmit(submit)}>
        <Input label="Category name" placeholder="Groceries" error={categoryForm.formState.errors.name?.message} {...categoryForm.register("name")} />
        <Select label="Type" error={categoryForm.formState.errors.categoryType?.message} {...categoryForm.register("categoryType")}>
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </Select>
        <Input
          label={monthlyBudgetLabel}
          type="number"
          min="0"
          step="0.01"
          error={categoryForm.formState.errors.monthlyBudgetAmount?.message}
          {...categoryForm.register("monthlyBudgetAmount")}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={!activeWorkspace}>Add category</Button>
        </div>
      </Form>
    </Dialog>
  );
}

function categoryTheme(name = "", type = "EXPENSE") {
  const text = name.toLowerCase();
  if (type === "INCOME") return { icon: Landmark, className: "bg-green-50 text-success" };
  if (text.includes("food") || text.includes("grocer")) return { icon: ShoppingCart, className: "bg-emerald-50 text-emerald-700" };
  if (text.includes("shop") || text.includes("online")) return { icon: ShoppingBag, className: "bg-indigo-50 text-indigo-700" };
  if (text.includes("travel") || text.includes("trip")) return { icon: Plane, className: "bg-sky-50 text-sky-700" };
  if (text.includes("bill") || text.includes("rent") || text.includes("home")) return { icon: Home, className: "bg-amber-50 text-warning" };
  if (text.includes("card") || text.includes("bank")) return { icon: CreditCard, className: "bg-slate-100 text-slate-950" };
  if (text.includes("receipt") || text.includes("expense")) return { icon: ReceiptText, className: "bg-rose-50 text-rose-700" };
  return { icon: Tag, className: "bg-slate-100 text-slate-950" };
}

function budgetColor(percentageUsed, overBudget) {
  if (overBudget || percentageUsed >= 100) return "#DC2626";
  if (percentageUsed >= 75) return "#F59E0B";
  if (percentageUsed >= 50) return "#0F172A";
  return "#16A34A";
}

function PaymentSourceOverview({ sources }) {
  const creditCards = sources.filter((source) => source.type === "CREDIT_CARD").length;
  const bankSources = sources.filter((source) => ["BANK_ACCOUNT", "CURRENT_ACCOUNT", "SAVINGS", "DEBIT_CARD"].includes(source.type)).length;
  const cashSources = sources.filter((source) => source.type === "CASH").length;

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <WorkspaceStat title="Total sources" value={sources.length.toString()} description="Available to expenses" icon={WalletCards} />
      <WorkspaceStat title="Bank sources" value={bankSources.toString()} description="Accounts and debit cards" icon={Building2} />
      <WorkspaceStat title="Credit cards" value={creditCards.toString()} description="Credit spending sources" icon={CreditCard} />
      <WorkspaceStat title="Cash" value={cashSources.toString()} description="Manual cash tracking" icon={Banknote} />
    </section>
  );
}

function ResponsiveSourceList({ sources, onEdit, onDeactivate }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sources.map((source) => (
        <PaymentSourceCard key={source.id} source={source} onEdit={onEdit} onDeactivate={onDeactivate} />
      ))}
    </div>
  );
}

function PaymentSourceCard({ source, onEdit, onDeactivate }) {
  const theme = sourceTheme(source.type);
  const Icon = theme.icon;
  const maskedSuffix = source.lastFourDigits ?? source.last4 ?? source.cardLast4 ?? "";

  return (
    <Card className="group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Badge tone={theme.badgeTone}>{formatSourceType(source.type)}</Badge>
          {maskedSuffix && <span className="text-xs font-bold text-muted">•••• {maskedSuffix}</span>}
        </div>

        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.iconClassName}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words font-display text-xl font-bold tracking-tight text-foreground">{source.name}</p>
            <p className="mt-1 text-sm font-medium text-muted">Available for workspace expenses</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="h-10 px-3" onClick={() => onEdit(source)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-3"
            onClick={() => window.confirm("Deactivate this payment source?") && onDeactivate(source.id)}
          >
            <Trash2 className="h-4 w-4" />
            Deactivate
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function AddSourceDialog({ open, onOpenChange, sourceForm, activeWorkspace, onCreatePaymentSource }) {
  async function submit(values) {
    await onCreatePaymentSource(values);
    onOpenChange(false);
  }

  return (
    <Dialog title="Add Payment Source" description="Add an account, card, cash wallet, or online wallet for workspace expenses." open={open} onOpenChange={onOpenChange}>
      <Form onSubmit={sourceForm.handleSubmit(submit)}>
        <Input label="Source name" placeholder="Barclays Current" error={sourceForm.formState.errors.name?.message} {...sourceForm.register("name")} />
        <Select label="Type" {...sourceForm.register("type")}>
          {paymentSourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={!activeWorkspace}>Add source</Button>
        </div>
      </Form>
    </Dialog>
  );
}

function sourceTheme(type = "OTHER") {
  if (type === "CREDIT_CARD") return { icon: CreditCard, iconClassName: "bg-slate-100 text-slate-950", badgeTone: "primary" };
  if (type === "CASH") return { icon: Banknote, iconClassName: "bg-amber-50 text-warning", badgeTone: "warning" };
  if (type === "UPI_WALLET") return { icon: Smartphone, iconClassName: "bg-green-50 text-success", badgeTone: "success" };
  if (["BANK_ACCOUNT", "CURRENT_ACCOUNT", "SAVINGS", "DEBIT_CARD"].includes(type)) return { icon: Building2, iconClassName: "bg-blue-50 text-blue-700", badgeTone: "primary" };
  return { icon: WalletCards, iconClassName: "bg-slate-100 text-slate-950", badgeTone: "neutral" };
}

function EditCategoryDialog({ category, currencyCode, onClose, onSave }) {
  const [values, setValues] = useState({ name: "", categoryType: "EXPENSE", monthlyBudgetAmount: "" });
  const monthlyBudgetLabel = `Monthly Budget (${getCurrencySymbol(currencyCode)})`;

  useEffect(() => {
    if (category) {
      setValues({
        name: category.name,
        categoryType: category.categoryType || "EXPENSE",
        monthlyBudgetAmount: category.monthlyBudgetAmount ?? 0,
      });
    }
  }, [category]);

  async function submit(event) {
    event.preventDefault();
    try {
      await onSave(category.id, values);
      onClose();
    } catch {
      // The parent handler already shows a toast; keep the dialog open for correction.
    }
  }

  return (
    <Dialog title="Edit Category" open={Boolean(category)} onOpenChange={(open) => !open && onClose()}>
      <Form onSubmit={submit}>
        <Input label="Category name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required />
        <Select label="Type" value={values.categoryType} onChange={(event) => setValues({ ...values, categoryType: event.target.value })}>
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </Select>
        <Input
          label={monthlyBudgetLabel}
          type="number"
          min="0"
          step="0.01"
          value={values.monthlyBudgetAmount}
          onChange={(event) => setValues({ ...values, monthlyBudgetAmount: event.target.value })}
          required
        />
        <Button type="submit">Save category</Button>
      </Form>
    </Dialog>
  );
}

function EditSourceDialog({ source, onClose, onSave }) {
  const [values, setValues] = useState({ name: "", type: "CASH" });

  useEffect(() => {
    if (source) setValues({ name: source.name, type: source.type || "CASH" });
  }, [source]);

  async function submit(event) {
    event.preventDefault();
    await onSave(source.id, values);
    onClose();
  }

  return (
    <Dialog title="Edit Payment Source" open={Boolean(source)} onOpenChange={(open) => !open && onClose()}>
      <Form onSubmit={submit}>
        <Input label="Source name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required />
        <Select label="Type" value={values.type} onChange={(event) => setValues({ ...values, type: event.target.value })}>
          {paymentSourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <Button type="submit">Save source</Button>
      </Form>
    </Dialog>
  );
}

function InviteMemberDialog({ open, onOpenChange, onInviteMember }) {
  const [values, setValues] = useState({ email: "", role: "CONTRIBUTOR", message: "" });
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onInviteMember(values);
      setValues({ email: "", role: "CONTRIBUTOR", message: "" });
      onOpenChange(false);
    } catch {
      // Parent handler shows the toast; keep the modal open for correction.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog title="Invite Member" description="Send an invitation to someone who should access this workspace." open={open} onOpenChange={onOpenChange}>
      <Form onSubmit={submit}>
        <Input label="Email" type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} required />
        <Select label="Role" value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value })}>
          <option value="CONTRIBUTOR">Contributor</option>
          <option value="VIEWER">Viewer</option>
        </Select>
        <div className="rounded-2xl border border-border bg-slate-50 p-4">
          <p className="text-sm font-bold text-foreground">{values.role === "VIEWER" ? "Viewer access" : "Contributor access"}</p>
          <p className="mt-1 text-sm font-medium leading-6 text-muted">
            {values.role === "VIEWER"
              ? "Viewers can review dashboard and reports, but cannot change workspace data."
              : "Contributors can view workspace data and add expenses, but cannot manage workspace settings."}
          </p>
        </div>
        <Input label="Optional message" value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            <UserPlus className="h-4 w-4" />
            {saving ? "Sending" : "Send invite"}
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}

function formatRole(value) {
  if (value === "OWNER") return "Owner";
  if (value === "VIEWER") return "Viewer";
  return "Contributor";
}

function formatStatus(value) {
  if (!value) return "Active";
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(value = "") {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ST";
}

function formatCategoryType(value) {
  return value === "INCOME" ? "Income" : "Expense";
}

function formatSourceType(value) {
  return paymentSourceTypes.find(([type]) => type === value)?.[1] ?? value;
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
