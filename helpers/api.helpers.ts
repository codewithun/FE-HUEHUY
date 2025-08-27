// api.helper.ts
import { useEffect, useState } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import Cookies from 'js-cookie';
import Router from 'next/router';
import { token_cookie_name, loginPath, basePath } from './middleware.helpers';
import fileDownload from 'js-file-download';
import { Decrypt } from './encryption.helpers';
import { standIn } from './standIn.helpers';

// =========================>
// ## Utils
// =========================>
const buildBaseUrl = (base?: string, path?: string) => {
  const b = (base || '').replace(/\/+$/, ''); // trim trailing /
  const p = (path || '').replace(/^\/+/, ''); // trim leading  /
  return [b, p].filter(Boolean).join('/');
};

const getAuthHeader = () => {
  try {
    const enc = Cookies.get(token_cookie_name);
    if (!enc) return {};
    const token = Decrypt(enc); // bisa throw kalau cookie korup
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    // Jangan kirim header kalau decrypt gagal
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[api] token decrypt failed => no Authorization header');
    }
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
    const res = await axios.get(fetchUrl, {
      headers: fetchHeaders,
      params: {
        ...params,
        ...includeParams,
        filter: params?.filter ? JSON.stringify(filter) : '',
      },
    });
    return res;
  } catch (err: any) {
    const resp = err?.response;
    if (resp?.status === 401) {
      Cookies.remove(token_cookie_name);
      Router.push(loginPath);
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

  // Biarkan axios set boundary kalau FormData
  if (contentType && contentType !== 'multipart/form-data') {
    fetchHeaders['Content-Type'] = contentType; // json, dll.
  } else {
    delete fetchHeaders['Content-Type'];
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
