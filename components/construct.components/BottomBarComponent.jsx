import {
  faHome,
  faBookmark,
  faUser,
  faLocationCrosshairs,
  faComments,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
// import { useRouter } from 'next/router';
import React from 'react';
import useDetectKeyboardOpen from 'use-detect-keyboard-open';

const BottomBarComponent = ({ active }) => {
  // const router = useRouter();
  const isKeyboardOpen = useDetectKeyboardOpen();

  return (
    <>
      <div
        className={`fixed ${
          isKeyboardOpen ? '-bottom-60' : 'bottom-0'
        } left-0 w-screen pt-3 pb-2 px-6 bg-slate-100 rounded-t-[25px] z-40`}
      >
        <div className="lg:mx-auto lg:relative lg:max-w-md">
          <div className="grid grid-cols-5 gap-2">
            <>
              <Link href="/app">
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-xl ${
                      active == 'home' ? 'text-primary' : 'text-slate-500'
                    }`}
                    icon={faHome}
                  />
                  {active == 'home' && <p className="text-xs mt-1">Beranda</p>}
                </div>
              </Link>

              <Link href="/app/saku">
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-xl ${
                      active == 'save' ? 'text-primary' : 'text-slate-500'
                    }`}
                    icon={faBookmark}
                  />
                  {active == 'save' && <p className="text-xs mt-1">Saku</p>}
                </div>
              </Link>
            </>
            <div className="relative">
              <Link href="/app/berburu">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-background w-16 rounded-2xl aspect-square flex justify-center items-center shadow-md">
                  <FontAwesomeIcon
                    className="text-3xl"
                    icon={faLocationCrosshairs}
                  />
                </div>
              </Link>
            </div>
            <>
              {/* <Link href="/app/notifikasi">
                <div className="flex  flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-xl ${
                      active == 'notification'
                        ? 'text-primary'
                        : 'text-slate-500'
                    }`}
                    icon={faBell}
                  />
                  {active == 'notification' && (
                    <p className="text-xs mt-1">Notifikasi</p>
                  )}
                </div>
              </Link> */}
              <Link href="/app/pesan">
                <div className="flex  flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-xl ${
                      active == 'notification'
                        ? 'text-primary'
                        : 'text-slate-500'
                    }`}
                    icon={faComments}
                  />
                  {active == 'notification' && (
                    <p className="text-xs mt-1">Pesan</p>
                  )}
                </div>
              </Link>

              <Link href="/app/akun">
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-xl ${
                      active == 'user' ? 'text-primary' : 'text-slate-500'
                    }`}
                    icon={faUser}
                  />
                  {active == 'user' && <p className="text-xs mt-1">Akun</p>}
                </div>
              </Link>
            </>
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomBarComponent;
