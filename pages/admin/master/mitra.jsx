import {
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import CorporateMemberPage from '../../../components/construct.components/partial-page/CorporateMember.page';
// import { useAccessContext } from '../../../context';

export default function ManageCorporate() {
  // const { accessActive, loading } = useAccessContext();
  const [selected, setSelected] = useState(null);
  const [modalMember, setModalMember] = useState(false);
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Mitra</h1>
      <TableSupervisionComponent
        title="Mitra"
        fetchControl={{
          path: 'admin/corporates',
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
              width: '300px',
              item: ({ address }) => (
                <span className="limit__line__2">{address}</span>
              ),
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
            };
          },
        }}
        actionControl={{
          except: 'detail',
          include: (data) => {
            return (
              <>
                <ButtonComponent
                  icon={faUsers}
                  label={'Pengguna'}
                  variant="outline"
                  paint="primary"
                  size={'sm'}
                  rounded
                  onClick={() => {
                    setSelected(data);
                    setModalMember(true);
                  }}
                />
              </>
            );
          },
        }}
      />

      <FloatingPageComponent
        show={modalMember}
        onClose={() => {
          setModalMember(false);
          setSelected(false);
          setRefresh(!refresh);
        }}
        size="xl"
        className="bg-background"
      >
        <div className="px-8">
          <CorporateMemberPage panel={'admin'} data={selected} />
        </div>
      </FloatingPageComponent>
    </div>
  );
}

ManageCorporate.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
