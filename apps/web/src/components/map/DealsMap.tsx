'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { MapPin } from '@grspecials/types'

interface DealsMapProps {
  pins: MapPin[]
  center?: [number, number]
  zoom?: number
  onPinClick?: (pin: MapPin) => void
}

export function DealsMap({ pins, center = [-85.6681, 42.9634], zoom = 12, onPinClick }: DealsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const [loaded, setLoaded] = useState(false)
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)

  const handlePinClick = useCallback(
    (pin: MapPin) => {
      setSelectedPin(pin)
      onPinClick?.(pin)
    },
    [onPinClick],
  )

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.warn('[DealsMap] NEXT_PUBLIC_MAPBOX_TOKEN not set')
      return
    }

    // Dynamically import mapbox-gl to avoid SSR issues
    import('mapbox-gl').then((mapboxgl) => {
      mapboxgl.default.accessToken = token

      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center,
        zoom,
        attributionControl: false,
      })

      mapRef.current = map

      map.on('load', () => {
        setLoaded(true)

        // Add deal pins
        pins.forEach((pin) => {
          const el = document.createElement('div')
          el.className = 'deal-map-pin'
          el.style.cssText = `
            width: 32px; height: 32px; border-radius: 50%;
            background: ${pin.featured ? '#F5C518' : pin.categoryColor};
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; transition: transform 0.15s;
          `
          el.title = pin.title

          el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)' })
          el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
          el.addEventListener('click', () => handlePinClick(pin))

          new mapboxgl.default.Marker({ element: el })
            .setLngLat([pin.lng, pin.lat])
            .addTo(map)
        })
      })
    })

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  }, [center, zoom, pins, handlePinClick])

  return (
    <div className="relative w-full" style={{ height: 'var(--map-height-mobile)' }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-card z-10">
          <div className="text-text-secondary text-sm">Loading map…</div>
        </div>
      )}
      <div ref={mapContainer} className="h-full w-full rounded-card overflow-hidden" />

      {/* Selected pin popup */}
      {selectedPin && (
        <div className="absolute bottom-4 left-4 right-4 z-10 rounded-card bg-white shadow-card-hover p-3 max-w-xs">
          <button
            onClick={() => setSelectedPin(null)}
            className="absolute top-2 right-2 text-text-muted hover:text-text-primary"
          >
            ×
          </button>
          <p className="font-semibold text-sm text-text-primary line-clamp-2">{selectedPin.title}</p>
          <p className="text-xs text-text-secondary mt-0.5">{selectedPin.venueName}</p>
          <a
            href={`/deals/${selectedPin.slug}`}
            className="mt-2 inline-block text-xs font-medium text-brand-blue hover:underline"
          >
            View deal →
          </a>
        </div>
      )}
    </div>
  )
}
