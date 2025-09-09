import {
    faArrowLeft,
    faCalendar,
    faClock,
    faLocationDot,
    faShare,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

export default function EventDetail() {
    const router = useRouter();
    const { eventId } = router.query;
    const [eventData, setEventData] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (eventId && isClient) {
            fetchEventData();
        }
    }, [eventId, isClient]);

    const fetchEventData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const encryptedToken = Cookies.get(token_cookie_name);
            const token = encryptedToken ? Decrypt(encryptedToken) : '';
            
            const response = await fetch(`${apiUrl}/api/events/${eventId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            if (!response.ok) {
                throw new Error('Event tidak ditemukan');
            }

            const result = await response.json();
            
            // Transform backend data to match frontend structure
            const transformedData = {
                id: result.data.id,
                title: result.data.title,
                subtitle: result.data.subtitle,
                // Use the transformed image_url from backend, with fallback
                image: result.data.image_url || result.data.image || '/images/event/default-event.jpg',
                organizer: {
                    name: result.data.organizer_name,
                    // Use the transformed organizer_logo_url from backend, with fallback
                    logo: result.data.organizer_logo_url || result.data.organizer_logo || '/images/organizer/default-organizer.png',
                    type: result.data.organizer_type
                },
                date: result.data.date,
                time: result.data.time,
                location: result.data.location,
                address: result.data.address,
                category: result.data.category,
                participants: result.data.participants || 0,
                maxParticipants: result.data.max_participants || 100,
                price: result.data.price || 'Gratis',
                description: result.data.description,
                requirements: result.data.requirements ? result.data.requirements.split('\n').filter(r => r.trim()) : [],
                schedule: result.data.schedule ? parseSchedule(result.data.schedule) : [],
                prizes: result.data.prizes ? result.data.prizes.split('\n').filter(p => p.trim()) : [],
                contact: {
                    phone: result.data.contact_phone,
                    email: result.data.contact_email
                },
                tags: result.data.tags ? result.data.tags.split(',').map(t => t.trim()) : []
            };

            setEventData(transformedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Parse schedule string to array of objects
    const parseSchedule = (scheduleString) => {
        return scheduleString.split('\n').filter(s => s.trim()).map(item => {
            const parts = item.split('|');
            if (parts.length >= 2) {
                return {
                    time: parts[0].trim(),
                    activity: parts[1].trim()
                };
            }
            return {
                time: '',
                activity: item.trim()
            };
        });
    };

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

    const handleRegister = async () => {
        try {
            const encryptedToken = Cookies.get(token_cookie_name);
            const token = encryptedToken ? Decrypt(encryptedToken) : '';
            
            if (!token) {
                alert('Silakan login terlebih dahulu untuk mendaftar event');
                router.push('/');
                return;
            }

            const response = await fetch(`${apiUrl}/events/${eventId}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                alert('Pendaftaran berhasil! Tim kami akan menghubungi Anda segera.');
                // Refresh event data to update participant count
                fetchEventData();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Gagal mendaftar event');
            }
        } catch (error) {
            alert('Terjadi kesalahan saat mendaftar event');
        }
    };

    if (!isClient) {
        return null;
    }

    if (loading) {
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

    if (error) {
        return (
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
                <div className="container mx-auto relative z-10">
                    <div className="w-full bg-red-500 h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
                        <div className="text-white text-center">
                            <p className="text-lg font-bold">Error</p>
                            <p className="mt-2 text-sm">{error}</p>
                            <button 
                                onClick={() => router.back()}
                                className="mt-4 bg-white text-red-500 px-4 py-2 rounded-lg font-semibold"
                            >
                                Kembali
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!eventData) {
        return (
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
                <div className="container mx-auto relative z-10">
                    <div className="w-full bg-gray-500 h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
                        <div className="text-white text-center">
                            <p className="text-lg font-bold">Event tidak ditemukan</p>
                            <button 
                                onClick={() => router.back()}
                                className="mt-4 bg-white text-gray-500 px-4 py-2 rounded-lg font-semibold"
                            >
                                Kembali
                            </button>
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
                        {eventData.category && (
                            <div className="absolute bottom-4 left-4">
                                <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-neuro">
                                    {eventData.category}
                                </span>
                            </div>
                        )}
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
                            {eventData.subtitle && (
                                <p className="text-slate-600 mb-4">
                                    {eventData.subtitle}
                                </p>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCalendar} className="text-primary" />
                                    <div>
                                        <div className="text-sm text-slate-600">Tanggal</div>
                                        <div className="font-semibold">{eventData.date}</div>
                                    </div>
                                </div>
                                {eventData.time && (
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faClock} className="text-primary" />
                                        <div>
                                            <div className="text-sm text-slate-600">Waktu</div>
                                            <div className="font-semibold">{eventData.time}</div>
                                        </div>
                                    </div>
                                )}
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
                        {eventData.organizer.name && (
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
                                        {eventData.organizer.type && (
                                            <p className="text-sm text-slate-600">{eventData.organizer.type}</p>
                                        )}
                                        {eventData.address && (
                                            <p className="text-sm text-slate-600">{eventData.address}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {eventData.description && (
                            <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-3">Deskripsi Event</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {eventData.description}
                                </p>
                            </div>
                        )}

                        {/* Requirements */}
                        {eventData.requirements.length > 0 && (
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
                        )}

                        {/* Schedule */}
                        {eventData.schedule.length > 0 && (
                            <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-3">Jadwal Acara</h3>
                                <div className="space-y-3">
                                    {eventData.schedule.map((item, index) => (
                                        <div key={index} className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                                            {item.time && (
                                                <div className="font-semibold text-primary min-w-[80px]">
                                                    {item.time}
                                                </div>
                                            )}
                                            <div className="text-slate-700">
                                                {item.activity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Prizes */}
                        {eventData.prizes.length > 0 && (
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
                        )}

                        {/* Tags */}
                        {eventData.tags.length > 0 && (
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
                        )}

                        {/* Contact */}
                        {(eventData.contact.phone || eventData.contact.email) && (
                            <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-3">Kontak</h3>
                                <div className="space-y-2">
                                    {eventData.contact.phone && (
                                        <div className="text-sm">
                                            <span className="font-semibold">Telepon: </span>
                                            <span className="text-slate-600">{eventData.contact.phone}</span>
                                        </div>
                                    )}
                                    {eventData.contact.email && (
                                        <div className="text-sm">
                                            <span className="font-semibold">Email: </span>
                                            <span className="text-slate-600">{eventData.contact.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
                                disabled={eventData.participants >= eventData.maxParticipants}
                            >
                                {eventData.participants >= eventData.maxParticipants ? 'Penuh' : 'Daftar Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
