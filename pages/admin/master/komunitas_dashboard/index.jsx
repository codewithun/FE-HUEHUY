/* eslint-disable no-console */
import {
  faPlus,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import Cookies from "js-cookie";
import Image from "next/image";
import { useMemo, useState, useRef } from "react";

import {
  ButtonComponent,
  FloatingPageComponent,
  InputComponent,
  TableSupervisionComponent,
} from "../../../../components/base.components";

import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";

import { token_cookie_name } from "../../../../helpers";
import { admin_token_cookie_name } from "../../../../helpers/api.helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";

/* =============================
   CONFIG
============================= */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const api = (path = "") =>
  `${API_ORIGIN.replace(/\/+$/, "")}/api/${path.replace(/^\/+/, "")}`;

const FILE_BASE = API_ORIGIN.replace(/\/+$/, "");

const buildCommunityLogoSrc = (logo) => {
  if (!logo) return "";
  if (typeof logo !== "string") return "";

  const raw = logo.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || /^data:/i.test(raw)) return raw;

  let path = raw.replace(/^\/+/, "").replace(/^api\/storage\//i, "storage/");

  if (/^storage\//i.test(path)) {
    return `${FILE_BASE}/${path}`.replace(/([^:]\/)\/+/, "$1");
  }

  if (/^(communities|ads|promos|uploads|images|files|banners)\//i.test(path)) {
    path = `storage/${path}`;
  } else {
    path = `storage/communities/${path}`;
  }

  return `${FILE_BASE}/${path}`.replace(/([^:]\/)\/+/, "$1");
};

/* =============================
   COMPONENT
============================= */
export default function KomunitasDashboard() {
  const [refresh, setRefresh] = useState(false);

  const [modalMember, setModalMember] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [memberTab, setMemberTab] = useState("members");
  const [memberList, setMemberList] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberRequestRefresh, setMemberRequestRefresh] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberAddLoading, setMemberAddLoading] = useState(false);
  const [memberAddError, setMemberAddError] = useState("");

  const abortRef = useRef(null);

  /* =============================
     AUTH HEADER
  ============================= */
  const getToken = () => {
    const enc =
      Cookies.get(admin_token_cookie_name) ||
      localStorage.getItem(admin_token_cookie_name) ||
      Cookies.get(token_cookie_name);

    return enc ? Decrypt(enc) : "";
  };

  const headersJSON = () => ({
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const headersMultipart = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  /* =============================
     FETCH MEMBERS
  ============================= */
  const openMemberModal = async (row) => {
    setActiveCommunity(row);
    setModalMember(true);
    setMemberTab("members");
    setMemberEmail("");
    setMemberAddError("");
    setMemberLoading(true);
    setMemberList([]);

    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(
        api(`admin/communities/${row.id}/members`),
        {
          headers: headersJSON(),
          signal: controller.signal,
        }
      );

      const json = await res.json();

      const data =
        json?.data?.data ||
        json?.data ||
        json?.members ||
        [];

      setMemberList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Member error:", e);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleMemberRequest = async (requestId, action) => {
    try {
      const res = await fetch(
        api(`admin/member-requests/${requestId}/${action}`),
        {
          method: "POST",
          headers: headersJSON(),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setMemberRequestRefresh((s) => !s);

      if (memberTab === "requests") {
        setRefresh((s) => !s);
      }
    } catch (e) {
      console.error("Member request error:", e);
      alert(
        `Gagal ${action === "approve" ? "menyetujui" : "menolak"} permintaan`
      );
    }
  };

  const fetchMembers = async (communityId) => {
    if (!communityId) return;

    setMemberLoading(true);
    try {
      const res = await fetch(api(`admin/communities/${communityId}/members`), {
        headers: headersJSON(),
      });

      const json = await res.json();
      const data = json?.data?.data || json?.data || json?.members || [];
      setMemberList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Member error:", e);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    const email = memberEmail.trim();
    if (!activeCommunity?.id) {
      setMemberAddError("Komunitas belum dipilih.");
      return;
    }

    if (!email) {
      setMemberAddError("Email wajib diisi.");
      return;
    }

    setMemberAddLoading(true);
    setMemberAddError("");

    try {
      const res = await fetch(api(`admin/communities/${activeCommunity.id}/members`), {
        method: "POST",
        headers: headersJSON(),
        body: JSON.stringify({ user_identifier: email }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }

      setMemberEmail("");
      await fetchMembers(activeCommunity.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Gagal menambahkan anggota";
      setMemberAddError(message);
      console.error("Add member error:", e);
    } finally {
      setMemberAddLoading(false);
    }
  };


  /* =============================
     CREATE / UPDATE
  ============================= */
  const submitCommunity = async ({ payload, isUpdate, row }) => {
    let body;
    let headers;

    if (payload.logo instanceof File) {
      const form = new FormData();

      if (isUpdate) form.append("_method", "PUT");

      Object.keys(payload).forEach((k) => {
        if (k === "logo") {
          form.append("logo", payload.logo);
        } else {
          form.append(k, payload[k] ?? "");
        }
      });

      body = form;
      headers = headersMultipart();
    } else {
      body = JSON.stringify(payload);
      headers = headersJSON();
    }

    const url = isUpdate
      ? api(`admin/communities/${row.id}`)
      : api("admin/communities");

    const method = payload.logo instanceof File ? "POST" : isUpdate ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!res.ok) throw new Error("Submit gagal");

    setRefresh((s) => !s);
    return true;
  };

  /* =============================
     TABLE COLUMN
  ============================= */
  const columns = useMemo(() => [
    {
      selector: "name",
      label: "Nama",
      item: (r) => <b>{r.name}</b>,
    },
    {
      selector: "description",
      label: "Deskripsi",
      item: (r) => r.description || "-",
    },
    {
      selector: "logo",
      label: "Logo",
      item: (r) =>
        buildCommunityLogoSrc(r.logo) ? (
          <Image src={buildCommunityLogoSrc(r.logo)} width={40} height={40} alt="" />
        ) : "-",
    },
  ], []);

  const memberColumns = useMemo(() => [
    {
      selector: "name",
      label: "Nama",
      item: (row) => <b>{row.name || row.email || "-"}</b>,
    },
    {
      selector: "email",
      label: "Email",
      item: (row) => row.email || "-",
    },
    {
      selector: "phone",
      label: "No. HP",
      item: (row) => row.phone || "-",
    },
    {
      selector: "joined_at",
      label: "Bergabung",
      item: (row) =>
        row.joined_at
          ? new Date(row.joined_at).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          : "-",
    },
  ], []);

  const requestColumns = useMemo(() => [
    {
      selector: "name",
      label: "Nama",
      item: (row) => <b>{row.user?.name || row.user?.full_name || "-"}</b>,
    },
    {
      selector: "email",
      label: "Email",
      item: (row) => row.user?.email || "-",
    },
    {
      selector: "status",
      label: "Status",
      item: (row) => (
        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
          {row.status === "pending" ? "Menunggu" : "Aktif"}
        </span>
      ),
    },
    {
      selector: "created_at",
      label: "Diminta Pada",
      item: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          : "-",
    },
  ], []);

  /* =============================
     RENDER
  ============================= */
  return (
    <>
      <TableSupervisionComponent
        title="Komunitas"
        columnControl={{ custom: columns }}
        setToRefresh={refresh}
        fetchControl={{
          path: "admin/communities",
          headers: headersJSON,
        }}
        customTopBarWithForm={({ setModalForm }) => (
          <ButtonComponent
            label="Tambah"
            icon={faPlus}
            onClick={() => setModalForm(true)}
          />
        )}
        actionControl={{
          include: (row) => (
            <ButtonComponent
              label="Anggota"
              icon={faUsers}
              size="xs"
              onClick={() => openMemberModal(row)}
            />
          ),
        }}
        formControl={{
          submit: submitCommunity,
          custom: [
            {
              construction: {
                name: "name",
                label: "Nama",
                validations: { required: true },
              },
            },
            {
              type: "textarea",
              construction: {
                name: "description",
                label: "Deskripsi",
              },
            },
            {
              type: "select",
              construction: {
                name: "privacy",
                label: "Tipe Komunitas",
                validations: { required: true },
                options: [
                  { label: "Public", value: "public" },
                  { label: "Private", value: "private" },
                ],
              },
            },
            {
              construction: {
                name: "bg_color_1",
                label: "Warna Background 1",
                placeholder: "#0b2e13",
              },
            },
            {
              construction: {
                name: "bg_color_2",
                label: "Warna Background 2",
                placeholder: "#14532d",
              },
            },
            {
              construction: {
                name: "mitra_id",
                label: "Mitra Komunitas",
                placeholder: "Masukkan ID Mitra",
              },
            },
            {
              type: "image",
              construction: {
                name: "logo",
                label: "Logo",
              },
            },
          ],
        }}
      />

      {/* MEMBER MODAL */}
      <FloatingPageComponent
        show={modalMember}
        onClose={() => setModalMember(false)}
        title={activeCommunity?.name ? `Anggota Komunitas: ${activeCommunity.name}` : "Anggota Komunitas"}
        size="lg"
      >
        <div className="p-4 space-y-4">
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            <ButtonComponent
              label="Anggota"
              variant={memberTab === "members" ? "solid" : "outline"}
              onClick={() => setMemberTab("members")}
            />
            <ButtonComponent
              label="Permintaan Bergabung"
              variant={memberTab === "requests" ? "solid" : "outline"}
              onClick={() => setMemberTab("requests")}
            />
          </div>

          {memberTab === "members" ? (
            <div className="space-y-4">
              <form
                onSubmit={handleAddMember}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <InputComponent
                    type="email"
                    name="member_email"
                    label="Tambah anggota via email"
                    placeholder="email@domain.com"
                    value={memberEmail}
                    onChange={setMemberEmail}
                  />
                  <ButtonComponent
                    type="submit"
                    label="Tambah Anggota"
                    loading={memberAddLoading}
                  />
                </div>
                {memberAddError ? (
                  <p className="mt-2 text-sm text-red-600">{memberAddError}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Email harus milik user yang sudah terdaftar dan bisa diidentifikasi oleh backend.
                  </p>
                )}
              </form>

              {memberLoading ? (
                <div className="p-4 text-sm text-slate-500">Loading...</div>
              ) : (
                <TableSupervisionComponent
                  key={`community-members-${modalMember}-${memberRequestRefresh}`}
                  title="Daftar Anggota"
                  noControlBar
                  unUrlPage
                  data={memberList}
                  columnControl={{ custom: memberColumns }}
                  customTopBar={<div />}
                  fetchControl={{
                    path: "",
                    url: "",
                    headers: headersJSON,
                  }}
                  setToRefresh={memberRequestRefresh}
                  actionControl={{
                    except: ["edit", "detail", "delete"],
                  }}
                />
              )}
            </div>
          ) : (
            <TableSupervisionComponent
              key={`community-requests-${memberRequestRefresh}`}
              title="Permintaan Bergabung"
              searchable
              noControlBar
              unUrlPage
              setToRefresh={memberRequestRefresh}
              customTopBar={<div />}
              fetchControl={{
                url: api(`admin/communities/${activeCommunity?.id || ''}/member-requests`),
                headers: headersJSON,
              }}
              columnControl={{ custom: requestColumns }}
              actionControl={{
                except: ["edit", "detail", "delete"],
                include: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <ButtonComponent
                      label="Setujui"
                      size="xs"
                      onClick={() => handleMemberRequest(row.id, "approve")}
                    />
                    <ButtonComponent
                      label="Tolak"
                      size="xs"
                      paint="danger"
                      onClick={() => handleMemberRequest(row.id, "reject")}
                    />
                  </div>
                ),
              }}
            />
          )}
        </div>
      </FloatingPageComponent>
    </>
  );
}

KomunitasDashboard.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);