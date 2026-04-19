import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapView.css';
import { usePulseStore } from '../../store/useStore';
import { auth } from '../../lib/firebase';
import { Compass, Search, Plus } from 'lucide-react';
import { PlaceDetails } from './PlaceDetails';
import { CreateShoutModal } from './CreateShoutModal';

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

    const events = [
      { id: 'e1', name: 'Футбол: Кайрат vs Астана', type: 'match', pos: [43.238, 76.924], desc: 'Центральный стадион. Начало в 19:00.' },
      { id: 'e2', name: 'Концерт: Sun Thali', type: 'concert', pos: [43.242, 76.905], desc: 'Дворец Республики. Начало в 20:00.' }
    ];

    useEffect(() => {
        updateLocation();
        const interval = setInterval(updateLocation, 30000);
        return () => clearInterval(interval);
    }, [updateLocation]);

    useEffect(() => {
        if (storeUserLocation) setUserPos(storeUserLocation);
    }, [storeUserLocation]);

    const hotZones = [
        { center: [43.235, 76.91], color: 'var(--primary-color)', radius: 300 },
        { center: [43.245, 76.88], color: 'var(--accent-color)', radius: 400 },
    ];

    const createFriendIcon = (avatar: string, isUser = false, photoURL?: string) => {
        const content = photoURL 
            ? `<img src="${photoURL}" class="marker-avatar-img" />` 
            : `<span>${avatar}</span>`;
        return L.divIcon({
            className: 'friend-marker',
            html: `
                <div class="marker-container ${isUser ? 'is-user' : ''}">
                    <div class="avatar-circle-inner">
                        ${content}
                    </div>
                    <div class="online-indicator"></div>
                </div>
            `,
            iconSize: [50, 50],
            iconAnchor: [25, 25],
        });
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
                            <button className="primary-action-mini">Я пойду</button>
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
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <Marker position={userPos} icon={createFriendIcon('', true, auth.currentUser?.photoURL || '')}>
                    <Popup>Это вы - Pulse активен!</Popup>
                </Marker>

                {friendsLocations.map((f) => (
                    <Marker key={f.id} position={[f.lat, f.lng]} icon={createFriendIcon('', false, f.photoURL)}>
                        <Popup className="friend-popup">
                            <div className="friend-popup-content">
                                <strong>{f.displayName}</strong>
                                <p>Друг • В сети</p>
                                <button className="chat-mini-btn glass">Чат</button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
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

            <div className="map-overlay-top">
                <div className="search-bar glass">
                    <Search size={18} color="var(--text-dim)" />
                    <input type="text" placeholder="Поиск мероприятий и друзей..." />
                </div>
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
