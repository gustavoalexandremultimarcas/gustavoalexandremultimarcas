"use client"

import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { ChevronRight, Car, Shield, CreditCard, RefreshCw } from "lucide-react"
import Link from "next/link"
import React from "react"

import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Autoplay, Pagination } from 'swiper/modules'
import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"
import { SimulacaoModal } from "@/components/SimulacaoModal"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { WEBHOOK_URL, WEBHOOK_AUTH, STORE_NAME } from "@/lib/config"

export function HeroSection() {
  const [showSimulacaoModal, setShowSimulacaoModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [nomeLead, setNomeLead] = useState("")
  const [telefoneLead, setTelefoneLead] = useState("")
  const [emailLead, setEmailLead] = useState("")
  const [interesseLead, setInteresseLead] = useState("")

  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = {
      origem: "interesse_home",
      tipoFormulario: "veiculo_ideal",
      nome: nomeLead,
      telefone: telefoneLead,
      email: emailLead,
      interesse: interesseLead      
    }

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": WEBHOOK_AUTH
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setFeedback({
          type: "success",
          message: "Interesse enviado com sucesso! Em breve nossa equipe entrará em contato."
        })

        // Limpa os campos do formulário
        setNomeLead("")
        setTelefoneLead("")
        setEmailLead("")
        setInteresseLead("")

      } else {
        const errorText = await response.text()
        setFeedback({
          type: "error",
          message: `Erro ao enviar a interesse: ${errorText || "Resposta inesperada do servidor."}`
        })
        console.error("Erro na resposta da API:", response.status, errorText)
      }
    } catch (error: any) {
      setFeedback({
        type: "error",
        message: `Erro de rede ou execução: ${error?.message || "Erro desconhecido"}`
      })
      console.error("Erro de rede ou execução:", error)
    } finally {
      setShowFeedbackModal(true)
    }
  }

  return (
    <section className="relative w-full overflow-hidden text-white">
      {/* Imagem de fundo responsiva */}
      <div className="absolute inset-0 z-[-1]">
        <img
          src="/images/Fundobanner.webp" // substitua pelo caminho correto da imagem
          alt="Banner de veículo esportivo"
          className="w-full h-[600px] sm:h-[900px] object-cover"
        />
        {/* Overlay escuro opcional */}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Overlay escuro por cima do fundo */}
      <div className="absolute inset-0 bg-black opacity-10 z-0" />

      {/* Decorative arrows */}
      <div className="absolute top-5 right-10 hidden lg:block">
        <div className="flex space-x-2">
          {[...Array(6)].map((_, i) => (
            <ChevronRight key={i} className="h-6 w-6 text-white opacity-30" />
          ))}
        </div>
      </div>

      <div className="absolute bottom-5 left-10 hidden lg:block">
        <div className="flex space-x-2">
          {[...Array(6)].map((_, i) => (
            <ChevronRight key={i} className="h-6 w-6 text-white opacity-20" />
          ))}
        </div>
      </div>
      
    <div className="w-full max-w-[1400px] mx-auto hero-wrapper px-4 flex flex-col lg:flex-row items-center lg:items-start gap-6 relative z-10">
      <div className="banner-swiper flex-1 mb-0">
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: '.swiper-next',
            prevEl: '.swiper-prev',
              }}
          autoplay={{ delay: 6000 }}
          pagination={{ clickable: true }}
          loop
          className="custom-swiper"
        >
          <SwiperSlide>
            <div className="space-y-8 min-h-[450px] flex flex-col justify-between">
              <div className="space-y-6">
                <h1 className="hero-title-sm text-3xl lg:text-5xl font-bold leading-tight">
                  CARROS REVISADOS E<br />
                  <span className="text-white">PERICIADOS COM</span>
                  <br />
                  <span className="text-red-500">GARANTIA</span>
                </h1>
                
                <div className="hero-buttons-sm text-lg font-semibold flex flex-wrap gap-2">
                  <span className="bg-red-600 px-4 py-2 rounded-full hero-badge-sm">COMPRA</span>
                  <span className="bg-red-600 px-4 py-2 rounded-full hero-badge-sm">VENDA</span>
                  <span className="bg-red-600 px-4 py-2 rounded-full hero-badge-sm">TROCA</span>
                  <span className="bg-red-600 px-4 py-2 rounded-full hero-badge-sm">FINANCIA</span>
                </div>
              </div>

              <p className="text-base text-gray-50 w-full sm:max-w-lg text-left sm:text-left px-2">
                Na {STORE_NAME}, você encontra os melhores veículos seminovos com total garantia e
                procedência. Facilitamos seu sonho com as melhores condições de financiamento.
              </p>

              <div className="flex flex-wrap gap-x-[6px] gap-y-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-red-600 p-2 rounded-full">
                    <Car className="h-5 w-5" />
                  </div>
                  <span className="text-sm">Veículos Revisados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-red-600 p-2 rounded-full">
                    <Shield className="h-5 w-5" />
                  </div>
                  <span className="text-sm">Com Garantia</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-red-600 p-2 rounded-full">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="text-sm">Financiamento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-red-600 p-2 rounded-full">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <span className="text-sm">Troca Facilitada</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/veiculos">
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-lg px-8 w-full sm:w-auto"
                  >
                    Ver Veículos Disponíveis
                  </Button>                  
                </Link>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="space-y-8 min-h-[450px] flex flex-col justify-between">
              <div className="space-y-6">
                <h1 className="hero-title-sm text-3xl lg:text-5xl font-bold leading-tight">
                  FINANCIAMENTO<br />
                  <span className="text-white">EM ATÉ </span>
                  <span className="text-red-500">60X</span>
                </h1>
                
                <div className="hero-buttons-sm text-lg font-semibold flex flex-wrap gap-2">
                  <span className="bg-red-600 px-4 py-2 rounded-full hero-badge-sm">TAXAS REDUZIDAS</span>
                  <span className="bg-red-600 px-4 py-2 rounded-full hero-badge-sm">CRÉDITO RÁPIDO</span>
                </div>
                
              </div>

              <p className="text-base text-gray-50 w-full sm:max-w-lg text-left sm:text-left px-2">
                Condições exclusivas para você realizar o sonho do carro próprio sem comprometer o seu orçamento. Faça uma simulação!
              </p>

              <div className="flex flex-wrap gap-x-[6px] gap-y-3 items-center">
                <div className="flex items-center space-x-2">
                  <div className="bg-red-600 p-2 rounded-full">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="text-sm">Taxas a partir de 1,19%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-red-600 p-2 rounded-full">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <span className="text-sm">Entrada Facilitada</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setShowSimulacaoModal(true)}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-lg px-8 w-full sm:w-auto"
                >
                  Simular Agora
                </Button>
              </div>
            </div>
          </SwiperSlide>                   
        </Swiper>   

        {/* Navegação abaixo do Swiper */}
        <div className="swiper-custom-nav flex justify-center items-center mt-4 gap-4 z-10 relative">
          <button className="swiper-prev">←</button>
          <button className="swiper-next">→</button>
        </div>
      </div>   

        {/* Right side - Lead Form */}
        <div className="hero-form flex justify-center w-full max-w-[480px] mt-6 mx-auto lg:mt-0 lg:ml-8">
          <Card className="bg-black/40 backdrop-blur-sm border border-white/10">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold mb-6 text-center text-white">Encontre seu veículo ideal</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={nomeLead}
                    onChange={(e) => setNomeLead(e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, ""))}
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white">WhatsApp</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    value={telefoneLead}
                    onChange={(e) => setTelefoneLead(formatTelefone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={emailLead}
                    onChange={(e) => setEmailLead(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="interest" className="text-white">Interesse</Label>
                  <Textarea
                    id="interest"
                    name="interest"
                    required
                    value={interesseLead}
                    onChange={(e) => setInteresseLead(e.target.value)}
                    placeholder="Que tipo de veículo você procura?"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    rows={3}
                  />
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-lg py-3">Solicitar atendimento</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <SimulacaoModal
        isOpen={showSimulacaoModal}
        onClose={() => setShowSimulacaoModal(false)}
      />
      
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-sm w-full text-center px-6 py-4 rounded-lg [&>button]:hidden">
          <DialogHeader className="items-center"> {/* centraliza o conteúdo */}
            <DialogTitle className="text-xl font-semibold text-gray-900 text-center w-full">
              Solicitação de atendimento
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-700 text-base my-4">{feedback?.message}</p>

          <DialogFooter className="flex justify-center">
            <Button
              onClick={() => setShowFeedbackModal(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </section>
  )
}
