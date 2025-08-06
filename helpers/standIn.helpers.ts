export const cacheName =
  String(process.env.NEXT_PUBLIC_APP_NAME || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') + '.stand-in';

export type setStandInProps = {
  key: string;
  data: any;
  expired: number;
};

export const standIn = {
  set: ({ key, data, expired }: setStandInProps) => {
    const prevData = localStorage.getItem(cacheName)
      ? JSON.parse(localStorage.getItem(cacheName) || '')
      : {};

    prevData[key] = {
      expired: new Date().setMinutes(new Date().getMinutes() + expired),
      data,
    };

    localStorage.setItem(cacheName, JSON.stringify(prevData));
  },
  get: (key: string) => {
    const data = localStorage.getItem(cacheName)
      ? JSON.parse(localStorage.getItem(cacheName) || '')
      : {};
    if (data[key] && data[key].expired > new Date()) {
      return data[key]?.data;
    } else {
      return null;
    }
  },
};
