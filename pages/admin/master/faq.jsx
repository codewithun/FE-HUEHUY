import React from 'react';
import { TableSupervisionComponent } from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
// import { useAccessContext } from '../../../context';

export default function ManageFaq() {
  // const { accessActive, loading } = useAccessContext();
  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen FAQ</h1>
      <TableSupervisionComponent
        title="FAQ"
        fetchControl={{
          path: 'admin/faqs',
        }}
        columnControl={{
          custom: [
            {
              selector: 'title',
              label: 'Judul',
              sortable: true,
              width: '300px',
              item: ({ title }) => title,
            },
            {
              selector: 'description',
              label: 'Deskripsi',
              sortable: true,
              width: '300px',
              item: ({ description }) => {
                return <div className="limit__line__3">{description}</div>;
              },
            },
          ],
        }}
        formControl={{
          custom: [
            {
              col: 6,
              type: 'image',
              name: 'image',
              label: 'Gambar',
              validations: {
                required: true,
              },
            },
            {
              construction: {
                name: 'title',
                label: 'Judul',
                placeholder: 'Masukkan judul...',
                validations: {
                  required: true,
                },
              },
            },
            {
              type: 'textarea',
              construction: {
                name: 'description',
                label: 'deskirpsi',
                placeholder: 'deskripsi...',
                rows: 4,
                validations: {
                  required: true,
                },
              },
            },
          ],
        }}
        customDetail={(data) => {
          return (
            <>
              <div className="px-10 py-4 mt-5 border border-t flex flex-col gap-4">
                <div
                  className="h-40 bg-white rounded-lg mx-auto"
                  style={{
                    backgroundImage: `url(${data?.picture_source})`,
                    backgroundSize: 'cover',
                  }}
                ></div>
                <div className="text-2xl font-semibold h-fit">
                  {data?.title}
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: data?.description.replace(/\n/g, '<br>'),
                  }}
                  className="max-h-[70vh] overflow-y-scroll scroll_control"
                ></div>
              </div>
            </>
          );
        }}
      />
    </div>
  );
}

ManageFaq.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
