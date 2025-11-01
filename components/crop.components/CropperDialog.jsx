/* eslint-disable no-console */
import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../helpers/crop.helpers';

export default function CropperDialog({
  open,
  imageUrl,
  onClose,
  onSave,
  aspect = 1,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset states when dialog opens
  useEffect(() => {
    if (open && imageUrl) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setError('');
      setLoading(false);
    }
  }, [open, imageUrl]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    try {
      setCroppedAreaPixels(croppedAreaPixels);
      setError('');
    } catch (err) {
      console.error('Error in onCropComplete:', err);
      setError('Error saat crop gambar');
    }
  }, []);

  const handleSave = async () => {
    console.log('CropperDialog: handleSave called', { imageUrl, croppedAreaPixels });
    if (!imageUrl || !croppedAreaPixels) {
      setError('Gambar atau area crop tidak valid');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      if (croppedBlob) {
        // Convert Blob to File with proper name and type
        const croppedFile = new File([croppedBlob], 'cropped-image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        console.log('CropperDialog: invoking onSave with cropped file', croppedFile);
        onSave(croppedFile);
        console.log('CropperDialog: onSave invoked');
      } else {
        setError('Gagal memproses gambar');
      }
    } catch (err) {
      console.error('Error in handleSave:', err);
      setError('Gagal menyimpan crop gambar: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Crop Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Crop Gambar</h2>
                <p className="text-sm text-gray-500">Sesuaikan ukuran dan posisi gambar</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  console.log('CropperDialog: header close clicked (Batal)');
                  if (onClose) onClose();
                }}
                className="btn btn-ghost btn-sm"
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[calc(95vh-160px)] overflow-y-auto">
              {/* Error Display */}
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              {/* Image not loaded warning */}
              {!imageUrl && (
                <div className="alert alert-warning">
                  <span>Gambar tidak dapat dimuat. Silakan coba lagi atau pilih gambar yang berbeda.</span>
                </div>
              )}

              {/* Cropper Area */}
              {imageUrl ? (
                <div className="relative w-full h-96 bg-gray-50 rounded-lg border border-gray-200">
                  <Cropper
                    image={imageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    showGrid={true}
                    cropShape="rect"
                    objectFit="contain"
                    restrictPosition={false}
                    onImageError={() => {
                      setError('Gagal memuat gambar. Pastikan format gambar valid (JPG/PNG).');
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="loading loading-spinner loading-lg mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Memuat Gambar</h3>
                    <p className="text-gray-500">Mohon tunggu sebentar...</p>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="text-xs text-gray-500">
                Drag gambar untuk mengatur posisi, scroll untuk zoom
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {croppedAreaPixels ? 'Crop area siap untuk disimpan' : 'Sesuaikan crop area terlebih dahulu'}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    console.log('CropperDialog: Batal clicked');
                    if (onClose) onClose();
                  }}
                  disabled={loading}
                  className="btn btn-outline btn-neutral px-6 py-2 min-h-[44px] font-medium border-2"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!croppedAreaPixels || loading}
                  className="btn btn-primary px-6 py-2 min-h-[44px] font-medium border-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Memproses...
                    </>
                  ) : (
                    'Simpan Crop'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
