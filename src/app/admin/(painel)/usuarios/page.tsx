"use client";

import { Fragment, useState } from "react";
import { AdminTopbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { EditoriaAssignments } from "@/components/admin/EditoriaAssignments";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getStaffProfiles, toggleProfileActive, updateProfileRole } from "@/lib/supabase/queries";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { logAction } from "@/lib/supabase/audit";
import { supabase } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

const EDITORIA_SCOPED_ROLES: UserRole[] = ["reviewer", "columnist"];

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  editor_chief: "Editor-chefe",
  editor: "Editor",
  reviewer: "Revisor",
  columnist: "Colunista",
  user: "Usuário",
};

const INVITABLE_ROLES: UserRole[] = ["editor_chief", "editor", "reviewer", "columnist", "admin"];

export default function AdminUsuariosPage() {
  const { profile } = useAdminSession();
  const { data: users, loading, refetch } = useSupabaseQuery(getStaffProfiles);
  const isAdmin = profile.role === "admin";

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("columnist");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRoleChange(id: string, oldRole: UserRole, newRole: UserRole) {
    await updateProfileRole(id, newRole);
    await logAction({
      userId: profile.id,
      action: "update",
      entity: "profile_role",
      entityId: id,
      oldValue: { role: oldRole },
      newValue: { role: newRole },
    });
    refetch();
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    if (id === profile.id) {
      alert("Você não pode desativar seu próprio usuário.");
      return;
    }
    await toggleProfileActive(id, !isActive);
    await logAction({
      userId: profile.id,
      action: "update",
      entity: "profile_active",
      entityId: id,
      newValue: { is_active: !isActive },
    });
    refetch();
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      const { error: invokeError } = await supabase.functions.invoke("invite-user", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { email: email.trim(), name: name.trim(), role },
      });

      if (invokeError) throw invokeError;

      setSuccess(`Convite enviado para ${email}.`);
      setName("");
      setEmail("");
      setIsInviting(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível convidar o usuário.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AdminTopbar title="Usuários" description="Gerencie os usuários e permissões do painel." />

      <div className="p-6">
        {isAdmin && (
          <div className="mb-4 flex justify-end">
            <Button type="button" onClick={() => setIsInviting((v) => !v)}>
              {isInviting ? "Cancelar" : "+ Novo Usuário"}
            </Button>
          </div>
        )}

        {isInviting && (
          <form
            onSubmit={handleInvite}
            className="mb-6 grid grid-cols-1 gap-4 rounded-sm border border-polis-navy/10 bg-white p-4 sm:grid-cols-3"
          >
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-polis-slate">
                Nome
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-polis-slate">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-xs font-semibold text-polis-slate">
                Papel
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-700 sm:col-span-3">{error}</p>}
            <Button type="submit" disabled={submitting} className="sm:col-span-3">
              {submitting ? "Enviando convite..." : "Enviar convite"}
            </Button>
          </form>
        )}

        {success && <p className="mb-4 text-sm text-emerald-700">{success}</p>}

        <div className="overflow-hidden rounded-sm border border-polis-navy/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-polis-navy/10 bg-polis-off-white text-xs uppercase tracking-wide text-polis-gray">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Papel</th>
                <th className="px-5 py-3">Status</th>
                {isAdmin && <th className="px-5 py-3">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-polis-navy/10">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-5 py-6 text-center text-polis-slate">
                    Carregando...
                  </td>
                </tr>
              ) : (
                (users ?? []).map((user) => {
                  const isEditoriaScoped = EDITORIA_SCOPED_ROLES.includes(user.role);
                  const isExpanded = expandedUserId === user.id;
                  return (
                    <Fragment key={user.id}>
                      <tr>
                        <td className="px-5 py-3 font-medium text-polis-navy">{user.name}</td>
                        <td className="px-5 py-3 text-polis-slate">{user.email}</td>
                        <td className="px-5 py-3 text-polis-slate">
                          {isAdmin ? (
                            <select
                              aria-label={`Papel de ${user.name}`}
                              value={user.role}
                              onChange={(event) =>
                                handleRoleChange(user.id, user.role, event.target.value as UserRole)
                              }
                              className="rounded-sm border border-polis-navy/20 px-2 py-1 text-sm focus:border-polis-gold focus:outline-none"
                            >
                              {INVITABLE_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {roleLabels[r]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            roleLabels[user.role]
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              user.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {user.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(user.id, user.is_active)}
                                className="text-xs font-semibold text-polis-navy hover:text-polis-gold"
                              >
                                {user.is_active ? "Desativar" : "Ativar"}
                              </button>
                              {isEditoriaScoped && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                                  className="text-xs font-semibold text-polis-navy hover:text-polis-gold"
                                >
                                  {isExpanded ? "Ocultar editorias" : "Editorias"}
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                      {isAdmin && isEditoriaScoped && isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <EditoriaAssignments profileId={user.id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
