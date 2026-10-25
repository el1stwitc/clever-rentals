import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import { calcStay, isRangeFree, rub, toKey, useApartments } from "@/lib/apartments";
import type { SearchState } from "./SearchBar";

export default function CityMap({ search }: { search: SearchState }) {
  const apartments = useApartments();
  const [active, setActive] = useState<string | null>(null);
  const activeId = active && apartments.some((a) => a.id === active) ? active : apartments[0]?.id;
  const apt = apartments.find((a) => a.id === activeId) ?? apartments[0];
  const { from, to } = search.range ?? {};

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([leafletModule]) => {
      if (!isMounted || !mapContainerRef.current) return;

      const L = leafletModule.default || leafletModule;
      LRef.current = L;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initial center: active apt or center of Novy Urengoy
      const centerCoords: [number, number] = apt?.coords || [66.0886, 76.6775];

      const map = L.map(mapContainerRef.current, {
        center: centerCoords,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap tiles (free, reliable, no API key required, full Cyrillic support)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add zoom control top-right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Create LayerGroup for markers
      const layerGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = layerGroup;

      renderMarkers(L, map, layerGroup);
    }).catch((err) => {
      console.error("Leaflet failed to load:", err);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers whenever apartments, activeId, or search dates change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !LRef.current) return;
    renderMarkers(LRef.current, mapInstanceRef.current, markersLayerRef.current);
  }, [apartments, activeId, from, to]);

  const renderMarkers = (L: any, map: any, layerGroup: any) => {
    layerGroup.clearLayers();

    apartments.forEach((a) => {
      const st = calcStay(a, from, to);
      const free = isRangeFree(a, from, to);
      const on = a.id === activeId;
      const coords: [number, number] = a.coords || [66.0886, 76.6775];

      const customHtml = `
        <div class="klever-map-pin ${on ? "is-active" : ""} ${!free ? "is-busy" : ""}" title="${a.title} (${a.address}) — ${rub(st.avg)}/сутки">
          <span class="pin-dot"></span>
          <span>${rub(st.avg)}</span>
        </div>
      `;

      const icon = L.divIcon({
        className: "klever-pin-wrapper",
        html: customHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker(coords, { icon });

      marker.on("click", () => {
        setActive(a.id);
        map.panTo(coords, { animate: true, duration: 0.4 });
      });

      layerGroup.addLayer(marker);
    });
  };

  const handleCardClick = (targetApt: typeof apt) => {
    if (!targetApt) return;
    setActive(targetApt.id);
    if (mapInstanceRef.current && targetApt.coords) {
      mapInstanceRef.current.panTo(targetApt.coords, { animate: true, duration: 0.4 });
    }
  };

  return (
    <section id="map" className="scroll-mt-6 pt-16 sm:pt-20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] sm:text-[12px] uppercase tracking-[0.28em] text-gold font-medium">
            Интерактивная карта Нового Уренгоя
          </p>
          <h2 className="mt-2 text-[26px] font-normal leading-tight tracking-[-0.02em] sm:mt-3 sm:text-[40px]">
            Квартиры в <span className="font-serif italic text-gold">Новом Уренгое</span>
          </h2>
        </div>
        <p className="max-w-sm text-[13px] sm:text-[14px] text-muted-foreground">
          Метки с ценами точно привязаны к домам. Вы можете перемещать и приближать карту, нажимая на адрес.
        </p>
      </div>

      <div className="mt-6 sm:mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Real Leaflet Map Container */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-[hsl(40_30%_90%)] shadow-inner sm:aspect-[16/9]">
          <div ref={mapContainerRef} className="absolute inset-0 h-full w-full z-0" />

          {/* Информационный бейдж карты */}
          <div className="glass-light pointer-events-none absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10 flex items-center gap-1.5 sm:gap-2 rounded-plate px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-[12px] text-foreground shadow-md backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Icon name="MapPin" size={13} className="text-gold" />
            <span className="font-medium">Новый Уренгой</span>
            <span className="text-muted-foreground">· {apartments.length} адресов</span>
          </div>

          {/* Кнопка перехода в полноэкранные Яндекс Карты */}
          <a
            href="https://yandex.ru/maps/11232/novy-urengoy/"
            target="_blank"
            rel="noreferrer"
            className="glass-light absolute top-2 left-2 sm:top-3 sm:left-3 z-10 hidden sm:flex items-center gap-1.5 rounded-plate px-3 py-1.5 text-[12px] text-foreground shadow-md backdrop-blur-md transition hover:text-gold"
          >
            <Icon name="ExternalLink" size={13} className="text-gold" />
            <span>Открыть в Яндекс Картах</span>
          </a>
        </div>

        {/* Selected Apartment Card Preview */}
        {apt ? (
          <Link
            to="/apartment/$id"
            params={{ id: apt.id }}
            search={{ from: from ? toKey(from) : undefined, to: to ? toKey(to) : undefined, adults: search.adults, children: search.children }}
            key={apt.id}
            onClick={() => handleCardClick(apt)}
            className="group flex animate-rise flex-col overflow-hidden rounded-card bg-card border border-border/60 transition hover:border-gold/40 shadow-sm"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <img
                src={apt.photos[0]}
                alt={apt.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              {apt.badge && (
                <span className="absolute top-2.5 left-2.5 rounded-full bg-primary/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-primary-foreground shadow-sm">
                  {apt.badge}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="text-[18px] font-medium text-foreground">{apt.title}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Icon name="MapPin" size={14} className="text-gold shrink-0" /> {apt.address} · {apt.metro}
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">
                {apt.district} · {apt.rooms} · {apt.area} м² · до {apt.guests} гостей
              </div>
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="text-[20px] font-semibold text-foreground">
                  {rub(calcStay(apt, from, to).avg)} <span className="text-[13px] font-normal text-muted-foreground">/ сутки</span>
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:translate-x-1">
                  <Icon name="ArrowRight" size={16} />
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 rounded-card bg-card text-center text-muted-foreground">
            <Icon name="Home" size={32} className="text-gold mb-2" />
            <p>Нет квартир в списке</p>
          </div>
        )}
      </div>
    </section>
  );
}
