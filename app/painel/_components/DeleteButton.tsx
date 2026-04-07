"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteButtonProps = {
  vehicleId: number;
  vehicleName: string;
};

export default function DeleteButton({ vehicleId, vehicleName }: DeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja excluir o veículo "${vehicleName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir veículo");
      }

      router.refresh();
    } catch (error) {
      alert("Erro ao excluir veículo. Tente novamente.");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting ? "Excluindo..." : "Excluir"}
    </button>
  );
}