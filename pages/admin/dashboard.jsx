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
import Cookies from 'js-cookie';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import DashboardCard from '../../components/construct.components/card/Dashboard.card';
import CubeComponent from '../../components/construct.components/CubeComponent';
import { AdminLayout } from '../../components/construct.components/layout/Admin.layout';
import { useUserContext } from '../../context/user.context';
import { useGet } from '../../helpers';
import { admin_token_cookie_name } from '../../helpers/api.helpers';

const DashboardLeafletMap = dynamic(
  () => import('../../components/construct.components/maps/DashboardLeafletMap'),
  { ssr: false }
);

export default function Index() {
  const [map, setMap] = useState(null);
  const [refreshMap, setRefreshMap] = useState(false);
  const [selectedCube, setSelectedCube] = useState(null);
  const { profile: Profile } = useUserContext();

  useEffect(() => {
    const adminToken = Cookies.get(admin_token_cookie_name) || (typeof window !== 'undefined' ? localStorage.getItem(admin_token_cookie_name) : null);
    if (adminToken && Profile) {
      if (Profile?.role_id !== 1) {
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

  const handleMarkerClick = (cube) => {
    setSelectedCube(cube);
  };

  return (
    <div className="p-2 md:p-6 bg-slate-50 min-h-screen rounded-2xl">
      <h1 className="text-xl lg:text-2xl font-bold mb-4 tracking-wide text-slate-700">Dashboard</h1>

      <h2 className="font-semibold mt-5 mb-3 border-l-4 rounded-md border-secondary pl-3 text-slate-600 text-lg tracking-wide">Statistik Dasar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <DashboardCard
          label="Kubus"
          value={data?.data?.cubes}
          icon={faCubes}
          linkPath="/admin/master/kubus"
        />
        <DashboardCard
          label="Pengguna"
          value={data?.data?.users}
          icon={faUsers}
          linkPath="/admin/master/pengguna"
        />
        <DashboardCard
          label="Mitra"
          value={data?.data?.corporates}
          icon={faHandshake}
          linkPath="/admin/master/mitra"
        />
        <DashboardCard
          label="Komunitas"
          value={(() => {
            const d = data?.data;
            if (!d) return 0;

            if (typeof d.worlds_count === "number") return d.worlds_count;
            if (typeof d.world_count === "number") return d.world_count;
            if (typeof d.communities_count === "number") return d.communities_count;

            if (Array.isArray(d.worlds)) return d.worlds.length;
            if (Array.isArray(d.communities)) return d.communities.length;

            if (typeof d.worlds === "number") return d.worlds;
            if (typeof d.communities === "number") return d.communities;

            return 0;
          })()}
          icon={faGlobe}
          linkPath="/admin/master/komunitas_dashboard"
        />

        <DashboardCard
          label="Iklan"
          value={data?.data?.huehuy_ads ?? 0}
          icon={faNewspaper}
          linkPath="/admin/master/iklan"
        />
      </div>

      <h2 className="font-semibold mt-10 mb-3 border-l-4 rounded-md border-secondary pl-3 text-slate-600 text-lg tracking-wide">Peta Persebaran Promo</h2>

      <div className="mt-2 relative overflow-visible rounded-2xl shadow bg-white">
        <DashboardLeafletMap
          position={map}
          dataAds={dataAds?.data}
          onMarkerClick={handleMarkerClick}
        />
        <div
          className="absolute top-4 right-4 w-12 h-12 bg-white flex items-center justify-center rounded-xl shadow-md hover:shadow-lg hover:bg-slate-100 transition-all duration-150 cursor-pointer z-[1000]"
          onClick={() => setRefreshMap(!refreshMap)}
        >
          <FontAwesomeIcon icon={faCrosshairs} className="text-2xl" />
        </div>
      </div>

      {selectedCube && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold border-l-4 rounded-md border-secondary pl-3 text-slate-600 text-lg tracking-wide">
              Detail Kubus
            </h2>
            <button
              onClick={() => setSelectedCube(null)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
          <div className="flex items-center gap-4">
            <CubeComponent
              size={36}
              color={selectedCube?.cube_type?.color || '#888'}
            />
            <div className="text-sm text-slate-700">
              <div className="font-semibold">
                {selectedCube?.ads?.[0]?.title || selectedCube?.address || selectedCube?.code || 'Tanpa Nama'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Index.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
