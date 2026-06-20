import React, { useEffect, useState } from "react";
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
  const currencySymbol = getCurrencySymbol(currencyCode);
  const monthlyBudgetLabel = `Monthly Budget (${currencySymbol})`;

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
        title="Manage Workspace"
        description="Manage workspace details, categories, payment sources, and members from one place."
      />

      <Tabs defaultValue="details" className="grid gap-5">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="details">Workspace</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="sources">Payment Sources</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="grid gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Create workspace</CardTitle>
                <CardDescription>Create a workspace and choose its base currency.</CardDescription>
              </div>
              {activeWorkspace && <Badge tone="success">{activeWorkspace.currencyCode || "GBP"} selected</Badge>}
            </CardHeader>
            <Form onSubmit={workspaceForm.handleSubmit(onCreateWorkspace)} className="grid gap-4 md:grid-cols-[1fr_260px_auto] md:items-end">
              <Input label="Workspace name" placeholder="Trip budget" error={workspaceForm.formState.errors.name?.message} {...workspaceForm.register("name")} />
              <Select label="Currency" {...workspaceForm.register("currencyCode")}>
                {currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} - {currency.label}</option>)}
              </Select>
              <Button type="submit">Create workspace</Button>
            </Form>
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
                <Button type="submit">Save changes</Button>
              </Form>
            </Card>
          ) : (
            <Card>
              <EmptyState title="Create a workspace in SpendTogether" description="Workspace setup unlocks categories, payment sources, budgets, members, and expenses." />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="grid gap-5">
          <Card>
            <CardTitle>Add category</CardTitle>
            <Form onSubmit={categoryForm.handleSubmit(onCreateCategory)} className="mt-5 grid gap-4 md:grid-cols-[1fr_160px_180px_auto] md:items-end">
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
              <Button type="submit" disabled={!activeWorkspace}>Add category</Button>
            </Form>
          </Card>
          {categories.length === 0 ? (
            <EmptyState title="No categories yet in SpendTogether" description="Add income or expense categories for this workspace." />
          ) : (
            <Table
              minWidth="420px"
              columns={[
                { key: "name", header: "Name" },
                { key: "categoryType", header: "Type", width: "110px" },
                { key: "monthlyBudgetAmount", header: "Monthly Budget", width: "150px", render: (row) => formatMoney(row.monthlyBudgetAmount, currencyCode) },
                { key: "actions", header: "Actions", width: "180px", render: (row) => (
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setEditingCategory(row)}>Edit</Button>
                    <Button type="button" variant="ghost" onClick={() => window.confirm("Deactivate this category?") && onDeactivateCategory(row.id)}>Deactivate</Button>
                  </div>
                ) },
              ]}
              rows={categories}
              getKey={(row) => row.id}
            />
          )}
        </TabsContent>

        <TabsContent value="sources" className="grid gap-5">
          <Card>
            <CardTitle>Add payment source</CardTitle>
            <Form onSubmit={sourceForm.handleSubmit(onCreatePaymentSource)} className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <Input label="Source name" placeholder="Cash" error={sourceForm.formState.errors.name?.message} {...sourceForm.register("name")} />
              <Select label="Type" {...sourceForm.register("type")}>
                {paymentSourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Button type="submit" disabled={!activeWorkspace}>Add source</Button>
            </Form>
          </Card>
          {paymentSources.length === 0 ? (
            <EmptyState title="No payment sources yet in SpendTogether" description="Add cash, bank, cards, or online wallets." />
          ) : (
            <Table
              minWidth="460px"
              columns={[
                { key: "name", header: "Name" },
                { key: "type", header: "Type", width: "150px" },
                { key: "actions", header: "Actions", width: "180px", render: (row) => (
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setEditingSource(row)}>Edit</Button>
                    <Button type="button" variant="ghost" onClick={() => window.confirm("Deactivate this payment source?") && onDeactivatePaymentSource(row.id)}>Deactivate</Button>
                  </div>
                ) },
              ]}
              rows={paymentSources}
              getKey={(row) => row.id}
            />
          )}
        </TabsContent>

        <TabsContent value="members" className="grid gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>Manage active members and pending invitations for this workspace.</CardDescription>
              </div>
              <Button type="button" onClick={() => setInviteOpen(true)} disabled={!activeWorkspace}>Invite member</Button>
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
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} onInviteMember={onInviteMember} />
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

function getCurrencySymbol(currencyCode) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode || "GBP",
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value || currencyCode || "GBP";
}
