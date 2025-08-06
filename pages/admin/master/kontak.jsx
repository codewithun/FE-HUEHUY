import React from 'react';
import { TableSupervisionComponent } from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
// import { useAccessContext } from '../../../context';

// import Image from 'next/image';

export default function ManageContact() {
  // const { accessActive, loading } = useAccessContext();

  return (
    <>
      <TableSupervisionComponent
        title="Kontak"
        fetchControl={{
          path: 'admin/admin-contacts',
        }}
        columnControl={{
          custom: [
            {
              selector: 'name',
              label: 'Nama',
              sortable: true,
              width: '300px',
              item: ({ name }) => name,
            },
            {
              selector: 'phone',
              label: 'No Telepon',
              sortable: true,
              width: '300px',
              item: ({ phone }) => phone,
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
                placeholder: 'Masukkan nama ...',
                validations: {
                  required: true,
                },
              },
            },
            {
              construction: {
                name: 'phone',
                label: 'No. Telepon',
                placeholder: 'Masukkan No. Telepon ...',
                validations: {
                  required: true,
                },
              },
            },
          ],
        }}
        actionControl={{ except: 'detail' }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            return {
              name: data?.name,
              phone: data?.phone,
            };
          },
        }}
      />
    </>
  );
}

ManageContact.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
