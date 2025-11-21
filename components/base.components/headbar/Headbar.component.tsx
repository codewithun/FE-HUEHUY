import {
  faBars,
  // faBell,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';

import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useUserContext } from '../../../context/user.context';
import { token_cookie_name, useGet } from '../../../helpers';
import {
  admin_token_cookie_name,
  corporate_token_cookie_name,
} from '../../../helpers/api.helpers';
import { HeadbarProps } from './headbar.props';

export function HeadbarComponent({ onMenuClick, panel }: HeadbarProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingProfile, codeProfile, dataProfile] = useGet({
    path: 'account',
  });
  const { setProfile: setUserProfile } = useUserContext();

  useEffect(() => {
    setUserProfile(dataProfile?.data?.profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingProfile, dataProfile]);
  return (
    <div
      className={`flex bg-primary shadow-md items-center justify-between ${
        profile ? 'rounded-bl-xl' : 'rounded-b-xl'
      } relative z-30 select-none intro__fade__down`}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={` ${
            dataProfile?.data?.profile?.role?.id == 1 ? 'bg-sky-700' : ''
          } px-4 lg:px-12 py-4 rounded-br-[150px] flex items-center gap-4 w-[320px]`}
        >
          <div className="flex lg:hidden justify-center pr-6">
            <div
              className="w-8 aspect-square flex justify-center items-center hover:text-primary rounded-md transition-colors duration-200"
              onClick={onMenuClick}
            >
              <FontAwesomeIcon icon={faBars} className="text-lg text-white" />
            </div>
          </div>
          <div className="bg-white p-1 rounded-full shadow-sm">
            <Image src="/logo.png" width={40} height={40} alt="logo HUEHUY" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white whitespace-nowrap tracking-wide">
              {dataProfile?.data?.profile.role.id == 1
                ? 'PANEL SUPER ADMIN'
                : 'PANEL MITRA'}
            </h1>
            <p className="text-xs whitespace-nowrap text-white font-medium">
              HUEHUY
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-max items-center">
        <div
          className="flex items-center gap-4 px-6 cursor-pointer py-3 mt-2 rounded-r-[15px] hover:bg-white/10 transition-colors duration-200"
          onClick={() => setProfile(!profile)}
        >
          <div className="h-10 bg-background rounded-full aspect-square overflow-hidden border border-white/30 shadow-sm">
            <img
              src={
                dataProfile?.data?.profile?.picture_source ||
                `/default-avatar.png`
              }
              width={40}
              height={40}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="hidden lg:block w-[150px] text-slate-50">
            <h6 className="font-semibold limit__line__1 text-base">
              {dataProfile?.data?.profile?.name || '-'}
            </h6>
            <h6 className="-mt-1 text-sm font-medium text-slate-200 limit__line__1">
              {dataProfile?.data?.profile?.email || '-'}
            </h6>
          </div>
        </div>
      </div>

      <OutsideClickHandler
        onOutsideClick={() => {
          setProfile(false);
        }}
      >
        <div
          className={`absolute right-0 top-[74px] rounded-l-xl shadow-md overflow-hidden bg-background z-30 ${
            profile ? 'scale-x-100 right-0' : 'scale-x-0 -right-60'
          } transition-all duration-200`}
        >
          <div className="flex items-center gap-6 px-8 py-6 rounded-b-xl shadow-md">
            <div className="h-16 bg-background border-2 border-light-primary rounded-full aspect-square overflow-hidden">
              <img
                src={
                  dataProfile?.data?.profile?.picture_source ||
                  `/default-avatar.png`
                }
                width={64}
                height={64}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="pr-5 w-[160px]">
              <h6 className="text-lg font-bold text-slate-600">
                {dataProfile?.data?.profile?.name || '-'}
              </h6>
              <h6 className="text-sm font-semibold text-gray-600 limit__line__1">
                {dataProfile?.data?.profile?.email || '-'}
              </h6>
              <h6 className="text-sm font-semibold text-warning limit__line__1">
                {dataProfile?.data?.profile?.corporate_user?.role?.name || '-'}
              </h6>
            </div>
          </div>

          <div className="py-5">
            <div
              className="px-8 py-4 flex items-center gap-5 hover:bg-red-50 cursor-pointer text-danger transition-colors duration-200"
              onClick={() => {
                // Tentukan cookie dan redirect berdasarkan panel/scope
                const isAdmin =
                  panel === 'admin' || router.pathname.startsWith('/admin');
                const isCorporate =
                  panel === 'corporate' ||
                  router.pathname.startsWith('/corporate');

                if (isAdmin) {
                  // Logout admin - hapus cookie admin dan redirect ke /admin
                  Cookies.remove(admin_token_cookie_name);
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(admin_token_cookie_name);
                  }
                  router.push('/admin');
                } else if (isCorporate) {
                  // Logout corporate - hapus cookie corporate dan redirect ke /corporate
                  Cookies.remove(corporate_token_cookie_name);
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(corporate_token_cookie_name);
                  }
                  router.push('/corporate');
                } else {
                  // Logout user - hapus cookie user dan redirect ke /
                  Cookies.remove(token_cookie_name);
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(token_cookie_name);
                  }
                  router.push('/');
                }
              }}
            >
              <FontAwesomeIcon icon={faPowerOff} />
              <label className="cursor-pointer font-semibold">Keluar</label>
            </div>
          </div>
        </div>
      </OutsideClickHandler>
    </div>
  );
}
