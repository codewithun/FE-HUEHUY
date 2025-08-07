import { faArrowLeft, faBolt, faCamera, faFlashlight, faFlashlightSlash, faQrcode, faShieldCheck, faStore, faTicket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import QrScannerComponent from '../../../components/construct.components/QrScannerComponent';

export default function ScanQR() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScanResult = async (result) => {
    if (!result || loading) return;
    
    setLoading(true);
    setScanResult(result);
    setIsScanning(false);

    try {
      const qrData = parseQRCode(result);
      
      if (qrData.type === 'event_booth') {
        router.push(`/app/scanner/register-event?qr=${encodeURIComponent(result)}&type=event&booth=${qrData.boothId}`);
      } else if (qrData.type === 'tenant_promo') {
        router.push(`/app/scanner/register-tenant?qr=${encodeURIComponent(result)}&type=tenant&tenantId=${qrData.tenantId}`);
      } else {
        router.push(`/app/scanner/register-event?qr=${encodeURIComponent(result)}&type=general&booth=BOOTH01`);
      }
    } catch (error) {
      console.error('Error processing QR:', error);
      setLoading(false);
      setIsScanning(true);
    }
  };

  const scanEventBooth = () => {
    const eventQR = 'event_booth_CURIOSITY2024';
    handleScanResult(eventQR);
  };

  const scanTenantPromo = () => {
    const tenantQR = 'tenant_promo_FOODCOURT01';
    handleScanResult(tenantQR);
  };

  const parseQRCode = (qrText) => {
    try {
      const data = JSON.parse(qrText);
      return data;
    } catch {
      if (qrText.includes('event') || qrText.includes('booth') || qrText.includes('curiosity')) {
        return {
          type: 'event_booth',
          boothId: extractBoothId(qrText) || 'CURIOSITY2024'
        };
      } else if (qrText.includes('tenant') || qrText.includes('promo') || qrText.includes('resto') || qrText.includes('food')) {
        return {
          type: 'tenant_promo',
          tenantId: extractTenantId(qrText) || 'FOODCOURT01'
        };
      }
      return { 
        type: 'event_booth', 
        boothId: 'CURIOSITY2024',
        data: qrText 
      };
    }
  };

  const extractBoothId = (qrText) => {
    const match = qrText.match(/booth[_-](\w+)/i);
    return match ? match[1] : null;
  };

  const extractTenantId = (qrText) => {
    const match = qrText.match(/tenant[_-](\w+)/i);
    return match ? match[1] : null;
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Sesuai HUEHUY Style */}
      <div className="bg-white px-4 py-4 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/app" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg text-gray-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">QR Scanner</h1>
            <p className="text-sm text-gray-600">
              {isScanning ? 'Arahkan kamera ke QR Code' : 'Memproses...'}
            </p>
          </div>
          <FontAwesomeIcon icon={faQrcode} className="text-xl text-gray-400" />
        </div>
      </div>

      {/* Quick Actions - Style seperti kategori HUEHUY */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <FontAwesomeIcon icon={faBolt} className="text-blue-600 text-sm" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Quick Scan</h3>
              <p className="text-xs text-gray-500">Akses cepat untuk jenis QR tertentu</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={scanEventBooth}
              className="bg-blue-500 text-white py-3 px-3 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <div className="flex flex-col items-center gap-1">
                <FontAwesomeIcon icon={faTicket} className="text-base" />
                <span className="text-xs">Event Booth</span>
              </div>
            </button>
            <button
              onClick={scanTenantPromo}
              className="bg-green-500 text-white py-3 px-3 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <div className="flex flex-col items-center gap-1">
                <FontAwesomeIcon icon={faStore} className="text-base" />
                <span className="text-xs">Tenant Promo</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Scanner Area - Style seperti card HUEHUY */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isScanning ? (
            <div className="relative">
              <QrScannerComponent onScan={handleScanResult} />
              <div className="absolute inset-0 border-2 border-white/30 rounded-xl">
                <div className="absolute top-3 left-3 w-5 h-5 border-l-3 border-t-3 border-white rounded-tl-lg"></div>
                <div className="absolute top-3 right-3 w-5 h-5 border-r-3 border-t-3 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-3 left-3 w-5 h-5 border-l-3 border-b-3 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-3 right-3 w-5 h-5 border-r-3 border-b-3 border-white rounded-br-lg"></div>
              </div>
            </div>
          ) : (
            <div className="aspect-square flex items-center justify-center p-6">
              {loading ? (
                <div className="text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-3 border-gray-200 border-t-blue-500 mx-auto"></div>
                    <FontAwesomeIcon icon={faQrcode} className="absolute inset-0 m-auto text-xl text-blue-500" />
                  </div>
                  <p className="text-gray-700 mt-3 font-medium text-sm">Memproses QR Code...</p>
                  <p className="text-gray-400 text-xs">Mohon tunggu sebentar</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-green-50 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <FontAwesomeIcon icon={faShieldCheck} className="text-2xl text-green-600" />
                  </div>
                  <p className="text-gray-800 font-medium text-sm">QR Code Berhasil Dipindai!</p>
                  <p className="text-gray-500 text-xs">Sedang mengarahkan...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-4">
        <div className="flex gap-3">
          <button
            onClick={() => setFlashOn(!flashOn)}
            className={`flex-1 py-3 px-3 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-sm ${
              flashOn 
                ? 'bg-yellow-500 text-white' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FontAwesomeIcon icon={flashOn ? faFlashlightSlash : faFlashlight} className="text-base" />
            <span>{flashOn ? 'Matikan Flash' : 'Flash'}</span>
          </button>
          
          {!isScanning && (
            <button
              onClick={resetScanner}
              className="flex-1 bg-blue-500 text-white py-3 px-3 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transition-all"
            >
              <FontAwesomeIcon icon={faCamera} className="mr-2" />
              Scan Lagi
            </button>
          )}
        </div>
      </div>

      {/* Information Cards */}
      <div className="px-4 space-y-3 pb-20">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            QR Code yang Didukung
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3 p-3 bg-blue-25 rounded-lg border border-blue-100">
              <div className="bg-blue-500 p-1.5 rounded-lg flex-shrink-0">
                <FontAwesomeIcon icon={faTicket} className="text-white text-xs" />
              </div>
              <div>
                <p className="font-medium text-blue-800 text-sm">Event Booth</p>
                <p className="text-xs text-blue-600">
                  Scan untuk voucher dan bergabung dengan komunitas sekolah
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-green-25 rounded-lg border border-green-100">
              <div className="bg-green-500 p-1.5 rounded-lg flex-shrink-0">
                <FontAwesomeIcon icon={faStore} className="text-white text-xs" />
              </div>
              <div>
                <p className="font-medium text-green-800 text-sm">Tenant & Promo</p>
                <p className="text-xs text-green-600">
                  Dapatkan promo menarik dan bergabung dengan komunitas merchant
                </p>
              </div>
            </div>
          </div>
        </div>

        {scanResult && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-green-500">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldCheck} className="text-green-600" />
              Hasil Scan
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-700 font-mono break-all">{scanResult}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}