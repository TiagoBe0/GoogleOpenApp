import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Superusuario",
  PSYCHOLOGIST: "Psicólogo",
  PATIENT: "Paciente",
};

async function requireAdmin() {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.isActive === false) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return session;
}

async function setUserActive(formData: FormData) {
  "use server";

  const session = await requireAdmin();
  const userId = formData.get("userId");
  const isActive = formData.get("isActive") === "true";

  if (typeof userId !== "string" || !userId) return;
  if (userId === session.user.id) return;

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  revalidatePath("/dashboard/admin/users");
}

export default async function AdminUsersPage() {
  const session = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">Administración</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-2">
          Gestioná el acceso de pacientes, psicólogos y administradores registrados.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Activos</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Dados de baja</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{inactiveCount}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Alta</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isCurrentUser = user.id === session.user.id;

                return (
                  <tr key={user.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{user.name || "Sin nombre"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ROLE_LABELS[user.role] ?? user.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {user.isActive ? "Activo" : "Dado de baja"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Intl.DateTimeFormat("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }).format(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isCurrentUser ? (
                        <span className="text-xs text-gray-400">Sesión actual</span>
                      ) : (
                        <form action={setUserActive}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="isActive" value={String(!user.isActive)} />
                          <button
                            type="submit"
                            className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                              user.isActive
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {user.isActive ? "Dar de baja" : "Activar"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>
                    Todavía no hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
