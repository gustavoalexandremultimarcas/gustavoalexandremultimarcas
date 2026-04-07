"use client"

import { Car, Shield, CreditCard, RefreshCcw, Store } from "lucide-react";
import { Card, CardContent } from "../components/ui/card"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"

export function ServicesSection() {
  const services = [
  {
    title: "Compra de Veículos",
    description: "Compramos seu veículo pelo melhor preço do mercado com avaliação justa e transparente.",
    icon: Car,
  },
  {
    title: "Venda com Garantia",
    description: "Todos os nossos veículos passam por rigorosa inspeção e vêm com garantia inclusa.",
    icon: Shield,
  },
  {
    title: "Financiamento",
    description: "Oferecemos as melhores condições de financiamento com parcelas que cabem no seu bolso.",
    icon: CreditCard,
  },
  {
    title: "Troca Facilitada",
    description: "Troque seu veículo atual por um novo com as melhores condições e facilidades.",
    icon: RefreshCcw,
  },
  {
    title: "Consignação",
    description: "Deixe seu veículo com a gente! Nós cuidamos da venda para você com segurança e praticidade.",
    icon: Store,
  },
]

  return (
    <section id="servicos" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Nossos Serviços</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Oferecemos soluções completas para todas as suas necessidades automotivas
          </p>
        </div>

        {/* Mobile - Carrossel */}  
        <div className="lg:hidden">
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true, el: ".custom-pagination" }}
            spaceBetween={16}
            slidesPerView={1.2}
            centeredSlides={true}
          >
            {services.map((service, index) => (
              <SwiperSlide key={index}>
                <Card className="text-center h-[320px]">
                  <CardContent className="p-8 flex flex-col justify-start items-center h-full">
                    <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mb-6 shrink-0">
                      <service.icon className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{service.title}</h3>
                    <p className="text-gray-600">{service.description}</p>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* PAGINAÇÃO FORA DO CARD */}
          <div className="custom-pagination mt-4 flex justify-center" />
        </div>

        {/* Desktop - Grid com ícones idênticos */}
        <div className="hidden lg:flex lg:flex-wrap lg:justify-center gap-8 max-w-[960px] mx-auto">
          {services.map((service, index) => (
            <Card
              key={index}
              className="text-center hover:shadow-lg transition-shadow h-[320px] flex-none w-[280px]"
            >
              <CardContent className="p-8 flex flex-col justify-start items-center h-full">
                <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mb-6 shrink-0">
                  <service.icon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}