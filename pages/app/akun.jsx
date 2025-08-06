/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faCoins,
  faCubes,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { token_cookie_name, useGet } from '../../helpers';
import CubeComponent from '../../components/construct.components/CubeComponent';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';
import { ButtonComponent } from '../../components/base.components';

export default function Akun() {
  const router = useRouter();
  const [modalConfirm, setModalConfirm] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: `account`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingArticle, codeArticle, dataArticle] = useGet({
    path: `article`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCubeType, codeCubeType, dataCubeType] = useGet({
    path: `cube-type`,
  });

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50">
        <div className="bg-primary w-full h-[180px] rounded-b-[40px]">
          <div className="flex flex-col gap-2 items-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mt-6 border-2 border-slate-100">
              <img
                src={
                  data?.data?.profile?.picture_source
                    ? data?.data?.profile?.picture_source
                    : '/avatar.jpg'
                }
                width={400}
                height={400}
                alt=""
                className="h-full"
              />
            </div>
            <p className="text-white text-lg font-semibold mt-2">
              {data?.data?.profile?.name}
            </p>
          </div>
        </div>

        <div className="px-4 -mt-8 pb-28">
          <div className="bg-white rounded-lg p-3 grid grid-cols-2 gap-4">
            <div className="flex gap-3 items-center border-r border-slate-300">
              <div className="w-12 h-12 flex justify-center items-center">
                <FontAwesomeIcon
                  icon={faCoins}
                  className="text-2xl text-slate-400"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Huehuy Poin</p>
                <p className="font-semibold">
                  {data?.data?.profile?.point} Poin
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 flex justify-center items-center">
                <FontAwesomeIcon
                  icon={faCubes}
                  className="text-2xl text-slate-400"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Kubus Kamu</p>
                <p className="font-semibold">
                  {data?.data?.profile?.cubes?.length} Kubus
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold mt-6">Inventory</p>
          <Link href="/app/kubusku">
            <div className="py-4 flex justify-between items-center border-b border-b-gray-300">
              <p className="font-medium">Kubusku</p>
              <p>
                <FontAwesomeIcon icon={faChevronRight} />
              </p>
            </div>
          </Link>
          <Link href="/app/validasi">
            <div className="py-4 flex justify-between items-center border-b border-b-gray-300">
              <p className="font-medium">Validasi</p>
              <p>
                <FontAwesomeIcon icon={faChevronRight} />
              </p>
            </div>
          </Link>

          <p className="text-sm font-semibold mt-6">Akun & Bantuan</p>
          <Link href="/app/informasi-akun">
            <div className="py-4 flex justify-between items-center border-b border-b-gray-300">
              <p className="font-medium">Informasi Akun</p>
              <p>
                <FontAwesomeIcon icon={faChevronRight} />
              </p>
            </div>
          </Link>
          <Link href="/app/pusat-bantuan">
            <div className="py-4 flex justify-between items-center border-b border-b-gray-300">
              <p className="font-medium">Pusat Bantuan</p>
              <p>
                <FontAwesomeIcon icon={faChevronRight} />
              </p>
            </div>
          </Link>
          <Link href="/app/hubungi-kami">
            <div className="py-4 flex justify-between items-center border-b border-b-gray-300">
              <p className="font-medium">Hubungi Admin</p>
              <p>
                <FontAwesomeIcon icon={faChevronRight} />
              </p>
            </div>
          </Link>
          <Link href="/app/kebijakan-privasi">
            <div className="py-4 flex justify-between items-center border-b border-b-gray-300">
              <p className="font-medium">Kebijakan & Privasi</p>
              <p>
                <FontAwesomeIcon icon={faChevronRight} />
              </p>
            </div>
          </Link>

          <p className="text-sm font-semibold mt-6">Informasi Kubus</p>
          <div className="w-full pb-2 overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-2">
            <div className="flex flex-nowrap gap-4 w-max">
              {dataCubeType?.data?.map((item, key) => {
                return (
                  <div
                    className="w-[280px] grid grid-cols-5 gap-3 p-3 shadow-sm rounded-[15px] relative bg-white bg-opacity-40 backdrop-blur-sm"
                    key={key}
                  >
                    <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-gray-100">
                      <CubeComponent size={18} color={item?.color} />
                    </div>
                    <div className="col-span-4">
                      <p className="font-semibold">
                        {item?.name} ({item?.code})
                      </p>

                      <p className="text-slate-600 text-xs">
                        {item?.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-sm font-semibold mt-4">Berita Huehuy</p>
          <div className="w-full pb-2 overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-2">
            <div className="flex flex-nowrap gap-4 w-max">
              {dataArticle?.data?.map((item, key) => {
                return (
                  <Link href={`/app/berita/${item?.slug}`} key={key}>
                    <div className="w-[320px] bg-white bg-opacity-40 backdrop-blur-sm grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative">
                      <div className="w-full aspect-square rounded-lg bg-slate-40 overflow-hidden">
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

                        <p className="text-slate-600 text-xs mt-1 limit__line__2">
                          {item?.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div
            className="bg-red-50 text-red-700 rounded-lg mt-4 p-4 flex gap-4 items-center border-b border-b-gray-300"
            onClick={() => {
              setModalConfirm(true);
            }}
          >
            <p>
              <FontAwesomeIcon icon={faPowerOff} />
            </p>
            <p className="font-medium">Keluar</p>
          </div>
        </div>
        <BottomBarComponent active={'user'} />
      </div>

      <BottomSheetComponent
        show={modalConfirm}
        onClose={() => setModalConfirm(false)}
        title={'Yakin mau keluar?'}
        height={130}
      >
        <div className="grid grid-cols-2 gap-4 p-4">
          <ButtonComponent
            label="Batal"
            variant="light"
            block
            rounded
            onClick={() => setModalConfirm(false)}
          />
          <ButtonComponent
            label="Ya"
            variant="simple"
            paint="danger"
            block
            rounded
            onClick={() => {
              Cookies.remove(token_cookie_name);
              router.push('/');
            }}
          />
        </div>
      </BottomSheetComponent>
    </>
  );
}
