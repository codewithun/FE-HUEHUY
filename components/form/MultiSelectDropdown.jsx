/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";

/**
 * MultiSelectDropdown
 * props:
 *  - options: [{ value: string|number, label: string }]
 *  - value: array of selected values
 *  - onChange: (array) => void
 *  - placeholder: string
 *  - maxHeight: number (px)
 */
export default function MultiSelectDropdown({
  options = [],
  value = [],
  onChange = () => {},
  placeholder = "Pilih...",
  maxHeight = 240,
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const clearAll = () => onChange([]);
  const selectAll = () => onChange(options.map((o) => o.value));

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border-2 border-gray-200 rounded-lg text-left hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/20"
      >
        <span className="flex flex-wrap gap-1">
          {value.length === 0 && (
            <span className="text-gray-400">{placeholder}</span>
          )}
          {value.slice(0, 3).map((val) => {
            const opt = options.find((o) => o.value === val);
            if (!opt) return null;
            return (
              <span
                key={val}
                className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-md"
              >
                {opt.label.split(" - ")[0]}
              </span>
            );
          })}
          {value.length > 3 && (
            <span className="text-xs text-gray-500">
              +{value.length - 3} lainnya
            </span>
          )}
        </span>
        <span className="text-xs text-gray-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100 space-y-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Cari..."
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="flex-1 text-xs bg-primary/10 text-primary py-1 rounded hover:bg-primary/20"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="flex-1 text-xs bg-gray-100 py-1 rounded hover:bg-gray-200"
              >
                Kosongkan
              </button>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {filtered.length === 0 && (
              <div className="p-3 text-xs text-gray-500">Tidak ada data</div>
            )}
            {filtered.map((opt) => {
              const active = value.includes(opt.value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`w-full flex items-start gap-2 px-3 py-2 text-left text-xs hover:bg-primary/5 ${
                    active ? "bg-primary/10" : ""
                  }`}
                >
                  <input
                    readOnly
                    type="checkbox"
                    checked={active}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="leading-tight">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {value.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-500">{value.length} dipilih</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
