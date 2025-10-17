import React from 'react';

const ContentTypeSelector = ({ values, setValues }) => {
	const currentTab = values.find((i) => i.name == 'content_type')?.value || 'promo';

	const handleContentTypeChange = (newType) => {
		// Koleksi field yang perlu di-reset ketika ganti jenis konten
		const fieldsToReset = [
			'ads[title]', 'ads[description]', 'ads[validation_type]', 'ads[code]',
			'ads[unlimited_grab]', 'ads[is_daily_grab]', 'ads[max_grab]',
			'ads[promo_type]', 'ads[ad_category_id]', 'cube_tags[0][link]', 'cube_tags[0][address]'
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

		// 3) Jika sedang mode "Kubus Informasi", otomatis matikan saat user memilih radio konten lain
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