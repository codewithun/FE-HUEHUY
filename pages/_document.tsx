import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <title>{process.env.NEXT_PUBLIC_APP_NAME || ''}</title>
      <link rel="icon" type="image/png" sizes="32x32" href="/" />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/icons/favicon-16x16.png"
      />
      <link rel="manifest" href="/manifest.json" />
      <link rel="mask-icon" href="/" color="#015850" />
      <link rel="shortcut icon" href="/" />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
