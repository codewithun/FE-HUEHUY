import { faArrowLeft, faCamera, faFlashlight, faFlashlightSlash, faQrcode, faShieldCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import QrScannerComponent from '../../../components/construct.components/QrScannerComponent';
import { get } from '../../../helpers/api.helpers';

export default function ScanQR() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showContactConfirm, setShowContactConfirm] = useState(false);
  const [contactData, setContactData] = useState(null);

  const handleScanResult = async (result) => {
    if (!result || loading) return;
    setLoading(true);
    setScanResult(result);
    setIsScanning(false);

    try {
      // Jika hasil scan adalah URL profile, ambil data kontak
      if (
        typeof result === 'string' &&
        (result.startsWith('http://') || result.startsWith('https://')) &&
        result.includes('/profile/')
      ) {
        // Extract profile ID dari URL
        const profileMatch = result.match(/\/profile\/(\d+)/);
        if (profileMatch) {
          const profileId = profileMatch[1];
          try {
            // Ambil data profil dari API
            const profileResponse = await get({
              path: `users/${profileId}/public`
            });

            if (profileResponse?.status === 200 && profileResponse?.data) {
              const profile = profileResponse?.data?.data || null;
              if (!profile) {
                setScanResult('Profil publik tidak ditemukan atau respons tidak valid');
                setLoading(false);
                setIsScanning(true);
                return;
              }
              setContactData({
                id: profile.id,
                name: profile.name || 'Nama tidak tersedia',
                email: profile.email || null,
                phone: profile.phone || profile.handphone || null,
                code: profile.code || `HUEHUY-${String(profile.id).padStart(6, '0')}`,
                verified: profile.verified_at ? true : false,
                avatar: profile.picture_source || '/avatar.jpg'
              });
              setShowContactConfirm(true);
              setIsScanning(false);
              setLoading(false);
              return;
            }
          } catch (error) {
            setScanResult(`Error mengambil data profil: ${error.message}`);
            setLoading(false);
            setIsScanning(true);
            return;
          }
        }
      }

      // Jika hasil scan adalah URL promo/voucher, langsung redirect
      if (
        typeof result === 'string' &&
        (result.startsWith('http://') || result.startsWith('https://')) &&
        (
          result.includes('/app/komunitas/promo/') ||
          result.includes('/app/komunitas/voucher/') ||
          result.includes('/app/voucher/') // tambahkan ini
        )
      ) {
        // Redirect ke URL yang ada di QR code
        window.location.href = result;
        return;
      }

      // --- Parsing QR untuk voucher code ---
      let voucherCode = null;
      let voucherId = null;

      // Coba parsing JSON untuk voucher
      try {
        const data = JSON.parse(result);
        if (data.type === 'voucher' && (data.code || data.id)) {
          voucherCode = data.code;
          voucherId = data.id;
        }
      } catch {
        // Jika bukan JSON, cek format string: voucher|<code> atau langsung voucher code
        if (result.startsWith('voucher|')) {
          const parts = result.split('|');
          if (parts.length >= 2) {
            voucherCode = parts[1];
          }
        } else if (result.startsWith('VOUCHER') || result.match(/^[A-Z0-9]{6,}$/)) {
          // Jika format seperti kode voucher (huruf besar dan angka)
          voucherCode = result;
        }
      }

      // Jika ada voucher code atau ID, cari voucher di database
      if (voucherCode || voucherId) {
        try {
          // Cari voucher berdasarkan code atau ID
          const voucherResponse = await get({
            path: voucherId ? `admin/vouchers/${voucherId}` : `admin/vouchers?search=${voucherCode}&paginate=1`
          });

          if (voucherResponse?.status === 200 && voucherResponse?.data) {
            let voucher = null;

            if (voucherId) {
              voucher = voucherResponse.data.data;
            } else {
              // Jika search by code, ambil dari array hasil
              const vouchers = Array.isArray(voucherResponse.data.data) ? voucherResponse.data.data : [voucherResponse.data.data];
              voucher = vouchers.find(v => v.code === voucherCode) || vouchers[0];
            }

            if (voucher) {
              // Redirect ke halaman detail voucher dengan ID
              router.push(`/app/voucher/${voucher.id}`);
              return;
            }
          }

          // Jika voucher tidak ditemukan
          setScanResult(`Voucher dengan kode "${voucherCode || voucherId}" tidak ditemukan`);
          setLoading(false);
          setIsScanning(true);
          return;
        } catch (error) {
          setScanResult(`Error mencari voucher: ${error.message}`);
          setLoading(false);
          setIsScanning(true);
          return;
        }
      }

      // --- Parsing QR untuk promo/voucher (format lama) ---
      let promoId = null;
      let communityId = null;

      // Coba parsing JSON
      try {
        const data = JSON.parse(result);
        if (data.type === 'promo' && data.promoId && data.communityId) {
          promoId = data.promoId;
          communityId = data.communityId;
        }
      } catch {
        // Jika bukan JSON, cek format string: promo|<promoId>|<communityId>
        if (result.startsWith('promo|')) {
          const parts = result.split('|');
          if (parts.length >= 3) {
            promoId = parts[1];
            communityId = parts[2];
          }
        }
      }

      if (promoId && communityId) {
        router.push(`/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=${communityId}`);
        return;
      }

      // --- fallback lama ---
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

  const downloadContactCard = () => {
    if (!contactData) return;

    // Create canvas untuk menggambar contact card
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Polyfill untuk roundRect jika tidak tersedia
    if (!ctx.roundRect) {
      ctx.roundRect = function (x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
      };
    }

    // Set ukuran canvas
    canvas.width = 600;
    canvas.height = 400;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#10b981'); // Green
    gradient.addColorStop(1, '#059669'); // Darker green
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // White card background
    ctx.fillStyle = 'white';
    ctx.roundRect(30, 30, 540, 340, 20);
    ctx.fill();

    // Header background
    ctx.fillStyle = '#059669';
    ctx.roundRect(50, 50, 500, 80, 15);
    ctx.fill();

    // Logo/Avatar circle
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(90, 90, 25, 0, 2 * Math.PI);
    ctx.fill();

    // Logo initial
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('H', 90, 96);

    // Title "HUEHUY CONTACT"
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HUEHUY CONTACT', 130, 85);

    ctx.font = '14px Arial';
    ctx.fillText('Digital Business Card', 130, 105);

    // Contact info section
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'left';

    // Nama
    ctx.font = 'bold 28px Arial';
    ctx.fillText(contactData.name, 70, 180);

    // Status
    ctx.font = '16px Arial';
    ctx.fillStyle = contactData.verified ? '#10b981' : '#6b7280';
    ctx.fillText(contactData.verified ? '✓ Verified Member' : 'Member', 70, 205);

    // Contact details
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';

    // Email dengan icon
    ctx.fillText('Email: ' + (contactData.email || 'Tidak tersedia'), 70, 245);

    // Phone dengan icon  
    ctx.fillText('Phone: ' + (contactData.phone || 'Tidak tersedia'), 70, 275);

    // User Code dengan icon
    ctx.fillText('Code: ' + contactData.code, 70, 305);

    // Footer
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by HUEHUY Platform', 300, 350);
    ctx.fillText(new Date().toLocaleDateString('id-ID'), 300, 365);

    // Convert canvas to blob dan download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `contact-${contactData.name.replace(/\s+/g, '-')}-${contactData.code}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');

    // Reset scanner
    setShowContactConfirm(false);
    setContactData(null);
    resetScanner();
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
              className={`flex-1 py-3 px-3 rounded-[15px] flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-sm ${flashOn
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

        {/* Contact Confirmation Modal */}
        {showContactConfirm && contactData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faQrcode} className="text-2xl text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Kontak Ditemukan!</h3>
                <p className="text-sm text-gray-600 mt-1">Apakah Anda ingin mengunduh contact card?</p>
              </div>

              {/* Contact Preview */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">{contactData.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-base">{contactData.name}</h4>
                    {contactData.verified && (
                      <span className="text-xs text-green-100 flex items-center gap-1">
                        <FontAwesomeIcon icon={faShieldCheck} className="text-xs" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-white text-sm">
                  {contactData.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-200">Email</span>
                      <span className="break-all">{contactData.email}</span>
                    </div>
                  )}
                  {contactData.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-200">Phone</span>
                      <span>{contactData.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-green-200">Code</span>
                    <span>{contactData.code}</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-green-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-700 text-center">
                  Contact card akan diunduh sebagai file gambar PNG yang dapat Anda simpan di galeri atau bagikan.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowContactConfirm(false);
                    setContactData(null);
                    resetScanner();
                  }}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={downloadContactCard}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  Unduh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}