import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json().catch(() => ({}));

  const name: string | undefined = body?.name;
  const username: string | undefined = body?.username;
  const currentPassword: string | undefined = body?.currentPassword;
  const newPassword: string | undefined = body?.newPassword;

  // Carrega usuário atual
  const { data: user, error: userErr } = await supabase
    .from("admin_users")
    .select("id, username, name, password_hash")
    .eq("id", userId)
    .single();
  if (userErr || !user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  // Se vai trocar username, valida unicidade
  if (username && username !== user.username) {
    const { data: exists } = await supabase
      .from("admin_users")
      .select("id")
      .eq("username", username)
      .limit(1)
      .maybeSingle();
    if (exists) {
      return NextResponse.json({ error: "Este usuário já existe." }, { status: 409 });
    }
  }

  // Se vai trocar senha, exige senha atual correta
  let password_hash: string | undefined;
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Informe a senha atual." }, { status: 400 });
    }
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }
    password_hash = await bcrypt.hash(newPassword, 10); // mesmo formato atual
  }

  // Monta payload de atualização
  const updatePayload: Record<string, any> = {};
  if (typeof name === "string") updatePayload.name = name || null;
  if (typeof username === "string") updatePayload.username = username;
  if (password_hash) updatePayload.password_hash = password_hash;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ success: true }); // nada para atualizar
  }

  const { error: updErr } = await supabase
    .from("admin_users")
    .update(updatePayload)
    .eq("id", userId);

  if (updErr) {
    return NextResponse.json({ error: updErr.message || "Erro ao atualizar" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
