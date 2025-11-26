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
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import DashboardCard from '../../components/construct.components/card/Dashboard.card';
import { CorporateLayout } from '../../components/construct.components/layout/Corporate.layout';
import { useUserContext } from '../../context/user.context';
import { useGet } from '../../helpers';

// Lazy load Google Maps - hanya dimuat saat komponen ini dirender
const CorporateMapWrapper = dynamic(
  () => import('../../components/base.components/map/CorporateMapWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] rounded-[20px] bg-slate-100 animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-300 border-t-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
);

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
        () => { },
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
        <CorporateMapWrapper
          position={map}
          dataAds={dataAds?.data}
        />
        <div
          className="absolute top-4 right-4 w-12 h-12 bg-white flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
