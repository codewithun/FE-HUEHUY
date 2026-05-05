/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  faEdit,
  faMagnifyingGlass,
  faPlus,
  faRefresh,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import { ButtonComponent } from '../../../components/base.components/button/Button.component';
import { FloatingPageComponent } from '../../../components/base.components/modal/FloatingPage.component';
import { FormSupervisionComponent } from '../../../components/base.components/supervision/FormSupervision.component';
import { IconButtonComponent } from '../../../components/base.components/button/IconButton.component';
import { InputComponent } from '../../../components/base.components/input/Input.component';
import { ModalConfirmComponent } from '../../../components/base.components/modal/ModalConfirm.component';
import { SelectComponent } from '../../../components/base.components/input/Select.component';
import { InputImageComponent } from '../../../components/base.components/input/InputImage.component';
import PaginateComponent from '../../../components/base.components/table/Paginate.component';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import { destroy, useGet } from '../../../helpers';

export default function ManageSlider() {
  const toStoragePath = (s) => {
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
    if (!s) return '';
    if (typeof s !== 'string') return '';

    const str = s.trim();

    if (/^https?:\/\//i.test(str)) return str;
    if (str.startsWith('/storage/')) return `${base}${str}`;

    const trimmed = str.replace(/^\/+/, '');
    if (trimmed.startsWith('storage/')) return `${base}/${trimmed}`;

    return `${base}/storage/${trimmed}`;
  };

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
    setTotalRow(data?.total_row ?? data?.total ?? data?.data?.length ?? 0);
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
        <div className="bg-white p-1.5 rounded-md w-24">
          <SelectComponent
            name="paginate"
            options={[
              { value: 9, label: '9' },
              { value: 18, label: '18' },
              { value: 27, label: '27' },
              { value: 45, label: '45' },
            ]}
            size="sm"
            value={paginate}
            onChange={(e) => setPaginate(e)}
          />
        </div>

        <div className="w-3/4 lg:w-2/3 flex gap-2 justify-end">
          <div className="bg-white p-1.5 rounded-md flex gap-1.5 w-[350px]">
            <InputComponent
              name="search"
              size="sm"
              placeholder="Cari disini..."
              rightIcon={faMagnifyingGlass}
              value={keyword}
              onChange={(e) => setKeyword(e)}
            />
          </div>

          <div className="bg-white p-1.5 rounded-md">
            <IconButtonComponent
              icon={faRefresh}
              onClick={reset}
              size="sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-9 gap-2">
        {fetchLoading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="col-span-3 h-36 bg-white rounded-lg skeleton__loading" />
          ))
        ) : !data?.data ? (
          <div className="col-span-9 text-center p-5">
            <img src="/204.svg" width="200" alt="empty" />
            <h1 className="text-xl font-bold">Data Kosong</h1>
          </div>
        ) : (
          data.data.map((item, key) => {
            const rawUrl = toStoragePath(item?.picture_source);
            const bgUrl = rawUrl
              ? `${rawUrl}?v=${encodeURIComponent(item?.updated_at || item?.id)}`
              : '';

            return (
              <div
                key={key}
                className="col-span-3 h-40 bg-white rounded-lg"
                style={{
                  backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
                  backgroundSize: 'cover',
                }}
              >
                <div className="flex gap-2 p-2">
                  <IconButtonComponent
                    icon={faEdit}
                    onClick={() => {
                      setSelected(item);
                      setModalForm(true);
                    }}
                  />
                  <IconButtonComponent
                    icon={faTrash}
                    onClick={() => {
                      setSelected(item);
                      setModalDelete(true);
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <PaginateComponent
        page={page}
        paginate={paginate}
        totalRow={totalRow}
        onChange={(t, p, pg) => {
          setPaginate(p);
          setPage(pg);
        }}
      />

      {/* MODAL FORM */}
      <FloatingPageComponent
        title={!selected ? 'Tambah Banner' : 'Edit Banner'}
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          setSelected(null);
        }}
      >
        <div className="p-6">
          <FormSupervisionComponent
            submitControl={{
              path: selected ? `${fetchControl.path}/${selected.id}` : fetchControl.path,
              contentType: 'multipart/form-data',
            }}
            confirmation
            onSuccess={() => {
              setModalForm(false);
              setSelected(null);
              reset();
            }}
            forms={[
              {
                type: 'custom',
                custom: ({ formControl }) => (
                  <InputImageComponent
                    {...formControl('picture')}   // ✅ FIX UTAMA
                    name="picture"                // ✅ HARUS SAMA
                    label="Banner"
                    aspect="16/6"
                  />
                ),
              },
            ]}
            defaultValue={
              selected && {
                _method: 'PUT',
                picture: toStoragePath(selected?.picture_source), // ✅ FIX
              }
            }
          />
        </div>
      </FloatingPageComponent>

      {/* DELETE */}
      <ModalConfirmComponent
        title="Hapus banner?"
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelected(null);
        }}
        onSubmit={async () => {
          setLoadingDelete(true);
          const res = await destroy({
            path: `${fetchControl.path}/${selected?.id}`,
          });

          if (res?.status === 200) {
            reset();
            setModalDelete(false);
            setSelected(null);
          }

          setLoadingDelete(false);
        }}
        submitButton={{
          label: 'Ya',
          loading: loadingDelete,
        }}
      />
    </>
  );
}

ManageSlider.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;