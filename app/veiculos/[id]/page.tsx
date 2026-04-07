"use client"

import type React from "react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import InnerImageZoom from "react-inner-image-zoom"
import "react-inner-image-zoom/lib/InnerImageZoom/styles.css"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { STORE_WHATSAPP_LINK, STORE_PHONE, STORE_ADDRESS, STORE_CITY_STATE } from "@/lib/config"
import { thumbUrlFromMeta } from "@/utils/thumb"

import { Calendar, Fuel, Settings, ArrowLeft, Phone, MessageCircle, Gauge, MapPin, Shield } from "lucide-react"

type VehicleImage =
  | string
  | {
      image_url: string
      image_meta?: any
    }

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
  km?: string | null
  first_image_url?: string | null
  /** se o endpoint já devolver, aproveitamos para gerar a thumb */
  first_image_meta?: any | null
  /** pode vir como array de urls OU como objetos com meta */
  images?: VehicleImage[]
}

function formatTelefone(value: string) {
  const cleaned = value.replace(/\D/g, "")
  const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/)
  if (!match) return value
  const [, ddd, parte1, parte2] = match
  return !parte2 ? `(${ddd}) ${parte1}` : `(${ddd}) ${parte1}-${parte2}`
}

export default function VehicleDetailsPage() {
  const params = useParams()
  const vehicleId = params?.id as string

  const [vehicle, setVehicle] = useState<PublicVehicle | null>(null)
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // controla fallback da imagem principal caso a URL remota falhe
  const [brokenIdx, setBrokenIdx] = useState<number | null>(null)
  const safeSrc = useCallback(
    (url: string | undefined) => (brokenIdx === selectedImage ? "/images/placeholder.webp" : (url || "/images/placeholder.webp")),
    [brokenIdx, selectedImage]
  )

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/vehicles?id=${encodeURIComponent(String(vehicleId))}&withImages=1`, {
          cache: "no-store",
        })
        const json = await res.json()
        if (!active) return
        const v = (json?.vehicles ?? [])[0] as PublicVehicle | undefined
        setVehicle(v ?? null)
        setSelectedImage(0)
        setBrokenIdx(null)
      } catch (e) {
        console.error("Erro ao carregar veículo:", e)
        setVehicle(null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [vehicleId])

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isModalOpen])

  /**
   * Normaliza as imagens:
   * - thumbs: URLs geradas via Render API (quando houver meta) ou fallback para image_url / first_image_url
   * - originals: URLs originais (image_url ou first_image_url)
   */
  const { thumbs, originals } = useMemo(() => {
    const PLACE = "/images/placeholder.webp"
    const r = { thumbs: [] as string[], originals: [] as string[] }

    if (!vehicle) return r

    // caso a API retorne a lista completa
    if (vehicle.images && vehicle.images.length) {
      for (const it of vehicle.images) {
        if (typeof it === "string") {
          r.thumbs.push(it || PLACE)
          r.originals.push(it || PLACE)
        } else {
          const orig = it.image_url || PLACE
          const thumb = thumbUrlFromMeta(it.image_meta, orig)
          r.thumbs.push(thumb || PLACE)
          r.originals.push(orig)
        }
      }
      return r
    }

    // fallback: só a primeira imagem
    if (vehicle.first_image_url || vehicle.first_image_meta) {
      const orig = vehicle.first_image_url || PLACE
      const thumb = thumbUrlFromMeta(vehicle.first_image_meta, orig)
      r.thumbs.push(thumb || PLACE)
      r.originals.push(orig)
      return r
    }

    return r
  }, [vehicle])

  if (!loading && !vehicle) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-12 text-center text-xl text-red-600">
          Veículo não encontrado.
        </div>
        <Footer onOpenSimulacaoModal={() => setShowModal(true)} />
      </div>
    )
  }

  if (loading || !vehicle) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="h-8 w-48 bg-gray-100 animate-pulse rounded mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
              <div className="h-[360px] bg-gray-100 animate-pulse rounded" />
              <div className="h-40 bg-gray-100 animate-pulse rounded" />
              <div className="h-40 bg-gray-100 animate-pulse rounded" />
            </div>
            <div className="space-y-6">
              <div className="h-80 bg-gray-100 animate-pulse rounded" />
              <div className="h-48 bg-gray-100 animate-pulse rounded" />
              <div className="h-48 bg-gray-100 animate-pulse rounded" />
            </div>
          </div>
        </div>
        <Footer onOpenSimulacaoModal={() => setShowModal(true)} />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      tipoFormulario: "veiculo_especifico",
      nome: name,
      telefone: phone,
      email: email,
      veiculo: vehicle.name,
      mensagem: message,
    }
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        setFeedback({ type: "success", message: "Interesse enviado com sucesso! Em breve entraremos em contato." })
        setName(""); setPhone(""); setEmail(""); setMessage("")
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

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-red-600">Início</Link>
          <span>/</span>
          <Link href="/veiculos" className="hover:text-red-600">Veículos</Link>
          <span>/</span>
          <span className="text-gray-900">{vehicle.name}</span>
        </div>

        <Link href="/veiculos" className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para veículos</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{vehicle.name}</h1>
                  {vehicle.badge && <Badge className="bg-red-600">{vehicle.badge}</Badge>}
                </div>
                {vehicle.price && <div className="text-3xl font-bold text-red-600">{vehicle.price}</div>}
              </div>
              <div className="flex gap-2">
                <a
                  href={`${STORE_WHATSAPP_LINK}?text=Olá! Tenho interesse no ${vehicle.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <a
                  href={`tel:${STORE_PHONE.replace(/\D/g, "")}`}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-800 rounded hover:bg-gray-100 transition text-sm"
                >
                  <Phone className="h-4 w-4" />
                  Ligar
                </a>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <Image
                    src={safeSrc(thumbs[selectedImage])}
                    alt={`${vehicle.name} - imagem ${selectedImage + 1}`}
                    width={1200}
                    height={900}
                    // pular otimização para evitar edge cases com URLs remotas
                    unoptimized
                    className="w-full h-80 object-cover rounded-t-lg cursor-zoom-in"
                    onClick={() => setIsModalOpen(true)}
                    onError={() => setBrokenIdx(selectedImage)}
                  />
                </div>
                {thumbs.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {thumbs.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`relative rounded-lg overflow-hidden ${selectedImage === idx ? "ring-2 ring-red-600" : ""}`}
                      >
                        <Image
                          src={img || "/images/placeholder.webp"}
                          alt={`${vehicle.name} miniatura ${idx + 1}`}
                          width={300}
                          height={200}
                          unoptimized
                          className="w-full h-20 object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/placeholder.webp"
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {isModalOpen && originals.length > 0 && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center px-4" onClick={() => setIsModalOpen(false)}>
                <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-2 right-2 text-white text-2xl font-bold z-50">&times;</button>
                  <InnerImageZoom
                    src={originals[selectedImage]}
                    zoomSrc={originals[selectedImage]}
                    zoomType="hover"
                    zoomPreload
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}

            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Especificações</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Item icon={<Calendar />} label="Ano" value={vehicle.year ?? "—"} />
                  <Item icon={<Gauge />} label="Quilometragem" value={vehicle.km ?? "—"} />
                  <Item icon={<Fuel />} label="Combustível" value={vehicle.fuel ?? "—"} />
                  <Item icon={<Settings />} label="Transmissão" value={vehicle.transmission ?? "—"} />
                </div>
              </CardContent>
            </Card>

            {vehicle.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Descrição</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{vehicle.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="sticky top-4 space-y-6 h-fit">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold mb-4">Tenho Interesse</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-black">Nome completo</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, ""))}
                      className="bg-white border border-gray-300 text-black placeholder:text-gray-500"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-black">WhatsApp</Label>
                    <Input
                      id="phone"
                      name="phone"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatTelefone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="bg-white border border-gray-300 text-black placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-black">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="bg-white border border-gray-300 text-black placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-black">Mensagem</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Gostaria de agendar um test drive..."
                      className="bg-white border border-gray-300 text-black placeholder:text-gray-500"
                      rows={3}
                    />
                  </div>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-lg py-3">Enviar Interesse</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                  <h3 className="text-xl font-semibold">Garantia Inclusa</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Veículo revisado e periciado</li>
                  <li>• Garantia de procedência</li>
                  <li>• Documentação em dia</li>
                  <li>• Suporte pós-venda</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <MapPin className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold">Nossa Localização</h3>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>{STORE_ADDRESS}</p>
                  <p>{STORE_CITY_STATE}</p>
                  <p className="font-semibold text-red-600">{STORE_PHONE}</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-sm w-full text-center px-6 py-4 rounded-lg [&>button]:hidden">
          <DialogHeader className="items-center">
            <DialogTitle className="text-xl font-semibold text-gray-900 text-center w-full">
              Solicitação de atendimento
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 text-base my-4">{feedback?.message}</p>
          <DialogFooter className="w-full flex justify-center">
            <Button onClick={() => setShowFeedbackModal(false)} className="mx-auto bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer onOpenSimulacaoModal={() => setShowModal(true)} />
    </div>
  )
}

function Item({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="text-red-600">{icon}</div>
      <div>
        <span className="text-sm text-gray-600">{label}</span>
        <div className="font-semibold">{value ?? "—"}</div>
      </div>
    </div>
  )
}
