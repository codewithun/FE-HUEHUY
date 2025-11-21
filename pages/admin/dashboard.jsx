/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  faCrosshairs,
  faCubes,
  faGlobe,
  faHandshake,
  faNewspaper,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GoogleMap, InfoBox, useJsApiLoader } from '@react-google-maps/api';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import DashboardCard from '../../components/construct.components/card/Dashboard.card';
import CubeComponent from '../../components/construct.components/CubeComponent';
import { AdminLayout } from '../../components/construct.components/layout/Admin.layout';
import { useUserContext } from '../../context/user.context';
import { useGet } from '../../helpers';
import { admin_token_cookie_name } from '../../helpers/api.helpers';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

// 👉 tambah ini
const INFOBOX_WIDTH = 220;

function MapWithAMarker({ position, dataAds }) {
  const [selectedCube, setSelectedCube] = useState(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyD74gvRdtA7NAo4j8ENoOsdy3QGXU6Oklc',
    libraries: ['places'],
  });

  if (!isLoaded) return <div style={{ height: '500px' }}>Loading...</div>;

  const getCubeName = (cube) => {
    // Prioritas: ads title > address > code
    const firstAdTitle = cube?.ads?.[0]?.title;
    return firstAdTitle || cube?.address || cube?.code || 'Tanpa Nama';
  };

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
        gestureHandling: 'cooperative',
        scrollwheel: true,
      }}
    >
      {dataAds?.map((ad, key) => {
        // Pastikan koordinat valid sebelum render InfoBox
        if (!ad?.map_lat || !ad?.map_lng) return null;

        return (
          <InfoBox
            position={{
              lat: parseFloat(ad?.map_lat),
              lng: parseFloat(ad?.map_lng),
            }}
            options={{
              closeBoxURL: '',
              enableEventPropagation: true,
              boxStyle: {
                overflow: 'visible',
                background: 'transparent',
                border: 'none',
              },
            }}
            key={key}
          >
            <div
              className="relative flex flex-col items-center cursor-pointer"
              style={{ transform: 'translate(-50%, -100%)' }}
              onClick={() => setSelectedCube(selectedCube?.id === ad?.id ? null : ad)}
            >
              {selectedCube?.id === ad?.id && (
                <div
                  className="mb-1 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200"
                  style={{
                    minWidth: '220px',
                    maxWidth: '600px',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    zIndex: 9999,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
                  }}
                >
                  <p className="text-sm font-semibold text-gray-800 text-center">{getCubeName(ad)}</p>
                </div>
              )}
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 bg-slate-200 p-1 border-white flex justify-center items-center">
                {ad?.picture_source ? (
                  <img src={ad?.picture_source} className="w-12" alt="" />
                ) : (
                  <CubeComponent
                    size={18}
                    color={`${ad?.cube_type?.color}`}
                  />
                )}
              </div>
            </div>
          </InfoBox>
        );
      })}
    </GoogleMap>
  );
}

export default function Index() {
  const [map, setMap] = useState(null);
  const [mapZoom, setMapZoom] = useState(false);
  const [refreshMap, setRefreshMap] = useState(false);
  const { profile: Profile } = useUserContext();

  useEffect(() => {
    // Gunakan cookie admin khusus (dengan fallback localStorage untuk Safari)
    const adminToken = Cookies.get(admin_token_cookie_name) || (typeof window !== 'undefined' ? localStorage.getItem(admin_token_cookie_name) : null);
    if (adminToken && Profile) {
      if (Profile?.role_id !== 1) {
        // Hapus token admin dan arahkan ke halaman login admin
        Cookies.remove(admin_token_cookie_name);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(admin_token_cookie_name);
          window.location.href = '/admin';
        }
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
        () => { },
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
          label="Komunitas"
          value={(() => {
            const d = data?.data;
            if (!d) return 0;

            // urutan prioritas berdasarkan struktur umum dashboard
            if (typeof d.worlds_count === "number") return d.worlds_count;
            if (typeof d.world_count === "number") return d.world_count;
            if (typeof d.communities_count === "number") return d.communities_count;

            // kalau isinya array, hitung panjangnya
            if (Array.isArray(d.worlds)) return d.worlds.length;
            if (Array.isArray(d.communities)) return d.communities.length;

            // fallback terakhir (misal ada field worlds tapi bukan array)
            if (typeof d.worlds === "number") return d.worlds;
            if (typeof d.communities === "number") return d.communities;

            // default aman
            return 0;
          })()}
          icon={faGlobe}
          linkPath="/admin/master/komunitas_dashboard"
        />

        {/* Event card removed as the feature is no longer used */}
        <DashboardCard
          label="Iklan"
          // loading={dashboardLoading}
          value={data?.data?.ads}
          icon={faNewspaper}
          linkPath=""
        />
      </div>

      <h2 className="font-semibold mt-10 mb-3 border-l-4 rounded-md border-secondary pl-3 text-slate-600 text-lg tracking-wide">Peta Persebaran Promo</h2>

      <div className="mt-2 relative overflow-visible rounded-2xl shadow bg-white">
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
