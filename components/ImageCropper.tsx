
import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';
import { X, Check, RotateCcw } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  aspectRatio: number;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  circularCrop?: boolean;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ 
  image, 
  aspectRatio, 
  onCropComplete, 
  onCancel,
  circularCrop = false
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [aspect, setAspect] = useState<number | undefined>(aspectRatio);
  const [imageAspect, setImageAspect] = useState<number>(1);

  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      setImageAspect(img.width / img.height);
    };
  }, [image]);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onRotationChange = (rotation: number) => {
    setRotation(rotation);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(
        image,
        croppedAreaPixels,
        rotation
      );
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-bottom flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Fotoğrafı Düzenle</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="relative flex-1 min-h-[300px] bg-gray-200">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            cropShape={circularCrop ? 'round' : 'rect'}
            showGrid={true}
          />
        </div>

        <div className="p-6 space-y-4 bg-white overflow-y-auto">
          {!circularCrop && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">En-Boy Oranı</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '1:1', value: 1 },
                  { label: '4:3', value: 4/3 },
                  { label: '16:9', value: 16/9 },
                  { label: 'Orijinal', value: imageAspect },
                  { label: 'Serbest', value: undefined },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setAspect(opt.value);
                      setZoom(1);
                      setCrop({ x: 0, y: 0 });
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      aspect === opt.value 
                        ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-sm' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Yakınlaştır</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Döndür</span>
                <span>{rotation}°</span>
              </div>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setCrop({ x: 0, y: 0 });
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={18} /> Sıfırla
            </button>
            <button
              onClick={showCroppedImage}
              className="flex-[2] flex items-center justify-center gap-2 py-2 px-4 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 transition-opacity font-bold"
            >
              <Check size={18} /> Uygula ve Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
