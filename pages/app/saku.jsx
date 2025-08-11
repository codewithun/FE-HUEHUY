/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import {
  faArrowLeft,
  faArrowRight,
  faCheckCircle,
  faChevronRight,
  faClock,
  faExclamationTriangle,
  faGift,
  faRoute,
  faTag,
  faTimesCircle,
  faWallet, // Icon saku/dompet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';

export default function Save() {
  const router = useRouter();
  const [modalValidation, setModalValidation] = useState(false);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState({ data: [] });

  useEffect(() => {
    // Ambil voucher dari localStorage (demo), jika kosong tambahkan dummy data
    let vouchers = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
    
    // Jika localStorage kosong, tambahkan dummy data untuk demo
    if (vouchers.length === 0) {
      vouchers = [
        {
          id: 'demo-1',
          code: 'PROMO12345678',
          claimed_at: new Date().toISOString(),
          expired_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          validation_at: null,
          voucher_item: null,
          ad: {
            id: 'demo-1',
            title: 'Paket Kenyang Cuma 40 Ribu - Beef Sausage & Chicken di Lalaunch!',
            picture_source: '/images/promo/beef-sausage-chicken.jpg',
            status: 'active',
            cube: {
              code: 'community-1',
              user: {
                name: 'D\'Botanica Admin',
                phone: '085666666333'
              },
              corporate: null,
              tags: [
                {
                  address: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163',
                  link: null,
                  map_lat: '-6.9175',
                  map_lng: '107.6191'
                }
              ]
            }
          }
        },
        {
          id: 'demo-2',
          code: 'PROMO87654321',
          claimed_at: moment().subtract(2, 'hours').toISOString(),
          expired_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          validation_at: null,
          voucher_item: {
            code: 'BOBA2024'
          },
          ad: {
            id: 'demo-2',
            title: 'Beli 1 Gratis 1! Brown Sugar Coffee di Boba Thai',
            picture_source: '/images/promo/brown-sugar-coffee.jpg',
            status: 'active',
            cube: {
              code: 'community-1',
              user: {
                name: 'Boba Thai Manager',
                phone: '085777777444'
              },
              corporate: null,
              tags: [
                {
                  address: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163',
                  link: 'https://bobathai.com',
                  map_lat: '-6.9175',
                  map_lng: '107.6191'
                }
              ]
            }
          }
        },
        {
          id: 'demo-3',
          code: 'PROMO11223344',
          claimed_at: moment().subtract(1, 'day').toISOString(),
          expired_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          validation_at: moment().subtract(30, 'minutes').toISOString(), // Already used
          voucher_item: null,
          ad: {
            id: 'demo-3',
            title: 'Makan Bertiga Lebih Hemat - Paket Ayam di Chicken Star Cuma 59 Ribu!',
            picture_source: '/images/promo/chicken-package.jpg',
            status: 'active',
            cube: {
              code: 'community-1',
              user: {
                name: 'Chicken Star Owner',
                phone: '085888888555'
              },
              corporate: null,
              tags: [
                {
                  address: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163',
                  link: null,
                  map_lat: '-6.9175',
                  map_lng: '107.6191'
                }
              ]
            }
          }
        },
        {
          id: 'demo-4',
          code: 'PROMO99887766',
          claimed_at: moment().subtract(6, 'hours').toISOString(),
          expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          validation_at: null,
          voucher_item: null,
          ad: {
            id: 'demo-4',
            title: 'Diskon 50% Bubble Tea untuk 15 Pelanggan Pertama!',
            picture_source: '/images/promo/bubble-tea-discount.jpg',
            status: 'active',
            cube: {
              code: 'community-1',
              user: {
                name: 'Bubble Tea House Staff',
                phone: '085999999666'
              },
              corporate: null,
              tags: [
                {
                  address: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163',
                  link: 'https://bubbletea-house.com',
                  map_lat: '-6.9175',
                  map_lng: '107.6191'
                }
              ]
            }
          }
        },
        {
          id: 'demo-5',
          code: 'PROMO55443322',
          claimed_at: moment().subtract(3, 'hours').toISOString(),
          expired_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          validation_at: null,
          voucher_item: {
            code: 'MCDFLASH2024'
          },
          ad: {
            id: 'demo-5',
            title: 'Flash Sale - Burger Combo',
            picture_source: '/images/promo/burger-combo-flash.jpg',
            status: 'active',
            cube: {
              code: 'community-1',
              corporate: {
                name: 'McDonald\'s BTC',
                phone: '085111111222'
              },
              user: null,
              tags: [
                {
                  address: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163',
                  link: 'https://mcdonalds.co.id',
                  map_lat: '-6.9175',
                  map_lng: '107.6191'
                }
              ]
            }
          }
        },
        {
          id: 'demo-6',
          code: 'PROMO66778899',
          claimed_at: moment().subtract(4, 'hours').toISOString(),
          expired_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Expired (1 day ago)
          validation_at: null,
          voucher_item: null,
          ad: {
            id: 'demo-6',
            title: 'Limited Time - Pizza Medium',
            picture_source: '/images/promo/pizza-medium-deal.jpg',
            status: 'inactive', // Promo sudah ditutup
            cube: {
              code: 'community-1',
              corporate: {
                name: 'Pizza Hut BTC',
                phone: '085222222333'
              },
              user: null,
              tags: [
                {
                  address: 'Bandung Trade Center (BTC) Dr. Djunjunan Boulevard, Bandung 40163',
                  link: 'https://pizzahut.co.id',
                  map_lat: '-6.9175',
                  map_lng: '107.6191'
                }
              ]
            }
          }
        }
      ];
      
      // Update localStorage dengan dummy data
      localStorage.setItem('huehuy_vouchers', JSON.stringify(vouchers));
    }
    
    setData({ data: vouchers });
  }, []);

  // Helper function untuk menghitung waktu kedaluwarsa
  const getTimeRemaining = (expiredAt) => {
    if (!expiredAt) return null;
    
    const now = moment();
    const expired = moment(expiredAt);
    const duration = moment.duration(expired.diff(now));
    
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) % 60;
    
    if (hours < 0 || minutes < 0) {
      return 'Sudah kedaluwarsa';
    } else if (hours > 0) {
      return `${hours} jam ${minutes} menit lagi`;
    } else if (minutes > 0) {
      return `${minutes} menit lagi`;
    } else {
      return 'Sudah kedaluwarsa';
    }
  };

  // Helper function untuk cek apakah promo baru direbut (dalam 1 jam terakhir)
  const isRecentlyClaimed = (claimedAt) => {
    if (!claimedAt) return false;
    const now = moment();
    const claimed = moment(claimedAt);
    return now.diff(claimed, 'hours') < 1;
  };

  // Helper function untuk status badge
  const getStatusBadge = (item) => {
    if (item?.validation_at) {
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faCheckCircle} className="text-success text-xs" />
          <span className="font-medium text-success bg-green-50 px-2 py-1 rounded-full text-xs">
            Sudah divalidasi
          </span>
        </div>
      );
    } else if (item?.ad?.status !== 'active') {
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faTimesCircle} className="text-danger text-xs" />
          <span className="font-medium text-danger bg-red-50 px-2 py-1 rounded-full text-xs">
            Promo Ditutup
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning text-xs" />
          <span className="font-medium text-warning bg-yellow-50 px-2 py-1 rounded-full text-xs">
            Belum divalidasi
          </span>
        </div>
      );
    }
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        {/* Header Section */}
        <div className="bg-primary w-full px-4 py-4 flex items-center">
          {/* Arrow Back */}
          <button
            onClick={() => router.push('/app')}
            className="text-white hover:text-white/80 transition-colors mr-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
          </button>

          {/* Title - centered */}
          <h2 className="text-white font-semibold text-lg flex-1 text-center">Saku Promo</h2>
        </div>

        {/* Content Section */}
        <div className="bg-slate-50 min-h-screen w-full pb-32">
          <div className="px-4 pt-6">
            {/* Info Card */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faWallet} className="text-primary text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Koleksi Promo Anda</h3>
                  <p className="text-slate-500 text-sm">
                    {data?.data?.length || 0} item tersimpan
                  </p>
                </div>
              </div>
            </div>

            {data?.data?.length ? (
              <div className="space-y-4">
                {data?.data?.map((item, key) => (
                  <div
                    className={`bg-white rounded-2xl p-4 shadow-lg border hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                      isRecentlyClaimed(item.claimed_at) 
                        ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-white' 
                        : 'border-slate-100'
                    }`}
                    key={key}
                    onClick={() => {
                      setModalValidation(true);
                      setSelected(item);
                    }}
                  >
                    {/* Badge untuk promo baru direbut */}
                    {isRecentlyClaimed(item.claimed_at) && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          ✨ Baru Direbut
                        </span>
                      </div>
                    )}

                    <div className="flex gap-4">
                      {/* Image Section dengan gambar yang sesuai */}
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex justify-center items-center group-hover:scale-105 transition-transform duration-300">
                        {item?.ad?.picture_source ? (
                          <img
                            src={item?.ad?.picture_source}
                            className="w-full h-full object-cover"
                            alt={item?.ad?.title || 'Promo'}
                            onError={(e) => {
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                        ) : (
                          <FontAwesomeIcon icon={faTag} className="text-slate-400 text-2xl" />
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h3 className="font-semibold text-slate-800 text-base leading-tight">
                            {item?.ad?.title || 'Promo Tanpa Judul'}
                          </h3>
                        </div>

                        {/* Type Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          {item?.voucher_item ? (
                            <span className="inline-flex items-center gap-1 font-medium text-success bg-emerald-50 px-3 py-1 rounded-full text-xs border border-emerald-200">
                              <FontAwesomeIcon icon={faGift} />
                              Voucher
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-warning bg-amber-50 px-3 py-1 rounded-full text-xs border border-amber-200">
                              <FontAwesomeIcon icon={faTag} />
                              Promo
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="mb-2">
                          {getStatusBadge(item)}
                        </div>

                        {/* Expiry Information */}
                        {item?.expired_at && (
                          <div className="flex items-center gap-1 text-xs">
                            <FontAwesomeIcon icon={faClock} className="text-red-500" />
                            <span className="text-red-600 font-medium">
                              {getTimeRemaining(item.expired_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faWallet} className="text-slate-400 text-3xl" />
                </div>
                <h3 className="font-semibold text-slate-600 mb-2">Saku Promo Kosong</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-4">
                  Jelajahi komunitas dan kumpulkan promo untuk mengisi saku Anda
                </p>
                <button 
                  onClick={() => router.push('/app/komunitas')}
                  className="bg-primary text-white px-6 py-3 rounded-[12px] font-semibold hover:bg-opacity-90 transition-all"
                >
                  Cari Promo
                </button>
              </div>
            )}
          </div>
        </div>

        <BottomBarComponent active={'save'} />
      </div>

      {/* Modal Bottom Sheet - tidak ada perubahan */}
      <BottomSheetComponent
        title={'Detail Promo'}
        show={modalValidation}
        onClose={() => {
          setModalValidation(false);
          setSelected(null);
        }}
        height={600}
      >
        {/* ...existing modal content remains the same... */}
        <div className="p-4 space-y-4">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-xl text-slate-800 leading-tight mb-2">
                  {selected?.ad?.title}
                </h4>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTag} className="text-primary text-sm" />
                  <span className="text-sm font-medium text-slate-600">
                    {selected?.voucher_item ? 'Voucher' : 'Promo'}
                  </span>
                </div>
              </div>

              <Link href={`/app/${selected?.ad?.cube?.code}`}>
                <div className="flex items-center gap-1 text-sm text-primary font-medium bg-primary/10 px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors">
                  Detail
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </div>
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h5 className="font-semibold text-slate-800 mb-3">Informasi Kontak</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Pemilik</span>
                <span className="text-slate-800 font-medium text-sm">
                  {selected?.ad?.cube?.user?.name || selected?.ad?.cube?.corporate?.name || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">No. Telepon</span>
                <span className="text-slate-800 font-medium text-sm">
                  {selected?.ad?.cube?.user?.phone || selected?.ad?.cube?.corporate?.phone || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Location or Online Store */}
          {(selected?.ad?.cube?.tags?.at(0)?.address || selected?.ad?.cube?.tags?.at(0)?.link) && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h5 className="font-semibold text-slate-800 mb-3">Lokasi/Link</h5>
              
              {selected?.ad?.cube?.tags?.at(0)?.address && (
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    <span className="text-sm text-slate-600">Alamat:</span>
                    <p className="text-slate-800 text-sm font-medium">
                      {selected?.ad?.cube?.tags?.at(0)?.address}
                    </p>
                  </div>
                  <a
                    href={`http://www.google.com/maps/place/${
                      selected?.ad?.cube?.tags?.at(0)?.map_lat
                    },${selected?.ad?.cube?.tags?.at(0)?.map_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <FontAwesomeIcon icon={faRoute} className="text-primary" />
                  </a>
                </div>
              )}

              {selected?.ad?.cube?.tags?.at(0)?.link && (
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="text-sm text-slate-600">Online Store:</span>
                    <p className="text-slate-800 text-sm font-medium truncate">
                      {selected?.ad?.cube?.tags?.at(0)?.link}
                    </p>
                  </div>
                  <a
                    href={selected?.ad?.cube?.tags?.at(0)?.link}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowRight} className="text-primary" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div className="px-4 pb-6">
          {selected?.validation_at ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl py-8">
              <div className="text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl mb-3" />
                <div className="font-bold text-green-700 text-lg">
                  Promo Telah Digunakan
                </div>
                <p className="text-green-600 text-sm mt-1">Terima kasih</p>
              </div>
            </div>
          ) : selected?.ad?.status !== 'active' ? (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl py-8">
              <div className="text-center">
                <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-4xl mb-3" />
                <div className="font-bold text-red-700 text-lg">
                  Promo Tidak Tersedia
                </div>
                <p className="text-red-600 text-sm mt-1">Promo sudah berakhir</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="text-center">
                <div className="mb-4">
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                    {selected?.voucher_item?.code ? 'Kode Voucher' : 'QR Code'}
                  </span>
                </div>
                
                {selected?.voucher_item?.code ? (
                  <>
                    <h4 className="text-2xl font-bold text-slate-800 mb-4">
                      {selected?.voucher_item?.code}
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <QRCodeSVG
                        value={selected?.voucher_item?.code}
                        size={180}
                        bgColor="#f8fafc"
                        fgColor="#0f172a"
                        level="H"
                        includeMargin={true}
                        className="mx-auto rounded-lg"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <QRCodeSVG
                        value={selected?.code}
                        size={180}
                        bgColor="#f8fafc"
                        fgColor="#0f172a"
                        className="mx-auto rounded-lg"
                      />
                    </div>
                    <div className="text-xl font-bold text-slate-600 mb-4">
                      {selected?.code}
                    </div>
                  </>
                )}
                
                <button
                  className="w-full bg-gradient-to-r from-primary to-primary/90 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                  onClick={() => {
                    alert('QR Code siap untuk divalidasi');
                  }}
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  Validasi Promo
                </button>
                <p className="text-slate-500 text-xs mt-3">
                  Tunjukkan kode ini kepada merchant
                </p>
              </div>
            </div>
          )}
        </div>
      </BottomSheetComponent>
    </>
  );
}
