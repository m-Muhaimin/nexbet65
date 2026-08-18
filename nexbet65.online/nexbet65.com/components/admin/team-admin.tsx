"use client";

import * as React from "react";
import {
  Copy,
  Check,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  ROLE_DEFAULT_PERMISSIONS,
  TEAM_PERMISSIONS,
  TEAM_ROLES,
  TEAM_ROLE_DESCRIPTIONS,
  TEAM_ROLE_LABELS,
  type TeamMemberDTO,
  type TeamPermission,
  type TeamRole,
} from "@/lib/team-types";
import { cn } from "@/lib/utils";

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-instrument text-lg font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: TeamRole }) {
  const map = {
    super_admin: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    moderator: "bg-brand/15 text-brand border-brand/30",
    operator: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        map[role]
      )}
    >
      {TEAM_ROLE_LABELS[role]}
    </span>
  );
}

type FormState = {
  name: string;
  role: TeamRole;
  permissions: TeamPermission[];
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  role: "moderator",
  permissions: [...ROLE_DEFAULT_PERMISSIONS.moderator],
  isActive: true,
};

export function TeamAdmin() {
  const [members, setMembers] = React.useState<TeamMemberDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TeamMemberDTO | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [permsTouched, setPermsTouched] = React.useState(false);

  const [reveal, setReveal] = React.useState<{ name: string; token: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<TeamMemberDTO | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/team", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { members: TeamMemberDTO[] };
      setMembers(data.members);
    } catch {
      toast.error("Could not load team members");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setPermsTouched(false);
    setFormOpen(true);
  };

  const openEdit = (m: TeamMemberDTO) => {
    setEditing(m);
    setForm({
      name: m.name,
      role: m.role,
      permissions: [...m.permissions],
      isActive: m.isActive,
    });
    setPermsTouched(true);
    setFormOpen(true);
  };

  const setRole = (role: TeamRole) => {
    setForm((f) => ({
      ...f,
      role,
      permissions: permsTouched ? f.permissions : [...ROLE_DEFAULT_PERMISSIONS[role]],
    }));
  };

  const togglePerm = (id: TeamPermission) => {
    setPermsTouched(true);
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(id)
        ? f.permissions.filter((p) => p !== id)
        : [...f.permissions, id],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const url = editing ? `/api/admin/team/${editing.id}` : "/api/admin/team";
      const method = editing ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        permissions: form.permissions,
      };
      if (editing) body.isActive = form.isActive;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        token?: string;
        member?: TeamMemberDTO;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success(editing ? "Member updated" : "Member added");
      setFormOpen(false);
      if (!editing && data.token) {
        setReveal({ name: data.member?.name ?? form.name, token: data.token });
      }
      await load();
    } catch {
      toast.error("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const rotate = async (m: TeamMemberDTO) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/team/${m.id}/token`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; token?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Rotate failed");
        return;
      }
      setReveal({ name: m.name, token: data.token ?? "" });
      await load();
    } catch {
      toast.error("Rotate failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/team/${confirmDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Delete failed");
        return;
      }
      toast.success("Member removed");
      setConfirmDelete(null);
      await load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const copyToken = async () => {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal.token);
      toast.success("Token copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-instrument text-lg font-bold text-white">
            Team Members
          </h2>
          <p className="text-sm text-white/40">
            Access tokens let moderators and operators into the admin console.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-brand/40 hover:text-brand"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="gold-glow flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-black transition hover:bg-brand-dim"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Member
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#111]">
        <div className="hidden grid-cols-[1.2fr_1fr_1.4fr_auto] gap-3 border-b border-white/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30 md:grid">
          <span>Member</span>
          <span>Role</span>
          <span>Permissions</span>
          <span className="text-right">Actions</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
          </div>
        ) : members.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-white/40">
            No team members yet. Add your first one.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {members.map((m) => (
              <li
                key={m.id}
                className={cn(
                  "grid gap-3 px-4 py-3 md:grid-cols-[1.2fr_1fr_1.4fr_auto] md:items-center",
                  !m.isActive && "opacity-50"
                )}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-semibold text-white">
                    {m.name}
                    {m.isActive ? (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    ) : (
                      <span className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/40">
                        Off
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    Last login{" "}
                    {m.lastLoginAt
                      ? new Date(m.lastLoginAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "never"}
                    {" · "}by {m.createdBy}
                  </p>
                </div>

                <div className="flex items-center">
                  <RoleBadge role={m.role} />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {m.permissions.length === 0 ? (
                    <span className="text-xs text-white/30">No permissions</span>
                  ) : (
                    m.permissions.map((p) => (
                      <span
                        key={p}
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/60"
                      >
                        {TEAM_PERMISSIONS.find((x) => x.id === p)?.label ?? p}
                      </span>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-start gap-1.5 md:justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void rotate(m)}
                    title="Regenerate access token"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-bold text-white/60 transition hover:border-brand/40 hover:text-brand disabled:opacity-40"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span className="hidden sm:inline">Token</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openEdit(m)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-bold text-white/60 transition hover:border-brand/40 hover:text-brand disabled:opacity-40"
                  >
                    <Pencil className="h-3 w-3" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDelete(m)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>

                <div className="md:hidden">
                  <p className="flex flex-wrap gap-1.5">
                    {m.permissions.length === 0 ? (
                      <span className="text-xs text-white/30">No permissions</span>
                    ) : (
                      m.permissions.map((p) => (
                        <span
                          key={p}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/60"
                        >
                          {TEAM_PERMISSIONS.find((x) => x.id === p)?.label ?? p}
                        </span>
                      ))
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {formOpen && (
        <Modal
          title={editing ? `Edit ${editing.name}` : "Add Team Member"}
          onClose={() => setFormOpen(false)}
        >
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">
                NAME
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rahul (Moderator)"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-brand/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">
                ROLE
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {TEAM_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-center transition",
                      form.role === r
                        ? "border-brand/50 bg-brand/10 text-brand"
                        : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                    )}
                  >
                    <span className="block text-xs font-bold">
                      {TEAM_ROLE_LABELS[r]}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-white/40">
                {TEAM_ROLE_DESCRIPTIONS[form.role]}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">
                PERMISSIONS
              </label>
              <div className="space-y-1.5">
                {TEAM_PERMISSIONS.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/25"
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(p.id)}
                      onChange={() => togglePerm(p.id)}
                      className="h-4 w-4 accent-[#f6b01a]"
                    />
                    <span className="text-sm font-medium text-white/80">
                      {p.label}
                    </span>
                    <span className="ml-auto text-[10px] text-white/30">
                      {p.hint}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {editing && (
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#f6b01a]"
                />
                <span className="text-sm font-medium text-white/80">
                  Active (can sign in)
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={busy || !form.name.trim()}
              className="gold-glow flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-sm font-bold text-black transition hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editing ? "Save changes" : "Create member"}
            </button>
            {!editing && (
              <p className="text-center text-[11px] text-white/40">
                A one-time access token will be shown after creation.
              </p>
            )}
          </form>
        </Modal>
      )}

      {reveal && (
        <Modal title="Access Token" onClose={() => setReveal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Token for <span className="font-semibold text-white">{reveal.name}</span>.
              This is the only time it will be shown — copy it now and send it to
              the member securely.
            </p>
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
              <p className="break-all font-mono text-sm font-bold tracking-wide text-brand">
                {reveal.token}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyToken()}
              className="gold-glow flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-sm font-bold text-black transition hover:bg-brand-dim"
            >
              <Copy className="h-4 w-4" /> Copy token
            </button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title="Remove member?"
          onClose={() => setConfirmDelete(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Remove <span className="font-semibold text-white">{confirmDelete.name}</span>?
              Their access token will stop working immediately.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500 py-2.5 text-sm font-bold text-black transition hover:bg-red-400 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
