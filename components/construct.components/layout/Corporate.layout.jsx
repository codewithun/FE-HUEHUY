import {
  faChartSimple,
  faCubes,
  faGlobe,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
// import { AccessProvider, UserProvider } from '../../../context';
import { HeadbarComponent, SidebarComponent } from '../../base.components';
import { UserProvider } from '../../../context/user.context';

export function CorporateLayout({ children }) {
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
          label: 'Admin',
          icon: faUser,
          path: 'master/pengguna',
        },
        // {
        //   label: 'Mitra',
        //   icon: faHandshake,
        //   path: 'master/mitra',
        // },
        {
          label: 'Dunia',
          icon: faGlobe,
          path: 'master/dunia',
        },
        // {
        //   label: 'Kategori Iklan',
        //   icon: faTags,
        //   path: 'master/kategori-iklan',
        // },
        {
          label: 'Kubus',
          icon: faCubes,
          path: 'master/kubus',
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
            panel="corporate"
            onMenuClick={() => setSidebar(!sidebar)}
            onHasAccessChange={(access) => setHasAccess(access)}
          ></HeadbarComponent>
          <div className="">
            <SidebarComponent
              basePath="/corporate"
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
