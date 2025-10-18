/* eslint-disable no-console */
import React from 'react';
import Image from 'next/image';

const ImageFieldComponent = ({ 
	formControl, 
	values, 
	selected, 
	fieldName, 
	label, 
	formSessionId,
	getServerImageUrl,
	withVersion,
	previewUrl,
	previewOwnerKey,
	handleFileInput,
	handleRecrop,
	onClearImage 
}) => {
	const fc = formControl(fieldName);
	const formId = values?.find?.((v) => v.name === 'id')?.value;
	const fieldKey = `${fieldName.replace(/[\[\]]/g, '-')}-${formSessionId}-${formId || 'new'}`;
	const isEditMode = Boolean(formId && formId !== 'new');

	// Server image - hanya untuk edit mode
	const serverImageUrl = isEditMode ? getServerImageUrl(fieldName, values, selected) : null;

	const valMap = (name) => values?.find?.((v) => v.name === name)?.value;
	const imageVersion =
		valMap(`${fieldName}_updated_at`) ||
		valMap('updated_at') ||
		formId ||
		Date.now();

	const serverSrc = serverImageUrl ? withVersion(serverImageUrl, imageVersion) : '';

	// Prioritas File object dan blob preview
	const currentValue = fc.value;
	const hasFileObject = currentValue instanceof File;
	const canUseBlob = Boolean(previewUrl) && String(previewOwnerKey) === String(fieldKey);

	// // Debug log untuk image field
	// console.log(`=== DEBUG IMAGE FIELD: ${fieldName} ===`);
	// console.log('isEditMode:', isEditMode);
	// console.log('currentValue:', currentValue);
	// console.log('hasFileObject:', hasFileObject);
	// console.log('serverImageUrl:', serverImageUrl);
	// console.log('serverSrc:', serverSrc);
	// console.log('canUseBlob:', canUseBlob);
	// console.log('previewUrl:', previewUrl);
	// console.log('formId:', formId);
	// console.log('selected:', selected);

	let finalPreviewSrc = '';
	if (hasFileObject && canUseBlob) {
		finalPreviewSrc = previewUrl;
		// console.log('Using blob preview URL');
	} else if (hasFileObject) {
		finalPreviewSrc = URL.createObjectURL(currentValue);
		// console.log('Creating object URL from file');
	} else if (serverSrc) {
		finalPreviewSrc = serverSrc;
		// console.log('Using server image URL');
	} else if (currentValue && typeof currentValue === 'string' && currentValue.startsWith('http')) {
		// Fallback: jika currentValue adalah URL string langsung
		finalPreviewSrc = currentValue;
		// console.log('Using direct URL from current value');
	}

	// console.log('finalPreviewSrc:', finalPreviewSrc);
	// console.log(`=== END DEBUG ${fieldName} ===`);

	// File input handler
	const handleFileChange = (e) => {
		handleFileInput(e, fc, fieldKey);
	};

	const fileInfo = hasFileObject ? `File: ${currentValue.name} (${(currentValue.size / 1024).toFixed(1)}KB)` : '';

	return (
		<div className="form-control" key={`${fieldName}-field-${fieldKey}`}>
			<label className="label">
				<span className="label-text font-medium">{label}</span>
				{hasFileObject && (
					<span className="label-text-alt text-green-600 text-xs">📁 {fileInfo}</span>
				)}
			</label>

			<div className="mb-4">
				{finalPreviewSrc ? (
					<div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
						<Image
							src={finalPreviewSrc}
							alt={`${label} Preview`}
							width={192}
							height={192}
							className="max-w-full max-h-full object-contain"
							unoptimized
						/>
					</div>
				) : (
					<div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
						<div className="text-center">
							<svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
							</svg>
							<p className="text-gray-500 text-sm">Belum ada gambar dipilih</p>
						</div>
					</div>
				)}
			</div>

			<div className="flex flex-wrap items-start gap-2">
	<input
		type="file"
		accept="image/*"
		className="file-input file-input-bordered flex-1"
		onChange={handleFileChange}
		key={`${fieldName}-file-input-${fieldKey}-${imageVersion}`}
	/>
	{finalPreviewSrc && (
		<div className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				className="btn btn-outline btn-sm"
				onClick={() => handleRecrop(fc)}
				title="Crop ulang untuk menyesuaikan gambar"
			>
				Crop Ulang
			</button>
			<button
				type="button"
				className="btn btn-outline btn-error btn-sm"
				onClick={() => onClearImage(fc, fieldKey)}
				title="Hapus gambar"
			>
				Hapus
			</button>
		</div>
	)}
</div>
			<span className="text-xs text-gray-500 mt-1">
				PNG/JPG/WEBP, maksimal 10MB. Dialog crop akan terbuka otomatis setelah memilih file.
			</span>
		</div>
	);
};

export default ImageFieldComponent;