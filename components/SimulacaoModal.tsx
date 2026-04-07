"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { WEBHOOK_URL, WEBHOOK_AUTH } from "@/lib/config";

type VehicleOption = {
  id: number;
  name: string;
  placa: string | null;
  available: boolean;
};

export function SimulacaoModal({
  isOpen,
  onClose,
}: { isOpen: boolean; onClose: () => void }) {
  const [veiculos, setVeiculos] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [veiculoId, setVeiculoId] = useState<string>(""); // value será o id em string
  const [feedback, setFeedback] =
    useState<{ type: "success" | "error"; message: string } | null>(null);
  const [valorEntrada, setValorEntrada] = useState("R$ 0,00");
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch("/api/public/vehicles?availableOnly=1", {
          cache: "no-store",
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!active) return;
        setVeiculos((json?.vehicles ?? []) as VehicleOption[]);
      } catch (e: any) {
        if (!active) return;
        setLoadError(e?.message || "Falha ao carregar veículos");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen]);

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const floatValue = (parseInt(numericValue, 10) || 0) / 100;
    return floatValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  };

  const veiculoSelecionado = useMemo(
    () => veiculos.find((v) => String(v.id) === veiculoId),
    [veiculos, veiculoId]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload = {
      tipoFormulario: data.tipoFormulario,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      dataNascimento: data.dataNascimento,
      veiculoId: veiculoSelecionado?.id,
      veiculoNome: veiculoSelecionado?.name,
      cnh: data.cnh,
      valorEntrada: data.valorEntrada,
      placa: veiculoSelecionado?.placa || "",
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: WEBHOOK_AUTH,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFeedback({
          type: "success",
          message:
            "Simulação enviada com sucesso! Em breve nossa equipe entrará em contato.",
        });
      } else {
        const errorText = await response.text();
        setFeedback({
          type: "error",
          message: `Erro ao enviar a simulação: ${
            errorText || "Resposta inesperada do servidor."
          }`,
        });
        console.error("Erro na resposta da API:", response.status, errorText);
      }
    } catch (error: any) {
      setFeedback({
        type: "error",
        message: `Erro de rede ou execução: ${
          error?.message || "Erro desconhecido"
        }`,
      });
      console.error("Erro de rede ou execução:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
        <h2 className="w-full text-center text-2xl font-semibold mb-4 text-gray-800">
          Simulação de Financiamento
        </h2>

        {!feedback ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="tipoFormulario" value="simulacao_financiamento" />

            {/* campos pessoais */}
            <div>
              <Label htmlFor="nome" className="text-gray-700">
                Nome completo
              </Label>
              <Input
                id="nome"
                name="nome"
                required
                value={nome}
                onChange={(e) => {
                  const letras = e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, "");
                  setNome(letras);
                }}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Digite seu nome"
              />
            </div>

            <div>
              <Label htmlFor="cpf" className="text-gray-700">
                CPF
              </Label>
              <Input
                id="cpf"
                name="cpf"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                required
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor="telefone" className="text-gray-700">
                Número de contato
              </Label>
              <Input
                id="telefone"
                name="telefone"
                value={telefone}
                onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                required
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor="dataNascimento" className="text-gray-700">
                Data de nascimento
              </Label>
              <Input
                id="dataNascimento"
                name="dataNascimento"
                type="date"
                required
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            {/* veículo */}
            <div>
              <Label htmlFor="veiculo" className="text-gray-700">
                Veículo de interesse
              </Label>

              {loading ? (
                <div className="text-sm text-gray-500 py-2">Carregando veículos…</div>
              ) : loadError ? (
                <div className="text-sm text-red-600 py-2">
                  {loadError} — tente novamente mais tarde
                </div>
              ) : (
                <select
                  id="veiculo"
                  name="veiculo"
                  value={veiculoId}
                  onChange={(e) => setVeiculoId(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-black"
                >
                  <option value="">Selecione um veículo</option>
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <Label className="text-gray-700">Possui CNH?</Label>
              <RadioGroup name="cnh" defaultValue="Sim" className="flex gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Sim" id="cnhSim" />
                  <Label htmlFor="cnhSim" className="text-gray-700">
                    Sim
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Não" id="cnhNao" />
                  <Label htmlFor="cnhNao" className="text-gray-700">
                    Não
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="valorEntrada" className="text-gray-700">
                Valor da entrada (R$)
              </Label>
              <Input
                id="valorEntrada"
                name="valorEntrada"
                value={valorEntrada}
                onChange={(e) => setValorEntrada(formatCurrency(e.target.value))}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
              Enviar simulação
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-gray-500 hover:underline text-sm"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-gray-700 mb-6">{feedback.message}</p>
            <button
              onClick={() => {
                setFeedback(null);
                if (feedback.type === "success") onClose();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
