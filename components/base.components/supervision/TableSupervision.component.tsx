/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { faEdit, faPlus, faTrash, faDownload } from '@fortawesome/free-solid-svg-icons';
import { destroy, useGet } from '../../../helpers';
import { ButtonComponent } from '../button';
import { TableComponent } from '../table';
import { FormSupervisionComponent } from './FormSupervision.component';
import { FloatingPageComponent, ModalConfirmComponent } from '../modal';
import { useRouter } from 'next/router';

interface FetchControl {
  url?: string;
  path: string;
  includeHeaders?: Record<string, string>;
}

interface TableSupervisionProps {
  title?: string | React.ReactNode;
  fetchControl: FetchControl;
  // Optional static data mode: when no fetchControl.path/url provided, use this data instead
  data?: any[];
  customTopBar?: React.ReactNode;
  customTopBarWithForm?: (args: { setModalForm: (b: boolean) => void }) => React.ReactNode;
  headBar?: React.ReactNode;
  columnControl?: any;
  formControl?: any;
  formUpdateControl?: any;
  actionControl?: any;
  setToLoading?: boolean;
  setToRefresh?: any;
  includeFilters?: any[];
  customDetail?: (row: any) => React.ReactNode;
  unUrlPage?: boolean;
  noControlBar?: boolean;
  permissionCode?: number;
  refreshOnClose?: boolean;
  searchable?: boolean;
  onDetail?: (row: any) => void;
  updateEndpoint?: string | null;
  // Optional callbacks to bubble up submit results
  onStoreSuccess?: (data?: any) => void;
  onUpdateSuccess?: (data?: any) => void;
  onSubmitSuccess?: (data?: any) => void;
  onFormClose?: () => void;
}

