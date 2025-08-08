import {
  faArrowLeft,
  faCheckCircle,
  faPhone,
  faTicket,
  faUser,
  faWhatsapp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function RegisterEvent() {
  const router = useRouter();
  const { booth } = router.query;

  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp) return;

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate voucher demo
      const voucherDemo = {
        code: 'VCR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        title: 'Voucher Event Demo',
        ad: {
          title: 'Voucher Event Demo',
          cube: { address: 'Demo Booth' },
          picture_source: '/voucher-demo.png',
          status: 'active',
        },
        voucher_item: { code: 'VCR-' + Math.random().toString(36).substr(2, 6).toUpperCase() },
        validation_at: null,
        expired_at: null,
      };

      // Simpan ke localStorage
      const vouchers = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
      vouchers.push(voucherDemo);
      localStorage.setItem('huehuy_vouchers', JSON.stringify(vouchers));

      setSubmitted(true);

      // Redirect ke halaman saku
      setTimeout(() => {
        router.push('/app/saku');
      }, 2000);
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto min-h-screen bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center px-4 max-w-sm mx-auto">
            <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-4xl text-primary"
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Registrasi Berhasil!
            </h2>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Selamat datang di Event {booth || 'Curiosity 2024'}!<br />
              Anda akan dialihkan ke halaman saku promo.
            </p>
            <div className="flex items-center justify-center gap-2 mb-4 bg-white bg-opacity-40 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-primary"></div>
              <span className="text-xs text-gray-600">
                Mengalihkan ke saku promo...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md">
      <div className="container mx-auto min-h-screen bg-gradient-to-br from-cyan-50">
        {/* Header - Hijau seperti HUEHUY */}
        <div className="bg-primary px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/app/scanner/scan-qr"
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                className="text-lg text-white"
              />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-white">Daftar Event</h1>
              <p className="text-sm text-white/90">
                Event {booth || 'Curiosity'} - Registrasi
              </p>
            </div>
            <FontAwesomeIcon
              icon={faTicket}
              className="text-xl text-white/80"
            />
          </div>
        </div>

        {/* Registration Form */}
        <div className="p-4">
          <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[25px] shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="bg-primary/10 p-3 rounded-[15px] w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faTicket}
                  className="text-xl text-primary"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Informasi Pendaftar
              </h3>
              <p className="text-sm text-gray-600">
                Isi data berikut untuk mengakses booth event
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 pl-10 border border__primary rounded-[20px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50"
                    placeholder="Masukkan nama lengkap"
                  />
                  <FontAwesomeIcon
                    icon={faUser}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    className="w-full px-4 py-3 pl-10 pr-10 border border__primary rounded-[20px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50"
                    placeholder="08xxxxxxxxxx"
                  />
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary text-sm"
                  />
                  <FontAwesomeIcon
                    icon={faWhatsapp}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Untuk notifikasi voucher dan update event
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-[15px] p-4 my-4">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={faTicket}
                    className="text-primary mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">
                      Setelah registrasi:
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Akses langsung ke WhatsApp event</li>
                      <li>• Dapatkan voucher promo eksklusif</li>
                      <li>• Join komunitas event otomatis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.name || !formData.whatsapp}
                className="w-full bg-primary text-white py-3 rounded-[20px] font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-6"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Memproses Registrasi...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faTicket} />
                    Daftar & Masuk ke Komunitas
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
