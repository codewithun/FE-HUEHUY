/* eslint-disable @next/next/no-img-element */
import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

function Recenter({ position, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (!position?.lat || !position?.lng) return;
        map.setView([position.lat, position.lng], zoom, { animate: true });
    }, [position?.lat, position?.lng, zoom, map]);
    return null;
}

export default function BerburuLeafletMap({ position, dataAds, height = 250, zoom = 9 }) {
    useEffect(() => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    const defaultPosition = position || { lat: -6.905977, lng: 107.613144 };

    const createIcon = (ad) =>
        L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="display:flex;flex-direction:column;align-items:center">
                    <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;border:2px solid white;background:#e2e8f0;padding:4px;display:flex;justify-content:center;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.2)">
                        ${ad?.cube?.picture_source
                    ? `<img src="${ad.cube.picture_source}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" alt="" />`
                    : `<div style="width:18px;height:18px;background-color:${ad?.cube?.cube_type?.color || '#888'};border-radius:2px"></div>`
                }
                    </div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            popupAnchor: [0, -48],
        });

    return (
        <>
            <style jsx global>{`
                .custom-marker { background: transparent; border: none; }
                .leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); }
                .leaflet-popup-content { margin: 8px 12px; min-width: 160px; }
            `}</style>
            <MapContainer
                center={[defaultPosition.lat, defaultPosition.lng]}
                zoom={zoom}
                style={{ width: '100%', height: `${height}px` }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Recenter position={position} zoom={zoom} />
                {dataAds?.map((ad) => {
                    if (!ad?.cube?.map_lat || !ad?.cube?.map_lng) return null;
                    const lat = parseFloat(ad.cube.map_lat);
                    const lng = parseFloat(ad.cube.map_lng);
                    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
                    return (
                        <Marker
                            key={ad?.id ?? `${lat}-${lng}`}
                            position={[lat, lng]}
                            icon={createIcon(ad)}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {ad?.title || ad?.cube?.address || 'Promo'}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </>
    );
}
