import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  const appTitle = process.env.NEXT_PUBLIC_APP_NAME || '';
  return (
    <Html lang="en">
      <Head>
        {/* Title should be managed via next/head per-page; keep a fallback here if needed */}
        {appTitle ? <title>{appTitle}</title> : null}
        {/* Favicon and PWA links must be inside <Head> */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#015850" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
