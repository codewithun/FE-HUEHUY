import { faArrowLeft, faSchool, faWhatsapp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function RegisterEvent() {
  const router = useRouter();
  const { qr, type, booth } = router.query;
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    school: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp) return;

    setLoading(true);
    
    try {
      // Simulasi API call untuk demo
      await new Promise(resolve => setTimeout(resolve, 1500)); // Delay 1.5 detik

      // Demo: anggap registrasi berhasil
      const demoResult = {
        voucherId: `VOUCHER_${Date.now()}`,
        success: true
      };

      setSubmitted(true);
      
      // Auto redirect ke success page atau saku
      setTimeout(() => {
        router.push(`/app/saku?registered=true&voucherId=${demoResult.voucherId}&demo=true`);
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faWhatsapp} className="text-3xl text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Registrasi Berhasil!</h2>
          <p className="text-gray-600 mb-4">
            Link voucher akan dikirim ke WhatsApp Anda dalam beberapa saat
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">
            Mengalihkan ke halaman saku voucher...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/app/scanner/scan-qr">
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Registrasi Event</h1>
            <p className="text-sm opacity-90">Curiosity Event - Booth {booth}</p>
          </div>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
        <p className="text-sm text-blue-700">
          🎬 <strong>Mode Demo:</strong> Simulasi registrasi event untuk testing
        </p>
      </div>

      {/* Event Info */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <FontAwesomeIcon icon={faSchool} className="text-3xl" />
            <div>
              <h2 className="text-xl font-bold">Event Curiosity</h2>
              <p className="opacity-90">Booth Sekolah #{booth}</p>
            </div>
          </div>
          <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3">
            <p className="text-sm">
              🎁 Dapatkan voucher eksklusif dari berbagai tenant partner kami!
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nomor WhatsApp *</label>
            <input
              type="tel"
              required
              value={formData.whatsapp}
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.name || !formData.whatsapp}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Memproses...
              </div>
            ) : (
              'Daftar & Dapatkan Voucher'
            )}
          </button>
        </form>

        {/* Benefits */}
        <div className="mt-6 bg-white rounded-xl p-4">
          <h3 className="font-semibold mb-3">Yang Akan Anda Dapatkan:</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Multiple voucher dari tenant partner</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Akses ke komunitas eksklusif</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Link voucher dikirim via WhatsApp</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Tracking pembelian di dashboard</p>
            </div>
          </div>
        </div>

        {/* QR Info */}
        <div className="mt-4 bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Info Registrasi:</h3>
          <p className="text-sm text-gray-600 break-all">
            <strong>QR Code:</strong> {qr}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Booth ID:</strong> {booth}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Type:</strong> {type}
          </p>
        </div>
      </div>
    </div>
  );
}