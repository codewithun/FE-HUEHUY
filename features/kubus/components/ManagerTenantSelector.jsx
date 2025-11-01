import React from 'react';
import { SelectComponent } from '../../../components/base.components';
import { getDisplayName, getPhone } from '../utils/helpers';

const ManagerTenantSelector = ({
	formControl,
	values,
	merchantManagers,
	managersLoading,
	managersError
}) => {
	const cubeType = values.find(i => i.name == 'cube_type_id')?.value;
	const isInfo = !!values.find(i => i.name === 'is_information')?.value?.at?.(0);

	// Prepare form controls so we can log and reuse them
	const ownerFc = formControl('owner_user_id');
	const corpFc = formControl('corporate_id');

	// Debug: log current values/options to trace disappearance
	try {
		// eslint-disable-next-line no-console
		console.log('[ManagerTenantSelector] render', {
			cubeType,
			isInfo,
			ownerValue: ownerFc?.value,
			corpValue: corpFc?.value,
			merchantManagersLength: merchantManagers?.length,
			managersLoading,
		});
	} catch (e) { }

	if (isInfo) return null; // sembunyikan saat Kubus Informasi

	return (
		<>
			{cubeType == 2 ? (
				<SelectComponent
					name="corporate_id"
					label="Manager Tenant"
					placeholder="Pilih Mitra..."
					serverOptionControl={{ path: `admin/options/corporate` }}
					{...(() => {
						const fc = formControl('corporate_id');
						return {
							...fc,
							value: fc?.value != null ? String(fc.value) : '',
							onChange: (v) => fc.onChange && fc.onChange(v == null ? '' : String(v)),
						};
					})()}
					searchable
				/>
			) : (
				<div>
					<SelectComponent
						name="owner_user_id"
						label="Manager Tenant"
						placeholder={
							managersLoading
								? "Loading manager tenant..."
								: merchantManagers.length === 0
									? "Tidak ada manager tenant"
									: "Pilih manager tenant..."
						}
						{...(() => {
							const fc = formControl('owner_user_id');
							return {
								...fc,
								value: fc?.value != null ? String(fc.value) : '',
								onChange: (v) => fc.onChange && fc.onChange(v == null ? '' : String(v)),
							};
						})()}
						options={merchantManagers.map((u) => ({
							value: String(u.id),
							label: `${getDisplayName(u)}${getPhone(u) ? " — " + getPhone(u) : ""}`,
						}))}
						disabled={managersLoading}
					/>
					{managersError && (
						<p className="text-red-500 text-sm mt-1">{managersError}</p>
					)}
				</div>
			)}
		</>
	);
};

export default ManagerTenantSelector;