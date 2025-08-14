import {
    faArrowLeft,
    faCalendar,
    faClock,
    faLocationDot,
    faShare,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function EventDetail() {
    const router = useRouter();
    const { eventId } = router.query;
    const [eventData, setEventData] = useState(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (eventId) {
            // Simulate API call to get event data
            const getEventData = (id) => {
                const allEvents = {
                    1: {
                        id: 1,
                        title: "Upcoming Kids Drawing Competition - dbotanica Bandung",
                        subtitle: "Kompetisi menggambar untuk anak-anak dengan hadiah menarik",
                        image: '/api/placeholder/400/300',
                        organizer: {
                            name: "dbotanica Bandung",
                            logo: '/api/placeholder/80/80',
                            type: "Shopping Mall"
                        },
                        date: "15 Agustus 2025",
                        time: "10:00 - 17:00",
                        location: "dbotanica Bandung, Lantai 2 - Area Central Court",
                        address: "Jl. Pasteur No. 28, Bandung",
                        category: "Kids & Family",
                        participants: 45,
                        maxParticipants: 100,
                        price: "Gratis",
                        description: "Acara kompetisi menggambar khusus untuk anak-anak usia 5-12 tahun. Peserta akan diberikan tema khusus dan alat gambar. Pemenang akan mendapatkan hadiah menarik berupa voucher belanja dan alat gambar premium.",
                        requirements: [
                            "Anak usia 5-12 tahun",
                            "Pendaftaran on-site mulai pukul 09:30",
                            "Membawa KTP orang tua",
                            "Alat gambar disediakan panitia",
                            "Peserta wajib didampingi orang tua"
                        ],
                        schedule: [
                            { time: "09:30 - 10:00", activity: "Registrasi peserta" },
                            { time: "10:00 - 10:15", activity: "Pembukaan & penjelasan aturan" },
                            { time: "10:15 - 15:00", activity: "Sesi menggambar" },
                            { time: "15:00 - 16:00", activity: "Penilaian juri" },
                            { time: "16:00 - 17:00", activity: "Pengumuman pemenang & penutupan" }
                        ],
                        prizes: [
                            "Juara 1: Voucher belanja Rp 500.000 + Set alat gambar",
                            "Juara 2: Voucher belanja Rp 300.000 + Set alat gambar", 
                            "Juara 3: Voucher belanja Rp 200.000 + Set alat gambar",
                            "Semua peserta mendapat goodie bag & sertifikat"
                        ],
                        contact: {
                            phone: "+62 22 1234567",
                            email: "event@dbotanica.com"
                        },
                        tags: ["Kids", "Drawing", "Competition", "Family", "Free"]
                    },
                    2: {
                        id: 2,
                        title: "Fashion Show & Beauty Contest",
                        subtitle: "Kompetisi fashion dan kecantikan dengan hadiah jutaan rupiah",
                        image: '/api/placeholder/400/300',
                        organizer: {
                            name: "dbotanica Bandung",
                            logo: '/api/placeholder/80/80',
                            type: "Shopping Mall"
                        },
                        date: "20 Agustus 2025",
                        time: "19:00 - 22:00",
                        location: "dbotanica Bandung, Main Stage",
                        address: "Jl. Pasteur No. 28, Bandung",
                        category: "Fashion & Beauty",
                        participants: 120,
                        maxParticipants: 150,
                        price: "Rp 50.000 (untuk kontestan)",
                        description: "Acara fashion show dan beauty contest terbesar di Bandung! Terbuka untuk umur 17-30 tahun. Peserta akan berjalan di atas panggung profesional dengan lighting dan sound system terbaik.",
                        requirements: [
                            "Usia 17-30 tahun",
                            "Tinggi minimal 160cm (wanita), 170cm (pria)",
                            "Foto portfolio terbaru",
                            "Pendaftaran online sebelum 18 Agustus",
                            "Medical check-up"
                        ],
                        schedule: [
                            { time: "17:00 - 18:00", activity: "Registrasi ulang & persiapan" },
                            { time: "18:00 - 19:00", activity: "Hair & makeup" },
                            { time: "19:00 - 19:30", activity: "Opening ceremony" },
                            { time: "19:30 - 21:00", activity: "Fashion show competition" },
                            { time: "21:00 - 22:00", activity: "Penilaian & pengumuman pemenang" }
                        ],
                        prizes: [
                            "Best Model: Rp 5.000.000 + Kontrak modeling",
                            "Best Fashion: Rp 3.000.000 + Trophy",
                            "People's Choice: Rp 2.000.000 + Trophy",
                            "10 Finalis terbaik mendapat sertifikat & goodie bag"
                        ],
                        contact: {
                            phone: "+62 22 1234567",
                            email: "fashion@dbotanica.com"
                        },
                        tags: ["Fashion", "Beauty", "Contest", "Modeling", "Prize"]
                    },
                    3: {
                        id: 3,
                        title: "Grand Opening Celebration - Sunscape Event Organizer",
                        subtitle: "Perayaan grand opening dengan live music dan doorprize",
                        image: '/api/placeholder/400/300',
                        organizer: {
                            name: "Sunscape Event Organizer",
                            logo: '/api/placeholder/80/80',
                            type: "Event Organizer"
                        },
                        date: "18 Agustus 2025",
                        time: "16:00 - 21:00",
                        location: "Sunscape Event Hall",
                        address: "Jl. Dago No. 45, Bandung",
                        category: "Grand Opening",
                        participants: 200,
                        maxParticipants: 300,
                        price: "Gratis",
                        description: "Rayakan grand opening kantor baru Sunscape Event Organizer! Acara akan dimeriahkan dengan live music, food festival, dan doorprize menarik. Terbuka untuk umum dan gratis!",
                        requirements: [
                            "Terbuka untuk umum",
                            "Registrasi di tempat",
                            "Membawa identitas diri",
                            "Doorprize terbatas untuk 100 orang pertama"
                        ],
                        schedule: [
                            { time: "16:00 - 16:30", activity: "Welcome drink & registrasi" },
                            { time: "16:30 - 17:00", activity: "Opening speech & company profile" },
                            { time: "17:00 - 19:00", activity: "Live music performance" },
                            { time: "19:00 - 20:00", activity: "Food festival & networking" },
                            { time: "20:00 - 21:00", activity: "Doorprize & closing" }
                        ],
                        prizes: [
                            "Grand Prize: iPhone 15 Pro",
                            "2nd Prize: Samsung Galaxy Watch",
                            "3rd Prize: Wireless earbuds",
                            "Door prizes: Voucher makan, merchandise, dll"
                        ],
                        contact: {
                            phone: "+62 22 9876543",
                            email: "info@sunscape.co.id"
                        },
                        tags: ["Grand Opening", "Music", "Food", "Networking", "Free"]
                    }
                };
                
                return allEvents[parseInt(id)] || allEvents[1];
            };

            setEventData(getEventData(eventId));
        }
    }, [eventId]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: eventData.title,
                text: eventData.subtitle,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const handleRegister = () => {
        alert('Pendaftaran berhasil! Tim kami akan menghubungi Anda segera.');
    };

    if (!isClient || !eventData) {
        return (
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
                <div className="container mx-auto relative z-10">
                    <div className="w-full bg-primary h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                            <p className="mt-2 text-sm drop-shadow-neuro">Loading event...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen">
                
                {/* Header with Back Button */}
                <div className="relative">
                    <div className="relative h-64 overflow-hidden">
                        <Image 
                            src={eventData.image} 
                            alt={eventData.title}
                            width={400}
                            height={256}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                        
                        {/* Back Button */}
                        <button 
                            onClick={() => router.back()}
                            className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm p-3 rounded-full shadow-neuro hover:scale-105 transition-all duration-300"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-primary text-lg" />
                        </button>

                        {/* Share Button */}
                        <button 
                            onClick={handleShare}
                            className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm p-3 rounded-full shadow-neuro hover:scale-105 transition-all duration-300"
                        >
                            <FontAwesomeIcon icon={faShare} className="text-primary text-lg" />
                        </button>

                        {/* Category Badge */}
                        <div className="absolute bottom-4 left-4">
                            <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-neuro">
                                {eventData.category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20">
                    <div className="px-6 pt-6 pb-24">
                        
                        {/* Event Title & Info */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                {eventData.title}
                            </h1>
                            <p className="text-slate-600 mb-4">
                                {eventData.subtitle}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCalendar} className="text-primary" />
                                    <div>
                                        <div className="text-sm text-slate-600">Tanggal</div>
                                        <div className="font-semibold">{eventData.date}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faClock} className="text-primary" />
                                    <div>
                                        <div className="text-sm text-slate-600">Waktu</div>
                                        <div className="font-semibold">{eventData.time}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faLocationDot} className="text-primary" />
                                    <div>
                                        <div className="text-sm text-slate-600">Lokasi</div>
                                        <div className="font-semibold">{eventData.location}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUsers} className="text-primary" />
                                    <div>
                                        <div className="text-sm text-slate-600">Peserta</div>
                                        <div className="font-semibold">{eventData.participants}/{eventData.maxParticipants}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-center">
                                {eventData.price}
                            </div>
                        </div>

                        {/* Organizer Info */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                                    <Image 
                                        src={eventData.organizer.logo} 
                                        alt={eventData.organizer.name}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-900">{eventData.organizer.name}</h3>
                                    <p className="text-sm text-slate-600">{eventData.organizer.type}</p>
                                    <p className="text-sm text-slate-600">{eventData.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Deskripsi Event</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {eventData.description}
                            </p>
                        </div>

                        {/* Requirements */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Syarat & Ketentuan</h3>
                            <ul className="space-y-2">
                                {eventData.requirements.map((req, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                        <span>{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Schedule */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Jadwal Acara</h3>
                            <div className="space-y-3">
                                {eventData.schedule.map((item, index) => (
                                    <div key={index} className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                                        <div className="font-semibold text-primary min-w-[80px]">
                                            {item.time}
                                        </div>
                                        <div className="text-slate-700">
                                            {item.activity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Prizes */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Hadiah & Rewards</h3>
                            <ul className="space-y-2">
                                {eventData.prizes.map((prize, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                                        <span>{prize}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Tags */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {eventData.tags.map((tag, index) => (
                                    <span key={index} className="bg-primary bg-opacity-20 text-primary px-3 py-1 rounded-full text-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Kontak</h3>
                            <div className="space-y-2">
                                <div className="text-sm">
                                    <span className="font-semibold">Telepon: </span>
                                    <span className="text-slate-600">{eventData.contact.phone}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold">Email: </span>
                                    <span className="text-slate-600">{eventData.contact.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Bottom CTA */}
                    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 p-4 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="text-sm text-slate-600">Biaya</div>
                                <div className="text-xl font-bold text-primary">
                                    {eventData.price}
                                </div>
                            </div>
                            <button 
                                onClick={handleRegister}
                                className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-neuro hover:scale-105 transition-all duration-300"
                            >
                                Daftar Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
