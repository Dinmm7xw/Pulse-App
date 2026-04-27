import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapView.css';
import { usePulseStore } from '../../store/useStore';
import { auth } from '../../lib/firebase';
import { Routing } from './Routing';
import { Compass, Search, Plus, Navigation, X } from 'lucide-react';
import { PlaceDetails } from './PlaceDetails';
import { CreateShoutModal } from './CreateShoutModal';

const NEUTRAL_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;

// Leaflet icon fix
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Sub-component to sync map instance to parent
const MapHook: React.FC<{ onMap: (map: L.Map) => void }> = ({ onMap }) => {
    const map = useMap();
    useEffect(() => { if (map) onMap(map); }, [map, onMap]);
    return null;
};

export const MapView: React.FC = () => {
    const { userLocation: storeUserLocation, updateLocation, friendsLocations, shouts } = usePulseStore();
    const [userPos, setUserPos] = useState<[number, number]>([43.2389, 76.8897]);
    const [map, setMap] = useState<L.Map | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<any>(null);
    const [isCreateShoutOpen, setIsCreateShoutOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [targetRoute, setTargetRoute] = useState<[number, number] | null>(null);

    const events = [
      { id: 'e1', name: 'Футбол: Кайрат vs Астана', type: 'match', pos: [43.238, 76.924], desc: 'Центральный стадион. Начало в 19:00.' },
      { id: 'e2', name: 'Концерт: Sun Thali', type: 'concert', pos: [43.242, 76.905], desc: 'Дворец Республики. Начало в 20:00.' }
    ];

    useEffect(() => {
        updateLocation();
        const interval = setInterval(updateLocation, 10000);
        return () => clearInterval(interval);
    }, [updateLocation]);

    useEffect(() => {
        if (storeUserLocation) setUserPos(storeUserLocation);
    }, [storeUserLocation]);

    const hotZones = [
        { center: [43.235, 76.91], color: 'var(--primary-color)', radius: 300 },
        { center: [43.245, 76.88], color: 'var(--accent-color)', radius: 400 },
    ];

    const createFriendIcon = (isUser = false, photoURL?: string) => {
        const urlOrNeutral = photoURL || NEUTRAL_AVATAR;
        const content = `<img src="${urlOrNeutral}" class="marker-avatar-img" />`;
        return L.divIcon({
            className: 'friend-marker',
            html: `
                <div class="marker-container ${isUser ? 'is-user' : ''}">
                    <div class="avatar-circle-inner blur-avatar">
                        ${content}
                    </div>
                    <div class="online-indicator"></div>
                </div>
            `,
            iconSize: [50, 50],
            iconAnchor: [25, 25],
        });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            // Strictly limit results to Kazakhstan (kz)
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=kz`;
            const res = await fetch(url);
            const data = await res.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result: any) => {
        const pos: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
        map?.flyTo(pos, 16);
        setSearchResults([]);
        setSearchQuery(result.display_name);
        setSelectedPlace({
            id: result.place_id,
            name: result.display_name.split(',')[0],
            desc: result.display_name,
            pos: pos
        });
    };

    const openNavigation = (lat: number, lng: number) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };

    const open2GIS = (lat: number, lng: number) => {
        const url = `https://2gis.kz/search/${lat},${lng}`;
        window.open(url, '_blank');
    };

    const getShoutIconHtml = (type: string) => {
        switch(type) {
            case 'love': return '❤️';
            case 'hype': return '⚡';
            case 'meet': return '👥';
            case 'question': return '💬';
            default: return '📍';
        }
    };

    return (
        <div className="map-wrapper">
            <MapContainer
                center={userPos}
                zoom={14}
                zoomControl={false}
                attributionControl={false}
                className="leaflet-container-pulse"
                key={userPos[0]} 
            >
                <MapHook onMap={setMap} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

                {hotZones.map((zone, idx) => (
                    <Circle key={idx} center={zone.center as any} radius={zone.radius}
                        pathOptions={{ fillColor: zone.color, color: zone.color, fillOpacity: 0.2, weight: 1 }} />
                ))}

                {events.map((e) => (
                  <Marker 
                    key={e.id} 
                    position={e.pos as any} 
                    icon={L.divIcon({ 
                        className: 'event-marker', 
                        html: `<div class="event-circle">${e.type === 'match' ? '⚽' : '🎸'}</div>`, 
                        iconSize: [35, 35], 
                        iconAnchor: [17, 17] 
                    })}
                  >
                    <Popup>
                        <div className="event-popup">
                            <h3>{e.name}</h3>
                            <p>{e.desc}</p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                <button className="primary-action-mini">Я пойду</button>
                                <button 
                                    className="secondary-action-mini" 
                                    onClick={() => setTargetRoute(e.pos as [number, number])}
                                >
                                    Путь
                                </button>
                                <button 
                                    className="route-mini-btn 2gis" 
                                    onClick={() => open2GIS(e.pos[0], e.pos[1])}
                                    style={{ background: '#2DBE2C', color: 'white', border: 'none', padding: '0 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                                >
                                    2GIS
                                </button>
                            </div>
                        </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Render Shouts */}
                {shouts.map((shout) => (
                    <Marker 
                        key={shout.id} 
                        position={[shout.lat, shout.lng]} 
                        icon={L.divIcon({ 
                            className: 'shout-marker', 
                            html: `<div class="shout-circle">${getShoutIconHtml(shout.type)}</div>`, 
                            iconSize: [40, 40], 
                            iconAnchor: [20, 20] 
                        })}
                    >
                        <Popup className="shout-popup">
                            <div className="shout-popup-content">
                                {shout.isAnonymous ? <strong>Аноним</strong> : <strong>Пользователь</strong>}
                                <p>{shout.text}</p>
                                <button 
                                    className="route-mini-btn primary" 
                                    onClick={() => {
                                        updateLocation();
                                        setTargetRoute([shout.lat, shout.lng]);
                                    }}
                                    style={{ marginTop: '8px', width: '100%', border: 'none', color: 'white', cursor: 'pointer' }}
                                >
                                    <Navigation size={14} style={{ marginRight: '4px' }} />
                                    Построить маршрут
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <Marker position={userPos} icon={createFriendIcon(true, auth.currentUser?.photoURL || '')}>
                    <Popup>Это вы - Pulse активен!</Popup>
                </Marker>

                {(friendsLocations || []).map((f) => (
                    <Marker key={f.id} position={[f.lat, f.lng]} icon={createFriendIcon(false, f.photoURL)}>
                        <Popup className="friend-popup">
                            <div className="friend-popup-content">
                                <strong>{f.displayName}</strong>
                                <p>Друг • В сети</p>
                                <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                                    <button className="chat-mini-btn glass">Чат</button>
                                    <button 
                                        className="route-mini-btn primary" 
                                        onClick={() => {
                                            updateLocation();
                                            setTargetRoute([f.lat, f.lng]);
                                        }}
                                    >
                                        Путь
                                    </button>
                                    <button 
                                        className="route-mini-btn 2gis" 
                                        onClick={() => open2GIS(f.lat, f.lng)}
                                        style={{ background: '#2DBE2C', color: 'white', border: 'none', padding: '0 8px' }}
                                    >
                                        2GIS
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {selectedPlace && (
                    <Marker position={selectedPlace.pos} icon={L.divIcon({ className: 'search-marker', html: '<div class="pin">📍</div>', iconSize: [30, 30], iconAnchor: [15, 30] })}>
                        <Popup>
                            <div className="search-popup">
                                <strong>{selectedPlace.name}</strong>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button className="route-mini-btn primary" onClick={() => setTargetRoute(selectedPlace.pos)} style={{ flex: 2 }}>
                                        Путь
                                    </button>
                                    <button 
                                        className="route-mini-btn 2gis" 
                                        onClick={() => open2GIS(selectedPlace.pos[0], selectedPlace.pos[1])}
                                        style={{ background: '#2DBE2C', color: 'white', border: 'none', flex: 1, borderRadius: '8px', fontWeight: 'bold' }}
                                    >
                                        2GIS
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {targetRoute && (
                    <Routing from={userPos} to={targetRoute} onReady={() => console.log("Route ready")} />
                )}
            </MapContainer>

            {/* Recenter Button */}
            <button 
                className="map-recenter-btn-pulse"
                onClick={() => {
                    console.log('Recentering...', userPos);
                    map?.flyTo(userPos, 16, { duration: 1 });
                }}
            >
                <Compass size={28} color="white" />
            </button>

            {/* Add Shout Button */}
            <button 
                className="map-add-shout-btn"
                onClick={() => setIsCreateShoutOpen(true)}
            >
                <Plus size={24} color="white" />
            </button>

            {/* Clear Route Button */}
            {targetRoute && (
                <button 
                    className="map-clear-route-btn"
                    onClick={() => setTargetRoute(null)}
                >
                    <X size={20} color="white" />
                    <span>Отмена пути</span>
                </button>
            )}

            <div className="map-overlay-top">
                <form className="search-bar glass" onSubmit={handleSearch}>
                    <Search size={18} color="var(--text-dim)" />
                    <input 
                        type="text" 
                        placeholder="Поиск мест, адресов..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {isSearching && <div className="loader-mini" />}
                </form>

                {searchResults.length > 0 && (
                    <div className="search-results-overlay glass">
                        {searchResults.map((res) => (
                            <div key={res.place_id} className="search-result-item" onClick={() => selectSearchResult(res)}>
                                <div className="res-icon">📍</div>
                                <div className="res-text">
                                    <div className="res-name">{res.display_name.split(',')[0]}</div>
                                    <div className="res-address">{res.display_name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="map-overlay-bottom">
                {!selectedPlace && (
                    <div className="status-pills">
                        <div className="pill glass active">🔥 В центре</div>
                        <div className="pill glass">⚽ Футбол</div>
                        <div className="pill glass">🎸 Музыка</div>
                        <div className="pill glass">🌟 Рекомендации</div>
                    </div>
                )}
            </div>

            <PlaceDetails isOpen={!!selectedPlace} onClose={() => setSelectedPlace(null)} place={selectedPlace} />
            <CreateShoutModal isOpen={isCreateShoutOpen} onClose={() => setIsCreateShoutOpen(false)} location={userPos} />
        </div>
    );
};
