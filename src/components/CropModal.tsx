import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { Check, X } from 'lucide-react';
import './CropModal.css';

interface CropModalProps {
    image: string;
    onCropComplete: (croppedAreaPixels: Area) => void;
    onClose: () => void;
}

export const CropModal: React.FC<CropModalProps> = ({ image, onCropComplete, onClose }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onConfirm = () => {
        if (croppedAreaPixels) {
            onCropComplete(croppedAreaPixels);
        }
    };

    return (
        <div className="crop-modal-overlay">
            <header className="crop-header">
                <button className="icon-btn" onClick={onClose}><X size={24} /></button>
                <span>Кадрирование</span>
                <button className="confirm-btn" onClick={onConfirm}><Check size={20} /> Готово</button>
            </header>
            
            <div className="cropper-container">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={9/16}
                    onCropChange={onCropChange}
                    onCropComplete={handleCropComplete}
                    onZoomChange={onZoomChange}
                />
            </div>

            <div className="crop-controls">
                <div className="zoom-slider">
                    <span>-</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                    />
                    <span>+</span>
                </div>
            </div>
        </div>
    );
};
