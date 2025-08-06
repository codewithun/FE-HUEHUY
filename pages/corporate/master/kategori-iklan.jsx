import { TableSupervisionComponent } from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import InputHexColor from '../../../components/construct.components/input/InputHexColor';
// import { useAccessContext } from '../../../context';

export default function ManageAdsCategories() {
  // const { accessActive, loading } = useAccessContext();
  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Kategori Iklan"
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
              item: ({ name, corporate_id }) => `${name},${corporate_id}`,
            },
            {
              selector: 'description',
              label: 'Deskripsi',
              sortable: true,
              width: '320px',
              item: ({ description }) => description,
            },
            {
              selector: 'color',
              label: 'Warna Branding',
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
              type: 'select',
              construction: {
                multiple: true,
                name: 'Mitra',
                label: 'corporate_id',
                placeholder: 'Pilih Mitra..',
                // serverOptionControl: {
                //   path: 'admin/option/corporate',
                // },
              },
            },
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
              type: 'custom',
              custom: ({ formControl }) => {
                return (
                  <InputHexColor
                    name="color"
                    label="Warna Branding"
                    formControl={formControl}
                  />
                );
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

ManageAdsCategories.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
