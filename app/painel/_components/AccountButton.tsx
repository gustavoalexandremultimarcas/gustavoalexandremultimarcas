"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AccountButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  // troca de senha (opcional)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setOk(null);
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setName(data?.name ?? "");
        setUsername(data?.username ?? "");
      })
      .catch(() => setError("Falha ao carregar seus dados."))
      .finally(() => setLoading(false));
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) return setError("Informe a senha atual.");
      if (newPassword.length < 6) return setError("A nova senha deve ter pelo menos 6 caracteres.");
      if (newPassword !== confirmPassword) return setError("A confirmação da nova senha não confere.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar.");

      setOk("Informações atualizadas com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Minha conta
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Minha conta</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="text-sm text-gray-500">Carregando…</div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {error}
                </div>
              )}
              {ok && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                  {ok}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-600 block mb-1">Nome</label>
                <input
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Usuário (login)</label>
                <input
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>

              <hr className="my-2" />
              <div className="text-sm text-gray-700 font-medium">Alterar senha (opcional)</div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Senha atual</label>
                <input
                  type="password"
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Nova senha</label>
                  <input
                    type="password"
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="mín. 6 caracteres"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Confirmar nova senha</label>
                  <input
                    type="password"
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="repita a nova senha"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
