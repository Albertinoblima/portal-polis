import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/Topbar";
import { ButtonLink } from "@/components/ui/Button";
import { getAuthors } from "@/lib/content";
import type { UserRole } from "@/types";

export const metadata: Metadata = {
  title: "Usuários",
};

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  editor_chief: "Editor-chefe",
  editor: "Editor",
  reviewer: "Revisor",
  columnist: "Colunista",
  user: "Usuário",
};

export default function AdminUsuariosPage() {
  const users = getAuthors();

  return (
    <>
      <AdminTopbar title="Usuários" description="Gerencie os usuários e permissões do painel." />

      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <ButtonLink href="#">+ Novo Usuário</ButtonLink>
        </div>

        <div className="overflow-hidden rounded-sm border border-polis-navy/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-polis-navy/10 bg-polis-off-white text-xs uppercase tracking-wide text-polis-gray">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Papel</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-polis-navy/10">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-3 font-medium text-polis-navy">{user.name}</td>
                  <td className="px-5 py-3 text-polis-slate">{user.email}</td>
                  <td className="px-5 py-3 text-polis-slate">{roleLabels[user.role]}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Ativo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
