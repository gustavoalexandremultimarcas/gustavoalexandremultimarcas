// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 Tentando autenticar:", credentials?.username);

        if (!credentials?.username || !credentials?.password) {
          console.log("❌ Credenciais vazias");
          return null;
        }

        // Teste de conexão
        console.log("📡 Conectando no Supabase:", process.env.NEXT_PUBLIC_SUPABASE_URL);

        const { data: user, error } = await supabase
          .from("admin_users")
          .select("id, username, password_hash, name")
          .eq("username", credentials.username)
          .single();

        console.log("📊 Resultado da query:", { 
          encontrou: !!user, 
          erro: error?.message,
          username: user?.username 
        });

        if (error || !user) {
          console.log("❌ Usuário não encontrado ou erro:", error?.message);
          return null;
        }

        console.log("🔑 Validando senha...");
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        console.log("✅ Senha válida?", isValid);

        if (!isValid) {
          console.log("❌ Senha inválida");
          return null;
        }

        console.log("✅ Login bem-sucedido!");
        return {
          id: user.id,
          name: user.name || user.username,
          email: user.username,
        };
      }
    })
  ],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    }
  }
};