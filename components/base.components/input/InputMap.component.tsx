/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import GoogleMapReact from 'google-map-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationCrosshairs,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import { inputMapProps, valueMapProps } from './props/input-map.props';
import axios from 'axios';

export function InputMapComponent({
  onChange,
  name,
  value,
  validations,
  register,
}: inputMapProps) {
  const [addressLoading, setAddressLoading] = useState(false);

  const [inputValue, setInputValue] = useState<valueMapProps>({
    lng: null,
    lat: null,
  });
  const [drag, setDrag] = useState(false);
  const [address, setAddress] = useState('');
  const [street, setStreet] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [stateAddress, setStateAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    register?.(name, validations);
  }, [register, name, validations]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setInputValue({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    setAddressLoading(true);
    setAddress('');

    async function fetch() {
      let getAddress = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${inputValue.lat}&lon=${inputValue.lng}&apiKey=2761145afb6a43e5ade77d5e825c9474`
      );

      if (getAddress?.status == 200 && !getAddress.data.error) {
        let data = getAddress.data.features?.at(0)?.properties;
        let address = data?.address_line1 + ' ' + data?.address_line2;

        setAddress(address);
        setStreet(data?.street);
        setCity(data?.city);
        setStateAddress(data?.state);
        setCountry(data?.country);
        setSubDistrict(data?.suburb);
        setPostalCode(data?.postcode);
        setAddressLoading(false);
      } else {
        setAddressLoading(false);
      }
    }
    if (inputValue.lat) {
      navigator?.onLine && fetch();
    }
  }, [inputValue]);

  useEffect(() => {
    if (onChange) {
      let newValue: valueMapProps = inputValue;

      newValue.address = address;
      newValue.lat = inputValue.lat;
      newValue.lng = inputValue.lng;
      newValue.street = street;
      newValue.city = city;
      newValue.state = stateAddress;
      newValue.country = country;
      newValue.subDistrict = subDistrict;
      newValue.postalCode = postalCode;

      onChange(newValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, address]);

  const setCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setInputValue({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }
  };

  useEffect(() => {
    if (value && value.lng && value.lat) {
      // Hanya update jika koordinat berbeda untuk menghindari loop
      if (inputValue.lat !== value.lat || inputValue.lng !== value.lng) {
        setInputValue({
          lat: value.lat,
          lng: value.lng,
        });
      }
    }
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=2761145afb6a43e5ade77d5e825c9474&limit=5`
      );

      if (response?.status === 200 && response.data.features?.length > 0) {
        setSuggestions(response.data.features);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for autocomplete
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 500);
  };

  const handleSelectSuggestion = (feature: any) => {
    const { lat, lon } = feature.properties;
    const address = feature.properties.formatted || feature.properties.address_line1;
    
    setSearchQuery(address);
    setInputValue({
      lat: lat,
      lng: lon,
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&apiKey=2761145afb6a43e5ade77d5e825c9474`
      );

      if (response?.status === 200 && response.data.features?.length > 0) {
        const result = response.data.features[0];
        const { lat, lon } = result.properties;
        
        setInputValue({
          lat: lat,
          lng: lon,
        });
      }
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      {/* Search Bar with Autocomplete */}
      <div className="relative search-container">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Cari alamat..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((feature, index) => {
                  const props = feature.properties;
                  const displayText = props.formatted || props.address_line1 || 'Unknown location';
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleSelectSuggestion(feature)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition"
                    >
                      <div className="flex items-start gap-2">
                        <FontAwesomeIcon 
                          icon={faLocationDot} 
                          className="text-blue-500 mt-1 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {props.name || props.street || 'Location'}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {displayText}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isSearching ? 'Mencari...' : 'Cari'}
          </button>
        </div>
      </div>

      <div
        className={`w-full h-[300px] bg-gray-300 rounded-xl overflow-hidden mt-4 relative`}
      >
        <input
          type="hidden"
          name={name + '_lat'}
          value={inputValue?.lat || ''}
        />
        <input
          type="hidden"
          name={name + '_lng'}
          value={inputValue?.lng || ''}
        />

        <GoogleMapReact
          bootstrapURLKeys={{
            key: 'AIzaSyBLjp3NfOdkLbKJ85DFBg3CCQuIoKEzVZc',
          }}
          options={{
            fullscreenControl: false,
            zoomControl: false,
          }}
          defaultCenter={{
            lat: inputValue.lat ? inputValue.lat : -6.208,
            lng: inputValue.lng ? inputValue.lng : 106.689,
          }}
          center={{
            lat: inputValue.lat ? inputValue.lat : -6.208,
            lng: inputValue.lng ? inputValue.lng : 106.689,
          }}
          onDrag={() => {
            setAddressLoading(true);
            setAddress('');
            setDrag(true);
          }}
          onDragEnd={(e: any) => {
            if (e.center.lat && e.center.lng) {
              setInputValue({
                lat: e.center.lat(),
                lng: e.center.lng(),
              });
            }
            setDrag(false);
          }}
          defaultZoom={18}
        ></GoogleMapReact>

        <div
          className={`flex flex-col items-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        >
          <FontAwesomeIcon
            icon={faLocationDot}
            className={`text-4xl text__primary drop-shadow-md  ${
              drag ? 'scale-125 -translate-y-3' : ''
            }`}
          />
        </div>

        {!drag && (
          <div
            className={`absolute top-3 left-3 bg-white shadow-md px-3 py-2 max-w-[200px] min-w-[200px] rounded-lg `}
          >
            <div
              className={`${
                addressLoading && !address ? 'skeleton-loading py-4' : ''
              }`}
            ></div>
            {address}
          </div>
        )}

        <div
          className={`absolute top-3 right-3 bg__background p-4 rounded-lg cursor-pointer`}
          onClick={() => setCurrentPosition()}
        >
          <FontAwesomeIcon icon={faLocationCrosshairs} className="text-2xl" />
        </div>
      </div>
    </div>
  );
}
