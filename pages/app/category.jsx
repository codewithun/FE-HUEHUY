/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import {
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  GoogleMap,
  InfoBox,
  useJsApiLoader,
} from '@react-google-maps/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import CubeComponent from '../../components/construct.components/CubeComponent';
import { useGet } from '../../helpers';

export default function Berburu() {
  const [expands, setExpands] = useState([]);
  const [map, setMap] = useState(null);
  const [mapZoom, setMapZoom] = useState(false);
  const [refreshMap, setRefreshMap] = useState(false);
  const [modalWorld, setModalWorld] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState(null);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingMenu, codeMenu, dataMenu] = useGet({
    path: `dynamic-content?type=hunting`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [
    loadingPrimaryCategories,
    codePrimaryCategories,
    dataPrimaryCategories,
  ] = useGet({
    path: `primary-category`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingAds, codeAds, dataAds] = useGet({
    path: map
      ? `ads/${map?.lat}/${map?.lng}${
          selectedWorld ? `?world_id=${selectedWorld?.id}` : ''
        }`
      : null,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingChildCategories, codeChildCategories, dataChildCategories] =
    useGet({
      path: `categories${
        selectedWorld ? `?world_id=${selectedWorld?.id}` : ''
      }`,
    });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingWorlds, codeWorlds, dataWorlds] = useGet({
    path: `worlds`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingNear, codeNear, dataNear] = useGet({
    path: map
      ? `ads/promo-nearest/${map?.lat}/${map?.lng}${
          selectedWorld ? `?world_id=${selectedWorld?.id}` : ''
        }`
      : '',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCategories, codeCategories, dataCategories] = useGet({
    path: `ads-category`,
  });

  function MapWithAMarker({ position, dataAds }) {
    const { isLoaded } = useJsApiLoader({
      googleMapsApiKey: 'AIzaSyD74gvRdtA7NAo4j8ENoOsdy3QGXU6Oklc',
      libraries: ['places'],
    });

    if (!isLoaded) return <div style={{ height: '250px' }}>Loading...</div>;

    return (
      <GoogleMap
        center={position ? position : { lat: -6.905977, lng: 107.613144 }}
        zoom={9}
        mapContainerStyle={{ height: '250px', width: '100%' }}
        options={{
          streetViewControl: false,
          fullscreenControl: false,
          disableDefaultUI: true,
          keyboardShortcuts: false,
        }}
      >
        {dataAds?.map((ad, key) => (
          <InfoBox
            position={{
              lat: ad?.cube?.map_lat,
              lng: ad?.cube?.map_lng,
            }}
            options={{ closeBoxURL: '', enableEventPropagation: true }}
            key={key}
          >
            <Link href={`/app/${ad?.cube?.code}`}>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 bg-slate-200 p-1 border-white flex justify-center items-center">
                  {ad?.cube?.picture_source ? (
                    <img src={ad?.cube?.picture_source} className="w-12" />
                  ) : (
                    <CubeComponent
                      size={18}
                      color={`${ad?.cube?.cube_type?.color}`}
                    />
                  )}
                </div>
              </div>
            </Link>
          </InfoBox>
        ))}
      </GoogleMap>
    );
  }

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary w-full px-4 pt-4 pb-14">
          <h2 className="text-white font-semibold text-lg">
            Temukan Promo Melalui Kategori
          </h2>
        </div>
        <div className="bg-background min-h-screen w-full rounded-t-[25px] px-4 -mt-10 relative z-20 pb-28 pt-4">
          {/* <div className="mt-6 pb-24 "> */}
          <div className="flex flex-col gap-3">
            {dataChildCategories?.data?.map((item, key) => {
              return (
                <div className="py-2 border-b-2 border-slate-200" key={key}>
                  <div className="flex justify-between items-end">
                    <Link href={`/app/cari?cari=${item?.name}`}>
                      <div className="flex gap-3 items-end">
                        {item?.picture_source && (
                          <div className="w-16 aspect-square bg-slate-400 rounded-[12px] relative overflow-hidden flex justify-center items-center">
                            <img
                              src={item?.picture_source}
                              height={1000}
                              width={1000}
                              alt=""
                              className="h-full aspect-square brightness-90"
                            />
                          </div>
                        )}
                        <p className="w-2/3 whitespace-nowrap font-semibold">
                          {item?.name}
                        </p>
                      </div>
                    </Link>
                    {item?.childs?.length ? (
                      <div
                        className="w-1/3 text-right pr-3"
                        onClick={() => {
                          if (expands?.find((e) => e == item?.id)) {
                            setExpands(expands.filter((e) => e != item?.id));
                          } else {
                            setExpands([
                              ...expands.filter((e) => e != item?.id),
                              item?.id,
                            ]);
                          }
                        }}
                      >
                        <FontAwesomeIcon
                          icon={
                            expands?.find((e) => e == item?.id)
                              ? faChevronUp
                              : faChevronDown
                          }
                        />
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>

                  {expands?.find((e) => e == item?.id) && (
                    <div className="flex flex-col gap-3 mt-2 pl-2">
                      {item?.childs?.map((item, key) => {
                        return (
                          <div
                            className="py-2 border-b-2 border-slate-200"
                            key={key}
                          >
                            <div className="flex justify-between">
                              <Link href={`/app/cari?cari=${item?.name}`}>
                                <p className="w-2/3 whitespace-nowrap">
                                  {item?.name}
                                </p>
                              </Link>
                              {item?.childs?.length ? (
                                <div
                                  className="w-1/3 text-right"
                                  onClick={() => {
                                    if (expands?.find((e) => e == item?.id)) {
                                      setExpands(
                                        expands.filter((e) => e != item?.id)
                                      );
                                    } else {
                                      setExpands([
                                        ...expands.filter((e) => e != item?.id),
                                        item?.id,
                                      ]);
                                    }
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={
                                      expands?.find((e) => e == item?.id)
                                        ? faChevronUp
                                        : faChevronDown
                                    }
                                  />
                                </div>
                              ) : (
                                <></>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <BottomBarComponent active={'hunting'} />
      </div>
    </>
  );
}
