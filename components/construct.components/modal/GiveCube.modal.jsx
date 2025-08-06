import React from 'react';
import {
  FloatingPageComponent,
  FormSupervisionComponent,
  InputComponent,
  SelectComponent,
} from '../../base.components';

const GiveCubeModal = ({
  data,
  panel,
  scope,
  show,
  setShow,
  giftToCorp,
  token,
}) => {
  const scopeName = scope && Object.entries(scope)?.at(0)?.at(0);
  const scopeValue = scope && Object.entries(scope)?.at(0)?.at(1);
  // console.log(data);
  return (
    <div>
      <FloatingPageComponent
        show={show}
        title={`Beri Kubus ke ${data?.name}`}
        onClose={() => {
          setShow(false);
        }}
      >
        <div className="px-6 pt-4 pb-20 h-full overflow-scroll scroll_control">
          <FormSupervisionComponent
            confirmation={true}
            submitControl={{
              path: `${panel ? panel : 'admin'}/cubes/create-gift`,
              contentType: 'multipart/form-data',
              bearer: token || null,
            }}
            defaultValue={
              giftToCorp
                ? { total: 1, corporate_id: scopeValue }
                : panel == 'admin'
                ? { user_id: data?.id, total: 1, cube_type_id: 1 }
                : panel == 'corporate' && {
                    user_id: data?.user_id,
                    total: 1,
                    cube_type_id: 1,
                    world_id: scopeValue,
                  }
            }
            onSuccess={() => {
              setTimeout(() => {
                setShow(false);
              }, 1500);
            }}
            forms={[
              {
                type: 'custom',
                custom: ({ formControl }) => (
                  <SelectComponent
                    name="cube_type_id"
                    label="Tipe Kubus"
                    placeholder="Tipe Kubus..."
                    // serverOptionControl={{
                    //   path: `admin/options/cube-type`,
                    // }}
                    options={
                      panel == 'admin'
                        ? [
                            { label: 'Kubus Putih (KUPU)', value: 1 },
                            { label: 'Kubus Merah (KUME)', value: 2 },
                          ]
                        : [{ label: 'Kubus Putih (KUPU)', value: 1 }]
                    }
                    {...formControl('cube_type_id')}
                  />
                ),
              },
              {
                type: 'number',
                construction: {
                  name: 'total',
                  label: 'jumlah',
                  placeholder: 'Jumlah kubus yang akan diberikan ...',
                  validations: { required: true, min: 1 },
                },
              },
              {
                type: 'custom',
                custom: ({ values, setValues, errors }) => (
                  <InputComponent
                    type="datetime-local"
                    name="inactive_at"
                    label="Aktif Sampai"
                    placeholder="..."
                    onChange={(e) => {
                      let [datePart, timePart] = e.split('T');
                      setValues([
                        ...values.filter((i) => i.name != 'inactive_at'),
                        {
                          name: 'inactive_at',
                          value: `${datePart
                            .split('-')
                            .reverse()
                            .join('-')} ${timePart}:00`,
                        },
                      ]);
                    }}
                    error={errors.find((err) => err.name == 'inactive_at')}
                  />
                ),
              },
              {
                type: 'custom',
                custom: ({ formControl }) =>
                  panel == 'admin' && (
                    <SelectComponent
                      name="world_id"
                      label="Dunia"
                      placeholder="Pilih Dunia..."
                      serverOptionControl={{
                        path: `${panel ? panel : 'admin'}/options/world?${
                          scopeName || ''
                        }=${scopeValue || ''}`,
                        // path: `admin/options/world`,
                        bearer: token || null,
                      }}
                      // validations={{ required: true }}
                      {...formControl('world_id')}
                    />
                  ),
              },
              {
                type: 'custom',
                custom: ({ errors }) => (
                  <div className="w-full grid gap-2">
                    {errors.map((err) => {
                      return (
                        <>
                          <p className="text-sm text-danger">{err.error}</p>
                        </>
                      );
                    })}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </FloatingPageComponent>
    </div>
  );
};

export default GiveCubeModal;
