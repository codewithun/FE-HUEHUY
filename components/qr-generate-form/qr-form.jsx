/* eslint-disable no-console */
import { useEffect, useMemo, useState } from 'react';

export default function QRForm({
  mode,              // 'create' | 'edit'
  initialData,       // { voucher_id, promo_id, tenant_name }
  voucherList = [],  // array voucher dari API
  promoList = [],    // array promo dari API
  onCancel,          // () => void
  onSubmit,          // (payload: {voucher_id|null, promo_id|null, tenant_name}) => Promise|void
}) {
  const initial = useMemo(() => ({
    voucher_id: '',
    promo_id: '',
    tenant_name: '',
    ...(initialData || {}),
  }), [initialData]);

  const [formData, setFormData] = useState(initial);

  useEffect(() => {
    setFormData(initial);
  }, [initial]);

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Ubah QR Event' : 'Tambah QR Event';
  const badgeText = isEdit ? 'Mode Ubah' : 'Mode Tambah';
  const submitText = isEdit ? 'Perbarui' : 'Simpan';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tenant_name?.trim()) {
      alert('Nama tenant wajib diisi');
      return;
    }
    if (!formData.voucher_id && !formData.promo_id) {
      alert('Voucher atau Promo harus diisi salah satu.');
      return;
    }

    // Normalisasi number/null
    const vId = formData.voucher_id ? Number(formData.voucher_id) : null;
    const pId = formData.promo_id ? Number(formData.promo_id) : null;

    await onSubmit({
      voucher_id: Number.isFinite(vId) ? vId : null,
      promo_id: Number.isFinite(pId) ? pId : null,
      tenant_name: formData.tenant_name.trim(),
    });
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="px-6 pt-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">Masukkan data yang valid dan benar!</p>
        <div className="mt-3">
          <span className={`badge ${isEdit ? 'badge-warning' : 'badge-success'}`}>{badgeText}</span>
        </div>
      </div>

      <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
        <div className="mb-2">
          <h3 className="text-base font-semibold">Informasi QR</h3>
          <p className="text-sm text-muted-foreground">Pilih salah satu: Voucher atau Promo, dan isi nama tenant.</p>
        </div>

        {/* Voucher - disable jika Promo dipilih */}
        <div>
          <label className="font-semibold">Voucher</label>
          <select
            className="select select-bordered w-full"
            value={String(formData.voucher_id || '')}
            onChange={(e) =>
              setFormData((s) => ({
                ...s,
                voucher_id: e.target.value,
                // saat pilih voucher, kosongkan promo
                promo_id: e.target.value ? '' : s.promo_id,
              }))
            }
            disabled={!!formData.promo_id}
          >
            <option value="">Pilih Voucher</option>
            {voucherList.length === 0 && <option value="" disabled>Tidak ada voucher</option>}
            {voucherList.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name || v.kode || v.code || v.id}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500 mt-1 block">
            Jika memilih Voucher, pilihan Promo akan dikunci.
          </span>
        </div>

        {/* Promo - disable jika Voucher dipilih */}
        <div>
          <label className="font-semibold">Promo</label>
          <select
            className="select select-bordered w-full"
            value={String(formData.promo_id || '')}
            onChange={(e) =>
              setFormData((s) => ({
                ...s,
                promo_id: e.target.value,
                // saat pilih promo, kosongkan voucher
                voucher_id: e.target.value ? '' : s.voucher_id,
              }))
            }
            disabled={!!formData.voucher_id}
          >
            <option value="">Pilih Promo</option>
            {promoList.length === 0 && <option value="" disabled>Tidak ada promo</option>}
            {promoList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.kode || p.code || p.id}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500 mt-1 block">
            Jika memilih Promo, pilihan Voucher akan dikunci.
          </span>
        </div>

        <div>
          <label className="font-semibold">Nama Tenant</label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Masukkan nama tenant"
            value={formData.tenant_name}
            onChange={(e) => setFormData((s) => ({ ...s, tenant_name: e.target.value }))}
            required
          />
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
          <button type="submit" className="btn btn-primary">{submitText}</button>
        </div>
      </form>
    </div>
  );
}