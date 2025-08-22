import { faArrowLeft, faCheckCircle, faExclamationTriangle, faMapMarkerAlt, faPhone, faShare, faWifi, faWifiSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

const PromoDetailPage = () => {
  const router = useRouter();
  const { promoId, communityId } = router.query;
  const [promoData, setPromoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClaimedLoading, setIsClaimedLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // jangan lanjut sebelum router siap
    if (!router.isReady) return;

    // Reset state setiap kali promoId atau communityId berubah
    setPromoData(null);
    setLoading(true);

    if (promoId && communityId) {
      // Mock data untuk detail promo berdasarkan ID dengan gambar yang sesuai
      const mockPromoDetails = {
        1: {
          id: 1,
          title: 'Paket Kenyang Cuma 40 Ribu - Beef Sausage & Chicken di Lalaunch!',
          merchant: 'Lalaunch',
          image: '/images/promo/beef-sausage-chicken.jpg',
          distance: '3 KM',
          location: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163, West Java, Indonesia',
          coordinates: '9°15KM 9°30KM 9°30KM',
          originalPrice: 80000,
          discountPrice: 40000,
          discount: '50%',
          schedule: {
            day: 'Weekday',
            details: 'Berlaku Di Hari Senin - Jumat',
            time: '11:00 - 14:00',
            timeDetails: 'Jam Berlaku Promo'
          },
          status: {
            type: 'Offline',
            description: 'Tipe Promo: 🌐 Online / 📍 Offline'
          },
          description: 'Makan enak tanpa bikin kantong bolong! Lalaunch hadirkan paket spesial berisi beef sausage dan ayam lezat hanya dengan Rp40.000. Cocok buat makan siang atau santai sore, rasanya mantap, harganya hemat! Promo terbatas, buruan nikmati sekarang di Lalaunch!',
          seller: {
            name: 'D\'Botanica Admin',
            phone: '085666666333'
          },
          terms: 'TERM & CONDITIONS APPLY'
        },
        2: {
          id: 2,
          title: 'Beli 1 Gratis 1! Brown Sugar Coffee di Boba Thai',
          merchant: 'Boba Thai',
          image: '/images/promo/brown-sugar-coffee.jpg',
          distance: '3 KM',
          location: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163, West Java, Indonesia',
          coordinates: '9°15KM 9°30KM 9°30KM',
          originalPrice: 25000,
          discountPrice: 12500,
          discount: 'BELI 1 GRATIS 1',
          schedule: {
            day: 'Weekday',
            details: 'Berlaku Di Hari Senin - Jumat',
            time: '10:00 - 22:00',
            timeDetails: 'Jam Berlaku Promo'
          },
          status: {
            type: 'Online',
            description: 'Tipe Promo: 🌐 Online / 📍 Offline'
          },
          description: 'Nikmati kelezatan Brown Sugar Coffee dengan promo BELI 1 GRATIS 1! Minuman favorit dengan rasa manis gurih yang sempurna. Promo terbatas untuk pecinta kopi dan bubble tea!',
          seller: {
            name: 'D\'Botanica Admin',
            phone: '085666666333'
          },
          terms: 'TERM & CONDITIONS APPLY'
        },
        3: {
          id: 3,
          title: 'Makan Bertiga Lebih Hemat - Paket Ayam di Chicken Star Cuma 59 Ribu!',
          merchant: 'Chicken Star',
          distance: '3 KM',
          location: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163, West Java, Indonesia',
          coordinates: '9°15KM 9°30KM 9°30KM',
          image: '/images/promo/chicken-package.jpg',
          originalPrice: 89000,
          discountPrice: 59000,
          discount: '34%',
          schedule: {
            day: 'Weekend',
            details: 'Berlaku Di Hari Sabtu - Minggu',
            time: '12:00 - 20:00',
            timeDetails: 'Jam Berlaku Promo'
          },
          status: {
            type: 'Offline',
            description: 'Tipe Promo: 🌐 Online / 📍 Offline'
          },
          description: 'Paket hemat untuk makan bertiga! Dapatkan ayam crispy yang lezat dengan bumbu rahasia Chicken Star. Cocok untuk makan bareng keluarga atau teman-teman.',
          seller: {
            name: 'D\'Botanica Admin',
            phone: '085666666333'
          },
          terms: 'TERM & CONDITIONS APPLY'
        },
        4: {
          id: 4,
          title: 'Diskon 50% Bubble Tea untuk 15 Pelanggan Pertama!',
          merchant: 'Bubble Tea House',
          distance: '3 KM',
          location: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163, West Java, Indonesia',
          coordinates: '9°15KM 9°30KM 9°30KM',
          image: '/images/promo/bubble-tea-discount.jpg',
          originalPrice: 30000,
          discountPrice: 15000,
          discount: '50% DISKON',
          schedule: {
            day: 'Everyday',
            details: 'Berlaku Setiap Hari',
            time: '09:00 - 21:00',
            timeDetails: 'Jam Berlaku Promo'
          },
          status: {
            type: 'Online',
            description: 'Tipe Promo: 🌐 Online / 📍 Offline'
          },
          description: 'Flash sale spesial! Diskon 50% untuk bubble tea favorit kamu. Terbatas hanya untuk 15 pelanggan pertama setiap harinya. Buruan sebelum kehabisan!',
          seller: {
            name: 'D\'Botanica Admin',
            phone: '085666666333'
          },
          terms: 'TERM & CONDITIONS APPLY'
        },
        // Limited Deals dengan gambar yang sesuai
        'limited-1': {
          id: 'limited-1',
          title: 'Flash Sale - Burger Combo',
          merchant: 'McDonald\'s BTC',
          distance: '3 KM',
          location: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163, West Java, Indonesia',
          coordinates: '9°15KM 9°30KM 9°30KM',
          image: '/images/promo/burger-combo-flash.jpg',
          originalPrice: 45000,
          discountPrice: 25000,
          discount: '44%',
          schedule: {
            day: 'Limited Time',
            details: 'Flash Sale Terbatas',
            time: '10:00 - 14:00',
            timeDetails: 'Jam Berlaku Promo'
          },
          status: {
            type: 'Online',
            description: 'Tipe Promo: 🌐 Online / 📍 Offline'
          },
          description: 'Flash Sale spesial untuk Burger Combo McDonald\'s! Nikmati burger favorit dengan kentang goreng dan minuman. Promo terbatas waktu, jangan sampai kehabisan!',
          seller: {
            name: 'D\'Botanica Admin',
            phone: '085666666333'
          },
          terms: 'TERM & CONDITIONS APPLY',
          timeLeft: '2 jam 30 menit'
        },
        'limited-2': {
          id: 'limited-2',
          title: 'Limited Time - Pizza Medium',
          merchant: 'Pizza Hut BTC',
          distance: '3 KM',
          location: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163, West Java, Indonesia',
          coordinates: '9°15KM 9°30KM 9°30KM',
          image: '/images/promo/pizza-medium-deal.jpg',
          originalPrice: 75000,
          discountPrice: 50000,
          discount: '33%',
          schedule: {
            day: 'Limited Time',
            details: 'Penawaran Waktu Terbatas',
            time: '11:00 - 16:00',
            timeDetails: 'Jam Berlaku Promo'
          },
          status: {
            type: 'Offline',
            description: 'Tipe Promo: 🌐 Online / 📍 Offline'
          },
          description: 'Penawaran waktu terbatas untuk Pizza Medium Pizza Hut! Berbagai pilihan topping favorit dengan harga spesial. Buruan sebelum waktunya habis!',
          seller: {
            name: 'D\'Botanica Admin',
            phone: '085666666333'
          },
          terms: 'TERM & CONDITIONS APPLY',
          timeLeft: '1 jam 15 menit'
        },
        // Data khusus untuk promo entry dari QR scan
        '123': {
          id: '123',
          title: 'Promo Spesial QR - Diskon 60% Menu Favorit!',
          merchant: 'Restoran QR Special',
          distance: '2 KM',
          location: 'Jl. Sudirman No. 123, Bandung, West Java, Indonesia',
          coordinates: '8°15KM 8°30KM 8°30KM',
          image: '/images/promo/qr-special-promo.jpg',
          originalPrice: 100000,
          discountPrice: 40000,
          discount: '60%',
          schedule: {
            day: 'Everyday',
            details: 'Berlaku Setiap Hari',
            time: '10:00 - 22:00',
            timeDetails: 'Jam Berlaku Promo'
          },
          status: {
            type: 'Online',
            description: 'Tipe Promo: 🌐 Online / 📍 Offline'
          },
          description: 'Promo spesial untuk pengguna yang scan QR Code! Nikmati diskon fantastis 60% untuk menu favorit di restoran kami. Promo terbatas untuk user yang datang dari QR scan.',
          seller: {
            name: 'QR Restaurant Admin',
            phone: '081234567890'
          },
          terms: 'TERM & CONDITIONS APPLY - Khusus untuk QR Scanner'
        }
      };

      // Simulasi async fetch (bisa diganti fetch API jika sudah ada backend)
      setTimeout(() => {
        // robust lookup: coba string key dulu lalu numeric
        const keyStr = String(promoId);
        const keyNum = Number(promoId);
        const selectedPromo =
          mockPromoDetails[keyStr] ?? mockPromoDetails[keyNum] ?? null;

        if (selectedPromo) {
          setPromoData(selectedPromo);
        } else {
          setPromoData(null);
        }
        setLoading(false);
      }, 300); // simulasi loading 300ms
    } else {
      setLoading(false);
    }
  }, [router.isReady, promoId, communityId]);

  const handleBack = () => {
    // Jika dari promo-entry, kembali ke halaman utama
    if (communityId === 'promo-entry') {
      router.push('/app');
    } else {
      router.push(`/app/komunitas/promo?communityId=${communityId}`);
    }
  };
  
  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleClaimPromo = async () => {
    if (isClaimedLoading) return;
    setIsClaimedLoading(true);

    try {
      if (!promoData?.id) {
        setErrorMessage('Promo tidak valid.');
        setShowErrorModal(true);
        return;
      }

      const encryptedToken = Cookies.get(token_cookie_name);
      console.log('encryptedToken(cookie):', encryptedToken);
      let token = encryptedToken ? Decrypt(encryptedToken) : null;

      // fallback ke localStorage (untuk debug)
      if (!token) {
        token = localStorage.getItem('auth_token') || null;
        console.log('token(localStorage):', token);
      }

      if (!token) {
        setErrorMessage('Sesi berakhir. Silakan login ulang. (token tidak ditemukan)');
        setShowErrorModal(true);
        return;
      }

      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
      const endpoints = [
        `${base}/api/admin/promos/${promoData.id}/items`,
        `${base}/api/admin/promo-items`,
      ];

      console.log('claim endpoints:', endpoints);

      // Ubah payload: hanya kirim { claim: true }
      const payload = {
        claim: true,
      };

      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      };

      let savedItem = null;
      let lastError = '';

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });

          const txt = await res.text().catch(() => '');
          let json = {};
          try {
            json = txt ? JSON.parse(txt) : {};
          } catch (e) {
            json = { raw: txt };
          }

          console.log('claim response:', url, res.status, json);

          if (res.ok) {
            savedItem = json?.data ?? json;
            break;
          }

          // Tangani error spesifik
          if (res.status === 401) {
            setErrorMessage('Sesi berakhir. Silakan login ulang.');
            setShowErrorModal(true);
            return;
          }
          if (res.status === 422 && json?.errors) {
            const msg = Object.values(json.errors).flat().join(', ');
            setErrorMessage(`Validasi gagal: ${msg}`);
            setShowErrorModal(true);
            return;
          }

          lastError = json?.message || json?.error || `HTTP ${res.status}`;
        } catch (e) {
          lastError = e?.message || 'Network error';
          // coba endpoint berikutnya
        }
      }

      if (!savedItem) {
        setErrorMessage(lastError || 'Gagal menyimpan promo ke server. Coba lagi nanti.');
        setShowErrorModal(true);
        return;
      }

      // Simpan juga ke localStorage agar UI Saku langsung ter-update
      try {
        const existing = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
        const enriched = {
          ...savedItem,
          claimed_at: new Date().toISOString(),
          ad: {
            id: promoData?.id,
            title: promoData?.title,
            picture_source: promoData?.image,
            status: 'active',
            cube: promoData?.cube || null,
          },
        };
        existing.push(enriched);
        localStorage.setItem('huehuy_vouchers', JSON.stringify(existing));
      } catch (e) {
        // abaikan error localStorage
      }

      setShowSuccessModal(true);
      return;
  } catch (error) {
      setErrorMessage(error?.message || 'Gagal merebut promo. Silakan coba lagi.');
      setShowErrorModal(true);
    } finally {
      setIsClaimedLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Redirect to saku promo after modal closes
    setTimeout(() => {
      router.push('/app/saku');
    }, 300);
  };

  const handleShareComplete = (platform) => {
    const promoUrl = window.location.href;
    const shareText = `Cek promo menarik ini: ${promoData.title} di ${promoData.merchant}! Diskon ${promoData.discount}`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + promoUrl)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(promoUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(promoUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(promoUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(promoUrl).then(() => {
          // Show copy success feedback
          const copyBtn = document.getElementById('copy-btn');
          if (copyBtn) {
            copyBtn.textContent = '✓ Link disalin!';
            setTimeout(() => {
              copyBtn.textContent = '📋 Salin Link';
            }, 2000);
          }
        });
        break;
    }
    setShowShareModal(false);
  };

  const submitReport = (reason) => {
    // Save report to localStorage
    const reports = JSON.parse(localStorage.getItem('promoReports') || '[]');
    reports.push({
      promoId: promoData.id,  
      reason,
      reportedAt: new Date().toISOString(),
      status: 'pending'
    });
    localStorage.setItem('promoReports', JSON.stringify(reports));
    
    setShowReportModal(false);
    
    // Show report success feedback
    setTimeout(() => {
      setErrorMessage('Laporan Anda telah dikirim. Terima kasih atas perhatian Anda!');
      setShowErrorModal(true);
    }, 300);
  };

  if (loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat detail promo...</p>
        </div>
      </div>
    );
  }

  if (!promoData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <p className="text-slate-600">Promo tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-container lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen lg:min-h-0 lg:my-4 lg:rounded-2xl lg:shadow-xl lg:border lg:border-slate-200 lg:overflow-hidden">
      {/* Header */}
      <div className="bg-primary w-full h-[60px] px-4 relative overflow-hidden lg:rounded-t-2xl">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1 right-3 w-6 h-6 bg-white rounded-full opacity-10"></div>
          <div className="absolute bottom-2 left-3 w-4 h-4 bg-white rounded-full opacity-10"></div>
          <div className="absolute top-2 left-1/3 w-3 h-3 bg-white rounded-full opacity-10"></div>
        </div>
        
        <div className="flex items-center justify-between h-full relative z-10">
          {/* Back Button */}
          <button 
            onClick={handleBack}
            className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-[10px] hover:bg-opacity-30 transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-white text-sm" />
          </button>
          
          {/* Title */}
          <div className="flex-1 text-center">
            <h1 className="text-white font-bold text-sm">Iklan</h1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-1.5">
            <button 
              onClick={handleShare}
              className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-[10px] hover:bg-opacity-30 transition-all"
            >
              <FontAwesomeIcon icon={faShare} className="text-white text-sm" />
            </button>
            <button 
              onClick={handleReport}
              className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-[10px] hover:bg-opacity-30 transition-all"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-white text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white min-h-screen w-full px-4 lg:px-6 pt-4 lg:pt-6 pb-28 lg:pb-4">
        <div className="lg:mx-auto lg:max-w-md">
          {/* Hero Promo Image Card - Bigger */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] shadow-lg overflow-hidden border border-slate-100">
              <div className="relative h-80 bg-slate-50 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full">
                  <Image 
                    src={promoData.image} 
                    alt={promoData.title}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg=="
                    onError={() => {
                      // Use default image if error occurs
                      const img = document.querySelector(`img[alt="${promoData.title}"]`);
                      if (img) img.src = '/default-avatar.png';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards - Clean & Minimal */}
          <div className="mb-4">
            <div className="bg-primary rounded-[20px] p-4 shadow-lg">
              {/* Distance & Schedule Row */}
              <div className="flex items-center justify-between mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white mr-2 text-sm" />
                  <span className="text-sm font-semibold text-white">{promoData.distance}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-white opacity-80">Jarak Promo:</span>
                  <div className="text-xs text-white opacity-70">{promoData.coordinates}</div>
                </div>
              </div>

              {/* Schedule */}
              <div className="mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white">{promoData.schedule.day}</span>
                    <div className="text-xs text-white opacity-80">{promoData.schedule.details}</div>
                  </div>
                  <div className="text-right">
                    <div className="bg-yellow-400 text-slate-800 px-3 py-1 rounded-[8px] text-sm font-semibold">
                      {promoData.schedule.time}
                    </div>
                    <div className="text-xs text-white opacity-70 mt-1">{promoData.schedule.timeDetails}</div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FontAwesomeIcon 
                      icon={promoData.status.type === 'Online' ? faWifi : faWifiSlash} 
                      className="mr-2 text-white text-sm" 
                    />
                    <span className="text-sm font-semibold text-white">{promoData.status.type}</span>
                  </div>
                  <span className="text-xs text-white opacity-70">{promoData.status.description}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Promo Title & Description */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-5 shadow-lg border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-4 text-left">
                {promoData.title}
              </h2>
              
              <p className="text-slate-600 leading-relaxed text-sm text-left mb-4">
                {promoData.description}
              </p>

              {/* Selengkapnya Button */}
              <div className="text-left">
                <button className="bg-primary text-white px-6 py-2 rounded-[12px] text-sm font-semibold hover:bg-opacity-90 transition-all">
                  Selengkapnya
                </button>
              </div>
            </div>
          </div>

          {/* Location Info - Compact */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Lokasi Promo / Iklan</h4>
              <p className="text-slate-600 text-xs leading-relaxed mb-3">{promoData.location}</p>
              <button className="w-full bg-primary text-white py-2 px-6 rounded-[12px] hover:bg-opacity-90 transition-colors text-sm font-semibold flex items-center justify-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-sm" />
                Rute
              </button>
            </div>
          </div>

          {/* Seller Contact - Compact */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Penjual / Pemilik Iklan</h4>
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 text-xs">Nama: {promoData.seller.name}</p>
                <p className="text-xs text-slate-500">No Hp/WA: {promoData.seller.phone}</p>
                <button className="w-full bg-primary text-white p-3 rounded-full hover:bg-opacity-90 transition-colors flex items-center justify-center">
                  <FontAwesomeIcon icon={faPhone} className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:static lg:mt-6 lg:mb-4 bg-white border-t border-slate-200 lg:border-t-0 p-4 lg:p-6 z-30">
        <div className="lg:max-w-sm lg:mx-auto">
          <button 
            onClick={handleClaimPromo}
            disabled={isClaimedLoading}
            className={`claim-button w-full py-4 lg:py-3.5 rounded-[15px] lg:rounded-xl font-bold text-lg lg:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] lg:max-w-sm lg:mx-auto ${ 
              isClaimedLoading 
                ? 'bg-slate-400 text-white cursor-not-allowed' 
                : 'bg-green-700 text-white hover:bg-green-800 lg:hover:bg-green-600 focus:ring-4 focus:ring-green-300 lg:focus:ring-green-200'
            }`}
          >
            {isClaimedLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Merebut Promo...
              </div>
            ) : (
              'Rebut Promo Sekarang'
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-3xl" />
            </div>
            
            {/* Success Message */}
            <h3 className="text-xl font-bold text-slate-900 mb-2">Selamat!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Promo <span className="font-semibold text-primary">{promoData?.title}</span> berhasil direbut dan masuk ke Saku Promo Anda!
            </p>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleSuccessModalClose}
                className="w-full bg-primary text-white py-3 rounded-[12px] font-semibold hover:bg-opacity-90 transition-all"
              >
                Lihat Saku Promo
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-[12px] font-semibold hover:bg-slate-200 transition-all"
              >
                Tetap di Halaman Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-3xl" />
            </div>
            
            {/* Error Message */}
            <h3 className="text-xl font-bold text-slate-900 mb-2">Oops!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {errorMessage}
            </p>
            
            {/* Action Button */}
            <button 
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 text-white py-3 rounded-[12px] font-semibold hover:bg-red-600 transition-all"
            >
              OK, Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:items-center">
          <div className="bg-white rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-md p-6 lg:m-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Bagikan Promo</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-500 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleShareComplete('whatsapp')}
                className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-green-50 hover:border-green-300 transition-all"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-sm">WA</span>
                </div>
                <span className="text-xs text-slate-600">WhatsApp</span>
              </button>
              
              <button 
                onClick={() => handleShareComplete('telegram')}
                className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-sm">TG</span>
                </div>
                <span className="text-xs text-slate-600">Telegram</span>
              </button>
              
              <button 
                onClick={() => handleShareComplete('facebook')}
                className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-sm">FB</span>
                </div>
                <span className="text-xs text-slate-600">Facebook</span>
              </button>
              
              <button 
                onClick={() => handleShareComplete('twitter')}
                className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-sky-50 hover:border-sky-300 transition-all"
              >
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-sm">TW</span>
                </div>
                <span className="text-xs text-slate-600">Twitter</span>
              </button>
              
              <button 
                id="copy-btn"
                onClick={() => handleShareComplete('copy')}
                className="col-span-2 flex items-center justify-center p-4 border border-slate-200 rounded-[12px] hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <span className="text-sm text-slate-700">📋 Salin Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:items-center">
          <div className="bg-white rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-md p-6 lg:m-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Laporkan Promo</h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-slate-500 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              Pilih alasan pelaporan promo ini:
            </p>
            
            <div className="space-y-2">
              {[
                'Promo sudah tidak berlaku',
                'Informasi tidak akurat',
                'Konten tidak pantas',
                'Spam atau penipuan',
                'Melanggar ketentuan',
                'Lainnya'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => submitReport(reason)}
                  className="w-full text-left p-3 border border-slate-200 rounded-[12px] hover:bg-red-50 hover:border-red-300 transition-all"
                >
                  <span className="text-sm text-slate-700">{reason}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        /* Desktop specific improvements */
        @media (min-width: 1024px) {
          .claim-button {
            max-width: 320px;
            margin: 0 auto;
          }
          
          .desktop-container {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
        }
      `}</style>
    </div>
  );
};

export default PromoDetailPage;
