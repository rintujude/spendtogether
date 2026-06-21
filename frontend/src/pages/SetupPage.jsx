import React, { useEffect, useState } from "react";
import { CreditCard, FolderKanban, Home, Landmark, Pencil, Plane, Plus, ReceiptText, Settings, ShoppingBag, ShoppingCart, Tag, Trash2, UserPlus, UsersRound, WalletCards } from "lucide-react";
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
  Table,
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
  const [activeTab, setActiveTab] = useState(initialTab);
  const currencySymbol = getCurrencySymbol(currencyCode);
  const monthlyBudgetLabel = `Monthly Budget (${currencySymbol})`;

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
        title={initialTab === "categories" ? "Budget Categories" : initialTab === "sources" ? "Payment Sources" : initialTab === "members" ? "Members" : "Manage Workspace"}
        description="Manage workspace details, categories, payment sources, and members from one place."
        actions={initialTab === "categories" ? (
          <Button type="button" onClick={() => setAddCategoryOpen(true)} disabled={!activeWorkspace}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        ) : null}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <WorkspaceStat title="Workspace" value={activeWorkspace?.name ?? "Not created"} description={activeWorkspace ? `${activeWorkspace.currencyCode || "GBP"} base currency` : "Create one to begin"} icon={Settings} />
        <WorkspaceStat title="Categories" value={categories.length.toString()} description="Income and expense groups" icon={FolderKanban} />
        <WorkspaceStat title="Sources" value={paymentSources.length.toString()} description="Cash, bank, cards, wallets" icon={WalletCards} />
        <WorkspaceStat title="Members" value={members.length.toString()} description="Owners, contributors, viewers" icon={UsersRound} />
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="grid gap-5">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="details">Workspace</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="sources">Payment Sources</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="grid gap-5">
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
          <Card>
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
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>Manage active members and pending invitations for this workspace.</CardDescription>
              </div>
              <Button type="button" onClick={() => setInviteOpen(true)} disabled={!activeWorkspace}><UserPlus className="h-4 w-4" />Invite member</Button>
            </CardHeader>
            {members.length === 0 ? (
              <EmptyState title="No members yet in SpendTogether" description="Invite contributors or viewers to collaborate in this workspace." />
            ) : (
              <Table
                minWidth="560px"
                columns={[
                  { key: "fullName", header: "Name" },
                  { key: "email", header: "Email" },
                  { key: "role", header: "Role", width: "140px", render: (row) => <Badge>{row.role}</Badge> },
                  { key: "status", header: "Status", width: "120px", render: (row) => <Badge tone="success">{row.status}</Badge> },
                ]}
                rows={members}
                getKey={(row) => row.id}
              />
            )}
          </Card>

          <Card>
            <CardTitle>Pending invitations</CardTitle>
            {pendingInvitations.length === 0 ? (
              <EmptyState title="No pending invitations in SpendTogether" description="Invitations you send will appear here until they are accepted or cancelled." />
            ) : (
              <Table
                minWidth="560px"
                columns={[
                  { key: "email", header: "Email" },
                  { key: "role", header: "Role", width: "140px", render: (row) => <Badge>{row.role}</Badge> },
                  { key: "status", header: "Status", width: "130px", render: (row) => <Badge tone="warning">{row.status}</Badge> },
                  { key: "invitedBy", header: "Invited by", width: "160px" },
                ]}
                rows={pendingInvitations}
                getKey={(row) => row.id}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <EditCategoryDialog category={editingCategory} currencyCode={currencyCode} onClose={() => setEditingCategory(null)} onSave={onUpdateCategory} />
      <EditSourceDialog source={editingSource} onClose={() => setEditingSource(null)} onSave={onUpdatePaymentSource} />
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

function WorkspaceStat({ title, value, description, icon: Icon }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">{title}</p>
          <p className="mt-2 truncate font-display text-xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 truncate text-xs font-semibold text-muted">{description}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
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

function AddCategoryDialog({ open, onOpenChange, categoryForm, monthlyBudgetLabel, activeWorkspace, onCreateCategory }) {
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

function ResponsiveSourceList({ sources, onEdit, onDeactivate }) {
  return (
    <>
      <div className="hidden md:block">
        <Table
          minWidth="520px"
          columns={[
            { key: "name", header: "Name" },
            { key: "type", header: "Type", width: "170px", render: (row) => <Badge>{formatSourceType(row.type)}</Badge> },
            { key: "actions", header: "Actions", width: "210px", render: (row) => (
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => onEdit(row)}><Pencil className="h-4 w-4" />Edit</Button>
                <Button type="button" variant="ghost" onClick={() => window.confirm("Deactivate this payment source?") && onDeactivate(row.id)}><Trash2 className="h-4 w-4" />Deactivate</Button>
              </div>
            ) },
          ]}
          rows={sources}
          getKey={(row) => row.id}
        />
      </div>
      <div className="grid gap-3 md:hidden">
        {sources.map((source) => (
          <Card key={source.id} className="p-4">
            <CardHeader className="mb-3">
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{source.name}</CardTitle>
                <CardDescription>{formatSourceType(source.type)}</CardDescription>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">
                <CreditCard className="h-5 w-5" />
              </div>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => onEdit(source)}><Pencil className="h-4 w-4" />Edit</Button>
              <Button type="button" variant="ghost" onClick={() => window.confirm("Deactivate this payment source?") && onDeactivate(source.id)}><Trash2 className="h-4 w-4" />Deactivate</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
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
    <Dialog title="Invite member" description="Invite a contributor or viewer to join this workspace." open={open} onOpenChange={onOpenChange}>
      <Form onSubmit={submit}>
        <Input label="Email" type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} required />
        <Select label="Role" value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value })}>
          <option value="CONTRIBUTOR">Contributor</option>
          <option value="VIEWER">Viewer</option>
        </Select>
        <Input label="Message" value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Sending" : "Send invite"}</Button>
        </div>
      </Form>
    </Dialog>
  );
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
