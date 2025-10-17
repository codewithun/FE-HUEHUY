/* eslint-disable no-console */
// Helper functions untuk Kubus Management

export const getCT = (values) =>
	values.find(i => i.name === 'content_type')?.value || 'promo';

export const isInfo = (values) =>
	!!values.find(i => i.name === 'is_information')?.value?.at?.(0);

export const isPromoOrVoucher = (values) => ['promo', 'voucher'].includes(getCT(values));

// Helper functions untuk Manager Tenant
export const getDisplayName = (u) =>
	u?.name || u?.full_name || u?.username || u?.display_name || `User #${u?.id}`;

export const getPhone = (u) =>
	u?.phone || u?.phone_number || u?.telp || u?.telpon || u?.mobile || u?.contact || "";

// normalisasi role → 'manager_tenant'
export const norm = (v) =>
	String(v ?? "").toLowerCase().replace(/[-\s]+/g, "_");

export const isManagerTenant = (u) => {
	const target = "manager_tenant";
	if (norm(u?.role?.name) === target) return true;   // { role: { name: '...' } }
	if (norm(u?.role) === target) return true;         // { role: '...' }
	if (norm(u?.user_role) === target) return true;    // { user_role: '...' }
	if (Array.isArray(u?.roles)) {
		return u.roles.some((r) => norm(r?.name || r) === target);
	}
	return false;
};

// ROLE FILTER: hanya user (exclude admin/manager)
export const isUserRole = (u) => {
	if (!u) return false;
	const denyList = [
		'admin', 'superadmin', 'manager', 'tenant', 'tenant_manager', 'manager_tenant', 'staff', 'owner', 'operator', 'moderator'
	];

	if (u.role && typeof u.role === 'object' && u.role.name) {
		return !denyList.includes(u.role.name.toLowerCase());
	}
	if (typeof u.role === 'string') {
		return !denyList.includes(u.role.toLowerCase());
	}
	if (Array.isArray(u.roles)) {
		return !u.roles.some((r) => 
			denyList.includes((r?.name || r || '').toLowerCase())
		);
	}
	const boolTrue = (v) => v === true || v === 1 || v === '1';
	if (boolTrue(u.is_admin) || boolTrue(u.is_superadmin) || boolTrue(u.is_staff) || boolTrue(u.is_manager) || boolTrue(u.is_tenant_manager) || boolTrue(u.tenant_manager)) {
		return false;
	}
	if (typeof u.level === 'string' && denyList.includes(u.level.toLowerCase())) return false;
	if (typeof u.type === 'string' && denyList.includes(u.type.toLowerCase())) return false;
	return true; // fallback permisif
};

// API helpers
export const getApiBase = () => {
	const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
	return raw.replace(/\/api\/?$/, "");
};

export const toStoragePath = (raw) => {
	if (!raw) return '/default-avatar.png';

	const s = String(raw).trim();

	// 🚨 Skip temporary files atau path Windows yang invalid
	if (s.includes('\\Temp\\') || s.includes('C:\\Users') || s.includes('.tmp') || s.includes('php')) {
		console.warn('Skipping invalid path:', s);
		return '/default-avatar.png';
	}

	// Sudah berupa path absolut FE
	if (s.startsWith('/')) return s;

	// Bentuk absolut ke BE → petakan ke path FE
	// contoh: http://localhost:8000/storage/xxx → /storage/xxx
	const m1 = s.match(/^https?:\/\/[^/]+\/(api\/)?storage\/(.+)$/i);
	if (m1) return `/storage/${m1[2]}`;

	// Kasus BE kirim "api/storage/xxx" → /storage/xxx
	if (/^api\/storage\//i.test(s)) return s.replace(/^api\/storage\//i, '/storage/');

	// Kasus BE kirim "storage/xxx" → /storage/xxx
	if (/^storage\//i.test(s)) return `/${s}`;

	// Kasus BE kirim hanya "vouchers/xxx" → /storage/vouchers/xxx
	return `/storage/${s.replace(/^\/+/, '')}`;
};

/** Tambahkan query param versing k=... */
export const withVersion = (base, ver) =>
	!base ? '' : `${base}${base.includes('?') ? '&' : '?'}k=${encodeURIComponent(String(ver ?? Date.now()))}`;