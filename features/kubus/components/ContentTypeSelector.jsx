import React from 'react';

const ContentTypeSelector = ({ values, setValues }) => {
	const currentTab = values.find((i) => i.name == 'content_type')?.value || 'promo';

	const handleContentTypeChange = (newType) => {
		// Koleksi field yang perlu di-reset ketika ganti jenis konten
		const fieldsToReset = [
			// Basic content fields
			'ads[title]', 'ads[description]', 'ads[validation_type]', 'ads[code]',
			
			// Promo/voucher specific fields
			'ads[unlimited_grab]', 'ads[is_daily_grab]', 'ads[max_grab]',
			'ads[promo_type]', 'ads[ad_category_id]', 
			'ads[level_umkm]', 'ads[max_production_per_day]', 'ads[sell_per_day]',
			
			// Time and validation fields
			'ads[jam_mulai]', 'ads[jam_berakhir]', 'ads[day_type]',
			'ads[start_validate]', 'ads[finish_validate]', 'ads[validation_time_limit]',
			
			// Custom days
			'ads[custom_days][0]', 'ads[custom_days][1]', 'ads[custom_days][2]', 
			'ads[custom_days][3]', 'ads[custom_days][4]', 'ads[custom_days][5]', 'ads[custom_days][6]',
			
			// Location and links
			'cube_tags[0][link]', 'cube_tags[0][address]', 'cube_tags[0][map_lat]', 'cube_tags[0][map_lng]',
			// Bare map fields possibly used elsewhere in form
			'map_lat', 'map_lng', 'address',
			
			// Target and community
			'target_type', 'target_user_ids', 'community_id',
			
			// Images (reset content images but keep cube logo)
			'ads[image]', 'ads[image_1]', 'ads[image_2]', 'ads[image_3]'
		];

		// 1) Buang field yang di-reset
		let next = values.filter(v => !fieldsToReset.includes(v.name));

		// 2) Set content_type
		const idxCT = next.findIndex((i) => i.name === 'content_type');
		if (idxCT !== -1) {
			next[idxCT] = { ...next[idxCT], value: newType };
		} else {
			next = [...next, { name: 'content_type', value: newType }];
		}

		// 3) Set default values berdasarkan jenis konten
		const defaultValues = {
			'ads[validation_type]': 'auto',
			'ads[day_type]': 'custom',
			'target_type': 'all',
			'target_user_ids': [],
			'community_id': '',
			'ads[is_daily_grab]': 0,
			'ads[unlimited_grab]': 0
		};

		// Set default values untuk jenis konten tertentu
		if (newType === 'voucher') {
			defaultValues['ads[promo_type]'] = 'offline';
		}

		// Tambahkan default values ke form
		Object.entries(defaultValues).forEach(([fieldName, defaultValue]) => {
			const existingIndex = next.findIndex(v => v.name === fieldName);
			if (existingIndex === -1) {
				next.push({ name: fieldName, value: defaultValue });
			}
		});

		// 4) Jika sedang mode "Kubus Informasi", otomatis matikan saat user memilih radio konten lain
		// 4) Jika sedang mode "Kubus Informasi", otomatis matikan saat user memilih radio konten lain
		const idxInfo = next.findIndex((i) => i.name === 'is_information');
		if (idxInfo !== -1) {
			next[idxInfo] = { ...next[idxInfo], value: [] };
		} else {
			next = [...next, { name: 'is_information', value: [] }];
		}

		setValues(next);
	};

	const options = [
		{ key: 'promo', label: 'Promo' },
		{ key: 'voucher', label: 'Voucher' },
		{ key: 'iklan', label: 'Iklan' },
	];

	return (
		<div className="space-y-3">
			<div className="font-semibold text-base text-slate-700">Jenis Konten</div>

			<div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
				<div className="flex items-center gap-6">
					{options.map(opt => (
						<label key={opt.key} className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="content_type_radio"
								value={opt.key}
								checked={currentTab === opt.key}
								onChange={() => handleContentTypeChange(opt.key)}
								className="radio radio-success radio-sm"
							/>
							<span className="text-sm font-medium text-slate-700">
								{opt.label}
							</span>
						</label>
					))}
				</div>
			</div>
		</div>
	);
};

export default ContentTypeSelector;