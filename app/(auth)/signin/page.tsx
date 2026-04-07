"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export const dynamic = "force-dynamic";

function SignInInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const err = sp.get("error");
  const errorMsg = useMemo(() => {
    if (!err) return null;
    if (err === "CredentialsSignin" || err === "AccessDenied" || err === "CredentialsError") {
      return "Usuário ou senha inválidos. Tente novamente.";
    }
    return "Não foi possível autenticar. Tente novamente.";
  }, [err]);

  const callbackUrl = useMemo(() => {
    const raw = sp.get("callbackUrl") || "/painel";
    try {
      const u = new URL(raw, typeof window !== "undefined" ? window.location.href : "http://localhost");
      return (u.pathname || "/") + u.search + u.hash;
    } catch {
      return raw.startsWith("/") ? raw : "/painel";
    }
  }, [sp]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });

    setSubmitting(false);

    if (res?.ok) {
      const to = (() => {
        try {
          const u = new URL(res.url ?? callbackUrl, window.location.href);
          return (u.pathname || "/") + u.search + u.hash;
        } catch {
          return callbackUrl || "/painel";
        }
      })();

      router.replace(to);
      router.refresh();
    } else {
      setLocalError("Usuário ou senha inválidos. Tente novamente.");
    }
  }

  return (
    <main className="h-full grid place-items-center px-6 py-6 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-sm text-gray-600 mt-2">Gestão de Veículos</p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {localError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {localError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Usuário</label>
            <input
              name="username"
              autoComplete="username"
              className="w-full h-11 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
              required
              placeholder="Digite seu usuário"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Senha</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full h-11 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
              required
              placeholder="Digite sua senha"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full h-11 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Acesso restrito a administradores
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}