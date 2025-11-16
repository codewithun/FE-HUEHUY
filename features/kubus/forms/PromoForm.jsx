import React from 'react';
import {
  InputComponent,
  TextareaComponent,
  SelectComponent,
  InputNumberComponent
} from '../../../components/base.components';

const PromoForm = ({ formControl, values, setValues }) => {
  // Get content type from values to determine if this is promo or voucher
  const contentType = values?.find(v => v.name === 'content_type')?.value || 'promo';
  const isVoucher = contentType === 'voucher';
  const label = isVoucher ? 'Voucher' : 'Promo';

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
          placeholder={`Masukan deskripsi singkat ${label.toLowerCase()}...`}
          {...formControl('ads[description]')}
          rows={4}
          validations={{ required: true }}
        />
      )}

      {TextareaComponent && (
        <TextareaComponent
          name="ads[detail]"
          label={`Detail ${label}`}
          placeholder={`Masukan detail lengkap ${label.toLowerCase()} untuk disimpan di manajemen ${label.toLowerCase()}...`}
          {...formControl('ads[detail]')}
          rows={6}
          validations={{ required: false }}
        />
      )}

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
          label={`Tipe ${label}`}
          placeholder={`Pilih Tipe ${label}...`}
          {...formControl('ads[promo_type]')}
          options={[
            { label: 'Online', value: 'online' },
            { label: 'Offline', value: 'offline' },
          ]}
          onChange={(value) => {
            // set promo type
            let next = [
              ...values.filter((i) => i.name !== 'ads[promo_type]')
            ];
            next.push({ name: 'ads[promo_type]', value });

            if (value === 'online') {
              // Bersihkan field lokasi TAG saat beralih ke Online
              // Catatan: Pada mode edit, backend tetap mewajibkan root address/map_lat/map_lng,
              // jadi JANGAN hapus root-level jika _original_* ada (indikasi edit mode)
              const isEditMode = Boolean(
                values.find(v => v.name === '_original_map_lat') ||
                values.find(v => v.name === '_original_map_lng') ||
                values.find(v => v.name === '_original_address')
              );

              const fieldsToRemove = [
                'cube_tags[0][map_lat]',
                'cube_tags[0][map_lng]',
                'cube_tags[0][address]'
              ];

              next = next.filter((i) => !fieldsToRemove.includes(i.name));

              if (!isEditMode) {
                // Hanya pada create, aman untuk menghapus root-level
                next = next.filter(
                  (i) => !['map_lat', 'map_lng', 'address'].includes(i.name)
                );
              }
            } else if (value === 'offline') {
              // Bersihkan link online saat beralih ke Offline
              next = next.filter((i) => i.name !== 'cube_tags[0][link]');
            }

            setValues(next);
          }}
          value={values.find((i) => i.name === 'ads[promo_type]')?.value}
        />
      </div>

      {values.find(i => i.name === 'ads[promo_type]')?.value === 'online' && (
        <InputComponent
          type="url"
          name="cube_tags[0][link]"
          label="Tautan/Link"
          placeholder={`Masukkan tautan/link ${label.toLowerCase()} online...`}
          onChange={(value) => {
            const linkIndex = values.findIndex(v => v.name === 'cube_tags[0][link]');
            const newValues = [...values];
            if (linkIndex >= 0) {
              newValues[linkIndex] = { name: 'cube_tags[0][link]', value: value };
            } else {
              newValues.push({ name: 'cube_tags[0][link]', value: value });
            }
            setValues(newValues);
          }}
          value={values.find(i => i.name === 'cube_tags[0][link]')?.value || ''}
          validations={{ required: true }}
        />
      )}

      {/* Lokasi untuk promo offline */}
      {values.find(i => i.name === 'ads[promo_type]')?.value === 'offline' && (
        <div className="grid grid-cols-2 gap-4">
        </div>
      )}
    </div>
  );
};

export default PromoForm;
