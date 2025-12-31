"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { BusinessSettings } from "@prisma/client";

// Define strict type for Serialized settings (Decimals converted to numbers)
// Define strict type for Serialized settings (Decimals converted to numbers)
type SerializedBusinessSettings = Omit<BusinessSettings, 'zone1Fee' | 'zone2Fee' | 'zone3Fee'> & {
    zone1Fee: number;
    zone2Fee: number;
    zone3Fee: number;
};

// Fix for default marker icon in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/marker-icon-2x.png', // We need to ensure these exist or use CDN
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
});

// Since we can't easily rely on local assets without copying them, let's use CDN for icons
const ICON_URL = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png";
const ICON_RETINA_URL = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png";
const SHADOW_URL = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconRetinaUrl: ICON_RETINA_URL,
    iconUrl: ICON_URL,
    shadowUrl: SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    settings: SerializedBusinessSettings;
    onLocationSelect: (data: { lat: number; lng: number; fee: number; valid: boolean; address?: string }) => void;
}

function LocationMarker({ onLocationSelect, settings }: LocationPickerProps) {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const map = useMap();

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            handleSelect(lat, lng);
        },
    });

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleSelect = async (lat: number, lng: number) => {
        setPosition({ lat, lng });

        // Calculate Distance
        const distance = calculateDistance(settings.baseLatitude, settings.baseLongitude, lat, lng);

        let fee = 0;
        let valid = true;

        if (distance <= settings.zone1RadiusKm) {
            fee = Number(settings.zone1Fee);
        } else if (distance <= settings.zone2RadiusKm) {
            fee = Number(settings.zone2Fee);
        } else if (distance <= settings.maxRadiusKm) {
            // Zone 3: Between Zone 2 and Max Radius
            fee = Number(settings.zone3Fee);
        } else {
            valid = false;
        }

        // Reverse Geocode
        let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
                address = data.display_name; // Full address
            }
        } catch (e) {
            console.error("Geocoding error", e);
        }

        onLocationSelect({ lat, lng, fee, valid, address });
    };

    return position === null ? null : (
        <Marker position={position}>
            <Popup>Local Selecionado</Popup>
        </Marker>
    );
}

export default function LocationPicker({ settings, onLocationSelect }: LocationPickerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const mapRef = useRef<L.Map>(null);

    const handleSearch = async () => {
        // e.preventDefault() not needed as we are not in a form
        if (!searchTerm) return;

        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const latNum = parseFloat(lat);
                const lonNum = parseFloat(lon);

                mapRef.current?.setView([latNum, lonNum], 15);
                // We don't auto-select, user must click to confirm exact house
            } else {
                alert("Morada não encontrada.");
            }
        } catch (e) {
            alert("Erro na pesquisa.");
        }
        setIsSearching(false);
    };

    if (!settings) return <div>A carregar mapa...</div>;

    const basePos: [number, number] = [settings.baseLatitude, settings.baseLongitude];

    return (
        <div className="space-y-4">
            {/* SEARCH BAR */}
            {/* SEARCH BAR - Changed to div to avoid nested forms in Wizard */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent submitting the parent form
                            handleSearch();
                        }
                    }}
                    placeholder="Pesquisar morada..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="button" // Changed to button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSearching ? "..." : "🔍"}
                </button>
            </div>

            <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border-2 border-slate-200 relative z-0">
                <MapContainer
                    center={basePos}
                    zoom={11}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* BASE LOCATION */}
                    <Marker position={basePos}>
                        <Popup>
                            <strong>Base (Patinhas na Lua)</strong>
                        </Popup>
                    </Marker>

                    {/* ZONES */}
                    {/* Zone 1 (Green) */}
                    <Circle
                        center={basePos}
                        radius={settings.zone1RadiusKm * 1000}
                        pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
                    />

                    {/* Zone 2 (Yellow) */}
                    <Circle
                        center={basePos}
                        radius={settings.zone2RadiusKm * 1000}
                        pathOptions={{ color: 'yellow', fillColor: 'yellow', fillOpacity: 0.1 }}
                    />

                    {/* Limit (Red) */}
                    <Circle
                        center={basePos}
                        radius={settings.maxRadiusKm * 1000}
                        pathOptions={{ color: 'red', fillOpacity: 0.0, dashArray: '10, 10' }}
                    />

                    <LocationMarker settings={settings} onLocationSelect={onLocationSelect} />
                </MapContainer>
            </div>

            <p className="text-xs text-gray-400 text-center">
                Clique no mapa para definir a localização exata do serviço.
            </p>
        </div>
    );
}

