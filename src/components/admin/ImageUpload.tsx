import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Upload, X, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string;
  folder?: string;
  aspectRatio?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onUploadComplete, 
  currentImageUrl, 
  folder = 'general',
  aspectRatio = 16 / 9
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImage(reader.result as string);
        setIsCropping(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png'); // Use PNG to preserve transparency
    });
  };

  const handleUpload = async () => {
    if (!image || !croppedAreaPixels) return;

    setUploading(true);
    try {
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      await uploadBytes(storageRef, croppedImageBlob);
      const downloadURL = await getDownloadURL(storageRef);
      
      onUploadComplete(downloadURL);
      setIsCropping(false);
      setImage(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Resim yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Image or Placeholder */}
      <div className="relative group">
        <div className={`w-full aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center transition-all duration-300 ${currentImageUrl ? 'border-none' : ''}`}>
          {currentImageUrl ? (
            <img 
              src={currentImageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center p-8">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Resim Seçilmedi</p>
            </div>
          )}
        </div>
        
        <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-3xl">
          <div className="bg-white px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-xl">
            <Upload className="w-4 h-4 text-[#1a5f6b]" />
            <span className="text-xs font-black text-[#1a5f6b] uppercase tracking-widest">Resim Değiştir</span>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={onSelectFile} />
        </label>
      </div>

      {/* Cropping Modal */}
      {isCropping && image && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">RESMİ KIRP</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">İstediğiniz alanı seçin</p>
              </div>
              <button 
                onClick={() => setIsCropping(false)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="relative h-[500px] bg-gray-900">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="w-full md:w-64 space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yakınlaştır</p>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#f97316]"
                />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsCropping(false)}
                  className="px-8 py-4 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-10 py-4 bg-[#1a5f6b] text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-[#f97316] transition-all shadow-xl shadow-[#1a5f6b]/20 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Onayla ve Yükle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
