import React, { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from 'react-leaflet';

type Center = { lat: number; lng: number };

type Props = {
  center: Center;
  zoom?: number;
  onMoveStart?: () => void;
  onMoveEnd?: (center: Center) => void;
  onMapClick?: (pos: Center) => void;
};

const createPinIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="
      width: 28px;
      height: 28px;
      background: #2563eb;
      border: 3px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

function Recenter({ center }: { center: Center }) {
  const map = useMap();

  useEffect(() => {
    if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: false });
  }, [center.lat, center.lng, map]);

  return null;
}

function MapEvents({
  onMoveStart,
  onMoveEnd,
  onMapClick,
}: {
  onMoveStart?: () => void;
  onMoveEnd?: (center: Center) => void;
  onMapClick?: (pos: Center) => void;
}) {
  const map = useMap();

  useMapEvents({
    movestart: () => {
      onMoveStart?.();
    },
    moveend: () => {
      const c = map.getCenter();
      onMoveEnd?.({ lat: c.lat, lng: c.lng });
    },
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick?.({ lat, lng });
      map.setView([lat, lng], map.getZoom(), { animate: true });
    },
  });

  return null;
}

export default function InputMapLeaflet({ center, zoom = 18, onMoveStart, onMoveEnd, onMapClick }: Props) {
  // Guard: react-leaflet expects numbers
  const safeCenter: Center = {
    lat: Number.isFinite(center?.lat) ? center.lat : -6.208,
    lng: Number.isFinite(center?.lng) ? center.lng : 106.689,
  };

  return (
    <MapContainer
      center={[safeCenter.lat, safeCenter.lng]}
      zoom={zoom}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[safeCenter.lat, safeCenter.lng]} icon={createPinIcon()} />
      <Recenter center={safeCenter} />
      <MapEvents onMoveStart={onMoveStart} onMoveEnd={onMoveEnd} onMapClick={onMapClick} />
    </MapContainer>
  );
}
