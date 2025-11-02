import { admin_token_cookie_name } from "../../../../helpers/api.helpers";
/* eslint-disable no-console */
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ButtonComponent,
  FloatingPageComponent,
  InputComponent,
  ModalConfirmComponent,
  SelectComponent,
  TableSupervisionComponent,
} from "../../../../components/base.components";
import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";
import { token_cookie_name } from "../../../../helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";

export default function QRCodeCrud() {
  const [modalView, setModalView] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [promoList, setPromoList] = useState([]);
  const [refreshToggle, setRefreshToggle] = useState(false);

  const qrContainerRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const [qrUrl, setQrUrl] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiBase = apiUrl.replace(/\/+$/, "");
  const storageBase = apiBase.replace(/\/api\/?$/, "");

  const authHeader = useCallback(() => {
    const encCookie = Cookies.get(admin_token_cookie_name);
    const encLs =
      typeof window !== "undefined"
        ? localStorage.getItem(admin_token_cookie_name)
        : null;
    const encUser = Cookies.get(token_cookie_name);
    const enc = encCookie || encLs || encUser || null;
    const token = enc ? Decrypt(enc) : "";
    return { Authorization: `Bearer ${token}` };
  }, []);

  const toStorageUrl = useCallback(
    (path) => {
      if (!path) return "";
      if (/^https?:\/\//i.test(path)) return path;
      return `${storageBase}/storage/${path}`.replace(/([^:]\/)\/+/g, "$1");
    },
    [storageBase]
  );

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLabel = (item) => {
    if (!item) return "";
    return (
      item.name ||
      item.nama ||
      item.title ||
      item.code ||
      item.label ||
      (item.id !== undefined ? String(item.id) : JSON.stringify(item))
    );
  };

  const getPromoLabel = useCallback(
    (id) => {
      if (!id) return "";
      const p = promoList.find((x) => String(x.id) === String(id));
      return p ? getLabel(p) : `Promo #${id}`;
    },
    [promoList]
  );

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const promoRes = await fetch(`${apiBase}/admin/promos?all=1`, {
          method: "GET",
          headers: { "Content-Type": "application/json", ...authHeader() },
        });
        if (promoRes.ok) {
          const promoResult = await promoRes.json();
          console.log("Promo result:", promoResult);
          setPromoList(Array.isArray(promoResult.data) ? promoResult.data : []);
        } else {
          console.error("Failed to fetch promos:", promoRes.status);
        }
      } catch (error) {
        console.error("Error fetching promos:", error);
        setPromoList([]);
      }
    };
    fetchPromos();
  }, [apiBase, authHeader]);

  const columns = useMemo(
    () => [
      {
        selector: "tenant_name",
        label: "Nama Tenant",
        sortable: true,
        item: ({ tenant_name }) => (
          <span className="font-semibold">{tenant_name}</span>
        ),
      },
      {
        selector: "promo_id",
        label: "Promo",
        item: ({ promo_id, promo }) => {
          if (promo) return getLabel(promo);
          return promo_id ? getPromoLabel(promo_id) : "-";
        },
      },
      {
        selector: "qr_code",
        label: "QR Code",
        width: "120px",
        item: ({ qr_code }) =>
          qr_code ? (
            <Image
              src={toStorageUrl(qr_code)}
              alt="QR"
              width={48}
              height={48}
              unoptimized
            />
          ) : (
            "-"
          ),
      },
      {
        selector: "created_at",
        label: "Tanggal Dibuat",
        sortable: true,
        item: ({ created_at }) => formatDate(created_at),
      },
    ],
    [getPromoLabel, toStorageUrl]
  );

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${apiBase}/admin/qrcodes/${selectedItem.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeader() },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setRefreshToggle((s) => !s);
        alert("QR Code berhasil dihapus");
      } else {
        console.error("Delete failed:", body);
        alert(body?.message || "Gagal menghapus QR Code");
      }
    } catch (error) {
      console.error("Error deleting QR Code:", error);
      alert("Gagal menghapus QR Code: Network error");
    } finally {
      setModalDelete(false);
      setSelectedItem(null);
    }
  };

  const buildTargetUrl = useCallback(
    (item) => {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      if (!item) return "";

      if (item.promo || item.promo_id) {
        const promo =
          item.promo || promoList.find((p) => String(p.id) === String(item.promo_id));
        if (promo) {
          const communityId =
            promo?.community?.id || promo?.community_id || "default";
          return `${origin}/app/komunitas/promo/detail_promo?promoId=${promo.id}&communityId=${communityId}&autoRegister=1&source=qr_scan`;
        }
      }
      return "";
    },
    [promoList]
  );

  useEffect(() => {
    if (!selectedItem) return setQrUrl("");
    setQrUrl(buildTargetUrl(selectedItem));
    qrCanvasRef.current = null;
  }, [selectedItem, buildTargetUrl]);

  const smartDownload = async () => {
    try {
      if (!selectedItem?.id) {
        alert("QR tidak valid.");
        return;
      }

      const apiFileUrl = `${apiBase}/admin/qrcodes/${selectedItem.id}/file`;

      const res = await fetch(apiFileUrl, {
        mode: "cors",
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("image/png")) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `qr-${selectedItem?.tenant_name || selectedItem?.id || "code"}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const svgText = await res.text();
      const img = new Image();
      img.crossOrigin = "anonymous";
      const svg64 =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgText)));

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(null);
        img.onerror = reject;
        img.src = svg64;
      });

      const TARGET = 2048;
      const ratio = img.width && img.height ? img.height / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = TARGET;
      canvas.height = Math.round(TARGET * ratio);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Unable to get 2D context from canvas");
        alert("Gagal membuat gambar QR — context tidak tersedia.");
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngDataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngDataUrl;
      a.download = `qr-${selectedItem?.tenant_name || selectedItem?.id || "code"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("Unduh QR gagal:", e);
      alert("Tidak bisa mengunduh QR. Cek koneksi dan coba lagi.");
    }
  };

  return (
    <>
      <TableSupervisionComponent
        title="Generator QR Event"
        columnControl={{ custom: columns }}
        searchable
        setToRefresh={refreshToggle}
        actionControl={{
          except: ["detail", "edit"],
          onAdd: () => setSelectedItem(null),
          onDelete: (item) => {
            setSelectedItem(item);
            setModalDelete(true);
          },
        }}
        fetchControl={{
          path: "admin/qrcodes",
          includeHeaders: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
        }}
        formDefaultValue={{
          promo_id: "",
          tenant_name: "",
        }}
        beforeSubmit={(payload) => {
          if (!payload.tenant_name?.trim()) {
            alert("Nama tenant wajib diisi");
            return false;
          }
          if (!payload.promo_id) {
            alert("Promo wajib dipilih.");
            return false;
          }
          return true;
        }}
        formControl={{
          contentType: "application/json",
          endpoint: "admin/qrcodes",
          method: "POST",
          transformData: (data) => ({
            promo_id: data.promo_id || null,
            tenant_name: data.tenant_name,
          }),
          custom: [
            {
              type: "custom",
              custom: ({ formControl }) => {
                const fc = formControl("promo_id");
                const current = fc.value ?? "";
                return (
                  <div className="col-span-12">
                    <SelectComponent
                      name="promo_id"
                      label="Promo"
                      placeholder="Pilih Promo..."
                      value={current}
                      onChange={fc.onChange}
                      clearable={true}
                      options={promoList.map((p) => ({
                        label: getLabel(p),
                        value: p.id,
                      }))}
                    />
                  </div>
                );
              },
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <div className="col-span-12">
                  <InputComponent
                    name="tenant_name"
                    label="Nama Tenant *"
                    placeholder="Masukkan nama tenant"
                    required
                    {...formControl("tenant_name")}
                  />
                </div>
              ),
            },
          ],
        }}
        onRowClick={(item) => {
          setSelectedItem(item);
          setModalView(true);
        }}
      />

      <FloatingPageComponent
        show={modalView}
        onClose={() => {
          setModalView(false);
          setSelectedItem(null);
          setQrUrl("");
        }}
        title="QR Code Event"
        size="md"
        className="bg-background"
      >
        {selectedItem && (selectedItem.promo || selectedItem.promo_id) ? (
          <div className="flex flex-col items-center gap-4 p-6" ref={qrContainerRef}>
            {qrUrl ? (
              <>
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={qrUrl}
                  size={512}
                  includeMargin
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
                <div className="text-center">
                  <div className="font-bold text-primary text-lg">
                    Promo:{" "}
                    {selectedItem.promo
                      ? getLabel(selectedItem.promo)
                      : getPromoLabel(selectedItem.promo_id)}
                  </div>
                  <div className="text-sm text-secondary mt-1">
                    Tenant: {selectedItem.tenant_name}
                  </div>
                </div>

                <ButtonComponent
                  label="Download QR (PNG)"
                  icon={faDownload}
                  paint="primary"
                  onClick={smartDownload}
                />
              </>
            ) : (
              <div className="text-center text-lg text-gray-500 font-semibold">
                Menyiapkan QR…
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-6">
            <div className="text-center text-lg text-gray-500 font-semibold">
              QR CODE BELUM DI BUAT
            </div>
          </div>
        )}
      </FloatingPageComponent>

      <ModalConfirmComponent
        title="Hapus QR Code"
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelectedItem(null);
        }}
        onSubmit={handleDelete}
      >
        <p className="text-gray-600 mb-4">
          Apakah Anda yakin ingin menghapus QR Code untuk tenant{" "}
          {selectedItem?.tenant_name}?
        </p>
        <p className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan.</p>
      </ModalConfirmComponent>
    </>
  );
}

QRCodeCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
