import { TableSupervisionComponent } from '../../../components/base.components';
import InputHexColor from '../../../components/construct.components/input/InputHexColor';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
// import { useAccessContext } from '../../../context';

export default function ManageContact() {
  // const { accessActive, loading } = useAccessContext();
  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Kontak Admin</h1>
      <TableSupervisionComponent
        title="Tipe Kubus"
        fetchControl={{
          path: 'admin/cube-types',
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
              selector: 'phone',
              label: 'No Hp/WA',
              sortable: true,
              width: '250px',
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
                placeholder: 'Masukkan Nama...',
                validations: {
                  required: true,
                },
              },
            },
            {
              construction: {
                name: 'code',
                label: 'Singkatan/Kode',
                placeholder: 'Masukkan Singkatan...',
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
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                return (
                  <InputHexColor
                    name="color"
                    label="Warna"
                    values={values}
                    setValues={setValues}
                    errors={errors}
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
    </div>
  );
}

ManageContact.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
