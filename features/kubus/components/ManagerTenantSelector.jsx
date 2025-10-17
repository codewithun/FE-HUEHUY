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

	if (isInfo) return null; // sembunyikan saat Kubus Informasi

	return (
		<>
			{cubeType == 2 ? (
				<SelectComponent
					name="corporate_id"
					label="Manager Tenant"
					placeholder="Pilih Mitra..."
					serverOptionControl={{ path: `admin/options/corporate` }}
					{...formControl('corporate_id')}
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
						{...formControl('owner_user_id')}
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