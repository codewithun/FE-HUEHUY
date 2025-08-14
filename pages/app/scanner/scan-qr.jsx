import { faArrowLeft, faCamera, faFlashlight, faFlashlightSlash, faQrcode, faShieldCheck } from '@fortawesome/free-solid-svg-icons';
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
      setScanResult(`Error: ${error.message || 'Unknown error processing QR code'}`);
      setLoading(false);
      setIsScanning(true);
    }
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
    <div className="lg:mx-auto lg:relative lg:max-w-md">
      <div className="container mx-auto relative z-10 min-h-screen bg-gradient-to-br from-cyan-50">
        {/* Header */}
        <div className="bg-primary px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/app" className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FontAwesomeIcon icon={faArrowLeft} className="text-lg text-white" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-white">QR Scanner</h1>
              <p className="text-sm text-white/90">
                {isScanning ? 'Arahkan kamera ke QR Code' : 'Memproses...'}
              </p>
            </div>
            <FontAwesomeIcon icon={faQrcode} className="text-xl text-white/80" />
          </div>
        </div>

        {/* Scanner Area */}
        <div className="px-4 pb-4 mt-4">
          <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
            {isScanning ? (
              <div className="relative">
                <QrScannerComponent onScan={handleScanResult} />
                <div className="absolute inset-0 border-2 border-white/30 rounded-[20px]">
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
                      <div className="animate-spin rounded-full h-16 w-16 border-3 border-gray-200 border-t-primary mx-auto"></div>
                      <FontAwesomeIcon icon={faQrcode} className="absolute inset-0 m-auto text-xl text-primary" />
                    </div>
                    <p className="text-gray-700 mt-3 font-medium text-sm">Memproses QR Code...</p>
                    <p className="text-gray-400 text-xs">Mohon tunggu sebentar</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <FontAwesomeIcon icon={faShieldCheck} className="text-2xl text-primary" />
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
              className={`flex-1 py-3 px-3 rounded-[15px] flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-sm ${
                flashOn 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-white bg-opacity-40 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={flashOn ? faFlashlightSlash : faFlashlight} className="text-base" />
              <span>{flashOn ? 'Matikan Flash' : 'Flash'}</span>
            </button>
            
            {!isScanning && (
              <button
                onClick={resetScanner}
                className="flex-1 bg-primary text-white py-3 px-3 rounded-[15px] font-medium text-sm shadow-sm hover:shadow-md transition-all"
              >
                <FontAwesomeIcon icon={faCamera} className="mr-2" />
                Scan Lagi
              </button>
            )}
          </div>
        </div>

        {/* Hasil Scan */}
        {scanResult && (
          <div className="px-4 pb-20">
            <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] p-4 shadow-sm border border-gray-100 border-l-4 border-l-primary">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldCheck} className="text-primary" />
                Hasil Scan
              </h3>
              <div className="bg-gray-50 p-3 rounded-[12px]">
                <p className="text-xs text-gray-700 font-mono break-all">{scanResult}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}