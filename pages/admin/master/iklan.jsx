import React from 'react';
import {
  InputNumberComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';

const Iklan = () => {
  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Iklan</h1>
      <TableSupervisionComponent
        title="Iklan Huehuy"
        fetchControl={{
          path: 'admin/huehuy-ads',
        }}
        columnControl={{
          custom: [
            {
              selector: 'title',
              label: 'Judul',
              sortable: true,
              width: '250px',
              item: ({ title }) => title,
            },
          ],
        }}
        formControl={{
          contentType: 'multipart/form-data',
          custom: [
            {
              construction: {
                name: 'title',
                label: 'Judul',
                placeholder: 'Masukkan judul iklan...',
                validations: {
                  required: true,
                },
              },
            },
            {
              type: 'textarea',
              construction: {
                name: 'description',
                label: 'Deskripsi',
                placeholder: 'Masukkan Deskripsi...',
                validations: {
                  required: true,
                },
              },
            },
            {
              type: 'image',
              construction: {
                name: 'image',
                label: 'Gambar',
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputNumberComponent
                  name="limit"
                  {...formControl('limit')}
                  label="Jumlah tampil per hari"
                  placeholder="..."
                />
              ),
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            return {
              ...data,
              role: data?.roles?.map((item) => item.id),
            };
          },
        }}
        actionControl={{ except: 'detail' }}
      />
    </div>
  );
};

export default Iklan;

Iklan.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
