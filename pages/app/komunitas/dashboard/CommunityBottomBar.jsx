import {
  faHome,
  faSignOutAlt,
  faTag,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useDetectKeyboardOpen from 'use-detect-keyboard-open';

const CommunityBottomBar = ({ active, communityId }) => {
  const router = useRouter();
  const isKeyboardOpen = useDetectKeyboardOpen();

  const handleLogout = () => {
    // Redirect ke halaman home
    router.push('/app');
  };

  return (
    <>
      <div
        className={`fixed ${
          isKeyboardOpen ? '-bottom-60' : 'bottom-0'
        } left-0 w-screen pt-3 pb-2 px-6 bg-white border-t border-slate-200 shadow-lg z-40`}
      >
        <div className="lg:mx-auto lg:relative lg:max-w-md">
          <div className="grid grid-cols-4 gap-1">
            <>
              {/* Home - Dashboard Komunitas */}
              <Link href={`/app/komunitas/dashboard/${communityId}`}>
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-lg ${
                      active == 'community' ? 'text-primary' : 'text-slate-500'
                    }`}
                    icon={faHome}
                  />
                  {active == 'community' && <p className="text-xs mt-1">Home</p>}
                </div>
              </Link>

              {/* Promo - Link to community promotions */}
              <Link href={`/app/komunitas/promo?communityId=${communityId}`}>
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-lg ${
                      active == 'promo' ? 'text-primary' : 'text-slate-500'
                    }`}
                    icon={faTag}
                  />
                  {active == 'promo' && <p className="text-xs mt-1">Promo</p>}
                </div>
              </Link>

              {/* Profile */}
              <Link href={`/app/komunitas/profile/profile_id?communityId=${communityId}`}>
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-lg ${
                      active == 'profile' ? 'text-primary' : 'text-slate-500'
                    }`}
                    icon={faUser}
                  />
                  {active == 'profile' && <p className="text-xs mt-1">Profile</p>}
                </div>
              </Link>

              {/* Exit/Logout */}
              <button onClick={handleLogout}>
                <div className="flex flex-col justify-center items-center py-2">
                  <FontAwesomeIcon
                    className={`text-lg ${
                      active == 'exit' ? 'text-primary' : 'text-slate-500'
                    }`}
                    icon={faSignOutAlt}
                  />
                  {active == 'exit' && <p className="text-xs mt-1">Keluar</p>}
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
