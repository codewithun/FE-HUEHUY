import {
  faHome,
  faSignOutAlt,
  faTag,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
// NOTE: Avoid SSR issues from external hooks by using a local keyboard-open detector
// that only runs on the client.

import { useEffect, useRef, useState } from 'react';

// Lightweight, SSR-safe keyboard detector for mobile browsers
function useKeyboardOpenSafe() {
  const [open, setOpen] = useState(false);
  const baseHeightRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const updateFromViewport = () => {
      if (!vv) return;
      // Heuristic: if viewport height shrinks by > 150px, assume keyboard open
      const delta = (baseHeightRef.current || vv.height) - vv.height;
      setOpen(delta > 150);
    };

    const updateFromWindow = () => {
      // Fallback if visualViewport isn't supported
      const h = window.innerHeight;
      if (!baseHeightRef.current) baseHeightRef.current = h;
      const delta = baseHeightRef.current - h;
      setOpen(delta > 150);
    };

    // Initialize base height after a tick to avoid SSR mismatch
    const init = () => {
      if (vv) {
        baseHeightRef.current = vv.height;
        vv.addEventListener('resize', updateFromViewport);
        vv.addEventListener('scroll', updateFromViewport);
      } else {
        baseHeightRef.current = window.innerHeight;
        window.addEventListener('resize', updateFromWindow);
        window.addEventListener('orientationchange', updateFromWindow);
      }
    };

    // Small timeout to capture the correct base height after page paint
    const t = setTimeout(init, 0);

    return () => {
      clearTimeout(t);
      if (vv) {
        vv.removeEventListener('resize', updateFromViewport);
        vv.removeEventListener('scroll', updateFromViewport);
      } else {
        window.removeEventListener('resize', updateFromWindow);
        window.removeEventListener('orientationchange', updateFromWindow);
      }
    };
  }, []);

  return open;
}

const CommunityBottomBar = ({ active, communityId }) => {
  const router = useRouter();
  const isKeyboardOpen = useKeyboardOpenSafe();

  const handleLogout = () => {
    // Redirect ke halaman home
    router.push('/app');
  };

  return (
    <>
      <div
        className={`fixed ${
          isKeyboardOpen ? '-bottom-60' : 'bottom-0'
        } left-0 w-screen pt-3 pb-2 px-6 bg-white/30 backdrop-blur-md border-t border-white/30 shadow-lg z-40`}
      >
        <div className="lg:mx-auto lg:relative lg:max-w-md">
          <div className="grid grid-cols-4 gap-1">
            <>
              {/* Home - Dashboard Komunitas */}
              <Link href={`/app/komunitas/dashboard/${communityId}`}>
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-lg ${
                      active == 'community' ? 'text-white' : 'text-white/70'
                    }`}
                    icon={faHome}
                  />
                  {active == 'community' && <p className="text-xs mt-1 text-white">Home</p>}
                </div>
              </Link>

              {/* Promo - Link to community promotions */}
              <Link href={`/app/komunitas/promo?communityId=${communityId}`}>
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-lg ${
                      active == 'promo' ? 'text-white' : 'text-white/70'
                    }`}
                    icon={faTag}
                  />
                  {active == 'promo' && <p className="text-xs mt-1 text-white">Promo</p>}
                </div>
              </Link>

              {/* Profile */}
              <Link href={`/app/komunitas/profile/profile_id?communityId=${communityId}`}>
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-lg ${
                      active == 'profile' ? 'text-white' : 'text-white/70'
                    }`}
                    icon={faUser}
                  />
                  {active == 'profile' && <p className="text-xs mt-1 text-white">Profile</p>}
                </div>
              </Link>

              {/* Exit/Logout */}
              <button onClick={handleLogout}>
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-lg ${
                      active == 'exit' ? 'text-white' : 'text-white/70'
                    }`}
                    icon={faSignOutAlt}
                  />
                  {active == 'exit' && <p className="text-xs mt-1 text-white">Keluar</p>}
                </div>
              </button>
            </>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityBottomBar;
