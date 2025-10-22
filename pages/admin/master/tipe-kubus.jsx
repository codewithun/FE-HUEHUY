import { TableSupervisionComponent } from '../../../components/base.components';
import InputHexColor from '../../../components/construct.components/input/InputHexColor';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
// import { useAccessContext } from '../../../context';

export default function ManageCubeTypes() {
  // const { accessActive, loading } = useAccessContext();
  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Tipe Kubus</h1>
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
              item: ({ name, code }) => `${name} (${code})`,
            },
            {
              selector: 'color',
              label: 'Warna',
              sortable: true,
              width: '200px',
              item: ({ color }) => {
                return (
                  <div
                    className="h-10 rounded-lg aspect-square border"
                    style={{ backgroundColor: color }}
                  ></div>
                );
              },
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
          // Untuk tipe kubus tidak ada field "role", cukup kembalikan data apa adanya
          customDefaultValue: (data) => ({
            ...data,
          }),
        }}
        actionControl={{ except: 'detail' }}
      />
    </div>
  );
}

ManageCubeTypes.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
