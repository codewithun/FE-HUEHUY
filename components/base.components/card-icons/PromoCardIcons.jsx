import React from 'react';
import {
    faClock,
    faCalendarAlt,
    faStoreAlt,
    faGlobe,
    faTicket
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Komponen untuk menampilkan icon informasi di card promo
 * @param {Object} ad - Data iklan/promo dari backend
 * @param {string} variant - Ukuran variant: 'xs', 'sm', 'md', 'lg'
 * @param {string} layout - Layout icon: 'horizontal', 'vertical', 'grid'
 */
export default function PromoCardIcons({ ad, variant = 'sm', layout = 'horizontal' }) {
    if (!ad) return null;

    // Helper function untuk format tanggal
    const formatDate = (dateString) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            return `${day}/${month}/${year}`;
        } catch {
            return null;
        }
    };

    // Helper function untuk format waktu
    const formatTime = (timeString) => {
        if (!timeString) return null;
        try {
            // Handle format HH:mm:ss atau HH:mm
            const parts = timeString.split(':');
            if (parts.length >= 2) {
                return `${parts[0]}:${parts[1]}`;
            }
            return timeString;
        } catch {
            return null;
        }
    };

    // Ambil data dari ad
    const remainingStock = ad?.remaining_stock ?? ad?.total_remaining ?? ad?.max_grab;
    const isUnlimited = ad?.unlimited_grab === true || ad?.unlimited_grab === 1;
    const finishDate = formatDate(ad?.finish_validate);

    // Normalisasi validationType dengan berbagai format dari backend
    let validationType = '';

    // Prioritas: cek promo_type dulu, baru validation_type
    // promo_type biasanya lebih akurat daripada validation_type
    const rawValidationType = ad?.promo_type || ad?.validation_type;

    // Cek online_store_link terlebih dahulu jika ada
    if (ad?.online_store_link && typeof ad.online_store_link === 'string' && ad.online_store_link.trim()) {
        validationType = 'online';
    }

    if (!validationType && rawValidationType) {
        // Convert to string dan normalize
        const normalized = String(rawValidationType).trim().toLowerCase();

        // Handle berbagai format yang mungkin dari backend:
        // "online", "Online", "ONLINE", "Online Store", dll
        if (normalized.includes('online') || normalized === 'online') {
            validationType = 'online';
        } else if (normalized.includes('offline') || normalized.includes('toko') || normalized.includes('store') || normalized === 'offline') {
            validationType = 'offline';
        } else if (normalized === 'auto') {
            // Handle "auto" - cek online_store_link untuk menentukan
            if (ad?.online_store_link && typeof ad.online_store_link === 'string' && ad.online_store_link.trim()) {
                validationType = 'online';
            } else {
                // Default untuk auto tanpa online_store_link
                validationType = 'offline';
            }
        } else {
            // Default fallback based on exact match
            validationType = normalized;
        }
    }

    // Fallback tambahan: cek field lain yang mungkin mengindikasikan online
    if (!validationType) {
        const possibleOnlineFields = [
            ad?.online_link,
            ad?.store_link,
            ad?.link_online,
            ad?.validation_link
        ];

        if (possibleOnlineFields.some(field => field && typeof field === 'string' && field.trim())) {
            validationType = 'online';
        }
    }

    // Jika masih kosong, cek apakah ada indikasi offline
    if (!validationType) {
        const possibleOfflineIndicators = [
            ad?.store_address,
            ad?.toko_address,
            ad?.offline_address,
            ad?.location
        ];

        if (possibleOfflineIndicators.some(field => field && typeof field === 'string' && field.trim())) {
            validationType = 'offline';
        }
    }

    const startTime = formatTime(ad?.jam_mulai);
    const endTime = formatTime(ad?.jam_berakhir);

    // Jika semua data kosong, jangan render apapun
    if (!remainingStock && isUnlimited === false && !finishDate && !validationType && !startTime && !endTime) {
        return null;
    }

    // Size configuration - diperbesar sedikit agar tidak terpotong
    const sizes = {
        xs: {
            icon: 'text-[8px]',
            text: 'text-[7px]',
            padding: 'px-1.5 py-0.5',
            gap: 'gap-0.5',
        },
        sm: {
            icon: 'text-[11px]',
            text: 'text-[10px]',
            padding: 'px-2.5 py-1',
            gap: 'gap-1',
        },
        md: {
            icon: 'text-xs',
            text: 'text-[11px]',
            padding: 'px-3 py-1.5',
            gap: 'gap-1.5',
        },
        lg: {
            icon: 'text-sm',
            text: 'text-xs',
            padding: 'px-3 py-1.5',
            gap: 'gap-2',
        },
    };

    const sizeConfig = sizes[variant] || sizes.sm;

    // Layout configuration
    const layoutClass = {
        horizontal: 'flex flex-wrap items-center gap-1',
        vertical: 'flex flex-col gap-1',
        grid: 'grid grid-cols-2 gap-1',
    };

    // Icon Badge Component dengan efek glassmorphism
    const IconBadge = ({ icon, label, color = 'blue', show = true }) => {
        if (!show) return null;

        // Warna yang lebih soft dengan efek glassmorphism
        const colorClasses = {
            blue: 'bg-blue-400/30 text-blue-900 border border-blue-300/50',
            green: 'bg-green-400/30 text-green-900 border border-green-300/50',
            orange: 'bg-orange-400/30 text-orange-900 border border-orange-300/50',
            purple: 'bg-purple-400/30 text-purple-900 border border-purple-300/50',
            red: 'bg-red-400/30 text-red-900 border border-red-300/50',
            slate: 'bg-slate-400/30 text-slate-900 border border-slate-300/50',
        };

        return (
            <div
                className={`
          ${colorClasses[color]}
          ${sizeConfig.padding}
          ${sizeConfig.gap}
          rounded-lg
          flex items-center
          shadow-sm
          backdrop-blur-md
          font-semibold
          whitespace-nowrap
          transition-all duration-200
          hover:scale-105
        `}
            >
                <FontAwesomeIcon icon={icon} className={sizeConfig.icon} />
                <span className={sizeConfig.text}>{label}</span>
            </div>
        );
    };

    return (
        <div className={layoutClass[layout]}>
            {/* Sisa Stok - hanya tampil jika ada nilai dan bukan unlimited */}
            <IconBadge
                icon={faTicket}
                label={isUnlimited ? '∞' : `Sisa ${remainingStock}`}
                color="red"
                show={remainingStock !== null && remainingStock !== undefined}
            />

            {/* Tanggal Berakhir */}
            <IconBadge
                icon={faCalendarAlt}
                label={finishDate}
                color="orange"
                show={!!finishDate}
            />

            {/* Tipe Validasi - Online/Offline */}
            <IconBadge
                icon={validationType === 'online' ? faGlobe : faStoreAlt}
                label={validationType === 'online' ? 'Online' : 'Offline'}
                color={validationType === 'online' ? 'blue' : 'green'}
                show={!!validationType}
            />

            {/* Waktu Rebut - tampil jika ada jam mulai atau jam berakhir */}
            <IconBadge
                icon={faClock}
                label={startTime && endTime ? `${startTime}-${endTime}` : startTime || endTime}
                color="purple"
                show={!!(startTime || endTime)}
            />
        </div>
    );
}
