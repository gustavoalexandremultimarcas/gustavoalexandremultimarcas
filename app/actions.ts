'use server'

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verifica se existe pelo menos um veículo elétrico disponível.
 */
export async function hasElectricVehicles(): Promise<boolean> {
    try {
        // Tenta encontrar "elétrico", "elétr", "eletrico"
        // Usando .or() para combinar condições: fuel.ilike.%elétr%,fuel.ilike.%eletric%
        const { count, error } = await supabase
            .from("vehicles")
            .select("*", { count: 'exact', head: true })
            .eq("available", true)
            .or('fuel.ilike.%elétr%,fuel.ilike.%eletric%');

        if (error) {
            console.error("Erro ao verificar veículos elétricos:", error);
            return false;
        }

        return (count ?? 0) > 0;
    } catch (err) {
        console.error("Exceção ao verificar veículos elétricos:", err);
        return false;
    }
}
