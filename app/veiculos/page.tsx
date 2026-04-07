"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Calendar, Fuel, Settings, Search } from "lucide-react"
import { WEBHOOK_URL, WEBHOOK_AUTH } from "@/lib/config"
import { useSearchParams } from "next/navigation"

type PublicVehicle = {
  id: number
  name: string
  brand: string | null
  price: string | null
  year: string | null
  fuel: string | null
  transmission: string | null
  badge: string | null
  description: string | null
  available: boolean
  spotlight: boolean
  first_image_url?: string | null
  km?: string | null
}

const PLACEHOLDER = "/images/placeholder.webp"

/** Imagem do card com fallback + key por src para forçar re-render seguro */
function CardImage({ src, alt, badge }: { src?: string | null; alt: string; badge?: string | null }) {
  // tenta converter a URL pública do Supabase para a URL de render (thumb)
  const toRenderUrl = (u?: string | null) => {
    if (!u) return PLACEHOLDER
    // casa: https://<host>/storage/v1/object/public/vehicles-media/<path>
    const m = u.match(/^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/(vehicles-media\/.+)$/)
    if (!m) return u
    // devolve render com width/quality (thumb)
    return `${m[1]}/storage/v1/render/image/public/${m[2]}?width=640&quality=75`
  }

  const original = src || PLACEHOLDER
  const renderSrc = toRenderUrl(src)

  const [currentSrc, setCurrentSrc] = useState(renderSrc)

  useEffect(() => {
    // sempre que o src mudar, recalcula a tentativa de thumb
    setCurrentSrc(toRenderUrl(src))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  return (
    <div className="w-full aspect-[4/3] relative overflow-hidden">
      <Image
        key={currentSrc}                     // força recriar quando trocar a primeira imagem
        src={currentSrc || PLACEHOLDER}
        alt={alt}
        fill
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover transition-transform duration-300 ease-in-out hover:scale-105"
        unoptimized                          // evita inconsistências do loader em fill com remotas
        onError={() => {
          // se a thumb der erro, tenta a URL original; se já era a original, cai no placeholder
          if (currentSrc !== original) setCurrentSrc(original)
          else setCurrentSrc(PLACEHOLDER)
        }}
        priority={false}
      />
      {badge && <Badge className="absolute top-4 left-4 bg-red-600">{badge}</Badge>}
    </div>
  )
}

export default function VeiculosPage() {
  const searchParams = useSearchParams()
  const isElectricOnly = searchParams.get("electric") === "true"

  const [allVehicles, setAllVehicles] = useState<PublicVehicle[]>([])
  const [loading, setLoading] = useState(true)

  const [nomeModal, setNomeModal] = useState("")
  const [telefoneModal, setTelefoneModal] = useState("")
  const [emailModal, setEmailModal] = useState("")
  const [interesseModal, setInteresseModal] = useState("")

  const [showModal, setShowModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedPrice, setSelectedPrice] = useState("")

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/public/vehicles?availableOnly=1&withFirstImage=1", { cache: "no-store" })
        const json = await res.json()
        if (!active) return
        setAllVehicles((json?.vehicles ?? []) as PublicVehicle[])
      } catch (e) {
        console.error("Erro ao carregar veículos:", e)
        setAllVehicles([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const formatTelefone = (value: string) =>
    value.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15)

  useEffect(() => {
    if (/\d/.test(nomeModal)) setNomeModal(nomeModal.replace(/\d/g, ""))
  }, [nomeModal])

  const handleCustomVehicleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = {
      origem: "interesse_veiculo",
      tipoFormulario: "veiculo_ideal",
      nome: nomeModal,
      telefone: telefoneModal,
      email: emailModal,
      interesse: interesseModal,
    }
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: WEBHOOK_AUTH,
        },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        setFeedback({ type: "success", message: "Solicitação enviada com sucesso! Em breve nossa equipe entrará em contato." })
        setNomeModal(""); setTelefoneModal(""); setEmailModal(""); setInteresseModal("")
      } else {
        const errorText = await response.text()
        setFeedback({ type: "error", message: `Erro ao enviar: ${errorText || "Resposta inesperada do servidor."}` })
      }
    } catch (error: any) {
      setFeedback({ type: "error", message: `Erro de rede ou execução: ${error?.message || "Erro desconhecido"}` })
    } finally {
      setShowFeedbackModal(true)
    }
  }

  const filteredVehicles = useMemo(() => {
    const parsePrice = (p?: string | null) => {
      if (!p) return 0
      const n = parseInt(p.replace(/\D/g, ""), 10)
      return isNaN(n) ? 0 : n
    }

    return (allVehicles ?? []).filter((vehicle) => {
      const matchesElectric =
        !isElectricOnly ||
        (vehicle.fuel || "").toLowerCase().includes("elétr") ||
        (vehicle.fuel || "").toLowerCase().includes("eletric")

      const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesBrand = selectedBrand === "" || selectedBrand === "all" || vehicle.brand === selectedBrand
      const matchesYear = selectedYear === "" || selectedYear === "all" || vehicle.year === selectedYear

      const price = parsePrice(vehicle.price)
      const matchesPrice =
        selectedPrice === "" ||
        selectedPrice === "all" ||
        (selectedPrice === "ate-50k" && price <= 50000) ||
        (selectedPrice === "50k-80k" && price > 50000 && price <= 80000) ||
        (selectedPrice === "acima-80k" && price > 80000)

      return matchesElectric && matchesSearch && matchesBrand && matchesYear && matchesPrice
    })
  }, [allVehicles, isElectricOnly, searchTerm, selectedBrand, selectedYear, selectedPrice])

  const totalDisponiveis = allVehicles.length

  return (
    <div>
      <Header />

      {/* Hero Section */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Nossos <span className="text-red-500">Veículos</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Encontre o veículo perfeito para você com garantia e as melhores condições
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar veículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as marcas</SelectItem>
                <SelectItem value="Honda">Honda</SelectItem>
                <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                <SelectItem value="Nissan">Nissan</SelectItem>
                <SelectItem value="Toyota">Toyota</SelectItem>
                <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                <SelectItem value="Hyundai">Hyundai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
                <SelectItem value="2013">2013</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPrice} onValueChange={setSelectedPrice}>
              <SelectTrigger><SelectValue placeholder="Preço" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os preços</SelectItem>
                <SelectItem value="ate-50k">Até R$ 50.000</SelectItem>
                <SelectItem value="50k-80k">R$ 50.000 - R$ 80.000</SelectItem>
                <SelectItem value="acima-80k">Acima de R$ 80.000</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => { setSearchTerm(""); setSelectedBrand(""); setSelectedYear(""); setSelectedPrice(""); }}
              variant="outline"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </section>

      {/* Vehicles Grid */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4 pb-28">
          <div className="mb-8">
            <p className="text-gray-600">
              Mostrando {filteredVehicles.length} de {totalDisponiveis} veículos
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[420px] bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardImage src={vehicle.first_image_url} alt={vehicle.name} badge={vehicle.badge} />
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{vehicle.name}</h3>
                      {vehicle.price && <div className="text-2xl font-bold text-red-600 mb-2">{vehicle.price}</div>}
                      {vehicle.description && <p className="text-gray-600 text-sm mb-4 truncate">{vehicle.description}</p>}
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1"><Calendar className="h-4 w-4" /><span>{vehicle.year ?? "—"}</span></div>
                        <div className="flex items-center space-x-1"><Fuel className="h-4 w-4" /><span>{vehicle.fuel ?? "—"}</span></div>
                        <div className="flex items-center space-x-1"><Settings className="h-4 w-4" /><span>{vehicle.transmission ?? "—"}</span></div>
                        <div className="text-sm"><span>{vehicle.km ?? "—"}</span></div>
                      </div>
                      <Link href={`/veiculos/${vehicle.id}`}>
                        <Button className="w-full bg-red-600 hover:bg-red-700">Ver Detalhes</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredVehicles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Nenhum veículo encontrado com os filtros selecionados.</p>
                </div>
              )}
            </>
          )}

          <div className="absolute right-4 bottom-8 md:bottom-12">
            <Button
              onClick={() => setShowModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-full shadow-lg"
            >
              Não encontrou o veículo ideal?
            </Button>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-neutral-300 rounded-lg w-full max-w-sm shadow-2xl p-6 text-black">
            <h2 className="text-2xl font-bold mb-6 text-center">Encontre seu veículo ideal</h2>
            <form onSubmit={handleCustomVehicleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-black">Nome completo</Label>
                <Input id="name" name="name" value={nomeModal} onChange={(e) => setNomeModal(e.target.value)} placeholder="Seu nome completo" required className="bg-white border border-gray-300 text-black placeholder:text-gray-500" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-black">WhatsApp</Label>
                <Input id="phone" name="phone" value={telefoneModal} onChange={(e) => setTelefoneModal(formatTelefone(e.target.value))} placeholder="(17) 99999-9999" required className="bg-white border border-gray-300 text-black placeholder:text-gray-500" />
              </div>
              <div>
                <Label htmlFor="email" className="text-black">E-mail</Label>
                <Input id="email" name="email" type="email" value={emailModal} onChange={(e) => setEmailModal(e.target.value)} placeholder="seu@email.com" required className="bg-white border border-gray-300 text-black placeholder:text-gray-500" />
              </div>
              <div>
                <Label htmlFor="interest" className="text-black">Interesse</Label>
                <Textarea id="interest" name="interest" value={interesseModal} onChange={(e) => setInteresseModal(e.target.value)} placeholder="Que tipo de veículo você procura?" rows={3} required className="bg-white border border-gray-300 text-black placeholder:text-gray-500" />
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-lg py-3">Solicitar atendimento</Button>
            </form>
            <button onClick={() => setShowModal(false)} className="mt-4 mx-auto block text-sm text-gray-500 hover:underline">Fechar</button>
          </div>
        </div>
      )}

      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-sm w-full text-center px-6 py-4 rounded-lg [&>button]:hidden">
          <DialogHeader className="items-center">
            <DialogTitle className="text-xl font-semibold text-gray-900 text-center w-full">Solicitação de atendimento</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 text-base my-4">{feedback?.message}</p>
          <div className="w-full flex justify-center">
            <Button
              onClick={() => setShowFeedbackModal(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer onOpenSimulacaoModal={() => setShowModal(true)} />
    </div>
  )
}
