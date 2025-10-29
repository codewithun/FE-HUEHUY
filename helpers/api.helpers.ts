// api.helper.ts
import { useEffect, useState } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import Cookies from 'js-cookie';
import Router from 'next/router';
import { token_cookie_name, loginPath, basePath } from './middleware.helpers';
import fileDownload from 'js-file-download';
import { Decrypt } from './encryption.helpers';
import { standIn } from './standIn.helpers';

// Gunakan cookie terpisah untuk admin agar tidak tabrakan dengan user biasa
export const admin_token_cookie_name = `${token_cookie_name}_admin`;

// =========================>
// ## Utils ss
// =========================>
const buildBaseUrl = (base?: string, path?: string) => {
  const b = (base || '').replace(/\/+$/, ''); // trim trailing /
  const p = (path || '').replace(/^\/+/, ''); // trim leading  /
  return [b, p].filter(Boolean).join('/');
};

const getAuthHeader = () => {
  try {
    const isBrowser = typeof window !== 'undefined';
    const isAdminScope = isBrowser && typeof window.location?.pathname === 'string'
      ? window.location.pathname.startsWith('/admin')
      : false;

    // Prioritaskan token sesuai scope (admin atau user), tapi tetap fallback ke yang lain
    const names = isAdminScope
      ? [admin_token_cookie_name, token_cookie_name]
      : [token_cookie_name, admin_token_cookie_name];

    let enc: string | undefined = undefined;
    for (const name of names) {
      enc = Cookies.get(name);
      if (!enc && isBrowser) {
        const ls = localStorage.getItem(name);
        enc = ls === null ? undefined : ls;
      }
      if (enc) break;
    }

    if (!enc) {
      // eslint-disable-next-line no-console
      console.debug('No encrypted token found (cookies/localStorage) for user/admin');
      return {};
    }

    const token = Decrypt(enc);
    if (!token || token.trim() === '') {
      // eslint-disable-next-line no-console
      console.warn('Token decryption failed or empty; clearing storages');
      try {
        Cookies.remove(token_cookie_name);
        Cookies.remove(admin_token_cookie_name);
        if (isBrowser) {
          localStorage.removeItem(token_cookie_name);
          localStorage.removeItem(admin_token_cookie_name);
        }
      } catch {}
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to resolve token from storages:', error);
    try {
      Cookies.remove(token_cookie_name);
      Cookies.remove(admin_token_cookie_name);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(token_cookie_name);
        localStorage.removeItem(admin_token_cookie_name);
      }
    } catch {}
    return {};
  }
};

const mergeHeaders = (includeHeaders?: Record<string, any>) => {
  const base: Record<string, any> = {
    Accept: 'application/json',
    ...getAuthHeader(),
  };
  return { ...base, ...(includeHeaders || {}) };
};

// =========================>
// ## type of filter params
// =========================>
export type getFilterParams = {
  type?: 'equal' | 'notEqual' | 'in' | 'notIn' | 'range';
  column?: string;
  value?: string | string[];
};

// =========================>
// ## type of get params
// =========================>
export type getParams = {
  paginate?: number;
  page?: number;
  sortBy?: string;
  sortDirection?: string;
  search?: string;
  filter?: getFilterParams[];
};

// =========================>
// ## type of get props
// =========================>
export type getProps = {
  path?: string;
  url?: string;
  params?: getParams;
  includeParams?: object;
  includeHeaders?: object;
  bearer?: string;
};

// =========================>
// ## filter type value
// =========================>
export const getFilterTypeValue: Record<NonNullable<getFilterParams['type']>, string> = {
  equal: 'eq',
  notEqual: 'ne',
  in: 'in',
  notIn: 'ni',
  range: 'bw',
};

