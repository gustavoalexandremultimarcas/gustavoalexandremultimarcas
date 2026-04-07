export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import VehicleForm from "../../_components/VehicleForm";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type VehicleData = {
  id: number;
  name: string;
  brand: string | null;
  price: string | null;
  year: string | null;
  fuel: string | null;
  transmission: string | null;
  km: string | null;
  color: string | null;
  placa: string | null;
  doors: string | null;
  badge: string | null;
  description: string | null;
  spotlight: boolean;
  available: boolean;
  features: { feature: string }[];
  images: { image_url: string; image_meta: any; display_order: number }[];
};

export default async function VehicleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/painel")}`);
  }

  const { id } = await params;
  const isNew = id === "novo";

  let vehicle: VehicleData | null = null;

  if (!isNew) {
    const vehicleId = parseInt(id);
    if (isNaN(vehicleId)) {
      redirect("/painel");
    }

    const { data: vData } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .single();

    if (!vData) {
      redirect("/painel");
    }

    const { data: features } = await supabase
      .from("vehicle_features")
      .select("feature")
      .eq("vehicle_id", vehicleId)
      .order("display_order");

    const { data: images } = await supabase
      .from("vehicle_images")
      .select("image_url, image_meta, display_order")
      .eq("vehicle_id", vehicleId)
      .order("display_order");

    vehicle = {
      ...vData,
      features: features || [],
      images: images || [],
    } as VehicleData;
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Link
          href="/painel"
          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          ← Voltar para listagem
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        {isNew ? "Novo Veículo" : `Editar Veículo #${vehicle?.id}`}
      </h1>

      <VehicleForm key={isNew ? "novo" : String(vehicle!.id)} vehicle={vehicle} />
    </main>
  );
}
