"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { WEBHOOK_URL, WEBHOOK_AUTH } from "@/lib/config"

export function ConsignarVeiculoForm({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [telefone, setTelefone] = useState("")
  const [veiculo, setVeiculo] = useState("")
  const [placa, setPlaca] = useState("")
  const [ano, setAno] = useState("")
  const [anexo, setAnexo] = useState<File | null>(null)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("tipoFormulario", "consignacao")
    formData.append("nome", nome)
    formData.append("cpf", cpf)
    formData.append("telefone", telefone)
    formData.append("veiculo", veiculo)
    formData.append("placa", placa)
    formData.append("ano", ano)
    if (anexo) formData.append("anexo", anexo)

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Authorization": WEBHOOK_AUTH
        },
        body: formData
      })

      if (response.ok) {
        // limpa os campos
        setNome("")
        setCpf("")
        setTelefone("")
        setVeiculo("")
        setPlaca("")
        setAno("")
        setAnexo(null)

        // limpa o input de arquivo visualmente (opcional)
        const fileInput = document.getElementById("anexo") as HTMLInputElement
        if (fileInput) fileInput.value = ""     
           
        setFeedback({ type: "success", message: "Solicitação enviada com sucesso! Em breve entraremos em contato." })
      } else {
        const errorText = await response.text()
        setFeedback({ type: "error", message: `Erro: ${errorText || "Resposta inesperada do servidor."}` })
      }
    } catch (error: any) {
      setFeedback({ type: "error", message: `Erro de rede: ${error?.message || "Erro desconhecido"}` })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
        <h2 className="w-full text-center text-2xl font-semibold mb-4 text-gray-800">Consignar meu veículo</h2>

        {!feedback ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-gray-700">Nome completo</Label>
              <Input
                id="nome"
                name="nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, ""))}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Digite seu nome"
              />
            </div>

            <div>
              <Label htmlFor="cpf" className="text-gray-700">CPF</Label>
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
              <Label htmlFor="telefone" className="text-gray-700">Número de contato</Label>
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
              <Label htmlFor="veiculo" className="text-gray-700">Veículo a consignar</Label>
              <Input
                id="veiculo"
                name="veiculo"
                value={veiculo}
                onChange={(e) => setVeiculo(e.target.value)}
                required
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Ex: Fiat Uno 1.0 2020"
              />
            </div>

            <div>
              <Label htmlFor="placa" className="text-gray-700">Placa</Label>
              <Input
                id="placa"
                name="placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                required
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="ABC-1234"
              />
            </div>

            <div>
              <Label htmlFor="ano" className="text-gray-700">Ano do veículo</Label>
              <Input
                id="ano"
                name="ano"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                required
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="2020"
              />
            </div>

            <div>
              <Label htmlFor="anexo" className="text-gray-700">Anexos (máx. 50MB)</Label>
              <Input
                id="anexo"
                name="anexo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (!file.type.startsWith("image/")) {
                      alert("Apenas arquivos de imagem são permitidos.")
                      e.target.value = ""
                      return
                    }

                    if (file.size <= 50 * 1024 * 1024) {
                      setAnexo(file)
                    } else {
                      alert("O arquivo deve ter no máximo 50MB.")
                      e.target.value = ""
                    }
                  }
                }}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
              Enviar solicitação
            </Button>
            <button type="button" onClick={onClose} className="w-full text-center text-gray-500 hover:underline text-sm">
              Cancelar
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-gray-700 mb-6">{feedback.message}</p>
            <button
              onClick={() => {
                setFeedback(null)
                if (feedback.type === "success") {
                  onClose()
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
