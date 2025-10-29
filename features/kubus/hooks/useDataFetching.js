import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { token_cookie_name, Decrypt } from '../../../helpers';
import { admin_token_cookie_name } from '../../../helpers/api.helpers';
import { getApiBase, isManagerTenant, getDisplayName, isUserRole } from '../utils/helpers';

export const useManagersData = () => {
	const [merchantManagers, setMerchantManagers] = useState([]);
	const [managersLoading, setManagersLoading] = useState(true);
	const [managersError, setManagersError] = useState(null);

	const authHeader = useCallback(() => {
			const encCookie = Cookies.get(admin_token_cookie_name);
			const encLs = typeof window !== 'undefined' ? localStorage.getItem(admin_token_cookie_name) : null;
			const encUser = Cookies.get(token_cookie_name);
			const enc = encCookie || encLs || encUser || null;
			const token = enc ? Decrypt(enc) : "";
		return { Authorization: `Bearer ${token}` };
	}, []);

	const apiBase = getApiBase();
	// Note: routes in routes/api.php are auto-prefixed with /api
	const MANAGERS_ENDPOINT = `${apiBase}/api/admin/users?roles[]=manager_tenant&roles[]=manager%20tenant&paginate=all`;

	useEffect(() => {
		const fetchManagers = async () => {
			try {
				setManagersLoading(true);
				setManagersError(null);

				const response = await fetch(MANAGERS_ENDPOINT, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						...authHeader(),
					},
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch managers: ${response.status}`);
				}

				const result = await response.json();
				let users = [];

				if (Array.isArray(result?.data)) {
					users = result.data;
				} else if (Array.isArray(result)) {
					users = result;
				}

				const filteredManagers = users
					.filter(isManagerTenant)
					.map((u) => ({
						...u,
						displayName: getDisplayName(u),
					}));

				setMerchantManagers(filteredManagers);
			} catch (error) {
				setManagersError(error.message || 'Failed to load manager tenant data');
				setMerchantManagers([]);
			} finally {
				setManagersLoading(false);
			}
		};

		fetchManagers();
	}, [MANAGERS_ENDPOINT, authHeader]);

	return { merchantManagers, managersLoading, managersError };
};

export const useUsersData = () => {
	const [users, setUsers] = useState([]);

	const authHeader = useCallback(() => {
			const encCookie = Cookies.get(admin_token_cookie_name);
			const encLs = typeof window !== 'undefined' ? localStorage.getItem(admin_token_cookie_name) : null;
			const encUser = Cookies.get(token_cookie_name);
			const enc = encCookie || encLs || encUser || null;
			const token = enc ? Decrypt(enc) : "";
		return { Authorization: `Bearer ${token}` };
	}, []);

	const apiBase = getApiBase();

	useEffect(() => {
		const fetchUsers = async () => {
			try {
						const response = await fetch(`${apiBase}/api/admin/users?paginate=all`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						...authHeader(),
					},
				});

				if (response.ok) {
					const result = await response.json();
					const userData = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
					setUsers(userData);
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Error fetching users:', error);
				setUsers([]);
			}
		};

		fetchUsers();
	}, [apiBase, authHeader]);

	const onlyUsers = users.filter(isUserRole);

	return { users, onlyUsers };
};