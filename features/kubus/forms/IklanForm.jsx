import React from 'react';
import {
  InputComponent,
  TextareaComponent,
  SelectComponent
} from '../../../components/base.components';

function IklanForm({ formControl, values, setValues }) {
  return (
    <div className="mt-6 space-y-4">
      <div className="font-semibold text-lg text-slate-700 border-b pb-2">Iklan</div>

      <InputComponent
        name="ads[title]"
        label="Judul Iklan"
        placeholder="Masukan Judul Iklan..."
        {...formControl('ads[title]')}
      />

      {TextareaComponent && (
        <TextareaComponent
          name="ads[description]"
          label="Deskripsi Iklan"
          placeholder="Masukan Deskripsi Iklan..."
          {...formControl('ads[description]')}
          rows={5}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <SelectComponent
          name="ads[ad_category_id]"
          label="Kategori Iklan"
          placeholder="Pilih Kategori Iklan..."
          {...formControl('ads[ad_category_id]')}
          serverOptionControl={{ path: 'admin/options/ad-category' }}
        />
        <SelectComponent
          name="ads[promo_type]"
          label="Tipe Promo"
          placeholder="Pilih Tipe Promo..."
          {...formControl('ads[promo_type]')}
          options={[
            { label: 'Online', value: 'online' },
            { label: 'Offline', value: 'offline' },
          ]}
        />
      </div>

      {values.find(i => i.name === 'ads[promo_type]')?.value === 'online' && (
        <InputComponent
          type="url"
          name="link_information"
          label="Link Toko Online"
          placeholder="Masukkan link toko online..."
          {...formControl('link_information')}
        />
      )}
    </div>
  );
};

export default IklanForm;