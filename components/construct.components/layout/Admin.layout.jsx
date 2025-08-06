import {
  faChartSimple,
  faCubes,
  faGlobe,
  faHandshake,
  faImage,
  faPhotoFilm,
  faTags,
  faTriangleExclamation,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
// import { AccessProvider, UserProvider } from '../../../context';
import { HeadbarComponent, SidebarComponent } from '../../base.components';
import { UserProvider } from '../../../context/user.context';

export function AdminLayout({ children }) {
  const [sidebar, setSidebar] = useState(false);
  const [hasAccess, setHasAccess] = useState([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          label: 'Manajemen Konten',
          icon: faPhotoFilm,
          items: [
            // { label: 'Konfigurasi', path: 'master/konfigurasi' },
            { label: 'Widget', path: 'master/widget' },
            { label: 'Berita', path: 'master/berita' },
            { label: 'Banner', path: 'master/banner' },
            { label: 'FAQ', path: 'master/faq' },
            { label: 'Kontak Admin', path: 'master/kontak' },
          ],
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