// =========================>
// ## Get function
// =========================>
export const get = async ({
  path,
  url,
  params,
  includeParams,
  includeHeaders,
  bearer,
}: getProps) => {
  const fetchUrl = url || buildBaseUrl(process.env.NEXT_PUBLIC_API_URL, path);
  const fetchHeaders: any = mergeHeaders(includeHeaders as any);

  if (bearer) {
    fetchHeaders.Authorization = `Bearer ${bearer}`;
  }

  const filter: Record<string, any> = {};
  if (params?.filter) {
    params.filter.forEach((val) => {
      if (!val?.column || !val?.type) return;
      const code = getFilterTypeValue[val.type];
      filter[val.column as keyof object] =
        `${code}:${Array.isArray(val.value) ? val.value.join(',') : (val.value ?? '')}`;
    });
  }

  try {
    const queryParams: Record<string, any> = {
      ...(params || {}),
      ...(includeParams || {}),
    };

    // hanya set 'filter' kalau memang ada
    if (params?.filter && Object.keys(filter).length > 0) {
      queryParams.filter = JSON.stringify(filter);
    }

    const res = await axios.get(fetchUrl, {
      headers: fetchHeaders,
      params: queryParams,
    });
    return res;
  } catch (err: any) {
    const resp = err?.response;
    if (resp?.status === 401) {
      // eslint-disable-next-line no-console
      console.error('401 Unauthorized error details:', {
        path: path || url,
        fullUrl: fetchUrl,
        headers: fetchHeaders,
        requestParams: params,
        responseData: resp?.data,
        responseHeaders: resp?.headers,
        timestamp: new Date().toISOString()
      });

      // TAMBAHAN: Cek apakah ini request ke endpoint yang memang butuh delay
      const isAccountRequest = (path || url || '').includes('account');
      const delayTime = isAccountRequest ? 500 : 100; // Delay lebih lama untuk account request

      // eslint-disable-next-line no-console
      console.warn(`Will redirect to login in ${delayTime}ms due to 401 error`);

      // Berikan delay kecil sebelum redirect untuk menghindari race condition
      setTimeout(() => {
        try {
          Cookies.remove(token_cookie_name);
          Cookies.remove(admin_token_cookie_name);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(token_cookie_name);
            localStorage.removeItem(admin_token_cookie_name);
          }
        } catch {}
        Router.push(loginPath);
      }, delayTime);
    }
    return resp;
  }
};

// =========================>
// ## Get hook function
// =========================>
export const useGet = (
  props: getProps & { cacheName?: string; expired?: number },
  sleep?: boolean
) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [code, setCode] = useState<number | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);

    const fetch = async () => {
      const cacheData = props.expired
        ? await standIn.get(props.cacheName || `fetch_${props?.path}`)
        : null;

      if (cacheData) {
        setLoading(false);
        setCode(200);
        setData(cacheData);
      } else {
        const response = await get(props);

        if (response?.status) {
          setLoading(false);
          setCode(response?.status);
          setData(response?.data);

          if (props.expired) {
            standIn.set({
              key: props?.cacheName || `option_${props?.path}`,
              data: response?.data,
              expired: props.expired,
            });
          }
        } else {
          setLoading(false);
          setCode(null);
          setData(null);
        }
      }
    };

    if (!sleep && (props.path || props.url)) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.path,
    props.url,
    props.params?.paginate,
    props.params?.page,
    props.params?.search,
    props.params?.sortBy,
    props.params?.sortDirection,
    props.params?.filter,
    props.includeParams,
    props.bearer,
    refresh,
    sleep,
  ]);

  const reset = () => setRefresh(!refresh);

  return [loading, code, data, reset] as const;
};

// =========================>
// ## type of post props
// =========================>
export type postProps = {
  path?: string;
  url?: string;
  params?: object;
  body?: any;
  includeHeaders?: object;
  bearer?: string;
  contentType?: 'application/json' | 'multipart/form-data';
};

// =========================>
// ## Post function
// =========================>
export const post = async ({
  path,
  url,
  params,
  body,
  includeHeaders,
  bearer,
  contentType,
}: postProps) => {
  const fetchUrl = url || buildBaseUrl(process.env.NEXT_PUBLIC_API_URL, path);
  const fetchHeaders: any = mergeHeaders(includeHeaders as any);

  if (bearer) fetchHeaders.Authorization = `Bearer ${bearer}`;

  // Backend expects proper Content-Type headers
  if (contentType === 'multipart/form-data') {
    // Let browser set boundary for FormData
    delete fetchHeaders['Content-Type'];
  } else {
    // Default to application/json for all other requests
    fetchHeaders['Content-Type'] = 'application/json';
  }

  try {
    const res = await axios.post(fetchUrl, body, {
      headers: fetchHeaders,
      params: { ...params },
    });
    return res;
  } catch (err: any) {
    const resp = err?.response;
    if (resp?.status === 401) {
      Router.push(loginPath);
    }
    return resp;
  }
};

