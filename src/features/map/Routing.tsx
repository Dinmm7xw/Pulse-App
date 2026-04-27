import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface RoutingProps {
    from: [number, number];
    to: [number, number];
    onReady?: () => void;
}

export const Routing: React.FC<RoutingProps> = ({ from, to, onReady }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !from || !to) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(from[0], from[1]),
                L.latLng(to[0], to[1])
            ],
            lineOptions: {
                styles: [{ color: '#7000FF', weight: 6, opacity: 0.8 }],
                extendToWaypoints: true,
                missingRouteTolerance: 10
            },
            show: false, // Hide the textual directions panel by default
            addWaypoints: false,
            routeWhileDragging: false,
            fitSelectedRoutes: true,
            showAlternatives: false
        }).addTo(map);

        if (onReady) onReady();

        return () => {
            map.removeControl(routingControl);
        };
    }, [map, from, to, onReady]);

    return null;
};
