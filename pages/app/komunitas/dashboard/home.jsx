import {
    faCalendar,
    faClock
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import CommunityBottomBar from './CommunityBottomBar';

export default function CommunityDashboard({ communityId }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Demo data - in real app this would come from API based on community ID
    const [communityData, setCommunityData] = useState(null);

    useEffect(() => {
        if (communityId) {
            // Simulate API call to get community data based on ID
            const getCommunityData = (id) => {
                const allCommunities = {
                    1: {
                        id: 1,
                        name: 'dbotanica Bandung',
                        description: 'Mall perbelanjaan standar dengan beragam toko pakaian, plus tempat makan kasual & bioskop. Terletak di daerah pusat wisata Kota Bandung, hanya beberapa ratus meter dari pintu tol Pasteur',
                        members: 1234,
                        category: 'Shopping',
                        location: 'Kota Bandung',
                        isOwner: false,
                        isAdmin: true,
                        isJoined: true,
                        privacy: 'public',
                        activePromos: 8,
                        totalEvents: 3,
                        unreadMessages: 5,
                        isVerified: true,
                        avatar: '/api/placeholder/50/50'
                    },
                    2: {
                        id: 2,
                        name: 'Sunscape Event Organizer',
                        description: 'Sunscape Event Organizer adalah penyelenggara acara profesional yang berfokus pada event-event berkualitas tinggi',
                        members: 856,
                        category: 'Event',
                        location: 'Bandung',
                        isOwner: true,
                        isAdmin: true,
                        isJoined: true,
                        privacy: 'private',
                        activePromos: 12,
                        totalEvents: 5,
                        unreadMessages: 3,
                        isVerified: false,
                        avatar: '/api/placeholder/50/50'
                    },
                    3: {
                        id: 3,
                        name: 'Kuliner Bandung Selatan',
                        description: 'Komunitas pecinta kuliner area Bandung Selatan dan sekitarnya. Berbagi rekomendasi tempat makan enak dan murah',
                        members: 2341,
                        category: 'Kuliner',
                        location: 'Bandung Selatan',
                        isOwner: false,
                        isAdmin: false,
                        isJoined: true,
                        privacy: 'public',
                        activePromos: 15,
                        totalEvents: 2,
                        unreadMessages: 8,
                        isVerified: true,
                        avatar: '/api/placeholder/50/50'
                    },
                    4: {
                        id: 4,
                        name: 'Otomotif Enthusiast',
                        description: 'Komunitas penggemar otomotif, modifikasi, dan spare part. Sharing tips perawatan kendaraan',
                        members: 892,
                        category: 'Otomotif',
                        location: 'Bandung',
                        isOwner: false,
                        isAdmin: true,
                        isJoined: true,
                        privacy: 'public',
                        activePromos: 6,
                        totalEvents: 1,
                        unreadMessages: 2,
                        isVerified: false,
                        avatar: '/api/placeholder/50/50'
                    },
                    5: {
                        id: 5,
                        name: 'Fashion & Style Bandung',
                        description: 'Komunitas fashion, style, dan shopping outfit terkini. Berbagi tips berpakaian dan trend fashion',
                        members: 1567,
                        category: 'Fashion',
                        location: 'Bandung',
                        isOwner: false,
                        isAdmin: false,
                        isJoined: true,
                        privacy: 'public',
                        activePromos: 22,
                        totalEvents: 4,
                        unreadMessages: 12,
                        isVerified: true,
                        avatar: '/api/placeholder/50/50'
                    }
                };
                return allCommunities[parseInt(id)] || allCommunities[1]; // fallback to default
            };

            setCommunityData(getCommunityData(communityId));
        }
    }, [communityId]);

    // Upcoming Events Data - dynamic based on community
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        if (communityData) {
            // Generate events based on community type
            const getEventsForCommunity = (community) => {
                const eventsByCategory = {
                    'Shopping': [
                        {
                            id: 1,
                            title: `Upcoming Kids Drawing Competition - ${community.name}`,
                            category: community.name,
                            image: '/api/placeholder/300/200',
                            date: '15 Agustus 2025',
                            time: '10:00 - 17:00',
                            location: community.name,
                            participants: 45
                        },
                        {
                            id: 2,
                            title: 'Fashion Show & Beauty Contest',
                            category: community.name,
                            image: '/api/placeholder/300/200',
                            date: '20 Agustus 2025',
                            time: '19:00 - 22:00',
                            location: community.name,
                            participants: 120
                        }
                    ],
                    'Event': [
                        {
                            id: 1,
                            title: `Grand Opening Celebration - ${community.name}`,
                            category: community.name,
                            image: '/api/placeholder/300/200',
                            date: '18 Agustus 2025',
                            time: '16:00 - 21:00',
                            location: 'Venue ' + community.name,
                            participants: 200
                        }
                    ],
                    'Kuliner': [
                        {
                            id: 1,
                            title: `Festival Kuliner ${community.location}`,
                            category: community.name,
                            image: '/api/placeholder/300/200',
                            date: '22 Agustus 2025',
                            time: '17:00 - 23:00',
                            location: community.location,
                            participants: 150
                        }
                    ],
                    'Otomotif': [
                        {
                            id: 1,
                            title: `Car Meet Up ${community.name}`,
                            category: community.name,
                            image: '/api/placeholder/300/200',
                            date: '25 Agustus 2025',
                            time: '08:00 - 12:00',
                            location: 'Parking Area ' + community.location,
                            participants: 80
                        }
                    ],
                    'Fashion': [
                        {
                            id: 1,
                            title: `Fashion Week ${community.location}`,
                            category: community.name,
                            image: '/api/placeholder/300/200',
                            date: '28 Agustus 2025',
                            time: '19:00 - 22:00',
                            location: community.location,
                            participants: 300
                        }
                    ]
                };
                return eventsByCategory[community.category] || [];
            };

            setUpcomingEvents(getEventsForCommunity(communityData));
        }
    }, [communityData]);

    // Promo Categories Data - dynamic based on community
    const [promoCategories, setPromoCategories] = useState([]);

    useEffect(() => {
        if (communityData) {
            // Generate promo categories based on community type
            const getPromosForCommunity = (community) => {
                const promosByCategory = {
                    'Shopping': [
                        {
                            id: 1,
                            title: 'Baby & Kids',
                            subtitle: 'Semua Perlengkapan & Permainan Anak!',
                            promos: [
                                {
                                    id: 1,
                                    title: 'IndoKids Baby & Mom - Welcome to Huehuy!',
                                    image: '/api/placeholder/150/120',
                                    label: 'Advertising',
                                    discount: null
                                },
                                {
                                    id: 2,
                                    title: 'WAFFLE JOY - Welcome to Huehuy!',
                                    image: '/api/placeholder/150/120',
                                    label: 'Advertising',
                                    discount: null
                                }
                            ]
                        },
                        {
                            id: 2,
                            title: 'Pojok Pelayanan',
                            subtitle: 'Pelayanan dan Penyewaan Jasa!',
                            promos: [
                                {
                                    id: 3,
                                    title: 'BEDJO HELMET - Welcome to...',
                                    image: '/api/placeholder/150/120',
                                    label: 'Advertising',
                                    discount: null,
                                    description: 'Jasa penjualan barang dan helm, serta pencucian...'
                                }
                            ]
                        }
                    ],
                    'Event': [
                        {
                            id: 1,
                            title: 'Event Packages',
                            subtitle: 'Paket Event Menarik untuk Semua!',
                            promos: [
                                {
                                    id: 1,
                                    title: 'Wedding Package Premium',
                                    image: '/api/placeholder/150/120',
                                    label: 'Event Package',
                                    discount: '25%'
                                },
                                {
                                    id: 2,
                                    title: 'Corporate Event Package',
                                    image: '/api/placeholder/150/120',
                                    label: 'Event Package',
                                    discount: '15%'
                                }
                            ]
                        }
                    ],
                    'Kuliner': [
                        {
                            id: 1,
                            title: 'Promo Makanan',
                            subtitle: 'Diskon Special untuk Member Komunitas!',
                            promos: [
                                {
                                    id: 1,
                                    title: 'Ayam Geprek Bensu',
                                    image: '/api/placeholder/150/120',
                                    label: 'Food Promo',
                                    discount: '20%'
                                },
                                {
                                    id: 2,
                                    title: 'Sate Klatak Pak Kumis',
                                    image: '/api/placeholder/150/120',
                                    label: 'Food Promo',
                                    discount: '15%'
                                }
                            ]
                        }
                    ],
                    'Otomotif': [
                        {
                            id: 1,
                            title: 'Spare Part & Service',
                            subtitle: 'Promo Perawatan Kendaraan!',
                            promos: [
                                {
                                    id: 1,
                                    title: 'Service Motor Complete',
                                    image: '/api/placeholder/150/120',
                                    label: 'Service',
                                    discount: '30%'
                                },
                                {
                                    id: 2,
                                    title: 'Oil Change Package',
                                    image: '/api/placeholder/150/120',
                                    label: 'Service',
                                    discount: '20%'
                                }
                            ]
                        }
                    ],
                    'Fashion': [
                        {
                            id: 1,
                            title: 'Fashion Sale',
                            subtitle: 'Koleksi Terbaru dengan Harga Terbaik!',
                            promos: [
                                {
                                    id: 1,
                                    title: 'Summer Collection 2025',
                                    image: '/api/placeholder/150/120',
                                    label: 'Fashion',
                                    discount: '40%'
                                },
                                {
                                    id: 2,
                                    title: 'Shoes & Accessories',
                                    image: '/api/placeholder/150/120',
                                    label: 'Fashion',
                                    discount: '35%'
                                }
                            ]
                        }
                    ]
                };
                return promosByCategory[community.category] || [
                    {
                        id: 1,
                        title: 'Promo Komunitas',
                        subtitle: 'Promo Eksklusif untuk Member!',
                        promos: [
                            {
                                id: 1,
                                title: 'Welcome Bonus',
                                image: '/api/placeholder/150/120',
                                label: 'Special',
                                discount: '10%'
                            }
                        ]
                    }
                ];
            };

            setPromoCategories(getPromosForCommunity(communityData));
        }
    }, [communityData]);

    // Function to get gradient based on community category
    const getCommunityGradient = (category) => {
        const gradients = {
            'Shopping': 'bg-gradient-to-br from-purple-500 to-purple-700',
            'Event': 'bg-gradient-to-br from-blue-500 to-blue-700',
            'Kuliner': 'bg-gradient-to-br from-orange-500 to-orange-700',
            'Otomotif': 'bg-gradient-to-br from-gray-600 to-gray-800',
            'Fashion': 'bg-gradient-to-br from-pink-500 to-pink-700',
            'Hobi': 'bg-gradient-to-br from-green-500 to-green-700',
            'Bisnis': 'bg-gradient-to-br from-indigo-500 to-indigo-700',
            'Kesehatan': 'bg-gradient-to-br from-red-500 to-red-700',
            'Teknologi': 'bg-gradient-to-br from-cyan-500 to-cyan-700',
            'Travel': 'bg-gradient-to-br from-yellow-500 to-yellow-700'
        };
        return gradients[category] || 'bg-gradient-to-br from-red-400 to-red-600';
    };

    if (!isClient || !communityData) {
        return (
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
                <div className="container mx-auto relative z-10 pb-28">
                    <div className="w-full bg-primary h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                            <p className="mt-2 text-sm drop-shadow-neuro">Loading komunitas...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
                <div className="container mx-auto relative z-10 pb-28">
                    {/* Header Banner */}
                                {/* Header Banner */}
            <div className={`w-full relative overflow-hidden ${getCommunityGradient(communityData.category)} rounded-b-[40px] shadow-neuro`}>
                        {/* Background decoration */}
                        <div className="absolute inset-0">
                            <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-full opacity-10"></div>
                            <div className="absolute bottom-8 left-8 w-12 h-12 bg-white rounded-full opacity-10"></div>
                            <div className="absolute top-12 left-1/4 w-8 h-8 bg-white rounded-full opacity-10"></div>
                        </div>
                        
                        <div className="relative px-6 py-6 text-white">
                            {/* Welcome Message */}
                            <div className="mb-6">
                                <h1 className="text-xl font-bold mb-2 drop-shadow-neuro">
                                    Selamat Datang Di Komunitas<br />
                                    {`"${communityData.name}"`}
                                </h1>
                                <p className="text-white text-opacity-90 text-sm leading-relaxed drop-shadow-neuro">
                                    {communityData.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20">
                        <div className="px-4 pt-6">
                            {/* Upcoming Events Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Upcoming Event</h2>
                                        <p className="text-sm text-slate-600">Upcoming Event</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {upcomingEvents.map((event) => (
                                        <div key={event.id} className="relative rounded-2xl overflow-hidden shadow-neuro hover:scale-[1.01] transition-all duration-300">
                                            <div className="relative h-48 bg-primary">
                                                {/* Background pattern */}
                                                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                                                <div className="absolute inset-0" style={{
                                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                                                }}></div>
                                                
                                                {/* Event Category Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <span className="bg-white bg-opacity-90 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                                                        {event.category}
                                                    </span>
                                                </div>
                                                
                                                {/* View More Button */}
                                                <button className="absolute top-3 right-3 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold border border-white border-opacity-30 shadow-neuro-in">
                                                    {event.category.toLowerCase()}
                                                </button>
                                                
                                                {/* Event Info */}
                                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                                    <h3 className="text-lg font-bold mb-2 tracking-wider drop-shadow-neuro">
                                                        UPCOMING
                                                    </h3>
                                                    <h4 className="text-xl font-bold mb-3 leading-tight drop-shadow-neuro">
                                                        {event.title}
                                                    </h4>
                                                    <div className="flex items-center gap-4 text-sm text-white text-opacity-90">
                                                        <div className="flex items-center gap-1">
                                                            <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                                                            <span className="drop-shadow-neuro">{event.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <FontAwesomeIcon icon={faClock} className="text-xs" />
                                                            <span className="drop-shadow-neuro">{event.time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Promo Categories */}
                            {promoCategories.map((category) => (
                                <div key={category.id} className="mb-6">
                                    <div className="bg-primary rounded-t-2xl p-4 text-white shadow-neuro">
                                        <h3 className="text-lg font-bold drop-shadow-neuro">{category.title}</h3>
                                        <p className="text-white text-opacity-90 text-sm drop-shadow-neuro">{category.subtitle}</p>
                                    </div>
                                    
                                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-b-2xl p-4 shadow-neuro">
                                        <div className="grid grid-cols-2 gap-3">
                                            {category.promos.map((promo) => (
                                                <div key={promo.id} className="bg-white rounded-xl overflow-hidden shadow-neuro-in hover:scale-[1.01] transition-all duration-300">
                                                        <Image 
                                                            src={promo.image} 
                                                            alt={promo.title}
                                                            width={150}
                                                            height={120}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="p-3">
                                                            <h4 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2">
                                                                {promo.title}
                                                            </h4>
                                                            {promo.description && (
                                                                <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                                                    {promo.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs bg-primary bg-opacity-20 text-primary px-2 py-1 rounded">
                                                                    {promo.label}
                                                                </span>
                                                                {promo.discount && (
                                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
                                                                        {promo.discount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <CommunityBottomBar active={'community'} communityId={communityData.id} />
            </div>
        </>
    );
}
