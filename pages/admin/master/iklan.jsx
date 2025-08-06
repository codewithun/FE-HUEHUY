import React from 'react';
import {
  InputNumberComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';

const Iklan = () => {
  return (
    <>
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
              type: 'select',
              construction: {
                name: 'type',
                label: 'Jenis Iklan',
                placeholder: 'Pilih jenis iklan...',
                options: [
                  {
                    label: 'Kubus',
                    value: 'cube',
                  },
                  {
                    label: 'Konten',
                    value: 'screen',
                  },
                ],
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const type = values.find((val) => val.name == 'type')?.value;

                if (type == 'cube')
                  return (
                    <InputNumberComponent
                      name="limit"
                      {...formControl('limit')}
                      label="Jumlah tampil per hari"
                      placeholder="..."
                    />
                  );
              },
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
    </>
  );
};

export default Iklan;

Iklan.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
