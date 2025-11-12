import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import Cookies from 'js-cookie';
import { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { Roboto } from "next/font/google";
import { ReactElement, ReactNode } from 'react';
import { UserProvider } from '../context/user.context';
import '../styles/general.css';
import HuehuyAdPopup from '../components/construct.components/modal/HuehuyAdPopup';
config.autoAddCss = false;

const font = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
});

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  Cookies.withAttributes({
    sameSite: 'none',
    secure: true,
  });

  return (
    <UserProvider>
      {getLayout(
        <>
          <main className={font.className}>
            <Component {...pageProps} />
            {/* Global popup that appears on promo/voucher detail pages */}
            <HuehuyAdPopup />
          </main>
        </>
      )}
    </UserProvider>
  );
}