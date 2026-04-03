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
  freeCrop?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onUploadComplete, 
  currentImageUrl, 
  folder = 'general',
  aspectRatio: initialAspectRatio = 16 / 9,
  freeCrop: initialFreeCrop = false
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFreeCrop, setIsFreeCrop] = useState(initialFreeCrop);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImage(reader.result as string);
        setIsCropping(true);
        setIsPreviewingOriginal(false);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleDirectUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}_${selectedFile.name}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(storageRef);
      onUploadComplete(url);
      setIsCropping(false);
      setIsPreviewingOriginal(false);
      setImage(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Direct upload error:", error);
      alert("Yükleme sırasında bir hata oluştu.");
    } finally {
      setUploading(false);
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
              <div className="flex items-center space-x-8">
                <div>
                  <h3 className="text-2xl font-black text-[#1a5f6b] uppercase tracking-tighter italic">
                    {isPreviewingOriginal ? 'ORİJİNAL GÖRSEL ÖNİZLEME' : 'RESMİ KIRP'}
                  </h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                    {isPreviewingOriginal ? 'Görsel olduğu gibi yüklenecektir' : 'İstediğiniz alanı seçin'}
                  </p>
                </div>
                {!isPreviewingOriginal && (
                  <div className="flex items-center bg-gray-100 p-1 rounded-2xl">
                    <button
                      onClick={() => setIsFreeCrop(false)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isFreeCrop ? 'bg-white text-[#1a5f6b] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      SABİT ORAN
                    </button>
                    <button
                      onClick={() => setIsFreeCrop(true)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFreeCrop ? 'bg-white text-[#1a5f6b] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      SERBEST
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  setIsCropping(false);
                  setIsPreviewingOriginal(false);
                }}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="relative h-[500px] bg-gray-900 flex items-center justify-center overflow-hidden">
              {isPreviewingOriginal ? (
                <img 
                  src={image} 
                  alt="Original Preview" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={isFreeCrop ? undefined : initialAspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            <div className="p-8 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
              {!isPreviewingOriginal ? (
                <>
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
                      onClick={() => setIsPreviewingOriginal(true)}
                      className="px-8 py-4 bg-gray-200 text-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-gray-300 transition-all"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>ORİJİNAL ÖNİZLE</span>
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
                          <span>Kırp ve Yükle</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[#1a5f6b] font-bold text-sm uppercase tracking-widest">
                    Görsel orijinal haliyle yüklenecek.
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setIsPreviewingOriginal(false)}
                      className="px-8 py-4 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-colors"
                    >
                      Kırpmaya Dön
                    </button>
                    <button
                      onClick={handleDirectUpload}
                      disabled={uploading}
                      className="px-10 py-4 bg-[#f97316] text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-[#1a5f6b] transition-all shadow-xl shadow-[#f97316]/20 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Orijinal Olarak Yükle</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