export function TableSupervisionComponent({
  title,
  fetchControl,
  data,
  customTopBar,
  headBar,
  columnControl,
  formControl,
  formUpdateControl,
  actionControl,
  setToLoading,
  setToRefresh,
  includeFilters,
  customDetail,
  unUrlPage,
  noControlBar,
  permissionCode,
  customTopBarWithForm,
  refreshOnClose,
  searchable,
  onDetail,
  updateEndpoint,
  onStoreSuccess,
  onUpdateSuccess,
  onSubmitSuccess,
  onFormClose,
}: TableSupervisionProps) {
  const router = useRouter();
  const {
    page: pageParams,
    paginate: paginateParams,
    search: searchParams,
    'sort.direction': sortDirectionParams,
    'sort.column': sortColumnParams,
  } = router.query || {};

  const [isError, setIsError] = useState(false);
  const [modalForm, setModalForm] = useState(false);
  const [modalView, setModalView] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [paginate, setPaginate] = useState(10);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({ column: 'created_at', direction: 'desc' });
  const [search, setSearch] = useState('');
  const [searchColumn, setSearchColumn] = useState('');
  const [filter, setFilter] = useState<Record<string, any>>({});
  const [mutatefilter, setMutateFilter] = useState<any[]>([]);

  const [columns, setColumns] = useState<any[]>([]);
  const [dataTable, setDataTable] = useState<any[]>([]);
  const [dataOriginal, setDataOriginal] = useState<any[]>([]);
  const [dataSelected, setDataSelected] = useState<number | null>(null);

  const [forms, setForms] = useState<any[]>([]);

  // Base URL API tanpa trailing slash
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
  // Base URL untuk storage: hapus '/api' di ujung jika ada
  const storageBase = apiBase.replace(/\/api\/?$/, '');

  const downloadQrAsPng = useCallback(
    async (path?: string, filenameBase?: string) => {
      try {
        if (!path) {
          alert('Path file QR di server tidak ditemukan.');
          return;
        }
        const safeFilename = filenameBase || 'qr-code';
        const fileUrl = /^https?:\/\//i.test(path)
          ? path
          : `${storageBase}/storage/${path}`.replace(/([^:]\/)\/+/g, '$1');

        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fileUrl.startsWith('http:')) {
          alert('Gagal mengunduh karena mixed-content. Pastikan file tersedia via HTTPS.');
          return;
        }

        const res = await fetch(fileUrl, { mode: 'cors' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ctype = (res.headers.get('content-type') || '').toLowerCase();

        if (ctype.includes('image/png') || /\.png(\?|$)/i.test(fileUrl)) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeFilename}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          return;
        }

        const svgText = await res.text();
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const svg64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = svg64;
        });

        const TARGET = 2048;
        const ratio = img.width && img.height ? img.height / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = TARGET;
        canvas.height = Math.round(TARGET * ratio);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context not available');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngDataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngDataUrl;
        a.download = `${safeFilename}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {
        console.error('Unduh QR PNG gagal:', e);
        alert('Tidak bisa mengunduh QR. Cek URL /storage, HTTPS, dan CORS.');
      }
    },
    [storageBase]
  );

  const shouldFetch = Boolean(fetchControl?.path || fetchControl?.url);
  const isStatic = !shouldFetch;

  const [apiLoading, apiCode, apiData, reset] = useGet(
    {
      ...fetchControl,
      params: {
        page,
        paginate,
        sortBy: sort.column,
        sortDirection: sort.direction,
        search,
        filter: mutatefilter.length ? mutatefilter : undefined,
      },
    },
    setToLoading || (includeFilters && mutatefilter.length < (includeFilters?.length || 0)) || isStatic
  );

  const hasPermissions = useMemo<number[]>(() => {
    if (!permissionCode) return [];
    return (apiData?.allowed_privileges || [])
      .filter((p: string) => Number(p.split('.')[0]) === permissionCode)
      .map((p: string) => Number(p.split('.')[1]))
      .filter((n: number) => !isNaN(n));
  }, [apiData, permissionCode]);

  // Refresh ketika trigger eksternal
  useEffect(() => {
    if (isStatic) return; // no auto-reset in static mode
    !apiLoading && reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setToRefresh]);

  // Ambil parameter dari URL (jika tidak di-disable)
  useEffect(() => {
    if (unUrlPage) return;
    if (pageParams) setPage(Number(pageParams));
    if (paginateParams) setPaginate(Number(paginateParams));
    if (searchParams) setSearch(String(searchParams));
    if (sortColumnParams && sortDirectionParams) {
      const dir = String(sortDirectionParams);
      setSort({
        column: String(sortColumnParams),
        direction: dir === 'asc' || dir === 'desc' ? dir : 'desc',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query, unUrlPage]);

  // Update URL ketika state berubah (jika tidak di-disable)
  useEffect(() => {
    if (unUrlPage || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    search ? url.searchParams.set('search', search) : url.searchParams.delete('search');
    page ? url.searchParams.set('page', String(page)) : url.searchParams.delete('page');
    paginate ? url.searchParams.set('paginate', String(paginate)) : url.searchParams.delete('paginate');
    sort?.column ? url.searchParams.set('sort.column', sort.column) : url.searchParams.delete('sort.column');
    sort?.direction ? url.searchParams.set('sort.direction', sort.direction) : url.searchParams.delete('sort.direction');
    window.history.replaceState({}, '', url.toString());
  }, [page, paginate, sort, search, unUrlPage]);

  // Bentuk mutatefilter untuk API
  useEffect(() => {
    const base = Object.keys(filter).map((key) => ({
      column: key,
      type: 'in',
      value: filter[key],
    }));
    setMutateFilter(includeFilters ? [...base, ...includeFilters] : base);
  }, [filter, includeFilters]);

  // Proses data API mode
  useEffect(() => {
    if (isStatic) return; // handled by separate effect
    if (apiLoading) return;

    if (apiCode === 200 || apiCode === 204) {
      // Normalisasi payload agar tahan segala bentuk (array langsung, laravel paginator, dsb)
      let originalData: any[] = [];
      const payload = (apiData && typeof apiData === 'object') ? (apiData.data ?? apiData) : apiData;

      if (Array.isArray(payload)) originalData = payload;
      else if (Array.isArray(payload?.data)) originalData = payload.data;        // { data: [...] }
      else if (Array.isArray(payload?.items)) originalData = payload.items;      // { items: [...] }
      else if (Array.isArray(apiData?.data?.data)) originalData = apiData.data.data;   // { data: { data: [...] } }

      const newColumns: any[] = [];
      const newData: any[] = [];

      // Total row: coba beberapa jalur umum
      const apiTotal =
        apiData?.totalRow ??
        apiData?.total_row ??
        apiData?.total ??
        apiData?.meta?.total ??
        apiData?.data?.total ??
        payload?.total ??
        originalData.length;

      setTotalRow(Number(apiTotal) || 0);

      if (originalData.length) {
        // Auto generate kolom
        if (!columnControl?.custom) {
            Object.keys(originalData[0] || {}).forEach((keyName) => {
              if (!columnControl?.except || !columnControl.except.includes(keyName)) {
                newColumns.push({
                  label: keyName.charAt(0).toUpperCase() + keyName.slice(1),
                  selector: keyName,
                  width: '200px',
                  sortable: !columnControl?.exceptSorts || !columnControl.exceptSorts.includes(keyName),
                });
              }
            });
        }

        // Auto generate forms
        if (!formControl?.custom) {
          let newForms: any[] = [];
          Object.keys(originalData[0] || {}).forEach((keyName) => {
            if (!formControl?.except || !formControl.except.includes(keyName)) {
              const custom = (formControl?.change && formControl.change[keyName]) || {};
              newForms.push({
                type: custom.type || 'default',
                construction: {
                  label: custom.construction?.label || keyName.charAt(0).toUpperCase() + keyName.slice(1),
                  name: keyName,
                  placeholder: custom.construction?.placeholder || 'Please enter ' + keyName + '...',
                  options: custom.construction?.options || [],
                  validations: custom.construction?.validations || {},
                },
              });
            }
          });
          if (formControl?.include?.length) newForms = [...newForms, ...formControl.include];
          setForms(newForms);
        }

        if (!columnControl?.custom) {
          setColumns(newColumns);
        }

        // Mapping baris
        originalData.forEach((row, idx) => {
          let items: Record<string, any> = row;

            if (columnControl?.custom) {
              const mapped: Record<string, any> = {};
              columnControl.custom.forEach((col: any) => {
                mapped[col.selector] = col.item(row);
              });
              items = mapped;
            }

          Object.keys(items).forEach((k) => {
            const includeBefore =
              columnControl?.include?.filter((c: any) => c.before && c.before === k) || [];
            includeBefore.forEach((inc: any) => {
              if (inc.selector) {
                items[inc.selector] = inc.item ? inc.item(row) : null;
              }
            });

            if (columnControl?.change && columnControl.change[k]) {
              items[k] = columnControl.change[k].custom(row);
              const originalVal = row[k];
              if (
                originalVal &&
                !(columnControl.include || []).some((c: any) => c.selector === k) &&
                (typeof originalVal === 'object' || Array.isArray(originalVal))
              ) {
                items[k] = JSON.stringify(items[k]);
              }
            }
          });

          const canEdit = !permissionCode || hasPermissions.includes(3);
          const canDelete = !permissionCode || hasPermissions.includes(4);

          newData.push({
            ...items,
            action: actionControl?.custom ? (
              actionControl.custom(
                row,
                {
                  setModalView: (e: boolean) => setModalView(e),
                  setDataSelected: () => setDataSelected(idx),
                  setModalForm: (e: boolean) => setModalForm(e),
                  setModalDelete: (e: boolean) => setModalDelete(e),
                },
                hasPermissions,
                originalData.length
              )
            ) : (
              <>
                {actionControl?.include &&
                  actionControl.include(
                    row,
                    {
                      setModalView: (e: boolean) => setModalView(e),
                      setDataSelected: () => setDataSelected(idx),
                      setModalForm: (e: boolean) => setModalForm(e),
                      setModalDelete: (e: boolean) => setModalDelete(e),
                    },
                    hasPermissions
                  )}

                {canEdit &&
                  (!actionControl?.except || !actionControl.except.includes('edit')) && (
                    <ButtonComponent
                      icon={faEdit}
                      label="Ubah"
                      variant="outline"
                      paint="warning"
                      size="xs"
                      rounded
                      onClick={() => {
                        setModalForm(true);
                        setDataSelected(idx);
                      }}
                    />
                  )}

                {row?.qr_code && (
                  <ButtonComponent
                    icon={faDownload}
                    label="Unduh QR (PNG)"
                    variant="outline"
                    paint="primary"
                    size="xs"
                    rounded
                    onClick={async () => {
                      const path = row.qr_code || row.path;
                      const filenameBase = `qr-${row.tenant_name || row.id || 'code'}`;
                      await downloadQrAsPng(path, filenameBase);
                    }}
                  />
                )}

                {canDelete &&
                  (!actionControl?.except || !actionControl.except.includes('delete')) && (
                    <ButtonComponent
                      icon={faTrash}
                      label="Hapus"
                      variant="outline"
                      paint="danger"
                      size="xs"
                      rounded
                      onClick={() => {
                        setModalDelete(true);
                        setDataSelected(idx);
                      }}
                    />
                  )}
              </>
            ),
          });
        });

        setDataTable(newData);
        setDataOriginal(originalData);
      } else {
        setDataTable([]);
        setDataOriginal([]);
        setTotalRow(0);
        if (apiData?.columns?.length) {
          const newForms = apiData.columns.map((c: string) => ({
            construction: {
              label: c.charAt(0).toUpperCase() + c.slice(1),
              name: c,
              placeholder: 'Please enter ' + c + '...',
            },
          }));
          setForms(newForms);
        }
      }
      setIsError(false);
    } else {
      setIsError(true);
    }
  }, [isStatic, apiLoading, apiCode, apiData, columnControl, formControl, actionControl, hasPermissions, downloadQrAsPng, permissionCode]);

  // Proses data Static mode (no fetch)
  useEffect(() => {
    if (!isStatic) return;
    const originalData: any[] = Array.isArray(data) ? data : [];
    const newColumns: any[] = [];
    const newData: any[] = [];

    setTotalRow(originalData.length);

    if (originalData.length) {
      if (!columnControl?.custom) {
        Object.keys(originalData[0] || {}).forEach((keyName) => {
          if (!columnControl?.except || !columnControl.except.includes(keyName)) {
            newColumns.push({
              label: keyName.charAt(0).toUpperCase() + keyName.slice(1),
              selector: keyName,
              width: '200px',
              sortable: !columnControl?.exceptSorts || !columnControl.exceptSorts.includes(keyName),
            });
          }
        });
      }

      if (!formControl?.custom) {
        let newForms: any[] = [];
        Object.keys(originalData[0] || {}).forEach((keyName) => {
          if (!formControl?.except || !formControl.except.includes(keyName)) {
            const custom = (formControl?.change && formControl.change[keyName]) || {};
            newForms.push({
              type: custom.type || 'default',
              construction: {
                label: custom.construction?.label || keyName.charAt(0).toUpperCase() + keyName.slice(1),
                name: keyName,
                placeholder: custom.construction?.placeholder || 'Please enter ' + keyName + '...',
                options: custom.construction?.options || [],
                validations: custom.construction?.validations || {},
              },
            });
          }
        });
        if (formControl?.include?.length) newForms = [...newForms, ...formControl.include];
        setForms(newForms);
      }

      if (!columnControl?.custom) {
        setColumns(newColumns);
      }

      originalData.forEach((row, idx) => {
        let items: Record<string, any> = row;

        if (columnControl?.custom) {
          const mapped: Record<string, any> = {};
          columnControl.custom.forEach((col: any) => {
            mapped[col.selector] = col.item(row);
          });
          items = mapped;
        }

        Object.keys(items).forEach((k) => {
          const includeBefore = columnControl?.include?.filter((c: any) => c.before && c.before === k) || [];
          includeBefore.forEach((inc: any) => {
            if (inc.selector) {
              items[inc.selector] = inc.item ? inc.item(row) : null;
            }
          });

          if (columnControl?.change && columnControl.change[k]) {
            items[k] = columnControl.change[k].custom(row);
            const originalVal = row[k];
            if (
              originalVal &&
              !(columnControl.include || []).some((c: any) => c.selector === k) &&
              (typeof originalVal === 'object' || Array.isArray(originalVal))
            ) {
              items[k] = JSON.stringify(items[k]);
            }
          }
        });

        const canEdit = !permissionCode || hasPermissions.includes(3);
        const canDelete = !permissionCode || hasPermissions.includes(4);

        newData.push({
          ...items,
          action: actionControl?.custom
            ? actionControl.custom(
                row,
                {
                  setModalView: (e: boolean) => setModalView(e),
                  setDataSelected: () => setDataSelected(idx),
                  setModalForm: (e: boolean) => setModalForm(e),
                  setModalDelete: (e: boolean) => setModalDelete(e),
                },
                hasPermissions,
                originalData.length
              )
            : (
                <>
                  {actionControl?.include &&
                    actionControl.include(
                      row,
                      {
                        setModalView: (e: boolean) => setModalView(e),
                        setDataSelected: () => setDataSelected(idx),
                        setModalForm: (e: boolean) => setModalForm(e),
                        setModalDelete: (e: boolean) => setModalDelete(e),
                      },
                      hasPermissions
                    )}

                  {canEdit &&
                    (!actionControl?.except || !actionControl.except.includes('edit')) && (
                      <ButtonComponent
                        icon={faEdit}
                        label="Ubah"
                        variant="outline"
                        paint="warning"
                        size="xs"
                        rounded
                        onClick={() => {
                          setModalForm(true);
                          setDataSelected(idx);
                        }}
                      />
                    )}

                  {canDelete &&
                    (!actionControl?.except || !actionControl.except.includes('delete')) && (
                      <ButtonComponent
                        icon={faTrash}
                        label="Hapus"
                        variant="outline"
                        paint="danger"
                        size="xs"
                        rounded
                        onClick={() => {
                          setModalDelete(true);
                          setDataSelected(idx);
                        }}
                      />
                    )}
                </>
              ),
        });
      });

      setDataTable(newData);
      setDataOriginal(originalData);
    } else {
      setDataTable([]);
      setDataOriginal([]);
      setTotalRow(0);
    }
    setIsError(false);
  }, [isStatic, data, columnControl, formControl, actionControl, hasPermissions, permissionCode]);

  const canCreate = !permissionCode || hasPermissions.includes(2);

  return (
    <>
      <h1 className="text-lg lg:text-xl font-bold mb-2 lg:mb-4">{title}</h1>

      {!isError ? (
        <TableComponent
          topBar={
            customTopBarWithForm ? (
              customTopBarWithForm({ setModalForm: (e) => setModalForm(e) })
            ) : customTopBar ? (
              customTopBar
            ) : (
              <>
                {canCreate && <ButtonComponent label="Tambah Baru" icon={faPlus} size="sm" onClick={() => setModalForm(true)} />}
              </>
            )
          }
          noControlBar={noControlBar}
            headBar={headBar}
            columns={
              !columnControl?.custom
                ? columns
                : columnControl.custom
                    .filter(
                      (col: any) => !col.permissionCode || apiData?.allowed_privileges?.includes(col.permissionCode)
                    )
                    .map((col: any) => ({
                      label: col.label || '',
                      selector: col.selector,
                      width: col.width || '200px',
                      sortable: col.sortable,
                      filter: col.filter,
                    }))
            }
          data={dataTable}
          sortBy={sort}
          onChangeSortBy={(column: string, direction: 'asc' | 'desc') => setSort({ column, direction })}
          pagination={{
            page,
            paginate,
            totalRow,
            onChange: (_totalRow: number, newPaginate: number, newPage: number) => {
              setPaginate(newPaginate);
              setPage(newPage);
            },
          }}
          searchableColumn={columnControl?.searchable || undefined}
          onChangeSearchColumn={(e: string) => setSearchColumn(e)}
          searchColumn={searchColumn}
          onChangeFilter={(e: any) => setFilter(e)}
          filter={filter}
          loading={isStatic ? false : apiLoading}
          onChangeSearch={(e: string) => setSearch(e)}
          search={search}
          onRefresh={reset}
          onRowClick={
            onDetail
              ? (_: any, idx: number) => onDetail(dataOriginal?.[idx] || {})
              : actionControl?.except?.includes('detail')
              ? undefined
              : (_: any, idx: number) => {
                  setDataSelected(idx);
                  setModalView(true);
                }
          }
          searchable={searchable}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-8 p-5">
          <img src="/500.svg" width="350" alt="server error" />
          <h1 className="text-2xl font-bold">Server Disconnect</h1>
        </div>
      )}

      <FloatingPageComponent
        title={
          dataSelected === null
            ? typeof title === 'string'
              ? 'Tambah ' + title + ' Baru'
              : 'Tambah Baru'
            : typeof title === 'string'
            ? 'Ubah data ' + title
            : 'Ubah Data'
        }
        tip="Masukkan data yang valid dan benar!"
        show={modalForm}
        size={(dataSelected === null ? formControl?.size : formUpdateControl?.size || formControl?.size) || 'md'}
        onClose={() => {
          setModalForm(false);
          setDataSelected(null);
          if (refreshOnClose && formUpdateControl?.custom) reset();
          // bubble close to parent if provided (for external cleanup)
          try { onFormClose?.(); } catch {}
        }}
      >
        <div className="px-6 pt-4 pb-20 h-full overflow-scroll scroll_control">
          {modalForm && (
            <FormSupervisionComponent
              submitControl={{
                url: fetchControl.url
                  ? dataSelected === null
                    ? fetchControl.url
                    : fetchControl.url + '/' + (dataOriginal?.at(dataSelected) || {}).id
                  : '',
                path:
                  dataSelected === null
                    ? fetchControl.path
                    : updateEndpoint == null
                    ? fetchControl.path + '/' + (dataOriginal?.at(dataSelected) || {}).id
                    : fetchControl.path + '/' + (dataOriginal?.at(dataSelected) || {}).id + updateEndpoint,
                // Strip Content-Type untuk request FormData - biarkan browser yang atur boundary
                includeHeaders: (() => {
                  const h = { ...(fetchControl.includeHeaders || {}) };
                  delete h['Content-Type'];
                  delete h['content-type'];
                  return h; // sisakan Authorization saja
                })(),
                contentType: formControl?.contentType || undefined,
              }}
              confirmation
              forms={
                dataSelected == null
                  ? formControl?.custom || forms
                  : formUpdateControl?.custom || formControl?.custom || forms
              }
              defaultValue={
                dataSelected === null
                  ? formControl?.customDefaultValue || null
                  : formUpdateControl?.customDefaultValue
                  ? {
                      _method: 'PUT',
                      ...(formUpdateControl.customDefaultValue(dataOriginal?.at(dataSelected) || {}) || {}),
                    }
                  : { _method: 'PUT', ...(dataOriginal?.at(dataSelected) || {}) }
              }
              onSuccess={(resp: any) => {
                const wasUpdate = dataSelected !== null;
                setModalForm(false);
                reset();
                try { onSubmitSuccess?.(resp); } catch {}
                try {
                  if (wasUpdate) onUpdateSuccess?.(resp);
                  else onStoreSuccess?.(resp);
                } catch {}
                setDataSelected(null);
              }}
            />
          )}
        </div>
      </FloatingPageComponent>

      <ModalConfirmComponent
        title={typeof title === 'string' ? 'Yakin ingin menghapus ' + title : 'Yakin ingin menghapus'}
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setDataSelected(null);
        }}
        onSubmit={async () => {
          try {
            setLoadingDelete(true);
            if (dataSelected !== null) {
              const row = dataSelected !== null ? dataOriginal?.at(dataSelected) : undefined;
              if (!row?.id) {
                setLoadingDelete(false);
                return;
              }
              const resp = await destroy({
                ...fetchControl,
                url: fetchControl.url ? fetchControl.url + '/' + row.id : '',
                path: fetchControl.path + '/' + row.id,
              });
              if (resp?.status === 200 || resp?.status === 201) {
                reset();
                setDataSelected(null);
                setModalDelete(false);
              }
            }
          } finally {
            setLoadingDelete(false);
          }
        }}
        submitButton={{
          label: 'Ya',
          loading: loadingDelete,
        }}
      />

      <FloatingPageComponent
        title={'Detail ' + (typeof title === 'string' ? title : '')}
        show={modalView}
        onClose={() => {
          setModalView(false);
          setDataSelected(null);
        }}
      >
        {modalView && dataSelected != null && customDetail ? (
          customDetail(dataOriginal?.at(dataSelected) || {})
        ) : (
          <div className="flex flex-col gap-2 p-6">
            {columns.map((column, i) => (
              <div className="flex justify-between gap-4 py-2.5 border-b" key={column.selector || i}>
                <h6 className="text-lg">{column.label} :</h6>
                <p className="text-lg font-semibold">
                  {(() => {
                    const row = dataSelected !== null ? dataOriginal?.at(dataSelected) : undefined;
                    if (!row) return '-';
                    const val = row[column.selector];
                    if (val === null || val === undefined) return '-';
                    if (typeof val === 'object') return '-';
                    return String(val);
                  })()}
                </p>
              </div>
            ))}
          </div>
        )}
      </FloatingPageComponent>
    </>
  );
}
