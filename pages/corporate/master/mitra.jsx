import React from 'react';
import { TableSupervisionComponent } from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
// import { useAccessContext } from '../../../context';

export default function ManageCorporate() {
  // const { accessActive, loading } = useAccessContext();
  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Mitra"
        fetchControl={{
          path: 'admin/users',
        }}
        columnControl={{
          custom: [
            {
              selector: 'name',
              label: 'Nama',
              sortable: true,
              width: '250px',
              item: ({ name }) => name,
            },
            {
              selector: 'description',
              label: 'Deskripsi',
              sortable: true,
              width: '320px',
              item: ({ description }) => description,
            },
            {
              selector: 'address',
              label: 'Alamat',
              sortable: true,
              width: '200px',
              item: ({ address }) => address,
            },
          ],
        }}
        formControl={{
          contentType: 'multipart/form-data',
          custom: [
            {
              construction: {
                name: 'name',
                label: 'Nama',
                placeholder: 'Masukkan Nama...',
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
                rows: 5,
                validations: {
                  required: true,
                },
              },
            },
            {
              type: 'textarea',
              construction: {
                name: 'address',
                label: 'Alamat',
                placeholder: 'Masukkan Alamat...',
                validations: {
                  required: true,
                },
              },
            },
            {
              construction: {
                name: 'phone',
                label: 'No. Telepon',
                placeholder: 'Masukkan No Telepon...',
                validations: {
                  required: true,
                  min: 10,
                },
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
}

ManageCorporate.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
