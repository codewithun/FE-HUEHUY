/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
import { faEdit, faPlus, faTrash, faDownload } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useMemo, useState } from 'react';
import { destroy, getFilterParams, useGet } from '../../../helpers';
import { ButtonComponent } from '../button';
import { tableColumnProps, TableComponent } from '../table';
import { tableSupervisionProps } from './table-supervision.props';
import { formProps } from './form-supervision.props';
import { inputCheckboxProps, inputRadioProps, selectProps } from '../input';
import { FormSupervisionComponent } from './FormSupervision.component';
import { FloatingPageComponent, ModalConfirmComponent } from '../modal';
import { useRouter } from 'next/router';

export function TableSupervisionComponent({
  title,
  fetchControl,
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
}: tableSupervisionProps) {
  const router = useRouter();
  const {
    page: pageParams,
    paginate: paginateParams,
    search: searchParams,
    'sort.direction': sortDirectionParams,
    'sort.column': sortColumnParams,
  } = router.query;

  const [isError, setIsError] = useState(false);
  const [modalForm, setModalForm] = useState(false);
  const [modalView, setModalView] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [paginate, setPaginate] = useState(10);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [sort, setSort] = useState<{ column: string; direction: 'desc' | 'asc' }>({
    column: 'created_at',
    direction: 'desc',
  });
  const [search, setSearch] = useState<string>('');
  const [searchColumn, setSearchColumn] = useState<string>('');
  const [filter, setFilter] = useState<getFilterParams[]>([]);
  const [mutatefilter, setMutateFilter] = useState<getFilterParams[]>([]);

  const [columns, setColumns] = useState<tableColumnProps[]>([]);
  const [dataTable, setDataTable] = useState<object[]>([]);
  const [dataOriginal, setDataOriginal] = useState<object[]>([]);
  const [dataSelected, setDataSelected] = useState<number | null>(null);

  const [forms, setForms] = useState<formProps[]>([]);

  // base URL API tanpa trailing slash (dipakai tombol unduh)
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

  // helper: cari communityId dari berbagai kemungkinan lokasi pada item
  const getCommunityIdFromItem = (item: any) => {
    if (!item) return 'default';
    const fromQuery =
      typeof window !== 'undefined'
        ? new URL(window.location.href).searchParams.get('communityId')
        : null;
    const candidates = [
      item.community_id,
      item.communityId,
      item.community?.id,
      item.community?.code,
      item.promo?.community_id,
      item.promo?.communityId,
      item.promo?.community?.id,
      item.promo?.community?.code,
      item.promo?.cube?.code,
      item.voucher?.community_id,
      item.voucher?.communityId,
      item.voucher?.community?.id,
      item.voucher?.community?.code,
      item.voucher?.ad?.cube?.code,
      item.ad?.cube?.code,
      fromQuery,
    ];
    const found = candidates.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
    return found || 'default';
  };

  const [loading, code, data, reset] = useGet(
    {
      ...fetchControl,
      params: {
        page,
        paginate,
        sortBy: sort.column,
        sortDirection: sort.direction,
        search: search,
        filter: mutatefilter.length ? mutatefilter : undefined,
      },
    },
    setToLoading || (includeFilters && mutatefilter.length < (includeFilters?.length || 0))
  );

  const hasPermissions = useMemo(() => {
    return data?.allowed_privileges
      ?.filter((p: string) => Number(p.split('.')[0]) == permissionCode)
      .map((p: string) => p.split('.')[1]);
  }, [data, permissionCode]);

  useEffect(() => {
    !loading && reset();
  }, [setToRefresh]); // eslint-disable-line

  useEffect(() => {
    if (!unUrlPage) {
      pageParams && setPage(Number(pageParams));
      paginateParams && setPaginate(Number(paginateParams));
      searchParams && setSearch(String(searchParams));
      sortColumnParams &&
        sortDirectionParams &&
        setSort({
          column: String(sortColumnParams),
          direction: sortDirectionParams as 'asc' | 'desc',
        });
    }
  }, [router]); // eslint-disable-line

  useEffect(() => {
    if (!unUrlPage) {
      const url = new URL(window.location.href);
      search ? url.searchParams.set('search', search) : url.searchParams.delete('search');
      page ? url.searchParams.set('page', page.toString()) : url.searchParams.delete('page');
      paginate ? url.searchParams.set('paginate', paginate.toString()) : url.searchParams.delete('paginate');
      sort?.column ? url.searchParams.set('sort.column', sort.column) : url.searchParams.delete('sort.column');
      sort?.direction ? url.searchParams.set('sort.direction', sort.direction) : url.searchParams.delete('sort.direction');
      window.history.pushState({}, '', url.toString());
    }
  }, [page, paginate, sort.column, sort.direction, search, unUrlPage]);

  // ===== Helper: unduh PNG dari /storage. Jika file SVG => convert ke PNG di FE =====
  const downloadQrAsPng = async (path: string, filenameBase: string) => {
    if (!path) {
      alert('Path file QR di server tidak ditemukan.');
      return;
    }
    const fileUrl = `${apiBase}/storage/${path}`;

    // Hindari mixed-content: FE https, API http
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fileUrl.startsWith('http:')) {
      alert('Gagal mengunduh karena mixed-content (FE https, API http). Pakai HTTPS untuk API.');
      return;
    }

    const res = await fetch(fileUrl, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const ctype = (res.headers.get('content-type') || '').toLowerCase();

    // Jika sudah PNG → langsung download
    if (ctype.includes('image/png') || /\.png(\?|$)/i.test(path)) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenameBase}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    // Jika SVG → fetch text & convert ke PNG via canvas
    const svgText = ctype.includes('svg') ? await res.text() : await (await fetch(fileUrl)).text();

    // Buat <img> dari data:URL SVG
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const svg64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = svg64;
    });

    // Render besar supaya tajam (ubah TARGET bila perlu)
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
    a.download = `${filenameBase}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  useEffect(() => {
    if (!loading) {
      if (code == 200 || code == 204) {
        const originalData = Array.isArray(data?.data) ? data.data : [];
        let newColumns: tableColumnProps[] = [];
        let newData: object[] = [];

        if (data.totalRow) setTotalRow(data.totalRow);

        if (originalData.length) {
          Object.keys(originalData.at(0)).map((keyName) => {
            if (!columnControl?.except || !columnControl?.except.includes(keyName)) {
              newColumns.push({
                label: keyName.charAt(0).toUpperCase() + keyName.slice(1),
                selector: keyName,
                width: '200px',
                sortable: !columnControl?.exceptSorts || !columnControl?.exceptSorts.includes(keyName),
              });
            }
          });

          if (!formControl?.custom) {
            let newForms: formProps[] = [];
            Object.keys(originalData.at(0)).map((keyName) => {
              if (!formControl?.except || !formControl?.except.includes(keyName)) {
                let custom = (formControl?.change && formControl?.change[keyName as keyof object]) || {};
                newForms.push({
                  type: custom.type ? custom.type : 'default',
                  construction: {
                    label: custom.construction?.label || keyName.charAt(0).toUpperCase() + keyName.slice(1),
                    name: keyName,
                    placeholder: custom.construction?.placeholder || 'Please enter ' + keyName + '...',
                    options:
                      (custom.construction as selectProps | inputCheckboxProps | inputRadioProps)?.options || [],
                    validations: custom.construction?.validations || {},
                  },
                });
              }
            });
            if (formControl?.include?.length) newForms = [...newForms, ...formControl.include];
            setForms(newForms);
          }

          setColumns(newColumns);

          originalData.map((item: object, key: number) => {
            let items: any = item;

            if (columnControl?.custom) {
              let newItems: any = {};
              columnControl?.custom?.map((column) => (newItems[column.selector] = column.item(item)));
              items = newItems;
            }

            Object.keys(items).map((keyName) => {
              const mappingIncludeColumns =
                columnControl?.include && columnControl?.include.filter((newCol) => newCol.before && newCol.before == keyName);

              mappingIncludeColumns &&
                mappingIncludeColumns.map((includeColumn) => {
                  if (includeColumn && includeColumn.selector) {
                    items[includeColumn.selector] = includeColumn.item ? includeColumn.item(originalData[key]) : null;
                  }
                });

              if (columnControl?.change && columnControl?.change[keyName as keyof object]) {
                items[keyName] = columnControl?.change[keyName as keyof object].custom(originalData[key]);
                if (
                  originalData[key][keyName] &&
                  !columnControl.include?.filter((newCol) => newCol.selector == keyName)[0] &&
                  (typeof originalData[key][keyName] === 'object' || Array.isArray(originalData[key][keyName]))
                ) {
                  items[keyName] = JSON.stringify(items[keyName]);
                }
              }
            });

            newData.push({
              ...items,
              action: actionControl?.custom ? (
                actionControl?.custom(
                  originalData[key],
                  {
                    setModalView: (e: any) => setModalView(e),
                    setDataSelected: () => setDataSelected(key),
                    setModalForm: (e: any) => setModalForm(e),
                    setModalDelete: (e: any) => setModalDelete(e),
                  },
                  hasPermissions,
                  originalData.length
                )
              ) : (
                <>
                  {actionControl?.include &&
                    actionControl?.include(
                      originalData[key],
                      {
                        setModalView: (e: any) => setModalView(e),
                        setDataSelected: () => setDataSelected(key),
                        setModalForm: (e: any) => setModalForm(e),
                        setModalDelete: (e: any) => setModalDelete(e),
                      },
                      hasPermissions
                    )}

                  {(!permissionCode || hasPermissions?.find((p: number) => p == 3)) &&
                    (!actionControl?.except || !actionControl?.except?.includes('edit')) && (
                      <ButtonComponent
                        icon={faEdit}
                        label={'Ubah'}
                        variant="outline"
                        paint="warning"
                        size={'xs'}
                        rounded
                        onClick={() => {
                          setModalForm(true);
                          setDataSelected(key);
                        }}
                      />
                    )}

                  {/* Tombol Unduh QR - ambil dari storage backend; auto convert SVG -> PNG */}
                  {(originalData as any)[key]?.qr_code && (
                    <ButtonComponent
                      icon={faDownload}
                      label={'Unduh QR (PNG)'}
                      variant="outline"
                      paint="primary"
                      size={'xs'}
                      rounded
                      onClick={async () => {
                        try {
                          const item: any = (originalData as any)[key];
                          const path = item.qr_code || item.path;
                          const filenameBase = `qr-${item.tenant_name || item.id || 'code'}`;
                          await downloadQrAsPng(path, filenameBase);
                        } catch (e) {
                          console.error('Unduh QR PNG gagal:', e);
                          alert('Tidak bisa mengunduh QR. Cek URL /storage, HTTPS, dan CORS.');
                        }
                      }}
                    />
                  )}

                  {(!permissionCode || hasPermissions?.find((p: number) => p == 4)) &&
                    (!actionControl?.except || !actionControl?.except?.includes('delete')) && (
                      <ButtonComponent
                        icon={faTrash}
                        label={'Hapus'}
                        variant="outline"
                        paint="danger"
                        size={'xs'}
                        rounded
                        onClick={() => {
                          setModalDelete(true);
                          setDataSelected(key);
                        }}
                      />
                    )}
                </>
              ),
            });
          });

          setDataTable(newData);
          setDataOriginal(originalData);
          setTotalRow(data.total_row);
        } else {
          setDataTable([]);
          setDataOriginal([]);
          setTotalRow(0);

          if (data?.columns?.length) {
            let newForms: formProps[] = [];
            data.columns.map((column: string) => {
              newForms.push({
                construction: {
                  label: column.charAt(0).toUpperCase() + column.slice(1),
                  name: column,
                  placeholder: 'Please enter ' + column + '...',
                },
              });
            });
            setForms(newForms);
          }
        }
      } else {
        setIsError(true);
      }
    }
  }, [loading, code, data, columnControl, formControl, actionControl]); // eslint-disable-line

  useEffect(() => {
    if (includeFilters) {
      setMutateFilter([
        ...(Object.keys(filter).map((key) => {
          return {
            column: key,
            type: 'in',
            value: filter[key as keyof object],
          };
        }) as getFilterParams[]),
        ...includeFilters,
      ]);
    } else {
      setMutateFilter(
        Object.keys(filter).map((key) => {
          return {
            column: key,
            type: 'in',
            value: filter[key as keyof object],
          };
        }) as getFilterParams[]
      );
    }
  }, [includeFilters, filter]); // eslint-disable-line

  return (
    <>
      <h1 className="text-lg lg:text-xl font-bold mb-2 lg:mb-4">{title}</h1>

      {!isError ? (
        <TableComponent
          topBar={
            customTopBarWithForm ? (
              customTopBarWithForm?.({
                setModalForm: (e: any) => setModalForm(e),
              })
            ) : customTopBar ? (
              customTopBar
            ) : (
              <>
                {(!permissionCode || hasPermissions?.find((p: number) => p == 2)) && (
                  <ButtonComponent label="Tambah Baru" icon={faPlus} size="sm" onClick={() => setModalForm(true)} />
                )}
              </>
            )
          }
          noControlBar={noControlBar}
          headBar={headBar}
          columns={
            !columnControl?.custom
              ? columns
              : columnControl?.custom
                  .filter(
                    (column) =>
                      !column.permissionCode || data?.allowed_privileges?.includes(column.permissionCode)
                  )
                  .map((column) => {
                    return {
                      label: column.label || '',
                      selector: column.selector,
                      width: column.width ? column.width : '200px',
                      sortable: column.sortable,
                      filter: column.filter,
                    };
                  })
          }
          data={dataTable}
          sortBy={sort}
          onChangeSortBy={(column, direction) => setSort({ column, direction })}
          pagination={{
            page,
            paginate,
            totalRow,
            onChange: (newTotalRow, newPaginate, newPage) => {
              setPaginate(newPaginate);
              setPage(newPage);
            },
          }}
          searchableColumn={columnControl?.searchable || undefined}
          onChangeSearchColumn={(e) => setSearchColumn(e)}
          searchColumn={searchColumn}
          onChangeFilter={(e) => setFilter(e)}
          filter={filter}
          loading={loading}
          onChangeSearch={(e) => setSearch(e)}
          search={search}
          onRefresh={reset}
          onRowClick={
            onDetail
              ? (_, key) => onDetail(dataOriginal?.at(key) || {})
              : actionControl?.except?.includes('detail')
              ? undefined
              : (item, key) => {
                  setDataSelected(key);
                  setModalView(true);
                }
          }
          searchable={searchable}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-8 p-5">
          <img src="/500.svg" width={'350px'} alt="server error" />
          <h1 className="text-2xl font-bold">Server Disconnect</h1>
        </div>
      )}

      <FloatingPageComponent
        title={
          dataSelected === null
            ? typeof title == 'string'
              ? 'Tambah ' + title + ' Baru'
              : 'Tambah Baru'
            : typeof title == 'string'
            ? 'Ubah data ' + title
            : 'Ubah Data'
        }
        tip={'Masukkan data yang valid dan benar!'}
        show={modalForm}
        size={(dataSelected === null ? formControl?.size : formUpdateControl?.size || formControl?.size) || 'md'}
        onClose={() => {
          setModalForm(false);
          setDataSelected(null);
          refreshOnClose && formUpdateControl?.custom && reset();
        }}
        className={''}
      >
        <div className="px-6 pt-4 pb-20 h-full overflow-scroll scroll_control">
          {modalForm && (
            <FormSupervisionComponent
              submitControl={{
                url: fetchControl.url
                  ? dataSelected === null
                    ? fetchControl.url
                    : fetchControl.url + '/' + (dataOriginal?.at(dataSelected) as { id: number })?.id
                  : '',
                path:
                  dataSelected === null
                    ? fetchControl.path
                    : updateEndpoint == null
                    ? fetchControl.path + '/' + (dataOriginal?.at(dataSelected) as { id: number })?.id
                    : fetchControl.path +
                      '/' +
                      (dataOriginal?.at(dataSelected) as { id: number })?.id +
                      updateEndpoint,
                includeHeaders: fetchControl.includeHeaders,
                contentType: formControl?.contentType ? formControl?.contentType : undefined,
              }}
              confirmation
              forms={dataSelected == null ? formControl?.custom || forms : formUpdateControl?.custom || formControl?.custom || forms}
              defaultValue={
                dataSelected === null
                  ? formControl?.customDefaultValue || null
                  : formUpdateControl?.customDefaultValue
                  ? {
                      _method: 'PUT',
                      ...formUpdateControl?.customDefaultValue(dataOriginal?.at(dataSelected) || {}),
                    }
                  : { _method: 'PUT', ...dataOriginal?.at(dataSelected) }
              }
              onSuccess={() => {
                setModalForm(false);
                reset();
                setDataSelected(null);
              }}
            />
          )}
        </div>
      </FloatingPageComponent>

      <ModalConfirmComponent
        title={typeof title == 'string' ? 'Yakin ingin menghapus ' + title : 'Yakin ingin menghapus'}
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setDataSelected(null);
        }}
        onSubmit={async () => {
          setLoadingDelete(true);

          if (dataSelected !== null) {
            let response = await destroy({
              ...fetchControl,
              url: fetchControl.url ? fetchControl.url + '/' + (dataOriginal?.at(dataSelected) as { id: number }).id : '',
              path: fetchControl.path + '/' + (dataOriginal?.at(dataSelected) as { id: number }).id,
            });

            if (response?.status == 200 || response?.status == 201) {
              setLoadingDelete(false);
              reset();
              setDataSelected(null);
              setModalDelete(false);
            } else {
              setLoadingDelete(false);
            }
          }
        }}
        submitButton={{
          label: 'Ya',
          loading: loadingDelete,
        }}
      />

      <FloatingPageComponent
        title={'Detail ' + (typeof title == 'string' ? title : '')}
        show={modalView}
        onClose={() => {
          setModalView(false);
          setDataSelected(null);
        }}
        className={''}
      >
        {modalView && dataSelected != null && customDetail ? (
          customDetail(dataOriginal?.at(dataSelected) || {})
        ) : (
          <div className="flex flex-col gap-2 p-6">
            {columns.map((column, key) => {
              return (
                <div className="flex justify-between gap-4 py-2.5 border-b" key={key}>
                  <h6 className="text-lg">{column.label} :</h6>
                  <p className="text-lg font-semibold">
                    {dataSelected != null &&
                    dataOriginal?.at(dataSelected) &&
                    typeof (dataOriginal?.at(dataSelected) as any)[column.selector] != 'object'
                      ? (dataOriginal?.at(dataSelected) as any)[column.selector]
                      : '-'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </FloatingPageComponent>
    </>
  );
}
