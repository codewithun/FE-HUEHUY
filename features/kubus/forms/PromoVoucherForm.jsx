import React, { useEffect } from 'react';
import { 
	InputComponent, 
	TextareaComponent, 
	SelectComponent, 
	InputNumberComponent 
} from '../../../../components/base.components';

const PromoVoucherForm = ({ formControl, values, setValues }) => {
	const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';

	// Ensure a default promo_type for voucher to avoid backend enum/NOT NULL issues
	useEffect(() => {
		if (contentType === 'voucher') {
			const promoType = values.find((i) => i.name === 'ads[promo_type]')?.value;
			if (promoType !== 'offline') {
				const idx = values.findIndex((i) => i.name === 'ads[promo_type]');
				const next = [...values];
				if (idx >= 0) next[idx] = { name: 'ads[promo_type]', value: 'offline' };
				else next.push({ name: 'ads[promo_type]', value: 'offline' });
				setValues(next);
			}

			// Ensure ad_category_id is cleared for voucher
			const idxCat = values.findIndex((i) => i.name === 'ads[ad_category_id]');
			if (idxCat >= 0) {
				const next = values.filter((i) => i.name !== 'ads[ad_category_id]');
				setValues(next);
			}
		}
	}, [contentType, values, setValues]);

	return (
		<div className="mt-6 space-y-4">
			<div className="font-semibold text-lg text-slate-700 border-b pb-2">
				{contentType === 'promo' ? 'Promo' : 'Voucher'}
			</div>

			<InputComponent
				name="ads[title]"
				label={`Judul ${contentType === 'promo' ? 'Promo' : 'Voucher'}`}
				placeholder={`Masukan Judul ${contentType === 'promo' ? 'Promo' : 'Voucher'}...`}
				{...formControl('ads[title]')}
				validations={{ required: true }}
			/>

			{TextareaComponent && (
				<TextareaComponent
					name="ads[description]"
					label={`Deskripsi ${contentType === 'promo' ? 'Promo' : 'Voucher'}`}
					placeholder={`Masukan Deskripsi ${contentType === 'promo' ? 'Promo' : 'Voucher'}...`}
					{...formControl('ads[description]')}
					rows={5}
					validations={{ required: true }}
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

			{contentType === 'promo' && (
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
			)}

			{contentType === 'promo' && values.find(i => i.name === 'ads[promo_type]')?.value === 'online' && (
				<InputComponent
					type="url"
					name="cube_tags[0][link]"
					label="Tautan/Link"
					placeholder="Masukkan tautan/link promo online..."
					onChange={(e) => {
						const linkIndex = values.findIndex(v => v.name === 'cube_tags[0][link]');
						const newValues = [...values];
						if (linkIndex >= 0) {
							newValues[linkIndex] = { name: 'cube_tags[0][link]', value: e.target.value };
						} else {
							newValues.push({ name: 'cube_tags[0][link]', value: e.target.value });
						}
						setValues(newValues);
					}}
					value={values.find(i => i.name === 'cube_tags[0][link]')?.value || ''}
					validations={{ required: true }}
				/>
			)}
		</div>
	);
};

export default PromoVoucherForm;