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

  // Debug logging
  React.useEffect(() => {

  }, [validationType, currentCode, values]);

  return (
    <div className="mt-6 space-y-4">
      <div className="font-semibold text-lg text-slate-700 border-b pb-2">Voucher</div>

      <InputComponent
        name="ads[title]"
        label="Judul Voucher"
        placeholder="Masukan Judul Voucher..."
        {...formControl('ads[title]')}
        validations={{ required: true }}
      />

      {TextareaComponent && (
        <TextareaComponent
          name="ads[description]"
          label="Deskripsi Voucher"
          placeholder="Masukan Deskripsi Voucher..."
          {...formControl('ads[description]')}
          rows={5}
          validations={{ required: true }}
        />
      )}

      {/* Tipe Validasi */}
      <SelectComponent
        name="ads[validation_type]"
        label="Tipe Validasi"
        placeholder="Pilih Tipe Validasi..."
        {...formControl('ads[validation_type]')}
        options={[
          { label: 'Generate Otomatis (QR Code)', value: 'auto' },
          { label: 'Masukan Kode Unik (Manual)', value: 'manual' },
        ]}
        validations={{ required: true }}
      />

      {/* Kode Unik (hanya tampil jika manual) */}
      {validationType === 'manual' && (
        <InputComponent
          name="ads[code]"
          label="Kode Unik Voucher"
          placeholder="Contoh: MYCODE123, VOUCHER-001, PROMO2025..."
          {...formControl('ads[code]')}
          validations={{ required: true }}
        />
      )}

      {/* Gambar Voucher */}
      {createImageField && createImageField('voucher_image', 'Gambar Voucher')}

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
