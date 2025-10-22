import {
  faBullhorn, // Tambahkan icon komunitas, import dulu di atas
  faChartSimple,
  faCubes,
  faGlobe,
  faHandshake,
  faImage,
  faPhotoFilm,
  faQrcode,
  faTags,
  faTriangleExclamation,
  faUser, // Tambahkan icon promo
  faUsers, // Tambahkan icon komunitas, import dulu di atas
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
// import { AccessProvider, UserProvider } from '../../../context';
import { UserProvider } from '../../../context/user.context';
import { HeadbarComponent, SidebarComponent } from '../../base.components';

export function AdminLayout({ children }) {
  const [sidebar, setSidebar] = useState(false);
  const [hasAccess, setHasAccess] = useState([]);

  const menu = [
    {
      label: 'Dashboard',
      items: [
        {
          label: 'Dashboard',
          icon: faChartSimple,
          path: '/dashboard',
        },
      ],
    },
    {
      label: 'Manajemen',
      collapse: false,
      items: [
        {
          label: 'Pengguna',
          icon: faUser,
          path: 'master/pengguna',
        },
        {
          label: 'Mitra',
          icon: faHandshake,
          path: 'master/mitra',
        },
        {
          label: 'Dunia',
          icon: faGlobe,
          path: 'master/dunia',
        },
        {
          label: 'Kategori Iklan',
          icon: faTags,
          path: 'master/kategori-iklan',
        },
        {
          label: 'Manajemen Kubus',
          icon: faCubes,
          items: [
            { label: 'Kubus', path: 'master/kubus' },
            { label: 'Tipe Kubus', path: 'master/tipe-kubus' },
          ],
        },
        {
          label: 'Iklan Huehuy',
          icon: faImage,
          path: 'master/iklan',
        },
        {
          label: 'Laporan Iklan',
          icon: faTriangleExclamation,
          path: 'master/laporan-iklan',
        },
        {
          label: 'Generator QR Event',
          icon: faQrcode,
          path: 'master/qrcode',
        },
        {
          label: 'Manajemen Konten',
          icon: faPhotoFilm,
          items: [
            { label: 'Widget', path: 'master/widget' },
            { label: 'Berita', path: 'master/berita' },
            { label: 'Banner', path: 'master/banner' },
            { label: 'FAQ', path: 'master/faq' },
            { label: 'Kontak Admin', path: 'master/kontak' },
          ],
        },
        {
          label: 'Manajemen Voucher',
          icon: faTags,
          path: 'master/voucher',
        },
        {
          label: 'Manajemen Promo', // Tambahkan menu promo
          icon: faBullhorn,
          path: 'master/promo_dashborad',
        },
        {
          label: 'Manajemen Komunitas',
          icon: faUsers, // Tambahkan icon komunitas, import dulu di atas
          path: 'master/komunitas_dashboard',
        },
      ],
    },
  ];

  // const availableMenu = useMemo(() => {
  //   const avails = [];

  //   menu.map((head) => {
  //     const items = [];
  //     head.items?.map((item) => {
  //       if (item.items && !item.key) {
  //         const childs = [];
  //         item.items?.map((child) => {
  //           (!child?.key ||
  //             hasAccess?.find((access) => access == child?.key)) &&
  //             childs.push(child);
  //         });

  //         childs.length && items.push({ ...item, items: childs });
  //       } else {
  //         (!item?.key || hasAccess?.find((access) => access == item?.key)) &&
  //           items.push(item);
  //       }
  //     });

  //     items.length && avails.push({ ...head, items: items });
  //   });

  //   return avails;
  // }, [menu, hasAccess]);

  return (
    <>
      <UserProvider>
        {/* <AccessProvider> */}
        <div className="bg-slate-50">
          <HeadbarComponent
            panel="admin"
            onMenuClick={() => setSidebar(!sidebar)}
            onHasAccessChange={(access) => setHasAccess(access)}
          ></HeadbarComponent>
          <div className="">
            <SidebarComponent
              basePath="/admin"
              items={menu}
              minimize={sidebar}
              onChange={() => setSidebar(false)}
              hasAccess={hasAccess}
            >
              {children}
            </SidebarComponent>
          </div>
        </div>
        {/* </AccessProvider> */}
      </UserProvider>
    </>
  );
}
