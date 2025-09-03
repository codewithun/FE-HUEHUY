/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    faCalendarAlt,
    faCrosshairs,
    faCubes,
    faGlobe,
    faHandshake,
    faNewspaper,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';
import DashboardCard from '../../components/construct.components/card/Dashboard.card';
import { AdminLayout } from '../../components/construct.components/layout/Admin.layout';
import { useUserContext } from '../../context/user.context';
import { token_cookie_name, useGet } from '../../helpers';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

function MapWithAMarker({ position, dataAds }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyD74gvRdtA7NAo4j8ENoOsdy3QGXU6Oklc',
    libraries: ['places'],
  });

  if (!isLoaded) return <div style={{ height: '500px' }}>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={10}
      center={position ? position : { lat: -6.914, lng: 107.609 }}
      options={{
        streetViewControl: false,
        fullscreenControl: false,
        disableDefaultUI: true,
        keyboardShortcuts: false,
      }}
    >
      {dataAds?.map((ad, key) => (
        <Marker
          key={key}
          position={{ lat: ad?.map_lat, lng: ad?.map_lng }}
          icon={{
            url: '/cube-icon.png', // Ganti dengan icon cube jika ada
            scaledSize: { width: 32, height: 32 },
          }}
        >
          {/* InfoWindow jika ingin popup detail */}
          {/* <InfoWindow position={{ lat: ad?.map_lat, lng: ad?.map_lng }}>
            <div>
              <CubeComponent size={18} color={`#${ad?.cube?.cube_type?.color}`} />
            </div>
          </InfoWindow> */}
        </Marker>
      ))}
    </GoogleMap>
  );
}

export default function Index() {
  const [map, setMap] = useState(null);
  const [mapZoom, setMapZoom] = useState(false);
  const [refreshMap, setRefreshMap] = useState(false);
  const { profile: Profile } = useUserContext();

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      if (Profile?.role_id != 1) {
        Cookies.remove(token_cookie_name);
        window.location.href = '/admin';
      }
    }
  }, [Profile]);

  const [loading, code, data, reset] = useGet({
    path: 'admin/dashboard/counter-data',
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMap({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, [refreshMap]);

  const [loadingAds, codeAds, dataAds] = useGet({
    path: map ? `admin/cubes` : null,
  });

  useEffect(() => {
    if (codeAds == 200) {
      setRefreshMap(!refreshMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeAds]);

  return (
    <div className="p-2 md:p-6 bg-slate-50 min-h-screen rounded-2xl">
      <h1 className="text-xl lg:text-2xl font-bold mb-4 tracking-wide text-slate-700">Dashboard</h1>

      <h2 className="font-semibold mt-5 mb-3 border-l-4 rounded-md border-secondary pl-3 text-slate-600 text-lg tracking-wide">Statistik Dasar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <DashboardCard
          label="Kubus"
          // loading={dashboardLoading}
          value={data?.data?.cubes}
          icon={faCubes}
          linkPath="/admin/master/kubus"
        />
        <DashboardCard
          label="Pengguna"
          // loading={dashboardLoading}
          value={data?.data?.users}
          icon={faUsers}
          linkPath="/admin/master/pengguna"
        />
        <DashboardCard
          label="Mitra"
          // loading={dashboardLoading}
          value={data?.data?.corporates}
          icon={faHandshake}
          linkPath="/admin/master/mitra"
        />
        <DashboardCard
          label="Dunia"
          // loading={dashboardLoading}
          value={data?.data?.worlds}
          icon={faGlobe}
          linkPath="/admin/master/dunia"
        />
        <DashboardCard
          label="Event"
          // loading={dashboardLoading}
          value={data?.data?.events}
          icon={faCalendarAlt}
          linkPath="/admin/master/event"
        />
        <DashboardCard
          label="Iklan"
          // loading={dashboardLoading}
          value={data?.data?.ads}
          icon={faNewspaper}
          linkPath=""
        />
      </div>

      <h2 className="font-semibold mt-10 mb-3 border-l-4 rounded-md border-secondary pl-3 text-slate-600 text-lg tracking-wide">Peta Persebaran Promo</h2>

      <div className="mt-2 relative overflow-hidden rounded-2xl shadow bg-white">
        <MapWithAMarker
          position={map}
          dataAds={dataAds?.data}
        />
        <div
          className="absolute top-4 right-4 w-12 h-12 bg-white flex items-center justify-center rounded-xl shadow-md hover:shadow-lg hover:bg-slate-100 transition-all duration-150 cursor-pointer"
          onClick={() => setRefreshMap(!refreshMap)}
        >
          <FontAwesomeIcon icon={faCrosshairs} className="text-2xl" />
        </div>
      </div>
    </div>
  );
}

Index.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
