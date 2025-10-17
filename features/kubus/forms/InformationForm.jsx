import React from 'react';
import { InputComponent, TextareaComponent } from '../../../../components/base.components';

const InformationForm = ({ formControl }) => {
	return (
		<div className="mt-6 space-y-4">
			<div className="font-semibold text-lg text-slate-700 border-b pb-2">
				Kubus Informasi
			</div>

			<InputComponent
				name="link_information"
				label="Link Youtube"
				placeholder="Masukkan link youtube"
				{...formControl('link_information')}
			/>

			<InputComponent
				name="ads[title]"
				label="Judul Iklan"
				placeholder="Masukan Judul Iklan..."
				{...formControl('ads[title]')}
				validations={{ required: true }}
			/>

			{TextareaComponent && (
				<TextareaComponent
					name="ads[description]"
					label="Deskripsi Iklan"
					placeholder="Masukan Deskripsi Iklan..."
					{...formControl('ads[description]')}
					rows={5}
					validations={{ required: true }}
				/>
			)}
		</div>
	);
};

export default InformationForm;