import {
    faArrowLeft,
    faCalendar,
    faClock,
    faFilter,
    faMapMarkerAlt,
    faSearch,
    faTimes,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

// Import helpers
import { Decrypt } from '../../../../../helpers/encryption.helpers';

const CommunityEvents = () => {
  const router = useRouter();
  const { id: communityId } = router.query;
  
  // API Configuration
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const token_cookie_name = process.env.NEXT_PUBLIC_TOKEN_COOKIE_NAME || 'huehuy.user.token';

  // State Management
  const [communityData, setCommunityData] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Categories for filtering
  const categories = [
    { value: 'all', label: 'Semua Event' },
    { value: 'competition', label: 'Kompetisi' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'festival', label: 'Festival' },
    { value: 'meetup', label: 'Meet Up' },
    { value: 'exhibition', label: 'Pameran' }
  ];

  // Format date to be more readable
  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle various date formats
      let date;
      
      // If it's already a valid date string like "4 Sep 2025"
      if (dateString.includes(' ') && !dateString.includes('T')) {
        return dateString;
      }
      
      // Try parsing as ISO date or other formats
      date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Try alternative parsing for formats like "2025-09-04"
        const parts = dateString.split('-');
        if (parts.length === 3) {
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        }
      }
      
      // If still invalid, return original string cleaned up
      if (isNaN(date.getTime())) {
        return dateString.replace(/T.*/, '').replace(/-/g, '/');
      }
      
      const options = { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      };
      return date.toLocaleDateString('id-ID', options);
    } catch (error) {
      return dateString.replace(/T.*/, '').replace(/-/g, '/');
    }
  };

  // Format time to be cleaner
  const formatEventTime = (timeString) => {
    if (!timeString) return '';
    
    // If it's already in HH:MM format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // If it's a range like "10:00 - 17:00", return as is
    if (timeString.includes(' - ')) {
      return timeString;
    }
    
    // If it contains "Invalid", return empty string
    if (timeString.toLowerCase().includes('invalid')) {
      return '';
    }
    
    try {
      // Try parsing time with various formats
      if (timeString.includes(':')) {
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0]);
          const minutes = parseInt(timeParts[1]);
          if (!isNaN(hours) && !isNaN(minutes)) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }
      }
      
      const time = new Date(`2000-01-01T${timeString}`);
      if (!isNaN(time.getTime())) {
        return time.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
      
      return timeString;
    } catch (error) {
      return timeString;
    }
  };

  useEffect(() => {
    if (communityId) {
      fetchCommunityData();
      fetchCommunityEvents();
    }
  }, [communityId]);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, selectedCategory]);

  const fetchCommunityData = async () => {
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      
      const response = await fetch(`${apiUrl}/communities/${communityId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setCommunityData(result.data);
      }
    } catch (error) {
    }
  };

  const fetchCommunityEvents = async () => {
    try {
      setLoading(true);
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      
      const response = await fetch(`${apiUrl}/communities/${communityId}/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const eventsData = Array.isArray(result.data) ? result.data : [];
        
        // Transform backend data
        const transformedEvents = eventsData.map(event => ({
          id: event.id,
          title: event.title,
          subtitle: event.subtitle,
          category: event.category || 'general',
          image: event.image ? (
            event.image.startsWith('http') 
              ? event.image 
              : `${apiUrl.replace('/api', '')}/storage/${event.image}`
          ) : '/images/event/default-event.jpg',
          date: event.date,
          time: event.time,
          location: event.location,
          address: event.address,
          participants: event.participants || 0,
          maxParticipants: event.max_participants,
          price: event.price || 0,
          organizer: {
            name: event.organizer_name || communityData?.name || 'Organizer',
            logo: event.organizer_logo || communityData?.logo,
            type: event.organizer_type || 'community'
          }
        }));

        setEvents(transformedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    setFilteredEvents(filtered);
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 bg-gray-200 animate-pulse rounded"></div>
              <div className="w-32 h-6 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="w-full h-48 bg-gray-200 animate-pulse rounded-xl mb-4"></div>
                <div className="space-y-2">
                  <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="w-1/2 h-3 bg-gray-200 animate-pulse rounded"></div>
                  <div className="w-2/3 h-3 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Event</h1>
                <p className="text-sm text-gray-600">
                  {communityData?.name || 'Komunitas'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-600 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faFilter} className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-md mx-auto px-4 py-4 bg-white border-b border-gray-200">
        {/* Search Bar */}
        <div className="relative mb-4">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Category Filters */}
        {showFilters && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Kategori</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="max-w-md mx-auto px-4 py-6">
        {filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Event Image */}
                <div className="relative h-48">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white bg-opacity-90 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                      {categories.find(cat => cat.value === event.category)?.label || 'Event'}
                    </span>
                  </div>
                  
                  {/* Price Badge */}
                  {event.price > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {formatPrice(event.price)}
                      </span>
                    </div>
                  )}
                  
                  {/* Event Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 drop-shadow-lg">
                      {event.title}
                    </h3>
                    {event.subtitle && (
                      <p className="text-sm text-white text-opacity-90 line-clamp-1 drop-shadow-lg">
                        {event.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendar} className="text-primary" />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="text-primary" />
                      <span>{formatEventTime(event.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUsers} className="text-primary" />
                      <span>
                        {event.participants} peserta
                        {event.maxParticipants && ` / ${event.maxParticipants}`}
                      </span>
                    </div>
                    {event.price === 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                          GRATIS
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak ada event ditemukan
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {searchQuery || selectedCategory !== 'all'
                ? 'Coba ubah pencarian atau filter Anda'
                : 'Belum ada event di komunitas ini'}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-semibold"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityEvents;
