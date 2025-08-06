import React, { useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import CorporateMemberPage from '../../../components/construct.components/partial-page/CorporateMember.page';
import {
  faCubes,
  faHandHoldingHand,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import ManageCubePage from '../../../components/construct.components/partial-page/ManageCube.page';
import GiveCubeModal from '../../../components/construct.components/modal/GiveCube.modal';
// import { useAccessContext } from '../../../context';

export default function ManageCorporate() {
  // const { accessActive, loading } = useAccessContext();
  const [selected, setSelected] = useState(null);
  const [modalMember, setModalMember] = useState(false);
  const [modalCube, setModalCube] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [modalGive, setModalGive] = useState(false);

  return (
    <>
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
                <ButtonComponent
                  icon={faCubes}
                  label={'Kubus'}
                  variant="outline"
                  paint="secondary"
                  size={'sm'}
                  rounded
                  onClick={() => {
                    setSelected(data);
                    setModalCube(true);
                  }}
                />
                <ButtonComponent
                  icon={faHandHoldingHand}
                  label={'Beri Kubus'}
                  variant="outline"
                  paint="secondary"
                  size={'xs'}
                  rounded
                  onClick={() => {
                    setModalGive(true);
                    setSelected(data);
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

      <FloatingPageComponent
        show={modalCube}
        onClose={() => {
          setModalCube(false);
          setSelected(false);
          setRefresh(!refresh);
        }}
        size="xl"
        className="bg-background"
      >
        <div className="px-8">
          <ManageCubePage scope={{ corporate_id: selected?.id }} />
        </div>
      </FloatingPageComponent>
      <GiveCubeModal
        data={selected}
        panel={'admin'}
        show={modalGive}
        setShow={setModalGive}
        scope={{ corporate_id: selected?.id }}
        giftToCorp={true}
      />
    </>
  );
}

ManageCorporate.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
