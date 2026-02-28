import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

function Recenter({ position, zoom = 10 }) {
    const map = useMap();

    useEffect(() => {
        if (!position?.lat || !position?.lng) return;
        map.setView([position.lat, position.lng], zoom, { animate: true });
    }, [position?.lat, position?.lng, zoom, map]);

    return null;
}

export default function DashboardLeafletMap({ position, dataAds, onMarkerClick }) {
    useEffect(() => {
        // Fix default marker icon path (Next sering bikin icon hilang)
        // Pakai CDN biar aman
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl:
                'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl:
                'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    const defaultPosition = position || { lat: -6.914, lng: 107.609 };

    const createCustomIcon = useMemo(() => {
        return (ad) =>
            L.divIcon({
                className: 'custom-marker',
                html: `
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 rounded-full overflow-hidden border-2 bg-slate-200 p-1 border-white flex justify-center items-center shadow-lg">
              ${ad?.picture_source
                        ? `<img src="${ad.picture_source}" class="w-12 h-12 object-cover rounded-full" alt="" />`
                        : `<div class="w-full h-full flex items-center justify-center">
                       <div style="width: 18px; height: 18px; background-color: ${ad?.cube_type?.color || '#888'
                        }; border-radius: 2px;"></div>
                     </div>`
                    }
            </div>
          </div>
        `,
                iconSize: [48, 48],
                iconAnchor: [24, 48],
                popupAnchor: [0, -48],
            });
    }, []);

    const getCubeName = (cube) => {
        const firstAdTitle = cube?.ads?.[0]?.title;
        return firstAdTitle || cube?.address || cube?.code || 'Tanpa Nama';
    };

    return (
        <>
            <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        }
        .leaflet-popup-content {
          margin: 8px 12px;
          min-width: 200px;
        }
      `}</style>

            <MapContainer
                center={[defaultPosition.lat, defaultPosition.lng]}
                zoom={10}
                style={{ width: '100%', height: '500px' }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Recenter position={position} zoom={10} />

                {dataAds?.map((ad) => {
                    if (!ad?.map_lat || !ad?.map_lng) return null;

                    const lat = parseFloat(ad.map_lat);
                    const lng = parseFloat(ad.map_lng);
                    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

                    return (
                        <Marker
                            key={ad?.id ?? `${lat}-${lng}`}
                            position={[lat, lng]}
                            icon={createCustomIcon(ad)}
                            eventHandlers={{
                                click: () => onMarkerClick?.(ad),
                            }}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-800">{getCubeName(ad)}</p>
                                    <button
                                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onMarkerClick?.(ad);
                                        }}
                                    >
                                        Lihat Detail
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </>
    );
}