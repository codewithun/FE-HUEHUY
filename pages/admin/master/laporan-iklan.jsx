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
              width: '120px',
              item: ({ ticket_number }) => ticket_number,
            },
            {
              selector: 'ad',
              label: 'Kubus',
              sortable: true,
              width: '180px',
              item: ({ ad }) => (
                <div className="text-sm">
                  <p className="font-medium">{ad?.title || ad?.name || '-'}</p>
                  <p className="text-xs text-gray-500">
                    Status: <span className={`font-medium ${ad?.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {ad?.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </p>
                </div>
              ),
            },
            {
              selector: 'status',
              label: 'Status Laporan',
              sortable: true,
              width: '120px',
              item: ({ status }) => (
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  status === 'accepted' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {status === 'pending' ? 'Menunggu' :
                    status === 'accepted' ? 'Disetujui' : 'Ditolak'}
                </span>
              ),
            },
            {
              selector: 'message',
              label: 'Pesan Laporan',
              width: '250px',
              item: ({ message }) => (
                <div className="text-sm">
                  <p className="text-gray-800 line-clamp-2">
                    {message || 'Tidak ada pesan'}
                  </p>
                </div>
              ),
            },
            {
              selector: 'user_reporter',
              label: 'User',
              width: '180px',
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
              width: '180px',
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
          updateStatus == 'accepted'
            ? 'Setujui Laporan Iklan'
            : 'Tolak Laporan Iklan'
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
          label: updateStatus == 'accepted' ? 'Ya, Setujui' : 'Ya, Tolak',
          loading: loadingUpdateStatus,
        }}
      >
        <div className="text-sm text-gray-600 mb-4">
          {updateStatus == 'accepted' ? (
            <div>
              <p className="mb-2">Dengan menyetujui laporan ini, sistem akan:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Mengubah status kubus menjadi <strong>Nonaktif</strong></li>
                <li>Kubus tidak akan tampil lagi untuk pengguna</li>
              </ul>
            </div>
          ) : (
            <p>Laporan ini akan ditandai sebagai tidak valid dan tidak ada tindakan yang diambil terhadap iklan.</p>
          )}
        </div>
      </ModalConfirmComponent>
    </div>
  );
}

ReportContent.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
