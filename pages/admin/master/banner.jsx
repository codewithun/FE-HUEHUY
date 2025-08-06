/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  FormSupervisionComponent,
  IconButtonComponent,
  InputComponent,
  ModalConfirmComponent,
  SelectComponent,
} from '../../../components/base.components';
import PaginateComponent from '../../../components/base.components/table/Paginate.component';
import InputImageComponent from '../../../components/base.components/input/InputImage.component';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import { destroy, useGet } from '../../../helpers';
import {
  faEdit,
  faMagnifyingGlass,
  faPlus,
  faRefresh,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

export default function ManageSlider() {
  // const { accessActive, loading } = useAccessContext();
  const [paginate, setPaginate] = useState(9);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [sort, setSort] = useState({
    column: 'created_at',
    direction: 'desc',
  });
  const [keyword, setKeyword] = useState('');

  const [modalForm, setModalForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalDelete, setModalDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const fetchControl = {
    path: 'admin/banners',
  };

  const [fetchLoading, code, data, reset] = useGet({
    ...fetchControl,
    params: {
      page,
      paginate,
      sortBy: sort.column,
      sortDirection: sort.direction,
      search: keyword,
    },
  });
  useEffect(() => {
    setTotalRow(data?.total);
  }, [fetchLoading, data]);

  return (
    <>
      <div className="p-2 rounded-lg bg-white shadow-sm">
        <ButtonComponent
          label="Tambah Baru"
          icon={faPlus}
          size="sm"
          onClick={() => setModalForm(true)}
        />
      </div>

      <div className="flex items-center justify-between my-4">
        {
          // =========================>
          // ## Input Paginate
          // =========================>
        }
        <div className="relative z-20">
          <>
            <div className="bg-white p-1.5 rounded-md w-24">
              <SelectComponent
                name="paginate"
                options={[
                  {
                    value: 9,
                    label: '9',
                  },
                  {
                    value: 18,
                    label: '18',
                  },
                  {
                    value: 27,
                    label: '27',
                  },
                  {
                    value: 45,
                    label: '45',
                  },
                ]}
                size="sm"
                value={paginate}
                onChange={(e) => {
                  setPaginate(e);
                }}
              />
            </div>
          </>
        </div>

        <div className="w-3/4 lg:w-2/3 flex gap-2 justify-end">
          <div className="bg-white p-1.5 rounded-md flex gap-1.5 w-[350px]">
            <div className="w-full min-w-[150px]">
              <InputComponent
                name="search"
                size="sm"
                placeholder="Cari disini..."
                rightIcon={faMagnifyingGlass}
                value={keyword}
                onChange={(e) => setKeyword(e)}
              />
            </div>
          </div>

          <div className="bg-white p-1.5 rounded-md relative">
            <IconButtonComponent
              icon={faRefresh}
              customPaint={{
                bg: 'base',
                border: 'slate-300 ',
                color: 'slate-400',
              }}
              onClick={() => {
                reset();
              }}
              size="sm"
            />
          </div>
        </div>
      </div>
      <div className="relative w-full grid grid-cols-3 lg:grid-cols-9 gap-2">
        {fetchLoading ? (
          [1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, key) => {
            return (
              <div
                className=" col-span-3 h-36 bg-white rounded-lg border-white border-2"
                key={key}
              >
                <div className="group w-full h-full relative bg-white skeleton__loading"></div>
              </div>
            );
          })
        ) : !data?.data ? (
          <div className="col-span-4 col-start-3 flex justify-center p-5">
            {
              // =========================>
              // ## When Empty
              // =========================>
            }
            <div className="flex flex-col items-center justify-center gap-8 p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/204.svg" width={'200px'} alt="server error" />
              <h1 className="text-2xl font-bold">Data Kosong</h1>
            </div>
          </div>
        ) : (
          data?.data.map((item, key) => {
            return (
              <div
                className=" col-span-3 h-40 bg-white rounded-lg"
                style={{
                  backgroundImage: `url(${item?.picture_source})`,
                  backgroundSize: 'cover',
                }}
                key={key}
              >
                <div className="group w-full h-full relative overflow-hidden">
                  <div className=" absolute flex gap-2 p-2 bg-white rounded-lg shadow-sm top-2 right-2 ">
                    <IconButtonComponent
                      icon={faEdit}
                      paint="warning"
                      rounded
                      onClick={() => {
                        setSelected(item);
                        setModalForm(true);
                      }}
                    />
                    <IconButtonComponent
                      icon={faTrash}
                      paint="danger"
                      rounded
                      onClick={() => {
                        setSelected(item);
                        setModalDelete(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-2">
        <PaginateComponent
          page={page}
          paginate={paginate}
          totalRow={totalRow}
          onChange={(newTotalRow, newPaginate, newPage) => {
            setPaginate(newPaginate);
            setPage(newPage);
          }}
        />
      </div>
      <FloatingPageComponent
        title={!selected ? 'Tambah Banner Baru' : 'Ubah Banner'}
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          setSelected(null);
        }}
      >
        <div className="px-6 pt-4 pb-20 h-full overflow-scroll scroll_control">
          <FormSupervisionComponent
            submitControl={{
              path:
                selected === null
                  ? fetchControl.path
                  : fetchControl.path + '/' + selected?.id,
              contentType: 'multipart/form-data',
            }}
            // method={dataSelected === null ? 'post' : 'put'}
            confirmation
            onSuccess={() => {
              setModalForm(false);
              reset();
              setSelected(null);
            }}
            forms={[
              {
                type: 'custom',
                custom: ({ formControl }) => {
                  return (
                    <>
                      <InputImageComponent
                        {...formControl('image')}
                        name="image"
                        label="Banner"
                        aspect="16/6"
                      />
                    </>
                  );
                },
              },
            ]}
            defaultValue={
              selected && {
                _method: 'PUT',
                image: selected?.picture_source,
              }
            }
          />
        </div>
      </FloatingPageComponent>
      <ModalConfirmComponent
        title={'Yakin ingin menghapus banner'}
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelected(null);
        }}
        onSubmit={async () => {
          setLoadingDelete(true);

          if (selected !== null) {
            let response = await destroy({
              ...fetchControl,
              path: fetchControl.path + '/' + selected?.id,
            });

            if (response?.status == 200 || response?.status == 201) {
              setLoadingDelete(false);
              reset();
              setSelected(null);
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
    </>
  );
}

ManageSlider.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
