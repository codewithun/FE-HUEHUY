/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  faCrosshairs,
  faCubes,
  faExclamationTriangle,
  faGlobe,
  faNewspaper,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import DashboardCard from '../../components/construct.components/card/Dashboard.card';
import CubeComponent from '../../components/construct.components/CubeComponent';
import { CorporateLayout } from '../../components/construct.components/layout/Corporate.layout';
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
  const [corporateData, setCorporateData] = useState(null);
  const { profile: Profile, forceRefreshProfile, loading: profileLoading } = useUserContext();

  // Try to fetch corporate user data directly if missing from profile
  useEffect(() => {
    const fetchCorporateUserData = async () => {
      if (!Profile || !Profile.id) return;
      
      const isCorporateRole = [3, 4, 5].includes(Profile?.role_id);
      const hasCorporateUser = Profile?.corporate_user && Profile?.corporate_user?.corporate_id;
      
      if (isCorporateRole && !hasCorporateUser) {
        try {
          console.log('🔍 Fetching corporate user data directly for user:', Profile.id);
          
          const token = Cookies.get(token_cookie_name);
          if (!token) return;
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/corporate/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token.replace(/['"]/g, '')}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('📋 Corporate user data fetched:', result);
            setCorporateData(result.data);
          } else {
            console.warn('❌ Failed to fetch corporate user data:', response.status);
          }
        } catch (error) {
          console.error('❌ Error fetching corporate user data:', error);
        }
      }
    };
    
    fetchCorporateUserData();
  }, [Profile]);

  // Auto-refresh profile if corporate_user data is missing but should be present
  useEffect(() => {
    const isCorporateRole = [3, 4, 5].includes(Profile?.role_id);
    const hasCorporateUser = Profile?.corporate_user && Profile?.corporate_user?.corporate_id;
    
    // If user has corporate role but missing corporate_user data, try refreshing once
    if (Profile && isCorporateRole && !hasCorporateUser && !profileLoading && !corporateData) {
      console.log('🔄 Auto-refreshing profile to fetch missing corporate_user data...');
      forceRefreshProfile();
    }
  }, [Profile, forceRefreshProfile, profileLoading, corporateData]);

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      console.group('Corporate Dashboard Access Validation');
      console.log('Profile:', {
        id: Profile?.id,
        name: Profile?.name,
        email: Profile?.email,
        role_id: Profile?.role_id,
        corporate_user: Profile?.corporate_user
      });
      
      // * PERBAIKAN: Validasi berdasarkan role_id dan corporate_user
      const isCorporateRole = [3, 4, 5].includes(Profile?.role_id); // Role corporate
      const hasCorporateUser = Profile?.corporate_user && Profile?.corporate_user?.corporate_id;
      
      if (!isCorporateRole) {
        console.warn('❌ Access denied: User does not have corporate role');
        console.warn(`Current role_id: ${Profile?.role_id}, required: 3, 4, or 5`);
        console.groupEnd();
        
        // Clear token dan redirect
        Cookies.remove(token_cookie_name);
        window.location.href = '/corporate';
        return;
      }
      
      if (isCorporateRole && !hasCorporateUser) {
        console.warn('⚠️  WARNING: Corporate role detected but corporate_user data is missing');
        console.warn('📋 API Issue: /account endpoint should include corporate_user relationship');
        console.warn('🔧 Backend Fix Required: Add corporate_user with() clause to profile query');
        console.warn('🚨 Temporary Access: Allowing dashboard access until backend is fixed');
        console.groupEnd();
        return; // Allow access for now
      }
      
      console.log('✅ Corporate access validated successfully');
      console.log(`Corporate ID: ${Profile?.corporate_user?.corporate_id}`);
      console.log(`Corporate Role: ${Profile?.corporate_user?.role_id}`);
      console.groupEnd();
    }
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

  // Check if user has corporate role but missing corporate_user data
  const isCorporateRole = [3, 4, 5].includes(Profile?.role_id);
  const hasCorporateUser = Profile?.corporate_user && Profile?.corporate_user?.corporate_id;
  const hasCorporateData = corporateData && corporateData?.corporate_id;
  const showWarning = isCorporateRole && !hasCorporateUser && !hasCorporateData;

  // Helper function to check if user can access admin features
  const canAccessAdminFeatures = () => {
    // Use corporate data from either profile or direct fetch
    const corporateRoleId = Profile?.corporate_user?.role_id || corporateData?.role_id;
    
    // If corporate_user data is available, check the role
    if (corporateRoleId) {
      return corporateRoleId === 3; // Only admin role
    }
    
    // If corporate_user data is missing but user has corporate role, allow access temporarily
    if (!hasCorporateUser && !hasCorporateData && isCorporateRole) {
      return true; // Temporary fallback
    }
    
    return false;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg lg:text-xl font-semibold">Dashboard</h1>
        
        {/* Action buttons when there's a corporate role issue */}
        {showWarning && (
          <div className="flex space-x-3">
            <button
              onClick={forceRefreshProfile}
              disabled={profileLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              {profileLoading ? 'Memuat...' : 'Refresh Profile'}
            </button>
            <button
              onClick={() => {
                Cookies.remove(token_cookie_name);
                window.location.href = '/corporate';
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              Logout & Login Ulang
            </button>
          </div>
        )}
      </div>

      {/* Warning banner for missing corporate user data */}
      {showWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-yellow-700">
                <p className="mb-2">
                  <strong>Peringatan:</strong> Data korporat pengguna tidak tersedia dari API.
                </p>
                <div className="text-xs space-y-1">
                  <p>• User ID: {Profile?.id} dengan role_id: {Profile?.role_id}</p>
                  <p>• Status: Role corporate terdeteksi tapi data corporate_user null</p>
                  <p>• Penyebab: Backend endpoint /account tidak include relationship corporate_user</p>
                  <p>• Solusi sementara: Coba refresh profile atau logout dan login ulang</p>
                  {corporateData && (
                    <p className="text-green-600">
                      • ✅ Data corporate berhasil dimuat: Corporate ID {corporateData.corporate_id}, Role {corporateData.role_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
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
