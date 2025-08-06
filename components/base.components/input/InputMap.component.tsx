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
      setInputValue(value);
    }
  }, [value]);

  return (
    <div>
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
