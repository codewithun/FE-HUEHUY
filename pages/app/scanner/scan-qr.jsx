import { faArrowLeft, faFlashlight, faFlashlightSlash, faQrcode } from '@fortawesome/free-solid-svg-icons';
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
      // Analisis QR Code untuk menentukan flow
      const qrData = parseQRCode(result);
      
      if (qrData.type === 'event_booth') {
        // Flow Voucher Sekolah - Event Curiosity
        router.push(`/app/scanner/register-event?qr=${encodeURIComponent(result)}&type=event&booth=${qrData.boothId}`);
      } else if (qrData.type === 'tenant_promo') {
        // Flow Promo Tenant
        router.push(`/app/scanner/register-tenant?qr=${encodeURIComponent(result)}&type=tenant&tenantId=${qrData.tenantId}`);
      } else {
        // QR tidak dikenali - demo fallback
        router.push(`/app/scanner/register-event?qr=${encodeURIComponent(result)}&type=demo&booth=DEMO01`);
      }
    } catch (error) {
      console.error('Error processing QR:', error);
      setLoading(false);
      setIsScanning(true);
    }
  };

  const demoEventScan = () => {
    const demoQR = 'event_booth_DEMO01';
    handleScanResult(demoQR);
  };

  const demoTenantScan = () => {
    const demoQR = 'tenant_promo_RESTO01';
    handleScanResult(demoQR);
  };

  const parseQRCode = (qrText) => {
    try {
      // Coba parse sebagai JSON
      const data = JSON.parse(qrText);
      return data;
    } catch {
      // Demo patterns - untuk testing dengan client
      if (qrText.includes('event') || qrText.includes('booth') || qrText.includes('curiosity')) {
        return {
          type: 'event_booth',
          boothId: extractBoothId(qrText) || 'DEMO01'
        };
      } else if (qrText.includes('tenant') || qrText.includes('promo') || qrText.includes('resto')) {
        return {
          type: 'tenant_promo',
          tenantId: extractTenantId(qrText) || 'RESTO01' // Ubah dari TENANT01 ke RESTO01
        };
      }
      // Fallback untuk demo - anggap semua QR sebagai event booth
      return { 
        type: 'event_booth', 
        boothId: 'DEMO01',
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/app">
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Scan QR Code</h1>
            <p className="text-sm opacity-90">
              {isScanning ? 'Arahkan kamera ke QR Code' : 'Memproses...'}
            </p>
          </div>
        </div>
      </div>

      {/* Demo Buttons - Untuk Testing Client */}
      <div className="px-4 py-4 bg-yellow-50 border-b border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">🎬 Mode Demo:</h3>
        <div className="flex gap-2">
          <button
            onClick={demoEventScan}
            className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm"
          >
            Demo Event Booth
          </button>
          <button
            onClick={demoTenantScan}
            className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm"
          >
            Demo Tenant Promo
          </button>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="px-4 py-6">
        <div className="relative">
          {isScanning ? (
            <QrScannerComponent onScan={handleScanResult} />
          ) : (
            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
              {loading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Memproses QR Code...</p>
                </div>
              ) : (
                <div className="text-center">
                  <FontAwesomeIcon icon={faQrcode} className="text-6xl text-gray-400 mb-4" />
                  <p className="text-gray-600">QR Code berhasil dipindai</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-xl p-4">
          <h3 className="font-semibold mb-3">Jenis QR Code yang Didukung:</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-blue-600">Event Booth QR</p>
                <p className="text-sm text-gray-600">
                  Scan di booth sekolah untuk mendapatkan voucher komunitas
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-green-600">Tenant Promo QR</p>
                <p className="text-sm text-gray-600">
                  Scan di tenant untuk promo langsung dan bergabung komunitas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Generate QR untuk Demo */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold mb-3">📱 QR Code untuk Testing:</h3>
          <div className="space-y-2 text-sm">
            <div className="bg-white p-2 rounded border">
              <strong>Event Booth:</strong> event_booth_DEMO01
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Tenant Promo:</strong> tenant_promo_RESTO01
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Buat QR code dari text di atas menggunakan generator online
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setFlashOn(!flashOn)}
            className="flex-1 bg-white border border-gray-300 py-3 px-4 rounded-xl flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={flashOn ? faFlashlightSlash : faFlashlight} />
            <span>{flashOn ? 'Matikan' : 'Nyalakan'} Flash</span>
          </button>
          
          {!isScanning && (
            <button
              onClick={resetScanner}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-xl"
            >
              Scan Lagi
            </button>
          )}
        </div>

        {/* Result Display */}
        {scanResult && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Hasil Scan:</h3>
            <p className="text-sm text-gray-600 break-all">{scanResult}</p>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="px-4 pb-28">
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Tips Demo:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Gunakan button demo di atas untuk testing cepat</li>
            <li>• Buat QR code dari text yang disediakan</li>
            <li>• QR apapun akan dianggap sebagai Event Booth (fallback)</li>
            <li>• Scan QR yang mengandung kata "tenant" untuk demo tenant</li>
          </ul>
        </div>
      </div>
    </div>
  );
}