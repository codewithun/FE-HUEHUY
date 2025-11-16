import React, { useEffect } from 'react';
import {
  ButtonComponent,
  InputComponent,
  ModalComponent,
} from '../../base.components';
import { useForm } from '../../../helpers';

const UpdateCubeStatusModal = ({ data, show, setShow, onSuccess, token }) => {
  const [{ submit, loading, values, setValues, errors }] = useForm(
    {
      path: `admin/cubes/${data?.id}/update-status`,
      bearer: token || null,
    },
    false,
    onSuccess
  );

  useEffect(() => {
    if (data !== null && show) {
      // Reset values completely to avoid duplicates
      const newValues = [
        {
          name: 'status',
          value: data?.status === 'active' ? 'inactive' : 'active',
        },
        {
          name: '_method',
          value: 'PUT',
        },
      ];
      // eslint-disable-next-line no-console
      console.log('🔵 UpdateCubeStatusModal - Setting initial values:', newValues);
      setValues(newValues);
    } else if (!show) {
      // Clear values when modal closes
      // eslint-disable-next-line no-console
      console.log('🔴 UpdateCubeStatusModal - Clearing values');
      setValues([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, show]);

  return (
    <div>
      <ModalComponent
        title={
          data?.status === 'active'
            ? 'Ubah Status kubus menjadi "Tidak Aktif"?'
            : 'Ubah Status kubus menjadi "Aktif"?'
        }
        show={show}
        onClose={() => {
          setShow(false);
        }}
      >
        {data?.id && (
          <form method="PUT" onSubmit={submit}>
            {data?.status === 'inactive' && (
              <InputComponent
                type="date"
                name="inactive_at"
                label="Aktif Sampai"
                size="lg"
                placeholder="Pilih Tanggal..."
                forceFormat="DD-MM-YYYY HH:mm:ss"
                onChange={(e) => {
                  const dateArray = e.split('-');
                  // Completely rebuild values array to avoid duplicates
                  const newValues = [
                    {
                      name: 'status',
                      value: data?.status === 'active' ? 'inactive' : 'active',
                    },
                    {
                      name: '_method',
                      value: 'PUT',
                    },
                    {
                      name: 'inactive_at',
                      value: `${dateArray[2]}-${dateArray[1]}-${dateArray[0]} 00:00:00`,
                    },
                  ];
                  // eslint-disable-next-line no-console
                  console.log('🟢 UpdateCubeStatusModal - Setting values with inactive_at:', newValues);
                  setValues(newValues);
                }}
                value={
                  values.find((i) => i.name == 'inactive_at')?.value
                    ? values.find((i) => i.name == 'inactive_at')?.value
                    : ''
                }
                errors={errors.filter((i) => i.name == 'inactive_at')?.error}
              // whenFocus={() => setIsFocus(true)}
              // whenBlur={() => setIsFocus(false)}
              />
            )}
            <div className={`flex justify-center gap-4 px-4 mt-4`}>
              <ButtonComponent
                label="Batal"
                variant="simple"
                onClick={() => setShow(false)}
                customPaint={{
                  color: 'slate-500',
                }}
                block
                size="lg"
              />
              <ButtonComponent
                type="submit"
                label="Ya"
                paint="primary"
                loading={loading}
                block
                size="lg"
              />
            </div>
          </form>
        )}
      </ModalComponent>
    </div>
  );
};

export default UpdateCubeStatusModal;
