import { useState } from 'react';
import {
    ButtonComponent,
    DateFormatComponent,
    ModalConfirmComponent,
    TableSupervisionComponent,
} from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import { post } from '../../../helpers';

export default function ReportContent() {
  const [updateStatus, setUpdateStatus] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loadingUpdateStatus, setLoadingUpdateStatus] = useState(false);

  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Laporan Iklan</h1>
      <TableSupervisionComponent
        title="Laporan Iklan"
        fetchControl={{
          path: 'admin/report-content-ticket',
        }}
        setToRefresh={refresh}
        customTopBar={<></>}
        columnControl={{
          custom: [
            {
              selector: 'ticket_number',
              label: 'No Laporan',
              sortable: true,
              width: '150px',
              item: ({ ticket_number }) => ticket_number,
            },
            {
              selector: 'ad',
              label: 'Iklan',
              sortable: true,
              width: '250px',
              item: ({ ad }) => ad.name,
            },
            {
              selector: 'user_reporter',
              label: 'User',
              width: '250px',
              item: ({ user_reporter }) => (
                <>
                  <b className="font-semibold">
                    {user_reporter?.name ? user_reporter?.name : '-'}
                  </b>
                  <p className="text-slate-500 text-sm">
                    {user_reporter?.email ? user_reporter?.email : null}
                  </p>
                </>
              ),
            },
            {
              selector: 'created_at',
              label: 'Tanggal/Waktu',
              sortable: true,
              width: '250px',
              item: ({ created_at }) => (
                <DateFormatComponent
                  date={created_at}
                  format="DD MMMM YYYY HH:mm:ss"
                />
              ),
            },
          ],
        }}
        actionControl={{
          except: ['detail', 'delete', 'edit'],
          custom: (data) => {
            if (data?.status == 'pending') {
              return (
                <>
                  <ButtonComponent
                    label={'Setujui'}
                    variant="outline"
                    paint={'success'}
                    size={'xs'}
                    rounded
                    onClick={() => {
                      setSelected(data);
                      setUpdateStatus('accepted');
                    }}
                  />
                  <ButtonComponent
                    label={'Batal'}
                    variant="outline"
                    paint={'danger'}
                    size={'xs'}
                    rounded
                    onClick={() => {
                      setSelected(data);
                      setUpdateStatus('rejected');
                    }}
                  />
                </>
              );
            }
          },
        }}
      />

      <ModalConfirmComponent
        title={
          'Yakin Ingin ' + updateStatus == 'accepted'
            ? 'Menyetujui Laporan'
            : 'Membatalkan Laporan'
        }
        show={updateStatus}
        onClose={() => {
          setUpdateStatus(false);
          setSelected(null);
        }}
        onSubmit={async () => {
          setLoadingUpdateStatus(true);

          if (selected !== null) {
            let response = await post({
              path:
                'admin/report-content-ticket/' +
                selected?.id +
                '/update-status',
              body: {
                _method: 'PUT',
                status: updateStatus,
              },
            });

            if (response?.status == 200 || response?.status == 201) {
              setLoadingUpdateStatus(false);
              setRefresh(!refresh);
              setSelected(null);
              setUpdateStatus(false);
            } else {
              setLoadingUpdateStatus(false);
            }
          }
        }}
        submitButton={{
          label: 'Ya',
          loading: loadingUpdateStatus,
        }}
      />
    </div>
  );
}

ReportContent.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
