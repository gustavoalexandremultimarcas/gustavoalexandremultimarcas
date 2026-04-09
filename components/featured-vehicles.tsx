"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar, Fuel, Settings } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { thumbUrlFromMeta } from "@/utils/thumb";

type VehicleCard = {
  id: number;
  name: string;
  brand: string | null;
  price: string | null;
  year: string | null;
  fuel: string | null;
  transmission: string | null;
  badge: string | null;
  description: string | null;
  available: boolean;
  spotlight: boolean;
  first_image_url?: string | null;
  /** <- acrescentado para usar o util existente */
  first_image_meta?: any | null;
};

export function FeaturedVehicles() {
  const [vehicles, setVehicles] = useState<VehicleCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "/api/public/vehicles?availableOnly=1&spotlight=1&withFirstImage=1&limit=12",
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!active) return;
        setVehicles((json?.vehicles ?? []) as VehicleCard[]);
      } catch (e) {
        console.error("Erro ao carregar veículos em destaque:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!loading && vehicles.length === 0) {
    return null;
  }

  const renderCard = (vehicle: VehicleCard) => {
    // usa sua função existente para gerar a thumb da Render API
    const img = thumbUrlFromMeta(
      vehicle.first_image_meta,
      vehicle.first_image_url || "/images/placeholder.webp"
    );

    const isSvg = img.endsWith(".svg");

    return (
      <div key={vehicle.id} className="w-full md:w-[330px] h-[500px] flex">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col justify-between w-full">
          <div className="w-full aspect-[1270/953] relative overflow-hidden">
            {isSvg ? (
              <img
                src={img}
                alt={vehicle.name}
                className="w-full h-full object-contain bg-white"
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholder.webp";
                }}
              />
            ) : (
              <Image
                src={img}
                alt={vehicle.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
                // se a imagem quebrar, pelo menos não trava o layout
                onError={(ev) => {
                  try {
                    (ev.currentTarget as any).src = "/images/placeholder.webp";
                  } catch { }
                }}
              />
            )}
            {vehicle.badge && (
              <Badge className="absolute top-4 left-4 bg-red-600">
                {vehicle.badge}
              </Badge>
            )}
          </div>

          <CardContent className="p-6 flex flex-col justify-between flex-grow">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                {vehicle.name}
              </h3>
              {vehicle.price && (
                <div className="text-2xl font-bold text-red-600 mb-4">
                  {vehicle.price}
                </div>
              )}
              {vehicle.description && (
                <p className="text-sm text-gray-600 truncate mb-4">
                  {vehicle.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{vehicle.year ?? "—"}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Fuel className="h-4 w-4" />
                  <span>{vehicle.fuel ?? "—"}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Settings className="h-4 w-4" />
                  <span>{vehicle.transmission ?? "—"}</span>
                </div>
              </div>
            </div>
            <Link href={`/veiculos/${vehicle.id}`}>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Ver Detalhes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Veículos em Destaque
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Confira nossa seleção especial de veículos com as melhores condições
          </p>
        </div>

        {/* Cards (desktop) */}
        <div className="hidden sm:flex flex-wrap justify-center gap-8 mb-12">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-full md:w-[330px] h-[500px] bg-gray-100 animate-pulse rounded-xl"
              />
            ))
            : vehicles.map(renderCard)}
        </div>

        {/* Carousel (mobile) */}
        <div className="block sm:hidden mb-12">
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={16}
            slidesPerView={1}
            className="[&_.swiper-pagination-bullets]:!static [&_.swiper-pagination-bullets]:!mt-4"
          >
            {(loading ? [] : vehicles).map((v) => (
              <SwiperSlide key={v.id}>{renderCard(v)}</SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="text-center">
          <Link href="/veiculos">
            <Button
              size="lg"
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              Ver Todos os Veículos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
