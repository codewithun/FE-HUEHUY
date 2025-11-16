import React from 'react';
import {
  InputComponent,
  TextareaComponent,
  SelectComponent,
  InputNumberComponent
} from '../../../components/base.components';

const VoucherForm = ({ formControl, createImageField, values }) => {
  // Get current validation type from form values
  const validationType = values?.find(v => v.name === 'ads[validation_type]')?.value || 'auto';
  const currentCode = values?.find(v => v.name === 'ads[code]')?.value || '';

  // Get content type to determine if this is promo or voucher
  const contentType = values?.find(v => v.name === 'content_type')?.value || 'voucher';
  const label = contentType === 'voucher' ? 'Voucher' : 'Promo';

  // Debug logging
  React.useEffect(() => {

  }, [validationType, currentCode, values]);

  return (
    <div className="mt-6 space-y-4">
      <div className="font-semibold text-lg text-slate-700 border-b pb-2">{label}</div>

      <InputComponent
        name="ads[title]"
        label={`Judul ${label}`}
        placeholder={`Masukan Judul ${label}...`}
        {...formControl('ads[title]')}
        validations={{ required: true }}
      />

      {TextareaComponent && (
        <TextareaComponent
          name="ads[description]"
          label={`Deskripsi ${label}`}
          placeholder={`Masukan Deskripsi ${label}...`}
          {...formControl('ads[description]')}
          rows={5}
          validations={{ required: true }}
        />
      )}

      {/* Gambar Voucher/Promo */}
      {createImageField && createImageField('voucher_image', `Gambar ${label}`)}

      <div className="grid grid-cols-3 gap-4">
        <SelectComponent
          name="ads[level_umkm]"
          label="Level UMKM (Opsional)"
          placeholder="..."
          {...formControl('ads[level_umkm]')}
          options={[
            { label: '1', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
          ]}
        />
        <InputNumberComponent
          name="ads[max_production_per_day]"
          label="Produksi Per Hari (Opsional)"
          placeholder="..."
          {...formControl('ads[max_production_per_day]')}
        />
        <InputNumberComponent
          name="ads[sell_per_day]"
          label="Penjualan Per Hari (Opsional)"
          placeholder="..."
          {...formControl('ads[sell_per_day]')}
        />
      </div>
    </div>
  );
};

export default VoucherForm;
