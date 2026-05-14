'use server'

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getElectricVehiclesAvailability = unstable_cache(
    async () => {
        const { count, error } = await supabase
            .from("vehicles")
            .select("id", { count: 'exact', head: true })
            .eq("available", true)
            .or('fuel.ilike.%elétr%,fuel.ilike.%eletric%');

        if (error) {
            console.error("Erro ao verificar veículos elétricos:", error);
            return false;
        }

        return (count ?? 0) > 0;
    },
    ["public-electric-vehicles-availability"],
    { revalidate: 300 }
);

/**
 * Verifica se existe pelo menos um veículo elétrico disponível.
 */
export async function hasElectricVehicles(): Promise<boolean> {
    try {
        return await getElectricVehiclesAvailability();
    } catch (err) {
        console.error("Exceção ao verificar veículos elétricos:", err);
        return false;
    }
}
