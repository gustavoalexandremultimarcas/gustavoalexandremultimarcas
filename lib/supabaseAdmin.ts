import { createClient } from "@supabase/supabase-js";

/**
 * Client "admin" (service role) — deve rodar apenas no servidor.
 * Criamos de forma lazy para não quebrar o build quando as env vars
 * não estão definidas no ambiente de build (ex.: Vercel sem env).
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey);
}

