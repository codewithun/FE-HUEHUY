/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useLayoutEffect, useState } from 'react';
import DashboardCard from '../../components/construct.components/card/Dashboard.card';
import {
  faCrosshairs,
  faCubes,
  faGlobe,
  faNewspaper,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { token_cookie_name, useGet } from '../../helpers';
import { GoogleMap, withGoogleMap, withScriptjs } from 'react-google-maps';
import { InfoBox } from 'react-google-maps/lib/components/addons/InfoBox';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CorporateLayout } from '../../components/construct.components/layout/Corporate.layout';
import CubeComponent from '../../components/construct.components/CubeComponent';
import { useUserContext } from '../../context/user.context';
import Cookies from 'js-cookie';

export default function Index() {
  const [map, setMap] = useState(null);
  const [refreshMap, setRefreshMap] = useState(false);
  const { profile: Profile } = useUserContext();

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      if (!Profile?.corporate_user?.corporate_id) {
        Cookies.remove(token_cookie_name);
        window.location.href = '/corporate';
      }
    }
  }, [Profile]);

  const [loading, code, data, reset] = useGet({
    path: 'corporate/dashboard/counter-data',
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
    path: map ? `corporate/cubes` : null,
  });

  useEffect(() => {
    if (codeAds == 200) {
      setRefreshMap(!refreshMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeAds]);

  return (
    <div>
      <h1 className="text-lg lg:text-xl font-semibold mb-2">Dashboard</h1>

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
          disable={Profile?.corporate_user?.role_id != 3}
        />
        <DashboardCard
          label="Dunia"
          // loading={dashboardLoading}
          value={data?.data?.worlds}
          icon={faGlobe}
          linkPath="/corporate/master/dunia"
          disable={Profile?.corporate_user?.role_id != 3}
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
          googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyBLjp3NfOdkLbKJ85DFBg3CCQuIoKEzVZc&v=3.exp&libraries=geometry,drawing,places"
          loadingElement={<div style={{ height: `500px` }} />}
          containerElement={<div style={{ height: `500px` }} />}
          mapElement={<div style={{ height: `500px` }} />}
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

const MapWithAMarker = withScriptjs(
  withGoogleMap(({ position, dataAds }) => {
    return (
      <>
        <GoogleMap
          defaultZoom={10}
          defaultCenter={
            position ? position : { lat: -6.905977, lng: 107.613144 }
          }
          center={position ? position : { lat: -6.905977, lng: 107.613144 }}
          options={{
            streetViewControl: false,
            fullscreenControl: false,
            disableDefaultUI: true,
            keyboardShortcuts: false,
          }}
        >
          {dataAds?.map((ad, key) => {
            return (
              <InfoBox
                defaultPosition={
                  new google.maps.LatLng({
                    lat: ad?.map_lat,
                    lng: ad?.map_lng,
                  })
                }
                options={{ closeBoxURL: ``, enableEventPropagation: true }}
                key={key}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 bg-slate-200 p-1 border-white flex justify-center items-center">
                    <CubeComponent
                      size={18}
                      color={`#${ad?.cube?.cube_type?.color}`}
                    />
                  </div>
                </div>
              </InfoBox>
            );
          })}
        </GoogleMap>
      </>
    );
  })
);
