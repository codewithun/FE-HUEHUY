/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import {
  faGlobe,
  faLocationDot,
  faMagnifyingGlass,
  faSort,
} from '@fortawesome/free-solid-svg-icons';
import {
  InputComponent,
  SelectComponent,
} from '../../components/base.components';
import { useGet, useLazySearch } from '../../helpers';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { distanceConvert } from '../../helpers/distanceConvert.helpers';

export default function Cari() {
  const [keywordSearch, setKeywordSearch] = useState('');
  const [search] = useLazySearch(keywordSearch);
  const [map, setMap] = useState(null);
  const [sort, setSort] = useState('created_at');
  const router = useRouter();
  const { cari, berdasarkan } = router.query;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMap({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingAds, codeAds, dataAds] = useGet({
    path:
      map && (search || sort == 'distance')
        ? `ads/${map?.lat}/${map?.lng}`
        : null,
    params: {
      search: search,
      sortBy: sort,
      sortDirection: sort == 'created_at' ? 'DESC' : 'ASC',
    },
  });

  useEffect(() => {
    setKeywordSearch(cari);
  }, [cari]);

  useEffect(() => {
    setSort(berdasarkan == 'Terdekat' ? 'distance' : 'created_at');
  }, [berdasarkan]);

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary w-full h-16"></div>

        <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20 pb-20">
          <div className="relative -top-7 px-2">
            <div className="bg-white w-full rounded-xl">
              <InputComponent
                placeholder="mau cari promo apa?..."
                rightIcon={faMagnifyingGlass}
                size="lg"
                onChange={(e) => setKeywordSearch(e)}
                value={keywordSearch}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <SelectComponent
                  placeholder="Urutkan..."
                  options={[
                    {
                      label: 'Terbaru',
                      value: 'created_at',
                    },
                    {
                      label: 'Terdekat',
                      value: 'distance',
                    },
                  ]}
                  value={sort}
                  onChange={(e) => setSort(e)}
                  size="sm"
                  leftIcon={faSort}
                />
              </div>
            </div>
          </div>

          <div className="px-4 -mt-2">
            {!loadingAds && (search || sort == 'distance') && (
              <div className="flex justify-between items-center gap-2">
                <div>
                  <p className="font-semibold">Hasil Pencarian</p>
                  <p className="text-xs text-slate-500">
                    Hasil relevan dengan pencarianmu...
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-4">
              {!loadingAds && (search || sort == 'distance') ? (
                dataAds?.data?.map((item, key) => {
                  return (
                    <Link href={`/app/${item?.cube?.code}`} key={key}>
                      <div className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative bg-white bg-opacity-40 backdrop-blur-sm">
                        <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                          <img
                            src={item?.picture_source}
                            height={700}
                            width={700}
                            alt=""
                          />
                        </div>
                        <div className="col-span-3">
                          <p className="font-semibold limit__line__1">
                            {item?.title}
                          </p>
                          <p className="text-slate-600 text-xs my-1 limit__line__2">
                            {item?.cube?.address}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <p className="text-xs text-slate-600 limit__line__1">
                              <FontAwesomeIcon icon={faLocationDot} />.{' '}
                              {distanceConvert(item?.distance)}
                            </p>
                            <p className="text-xs"> | </p>
                            <p className="text-xs text-slate-600 limit__line__1">
                              <FontAwesomeIcon icon={faGlobe} />.{' '}
                              {item?.cube?.world?.name || 'General'}
                            </p>
                            {item?.cube?.world_affiliate_id && (
                              <>
                                <p className="text-xs"> | </p>
                                <p className="text-xs text-slate-600 font-semibold limit__line__1 p-1">
                                  Affiliate
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        {/* <div className="absolute top-5 left-0 bg-white bg-opacity-50 backdrop-blur-md min-h-[20px] py-1 pl-2 pr-3 rounded-r-full flex gap-2 items-center">
                          <CubeComponent
                            size={9}
                            color={`${item?.cube?.cube_type?.color}`}
                          />
                          <p className="text-xs">
                            {item?.cube?.cube_type?.code}
                          </p>
                        </div> */}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <>
                  <div className="text-center">Isi kolom pencarian dulu...</div>
                </>
              )}
            </div>
          </div>
        </div>

        <BottomBarComponent active={'home'} />
      </div>
    </>
  );
}
