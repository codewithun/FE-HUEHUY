import React from 'react';
import { TableSupervisionComponent } from '../../../components/base.components';

import moment from 'moment';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';

export default function ManageNews() {
  // const { accessActive, loading } = useAccessContext();

  return (
    <>
      <TableSupervisionComponent
        title="Berita"
        fetchControl={{
          path: 'admin/articles',
        }}
        columnControl={{
          custom: [
            {
              selector: 'title',
              label: 'judul',
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
          contentType: 'multipart/form-data',
          customDefaultValue: { publish_at: moment().format('YYYY-MM-DD') },
          custom: [
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
                  min: 10,
                  required: true,
                },
              },
            },
            {
              col: 8,
              type: 'image',
              construction: {
                name: 'image',
                label: 'Gambar',
                aspect: '16/9',
                validations: {
                  required: true,
                },
              },
            },
          ],
        }}
        customDetail={(data) => {
          return (
            <div className="flex flex-col px-8 py-4">
              <ul className="space-y-2">
                <li>
                  <b>Judul : </b>
                  <div className="inline">{data?.title}</div>
                </li>
                <li>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data?.picture_source}
                    className="w-full aspect-video"
                    alt=""
                  />
                </li>
                <li>
                  <b className="block w-full pb-2">Deskripsi : </b>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: data?.description.replace(/\n/g, '<br>'),
                    }}
                    className="max-h-[30vh] overflow-y-scroll scroll_control px-3 py-4 bg-slate-100 rounded-lg"
                  ></div>
                </li>
              </ul>
            </div>
          );
        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            return {
              id: data?.id,
              title: data?.title,
              description: data?.description,
              publish_at: data?.publish_at,
            };
          },
        }}
      />
    </>
  );
}

ManageNews.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