// =========================>
// ## type of patch props
// =========================>
export type patchProps = {
  path?: string;
  url?: string;
  params?: object;
  body?: any;
  includeHeaders?: object;
  bearer?: string;
  contentType?: 'application/json' | 'multipart/form-data';
};

// =========================>
// ## Patch function
// =========================>
export const patch = async ({
  path,
  url,
  params,
  body,
  includeHeaders,
  bearer,
  contentType,
}: patchProps) => {
  const fetchUrl = url || buildBaseUrl(process.env.NEXT_PUBLIC_API_URL, path);
  const fetchHeaders: any = mergeHeaders(includeHeaders as any);

  if (bearer) fetchHeaders.Authorization = `Bearer ${bearer}`;

  if (contentType && contentType !== 'multipart/form-data') {
    fetchHeaders['Content-Type'] = contentType;
  } else {
    delete fetchHeaders['Content-Type'];
  }

  try {
    const res = await axios.patch(fetchUrl, body, {
      headers: fetchHeaders,
      params: { ...params },
    });
    return res;
  } catch (err: any) {
    const resp = err?.response;
    if (resp?.status === 401) {
      Router.push(loginPath);
    } else if (resp?.status === 403) {
      Router.push(basePath);
    }
    return resp;
  }
};

// =========================>
// ## type of destroy props
// =========================>
export type destroyProps = {
  path?: string;
  url?: string;
  params?: object;
  includeHeaders?: object;
  bearer?: string;
};

// =========================>
// ## Destroy function
// =========================>
export const destroy = async ({
  path,
  url,
  params,
  includeHeaders,
  bearer,
}: destroyProps) => {
  const fetchUrl = url || buildBaseUrl(process.env.NEXT_PUBLIC_API_URL, path);
  const fetchHeaders: any = mergeHeaders(includeHeaders as any);

  if (bearer) fetchHeaders.Authorization = `Bearer ${bearer}`;

  try {
    const res = await axios.delete(fetchUrl, {
      headers: fetchHeaders,
      params: { ...params },
    });
    return res;
  } catch (err: any) {
    const resp = err?.response;
    if (resp?.status === 401) {
      Router.push(loginPath);
    } else if (resp?.status === 403) {
      Router.push(basePath);
    }
    return resp;
  }
};

// =========================>
// ## type of download props
// =========================>
export type downloadProps = {
  path?: string;
  url?: string;
  params?: object;
  includeHeaders?: object;
  bearer?: string;
  fileName: string;
  onDownloadProgress: (e: AxiosProgressEvent) => void;
};

// =========================>
// ## Download function
// =========================>
export const download = async ({
  path,
  url,
  params,
  includeHeaders,
  bearer,
  fileName,
  onDownloadProgress,
}: downloadProps) => {
  const fetchUrl = url || buildBaseUrl(process.env.NEXT_PUBLIC_API_URL, path);
  const fetchHeaders: any = mergeHeaders(includeHeaders as any);

  if (bearer) fetchHeaders.Authorization = `Bearer ${bearer}`;

  try {
    const res = await axios.get(fetchUrl, {
      headers: fetchHeaders,
      params: { ...params },
      responseType: 'blob',
      onDownloadProgress,
    });

    if (res.status === 401) {
      Router.push(loginPath);
      return;
    }
    if (res.status === 403) {
      Router.push(basePath);
      return;
    }

    fileDownload(res.data, fileName);
    return res.data;
  } catch (err: any) {
    const resp = err?.response;
    if (resp?.status === 401) {
      Router.push(loginPath);
    } else if (resp?.status === 403) {
      Router.push(basePath);
    }
    return resp;
  }
};
