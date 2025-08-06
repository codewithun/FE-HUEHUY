/* eslint-disable @next/next/no-img-element */
import { faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
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
  // const [modalDeleteSuccess, setModalDeleteSuccess] = useState(false);
  // const [modalDeleteError, setModalDeleteError] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [paginate, setPaginate] = useState(10);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [sort, setSort] = useState<{
    column: string;
    direction: 'desc' | 'asc';
  }>({
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
    setToLoading ||
      (includeFilters && mutatefilter.length < includeFilters?.length)
  );

  const hasPermissions = useMemo(() => {
    return data?.allowed_privileges
      ?.filter((p: string) => Number(p.split('.')[0]) == permissionCode)
      .map((p: string) => p.split('.')[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, permissionCode]);

  useEffect(() => {
    !loading && reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setToRefresh]);

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!unUrlPage) {
      const url = new URL(window.location.href);
      search && url.searchParams.set('search', search);
      page && url.searchParams.set('page', page.toString());
      paginate && url.searchParams.set('paginate', paginate.toString());
      sort?.column && url.searchParams.set('sort.column', sort.column);
      sort?.direction && url.searchParams.set('sort.direction', sort.direction);
      window.history.pushState({}, '', url.toString());
    }
  }, [page, paginate, sort.column, sort.direction, search, unUrlPage]);

  useEffect(() => {
    if (!loading) {
      if (code == 200 || code == 204) {
        const originalData = data.data;
        let newColumns: tableColumnProps[] = [];
        let newData: object[] = [];

        if (data.totalRow) {
          setTotalRow(data.totalRow);
        }

        if (originalData.length) {
          // if (!columnControl?.custom) {
          Object.keys(originalData.at(0)).map((keyName) => {
            if (
              !columnControl?.except ||
              !columnControl?.except.includes(keyName)
            ) {
              newColumns.push({
                label: keyName.charAt(0).toUpperCase() + keyName.slice(1),
                selector: keyName,
                width: '200px',
                sortable:
                  !columnControl?.exceptSorts ||
                  !columnControl?.exceptSorts.includes(keyName),
              });
            }
          });
          // }

          if (!formControl?.custom) {
            let newForms: formProps[] = [];

            Object.keys(originalData.at(0)).map((keyName) => {
              if (
                !formControl?.except ||
                !formControl?.except.includes(keyName)
              ) {
                let custom =
                  (formControl?.change &&
                    formControl?.change[keyName as keyof object]) ||
                  {};

                newForms.push({
                  type: custom.type ? custom.type : 'default',
                  construction: {
                    label:
                      custom.construction?.label ||
                      keyName.charAt(0).toUpperCase() + keyName.slice(1),
                    name: keyName,
                    placeholder:
                      custom.construction?.placeholder ||
                      'Please enter ' + keyName + '...',
                    options:
                      (
                        custom.construction as
                          | selectProps
                          | inputCheckboxProps
                          | inputRadioProps
                      )?.options || [],
                    validations: custom.construction?.validations || {},
                  },
                });
              }
            });

            if (formControl?.include && formControl?.include?.length) {
              newForms = [...newForms, ...formControl?.include];
            }

            setForms(newForms);
          }

          setColumns(newColumns);

          originalData.map((item: object, key: number) => {
            let items: any = item;

            if (columnControl?.custom) {
              let newItems: any = {};
              columnControl?.custom?.map((column) => {
                newItems[column.selector] = column.item(item);
              });

              items = newItems;
            }

            Object.keys(items).map((keyName) => {
              const mappingIncludeColumns =
                columnControl?.include &&
                columnControl?.include.filter(
                  (newCol) => newCol.before && newCol.before == keyName
                );

              mappingIncludeColumns &&
                mappingIncludeColumns.map((includeColumn) => {
                  if (includeColumn && includeColumn.selector) {
                    items[includeColumn.selector] = includeColumn.item
                      ? includeColumn.item(originalData[key])
                      : null;
                  }
                });

              if (
                columnControl?.change &&
                columnControl?.change[keyName as keyof object]
              ) {
                items[keyName] = columnControl?.change[
                  keyName as keyof object
                ].custom(originalData[key]);

                if (
                  originalData[key][keyName] &&
                  !columnControl.include?.filter(
                    (newCol) => newCol.selector == keyName
                  )[0] &&
                  (typeof originalData[key][keyName] === 'object' ||
                    Array.isArray(originalData[key][keyName]))
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

                  {/* {(!actionControl?.except ||
                    !actionControl?.except.includes('detail')) && (
                    <ButtonComponent
                      icon={faEye}
                      label={'Detail'}
                      variant="outline"
                      paint="secondary"
                      size={'xs'}
                      rounded
                      onClick={() => {
                        setModalView(true);
                        setDataSelected(key);
                      }}
                    />
                  )} */}

                  {(!permissionCode ||
                    hasPermissions?.find((p: number) => p == 3)) &&
                    (!actionControl?.except ||
                      !actionControl?.except?.includes('edit')) && (
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

                  {(!permissionCode ||
                    hasPermissions?.find((p: number) => p == 4)) &&
                    (!actionControl?.except ||
                      !actionControl?.except?.includes('delete')) && (
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, code, data, columnControl, formControl, actionControl]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeFilters, filter]);
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
                {(!permissionCode ||
                  hasPermissions?.find((p: number) => p == 2)) && (
                  <ButtonComponent
                    label="Tambah Baru"
                    icon={faPlus}
                    size="sm"
                    onClick={() => setModalForm(true)}
                  />
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
                      !column.permissionCode ||
                      data?.allowed_privileges?.includes(column.permissionCode)
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
        size={
          (dataSelected === null
            ? formControl?.size
            : formUpdateControl?.size || formControl?.size) || 'md'
        }
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
                    : fetchControl.url +
                      '/' +
                      (dataOriginal?.at(dataSelected) as { id: number })?.id
                  : '',
                path:
                  dataSelected === null
                    ? fetchControl.path
                    : updateEndpoint == null
                    ? fetchControl.path +
                      '/' +
                      (dataOriginal?.at(dataSelected) as { id: number })?.id
                    : fetchControl.path +
                      '/' +
                      (dataOriginal?.at(dataSelected) as { id: number })?.id +
                      updateEndpoint,
                includeHeaders: fetchControl.includeHeaders,
                contentType: formControl?.contentType
                  ? formControl?.contentType
                  : undefined,
              }}
              // method={dataSelected === null ? 'post' : 'put'}
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
                      ...formUpdateControl?.customDefaultValue(
                        dataOriginal?.at(dataSelected) || {}
                      ),
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
        title={
          typeof title == 'string'
            ? 'Yakin ingin menghapus ' + title
            : 'Yakin ingin menghapus'
        }
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
              url: fetchControl.url
                ? fetchControl.url +
                  '/' +
                  (dataOriginal?.at(dataSelected) as { id: number }).id
                : '',
              path:
                fetchControl.path +
                '/' +
                (dataOriginal?.at(dataSelected) as { id: number }).id,
            });

            if (response?.status == 200 || response?.status == 201) {
              setLoadingDelete(false);
              reset();
              setDataSelected(null);
              setModalDelete(false);
            } else {
              // setModalDeleteError(true);
              setLoadingDelete(false);
              // setModalDelete(false);
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
                <div
                  className="flex justify-between gap-4 py-2.5 border-b"
                  key={key}
                >
                  <h6 className="text-lg">{column.label} :</h6>
                  <p className="text-lg font-semibold">
                    {dataSelected != null &&
                    dataOriginal?.at(dataSelected) &&
                    typeof (dataOriginal?.at(dataSelected) as any)[
                      column.selector
                    ] != 'object'
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
