"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, MessageCircle, Clock, Mail } from "lucide-react"
import { useState, useEffect } from "react"
import { STORE_ADDRESS, STORE_CITY_STATE, STORE_PHONE, STORE_EMAIL, MAPS_LINK, MAPS_EMBED } from "@/lib/config"

export function ContactSection() {
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactSubject, setContactSubject] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15)
  }

  useEffect(() => {
    if (/\d/.test(contactName)) {
      setContactName(contactName.replace(/\d/g, ""))
    }
  }, [contactName])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = {
      tipoFormulario: "contato_geral",
      nome: contactName,
      telefone: contactPhone,
      email: contactEmail,
      assunto: contactSubject,
      mensagem: contactMessage
    }

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setFeedback({ type: "success", message: "Mensagem enviada com sucesso! Em breve entraremos em contato." })
        setContactName("")
        setContactPhone("")
        setContactEmail("")
        setContactSubject("")
        setContactMessage("")
      } else {
        const errorText = await response.text()
        setFeedback({ type: "error", message: `Erro: ${errorText || "Resposta inesperada do servidor."}` })
      }
    } catch (error: any) {
      setFeedback({ type: "error", message: `Erro de rede: ${error?.message || "Erro desconhecido"}` })
    }
  }

  return (
    <section id="contato" className="py-20 text-white bg-black overflow-x-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Entre em Contato</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Estamos prontos para ajudar você a encontrar o veículo dos seus sonhos
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8 min-w-0">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Informações de Contato</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-red-500 hidden sm:block" />
                    Endereço
                  </h4>
                  <div className="rounded-lg overflow-hidden border border-white/10 w-full max-w-full">
                    <a
                      href={MAPS_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <iframe
                        src={MAPS_EMBED}
                        width="100%"
                        height="220"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full max-w-full"
                      ></iframe>
                    </a>
                    <p className="text-gray-300 text-sm text-center mt-2">
                      {STORE_ADDRESS}<br />{STORE_CITY_STATE}
                    </p>
                  </div>
                </div>                

                <div className="flex items-start space-x-0 sm:space-x-4">
                  <MessageCircle className="h-6 w-6 text-red-500 mt-1 hidden sm:block" />
                  <div>
                    <h4 className="font-semibold">WhatsApp</h4>
                    <p className="text-gray-300">{STORE_PHONE}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-0 sm:space-x-4">
                  <Mail className="h-6 w-6 text-red-500 mt-1 hidden sm:block" />
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-gray-300">{STORE_EMAIL}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-0 sm:space-x-4">
                  <Clock className="h-6 w-6 text-red-500 mt-1 hidden sm:block" />
                  <div>
                    <h4 className="font-semibold">Horário de Funcionamento</h4>
                    <p className="text-gray-300">
                      Segunda a Sexta: 9h às 18h
                      <br />
                      Sábado: 8h às 13h
                      <br />
                      Domingos e Feriados: Atendimento com hora marcada
                    </p>
                  </div>
                </div>                
              </div>
            </div>

            <div className="bg-red-600 p-6 rounded-lg">
              <h4 className="text-xl font-semibold mb-2">Atendimento Personalizado</h4>
              <p className="text-red-100">
                Nossa equipe está pronta para oferecer o melhor atendimento e encontrar o veículo perfeito para suas
                necessidades.
              </p>
            </div>
          </div>

          <div id="contato-footer" className="flex flex-col justify-end h-full min-w-0">
            <Card className="bg-white text-gray-900 w-full max-w-full">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-2xl font-semibold mb-6">Envie sua Mensagem</h3>
                {feedback ? (
                  <p className={`mb-4 ${feedback.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {feedback.message}
                  </p>
                ) : null}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-name">Nome</Label>
                      <Input
                        id="contact-name"
                        placeholder="Seu nome"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-phone">Telefone</Label>
                      <Input
                        id="contact-phone"
                        placeholder="(17) 99999-9999"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(formatTelefone(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contact-email">E-mail</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-subject">Assunto</Label>
                    <Input
                      id="contact-subject"
                      placeholder="Como podemos ajudar?"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-message">Mensagem</Label>
                    <Textarea
                      id="contact-message"
                      placeholder="Descreva sua necessidade ou dúvida..."
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-lg py-3">
                    Enviar Mensagem
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
