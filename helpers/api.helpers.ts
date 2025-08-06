import { useEffect, useState } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import Cookies from 'js-cookie';
import Router from 'next/router';
import { token_cookie_name, loginPath, basePath } from './middleware.helpers';
import fileDownload from 'js-file-download';
import { Decrypt } from './encryption.helpers';
import { standIn } from './standIn.helpers';

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
export const getFilterTypeValue = {
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
  const fetchUrl = url
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}/${path || ''}`;
  const fetchHeaders: any = includeHeaders || {};

  if (!fetchHeaders.Authorization) {
    if (bearer) {
      fetchHeaders.Authorization = `Bearer ${bearer}`;
    } else if (Cookies.get(token_cookie_name)) {
      fetchHeaders.Authorization = `Bearer ${Decrypt(
        Cookies.get(token_cookie_name)
      )}`;
    }
  }

  const filter: Record<string, any> = {};
  if (params?.filter) {
    params?.filter?.map((val) => {
      filter[val.column as keyof object] = `${
        getFilterTypeValue[val.type as keyof object]
      }:${Array.isArray(val.value) ? val.value.join(',') : val.value}`;
    });
  }

  // await axios.get(process.env.NEXT_PUBLIC_CSRF_URL || '');
  const fetch = await axios
    .get(fetchUrl, {
      headers: fetchHeaders,
      params: {
        ...params,
        ...includeParams,
        filter: params?.filter ? JSON.stringify(filter) : '',
      },
    })
    .then((res) => res)
    .catch((err) => err.response);

  if (fetch?.status == 401) {
    Cookies.remove(token_cookie_name);
    Router.push(loginPath);
    return fetch;
  } else if (fetch?.status == 403) {
    // Router.push(basePath);
  } else {
    return fetch;
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
    // props.includeHeaders,
    props.bearer,
    refresh,
    sleep,
  ]);

  const reset = () => setRefresh(!refresh);

  return [loading, code, data, reset];
};

// =========================>
// ## type of post props
// =========================>
export type postProps = {
  path?: string;
  url?: string;
  params?: object;
  body?: object;
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
  const fetchUrl = url
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}/${path || ''}`;
  const fetchHeaders: any = includeHeaders || {};

  if (!fetchHeaders.Authorization) {
    if (bearer) {
      fetchHeaders.Authorization = `Bearer ${bearer}`;
    } else if (Cookies.get(token_cookie_name)) {
      fetchHeaders.Authorization = `Bearer ${Decrypt(
        Cookies.get(token_cookie_name)
      )}`;
    }
  }

  if (!fetchHeaders['Content-Type']) {
    fetchHeaders['Content-Type'] = contentType
      ? contentType
      : 'application/json';
  }

  // await axios.get(process.env.NEXT_PUBLIC_CSRF_URL || '');
  const fetch = await axios
    .post(fetchUrl, body, {
      headers: fetchHeaders,
      params: {
        ...params,
      },
    })
    .then((res) => res)
    .catch((err) => err.response);

  if (fetch?.status == 401) {
    Router.push(loginPath);
  } else if (fetch?.status == 403) {
    // Router.push('');
  } else {
    return fetch;
  }
};

// =========================>
// ## type of patch props
// =========================>
export type patchProps = {
  path?: string;
  url?: string;
  params?: object;
  body?: object;
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
  const fetchUrl = url
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}/${path || ''}`;
  const fetchHeaders: any = includeHeaders || {};

  if (!fetchHeaders.Authorization) {
    if (bearer) {
      fetchHeaders.Authorization = `Bearer ${bearer}`;
    } else if (Cookies.get(token_cookie_name)) {
      fetchHeaders.Authorization = `Bearer ${Decrypt(
        Cookies.get(token_cookie_name)
      )}`;
    }
  }

  if (!fetchHeaders['Content-Type']) {
    fetchHeaders['Content-Type'] = contentType
      ? contentType
      : 'application/json';
  }

  // await axios.get(process.env.NEXT_PUBLIC_CSRF_URL || '');
  const fetch = await axios.patch(fetchUrl, body, {
    headers: fetchHeaders,
    params: {
      ...params,
    },
  });

  if (fetch.status == 401) {
    Router.push(loginPath);
  } else if (fetch.status == 403) {
    Router.push(basePath);
  } else {
    return fetch;
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
  const fetchUrl = url
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}/${path || ''}`;
  const fetchHeaders: any = includeHeaders || {};

  if (!fetchHeaders.Authorization) {
    if (bearer) {
      fetchHeaders.Authorization = `Bearer ${bearer}`;
    } else if (Cookies.get(token_cookie_name)) {
      fetchHeaders.Authorization = `Bearer ${Decrypt(
        Cookies.get(token_cookie_name)
      )}`;
    }
  }

  const fetch = await axios.delete(fetchUrl, {
    headers: fetchHeaders,
    params: {
      ...params,
    },
  });

  if (fetch.status == 401) {
    Router.push(loginPath);
  } else if (fetch.status == 403) {
    Router.push(basePath);
  } else {
    return fetch;
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
  const fetchUrl = url
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}/${path || ''}`;
  const fetchHeaders: any = includeHeaders || {};

  if (!fetchHeaders.Authorization) {
    if (bearer) {
      fetchHeaders.Authorization = `Bearer ${bearer}`;
    } else if (Cookies.get(token_cookie_name)) {
      fetchHeaders.Authorization = `Bearer ${Decrypt(
        Cookies.get(token_cookie_name)
      )}`;
    }
  }

  if (!fetchHeaders.responseType) {
    fetchHeaders.responseType = 'blob';
  }

  const fetch = await axios.get(fetchUrl, {
    headers: fetchHeaders,
    params: {
      ...params,
    },
    onDownloadProgress: onDownloadProgress,
  });

  if (fetch.status == 401) {
    Router.push(loginPath);
  } else if (fetch.status == 403) {
    Router.push(basePath);
  } else {
    fileDownload(fetch.data, fileName);
    return fetch.data;
  }
};
