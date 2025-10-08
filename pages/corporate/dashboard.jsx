/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  faCrosshairs,
  faCubes,
  faGlobe,
  faNewspaper,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import DashboardCard from '../../components/construct.components/card/Dashboard.card';
import CubeComponent from '../../components/construct.components/CubeComponent';
import { CorporateLayout } from '../../components/construct.components/layout/Corporate.layout';
import { useUserContext } from '../../context/user.context';
import { useGet } from '../../helpers';

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
      center={position ? position : { lat: -6.905977, lng: 107.613144 }}
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
            url: '/cube-icon.png',
            scaledSize: { width: 32, height: 32 },
          }}
        >
          <InfoWindow position={{ lat: ad?.map_lat, lng: ad?.map_lng }}>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 bg-slate-200 p-1 border-white flex justify-center items-center">
                <CubeComponent
                  size={18}
                  color={`#${ad?.cube?.cube_type?.color}`}
                />
              </div>
            </div>
          </InfoWindow>
        </Marker>
      ))}
    </GoogleMap>
  );
}

export default function Index() {
  const [map, setMap] = useState(null);
  const [refreshMap, setRefreshMap] = useState(false);
  const { profile: Profile } = useUserContext();
  const [accessDenied, setAccessDenied] = useState(false);

  // Gate access using corporate_user instead of global role_id
  useEffect(() => {
    if (!Profile) return;
    const corpUser = Profile?.corporate_user;
    const corpRoleId = Number(corpUser?.role_id ?? corpUser?.role?.id);
    const isCorporateMember = !!corpUser;
    const allow = isCorporateMember && [3, 4, 5].includes(corpRoleId);
    setAccessDenied(!allow);
  }, [Profile]);

  // Debug logging for access state
  useEffect(() => {
    if (!Profile) return;
    const corpUser = Profile?.corporate_user;
    const corpRoleId = Number(corpUser?.role_id ?? corpUser?.role?.id);
    const isCorporateMember = !!corpUser;
    const allow = isCorporateMember && [3, 4, 5].includes(corpRoleId);
    console.group('Corporate Dashboard Access Validation');
    console.log('Profile:', {
      id: Profile?.id,
      name: Profile?.name,
      email: Profile?.email,
      corpRoleId,
      corporate_user: corpUser,
      allow,
    });
    console.groupEnd();
  }, [Profile]);

  const [loading, code, data, reset] = useGet({
    path: 'corporate/dashboard/counter-data',
  });

  // Log API response for debugging
  useEffect(() => {
    if (code && data) {
      console.log('Dashboard API Response:', { code, data: data?.data });
    }
  }, [code, data]);

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
    path: map ? `corporate/cubes` : null,
  });

  useEffect(() => {
    if (codeAds == 200) {
      setRefreshMap(!refreshMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeAds]);

  // Helper: check if user can access admin features (corporate admin = role 3)
  const canAccessAdminFeatures = () => {
    const corpUser = Profile?.corporate_user;
    const corpRoleId = Number(corpUser?.role_id ?? corpUser?.role?.id);
    return corpRoleId === 3;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg lg:text-xl font-semibold">Dashboard</h1>
      </div>

      {accessDenied && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
          <div className="text-sm text-red-700">
            <p className="mb-2 font-semibold">Access denied</p>
            <p className="text-xs">Akun Anda tidak terdaftar sebagai anggota corporate.</p>
          </div>
        </div>
      )}

      <h2 className="font-semibold mt-5 mb-3 border-l-4 rounded-md border-secondary pl-2">
        Statistik Dasar
      </h2>
      <div className="grid grid-cols-4 gap-3">
        <DashboardCard
          label="Kubus"
          // loading={dashboardLoading}
          value={data?.data?.cubes}
          icon={faCubes}
          linkPath="/corporate/master/kubus"
        />
        <DashboardCard
          label="Admin"
          // loading={dashboardLoading}
          value={data?.data?.users}
          icon={faUsers}
          linkPath="/corporate/master/pengguna"
          disable={!canAccessAdminFeatures()}
        />
        <DashboardCard
          label="Dunia"
          // loading={dashboardLoading}
          value={data?.data?.worlds}
          icon={faGlobe}
          linkPath="/corporate/master/dunia"
          disable={!canAccessAdminFeatures()}
        />
        <DashboardCard
          label="Iklan"
          // loading={dashboardLoading}
          value={data?.data?.ads}
          icon={faNewspaper}
          linkPath=""
        />
      </div>

      <h2 className="font-semibold mt-8 mb-3 border-l-4 rounded-md border-secondary pl-2">
        Peta Persebaran Promo
      </h2>

      <div className="mt-2 relative overflow-hidden rounded-[20px]">
        <MapWithAMarker
          position={map}
          dataAds={dataAds?.data}
        />
        <div
          className="absolute top-4 right-4 w-12 h-12 bg-white flex items-center justify-center rounded-lg"
          onClick={() => setRefreshMap(!refreshMap)}
        >
          <FontAwesomeIcon icon={faCrosshairs} className="text-2xl" />
        </div>
      </div>
    </div>
  );
}

Index.getLayout = function getLayout(page) {
  return <CorporateLayout>{page}</CorporateLayout>;
};
