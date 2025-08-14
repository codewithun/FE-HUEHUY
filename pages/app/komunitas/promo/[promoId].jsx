import {
    faArrowLeft,
    faCalendar,
    faLocationDot,
    faShare,
    faStar
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function PromoDetail() {
    const router = useRouter();
    const { promoId } = router.query;
    const [promoData, setPromoData] = useState(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (promoId) {
            // Simulate API call to get promo data
            const getPromoData = (id) => {
                const allPromos = {
                    1: {
                        id: 1,
                        title: "McDonald's - Burger Combo Flash Sale",
                        subtitle: "Paket burger kombo dengan kentang dan minuman",
                        image: '/images/promo/burger-combo-flash.jpg',
                        merchant: {
                            name: "McDonald's Bandung",
                            logo: '/images/merchants/mcdonalds-logo.png',
                            rating: 4.5,
                            address: "Jl. Merdeka No. 123, Bandung",
                            phone: "+62 22 1234567"
                        },
                        discount: "30%",
                        originalPrice: 45000,
                        discountedPrice: 31500,
                        category: "Fast Food",
                        description: "Nikmati burger combo spesial dengan diskon hingga 30%! Paket lengkap berisi burger beef, kentang goreng crispy, dan minuman soda pilihan. Cocok untuk makan siang atau malam bersama keluarga.",
                        terms: [
                            "Berlaku untuk pembelian di lokasi",
                            "Tidak dapat digabung dengan promo lain", 
                            "Berlaku hingga 31 Agustus 2025",
                            "Maksimal 2 paket per customer",
                            "Hanya untuk member komunitas"
                        ],
                        validUntil: "31 Agustus 2025",
                        location: "dbotanica Bandung",
                        tags: ["Burger", "Fast Food", "Family", "Combo"],
                        gallery: [
                            '/images/promo/burger-combo-flash.jpg',
                            '/images/promo/chicken-package.jpg',
                            '/images/promo/pizza-medium-deal.jpg'
                        ]
                    },
                    2: {
                        id: 2,
                        title: "Chicken Star - Paket Ayam Special",
                        subtitle: "Ayam crispy dengan nasi dan saus pilihan",
                        image: '/images/promo/chicken-package.jpg',
                        merchant: {
                            name: "Chicken Star",
                            logo: '/images/merchants/chicken-star-logo.png',
                            rating: 4.3,
                            address: "Jl. Sudirman No. 45, Bandung",
                            phone: "+62 22 7654321"
                        },
                        discount: "25%",
                        originalPrice: 35000,
                        discountedPrice: 26250,
                        category: "Chicken",
                        description: "Ayam crispy special dengan bumbu rahasia yang menggugah selera. Disajikan dengan nasi hangat dan pilihan saus pedas atau manis. Perfect untuk pecinta ayam crispy!",
                        terms: [
                            "Berlaku untuk dine-in dan take away",
                            "Promo khusus member komunitas",
                            "Berlaku setiap hari",
                            "Tidak berlaku untuk delivery",
                            "Berlaku hingga stok habis"
                        ],
                        validUntil: "30 September 2025",
                        location: "dbotanica Bandung",
                        tags: ["Chicken", "Crispy", "Rice", "Spicy"],
                        gallery: [
                            '/images/promo/chicken-package.jpg',
                            '/images/promo/beef-sausage-chicken.jpg',
                            '/images/promo/burger-combo-flash.jpg'
                        ]
                    },
                    3: {
                        id: 3,
                        title: "Pizza Hut - Medium Pizza Deal",
                        subtitle: "Pizza medium dengan topping pilihan dan minuman",
                        image: '/images/promo/pizza-medium-deal.jpg',
                        merchant: {
                            name: "Pizza Hut",
                            logo: '/images/merchants/pizza-hut-logo.png',
                            rating: 4.4,
                            address: "Jl. Asia Afrika No. 67, Bandung",
                            phone: "+62 22 3456789"
                        },
                        discount: "35%",
                        originalPrice: 85000,
                        discountedPrice: 55250,
                        category: "Pizza",
                        description: "Pizza medium dengan berbagai pilihan topping favorit. Dari pepperoni, sausage, hingga vegetarian. Dilengkapi dengan minuman soda dan garlic bread. Perfect untuk sharing!",
                        terms: [
                            "Pilihan topping: Pepperoni, Sausage, Mushroom, Vegetarian",
                            "Termasuk 1 minuman soda",
                            "Berlaku untuk dine-in saja",
                            "Tidak dapat dibawa pulang",
                            "Reservasi direkomendasikan"
                        ],
                        validUntil: "15 September 2025",
                        location: "dbotanica Bandung",
                        tags: ["Pizza", "Italian", "Sharing", "Drinks"],
                        gallery: [
                            '/images/promo/pizza-medium-deal.jpg',
                            '/images/promo/burger-combo-flash.jpg',
                            '/images/promo/brown-sugar-coffee.jpg'
                        ]
                    },
                    4: {
                        id: 4,
                        title: "Bubble Tea House - Minuman Segar",
                        subtitle: "Bubble tea dengan berbagai rasa dan topping",
                        image: '/images/promo/bubble-tea-discount.jpg',
                        merchant: {
                            name: "Bubble Tea House",
                            logo: '/images/merchants/bubble-tea-house-logo.png',
                            rating: 4.6,
                            address: "Jl. Braga No. 89, Bandung",
                            phone: "+62 22 9876543"
                        },
                        discount: "15%",
                        originalPrice: 25000,
                        discountedPrice: 21250,
                        category: "Beverages",
                        description: "Bubble tea premium dengan berbagai pilihan rasa mulai dari original, taro, matcha, hingga brown sugar. Topping bisa pilih pearl, jelly, atau pudding. Segar dan menyegarkan!",
                        terms: [
                            "Berlaku untuk semua varian",
                            "Pilihan topping gratis: pearl, jelly, pudding",
                            "Buy 2 get extra 5% discount",
                            "Berlaku untuk take away dan dine-in",
                            "Dapat dipesan via delivery"
                        ],
                        validUntil: "20 September 2025",
                        location: "dbotanica Bandung",
                        tags: ["Bubble Tea", "Drinks", "Sweet", "Refreshing"],
                        gallery: [
                            '/images/promo/bubble-tea-discount.jpg',
                            '/images/promo/brown-sugar-coffee.jpg',
                            '/images/promo/chicken-package.jpg'
                        ]
                    }
                };
                
                return allPromos[parseInt(id)] || allPromos[1];
            };

            setPromoData(getPromoData(promoId));
        }
    }, [promoId]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: promoData.title,
                text: promoData.subtitle,
                url: window.location.href,
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const handleClaim = () => {
        // Handle claim promo logic here
        alert('Promo berhasil diklaim! Tunjukkan di kasir untuk mendapatkan diskon.');
    };

    if (!isClient || !promoData) {
        return (
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
                <div className="container mx-auto relative z-10">
                    <div className="w-full bg-primary h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                            <p className="mt-2 text-sm drop-shadow-neuro">Loading promo...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx>{`
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen">
                
                {/* Header with Back Button */}
                <div className="relative">
                    <div className="relative h-64 overflow-hidden">
                        <Image 
                            src={promoData.image} 
                            alt={promoData.title}
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

                        {/* Discount Badge */}
                        {promoData.discount && (
                            <div className="absolute bottom-4 left-4">
                                <span className="bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-neuro">
                                    {promoData.discount} OFF
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20">
                    <div className="px-6 pt-6 pb-24">
                        
                        {/* Promo Title & Price */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                {promoData.title}
                            </h1>
                            <p className="text-slate-600 mb-4">
                                {promoData.subtitle}
                            </p>
                            
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-primary">
                                        Rp {promoData.discountedPrice?.toLocaleString()}
                                    </span>
                                    {promoData.originalPrice && (
                                        <span className="text-lg text-slate-500 line-through">
                                            Rp {promoData.originalPrice?.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                                    <span>Valid hingga {promoData.validUntil}</span>
                                </div>
                            </div>
                        </div>

                        {/* Merchant Info */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                                    <Image 
                                        src={promoData.merchant.logo} 
                                        alt={promoData.merchant.name}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-900">{promoData.merchant.name}</h3>
                                    <div className="flex items-center gap-2 mb-1">
                                        <FontAwesomeIcon icon={faStar} className="text-yellow-500 text-sm" />
                                        <span className="text-sm text-slate-600">{promoData.merchant.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                        <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
                                        <span>{promoData.merchant.address}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Deskripsi</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {promoData.description}
                            </p>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Syarat & Ketentuan</h3>
                            <ul className="space-y-2">
                                {promoData.terms.map((term, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                        <span>{term}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Tags */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {promoData.tags.map((tag, index) => (
                                    <span key={index} className="bg-primary bg-opacity-20 text-primary px-3 py-1 rounded-full text-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Gallery */}
                        <div className="bg-white rounded-2xl p-4 shadow-neuro mb-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-3">Gallery</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {promoData.gallery.map((image, index) => (
                                    <div key={index} className="aspect-square rounded-xl overflow-hidden">
                                        <Image 
                                            src={image} 
                                            alt={`Gallery ${index + 1}`}
                                            width={100}
                                            height={100}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Fixed Bottom CTA */}
                    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 p-4 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="text-sm text-slate-600">Harga Promo</div>
                                <div className="text-xl font-bold text-primary">
                                    Rp {promoData.discountedPrice?.toLocaleString()}
                                </div>
                            </div>
                            <button 
                                onClick={handleClaim}
                                className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-neuro hover:scale-105 transition-all duration-300"
                            >
                                Klaim Promo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
