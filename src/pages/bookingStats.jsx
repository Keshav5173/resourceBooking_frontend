import { useCallback, useEffect, useMemo, useState } from "react";
import { getBookingStats } from "../services/booking.service.js"; 

const PAGE_SIZE = 20;

const TIME_FILTERS = [
  { id: "all", label: "Any date" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

const STATUS_STYLES = {
  confirmed: "bg-green-100 text-green-800",
  approved: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  pending: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800",
  canceled: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
};
const statusStyle = (s) => STATUS_STYLES[s] || "bg-slate-200 text-slate-700";

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });

const bookedFor = (b) => b.date ?? b.bookingDate;
const toDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmt = (v) => {
  const d = toDate(v);
  return d ? dateFmt.format(d) : "—";
};
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const isUpcoming = (b) => {
  const d = toDate(bookedFor(b));
  return !!d && d >= startOfToday();
};
const norm = (s) => (s ? String(s).toLowerCase() : "unknown");
const label = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function SummaryCard({ title, value, hint }) {
  return (
    <div className="rounded-lg border-[1.5px] border-slate-300 bg-white p-4">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const chip = (active) =>
  `rounded-lg px-3.5 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-indigo-600/40 ${
    active
      ? "bg-indigo-600 text-white"
      : "border-[1.5px] border-slate-300 bg-white text-slate-700 hover:border-slate-400"
  }`;

export default function BookingStats() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState({ type: "loading", message: "" });

  const [time, setTime] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resource, setResource] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setStatus({ type: "loading", message: "" });
    try {
      const data = await getBookingStats();
      setBookings(Array.isArray(data) ? data : []);
      setStatus({ type: "success", message: "" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filter options are built from the data, so new statuses or resources appear automatically.
  const statusCounts = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const s = norm(b.status);
      map[s] = (map[s] || 0) + 1;
    });
    return map;
  }, [bookings]);

  const resourceCounts = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const r = b.resourceName || "Deleted resource";
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  const uniqueUsers = useMemo(
    () => new Set(bookings.map((b) => b.email || b.fullName).filter(Boolean)).size,
    [bookings]
  );
  const upcomingCount = useMemo(() => bookings.filter(isUpcoming).length, [bookings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = bookings.filter((b) => {
      if (time === "upcoming" && !isUpcoming(b)) return false;
      if (time === "past" && isUpcoming(b)) return false;
      if (statusFilter !== "all" && norm(b.status) !== statusFilter) return false;
      if (resource !== "all" && (b.resourceName || "Deleted resource") !== resource) return false;
      if (q && !`${b.fullName || ""} ${b.email || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const t = (b) => toDate(bookedFor(b))?.getTime() ?? 0;
    return list.sort((a, b) => (sort === "newest" ? t(b) - t(a) : t(a) - t(b)));
  }, [bookings, time, statusFilter, resource, search, sort]);

  const filtersActive = time !== "all" || statusFilter !== "all" || resource !== "all" || search !== "";
  const clearFilters = () => {
    setTime("all");
    setStatusFilter("all");
    setResource("all");
    setSearch("");
    setVisibleCount(PAGE_SIZE);
  };
  // Reset paging whenever a filter changes.
  const set = (setter) => (v) => {
    setter(v);
    setVisibleCount(PAGE_SIZE);
  };

  const loading = status.type === "loading";
  const maxResource = resourceCounts[0]?.[1] || 1;

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-12 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Booking stats</h1>
            <p className="max-w-[60ch] text-[15px] leading-relaxed text-slate-600">
              All bookings across every user and resource.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg border-[1.5px] border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-slate-400 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-indigo-600/40 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {status.type === "error" && (
          <div role="alert" className="mb-6 rounded-lg bg-red-100 p-4 text-sm text-red-800">
            <p className="mb-3">{status.message}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-red-700/40"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary */}
        <section aria-label="Summary" className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading ? (
            [0, 1, 2, 3].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-lg bg-slate-200" />)
          ) : (
            <>
              <SummaryCard title="Total bookings" value={bookings.length} />
              <SummaryCard title="Upcoming" value={upcomingCount} hint={`${bookings.length - upcomingCount} past`} />
              <SummaryCard title="Users who booked" value={uniqueUsers} />
              <SummaryCard
                title="Most booked resource"
                value={<span className="line-clamp-1 break-words text-xl">{resourceCounts[0]?.[0] || "—"}</span>}
                hint={resourceCounts[0] ? `${resourceCounts[0][1]} bookings` : undefined}
              />
            </>
          )}
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_280px]">
          {/* Filters + table */}
          <section aria-label="Bookings">
            <div className="mb-4 space-y-4 rounded-lg border-[1.5px] border-slate-300 bg-white p-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Date">
                {TIME_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={time === f.id}
                    onClick={() => set(setTime)(f.id)}
                    className={chip(time === f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
                <button
                  type="button"
                  aria-pressed={statusFilter === "all"}
                  onClick={() => set(setStatusFilter)("all")}
                  className={chip(statusFilter === "all")}
                >
                  Any status
                </button>
                {Object.entries(statusCounts).map(([s, n]) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={statusFilter === s}
                    onClick={() => set(setStatusFilter)(s)}
                    className={chip(statusFilter === s)}
                  >
                    {label(s)} <span className="opacity-70">{n}</span>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="bs-search" className="mb-1 block text-xs font-semibold text-slate-600">
                    User
                  </label>
                  <input
                    id="bs-search"
                    type="search"
                    value={search}
                    onChange={(e) => set(setSearch)(e.target.value)}
                    placeholder="Name or email"
                    className="w-full rounded-lg border-[1.5px] border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                  />
                </div>
                <div>
                  <label htmlFor="bs-resource" className="mb-1 block text-xs font-semibold text-slate-600">
                    Resource
                  </label>
                  <select
                    id="bs-resource"
                    value={resource}
                    onChange={(e) => set(setResource)(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                  >
                    <option value="all">All resources</option>
                    {resourceCounts.map(([name, n]) => (
                      <option key={name} value={name}>
                        {name} ({n})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="bs-sort" className="mb-1 block text-xs font-semibold text-slate-600">
                    Sort by date
                  </label>
                  <select
                    id="bs-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <span aria-live="polite">
                  {status.type === "success" ? `${filtered.length} of ${bookings.length} bookings` : "\u00A0"}
                </span>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-indigo-600/40"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <div className="space-y-2" aria-busy="true" aria-label="Loading bookings">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-200" />
                ))}
              </div>
            )}

            {status.type === "success" && filtered.length === 0 && (
              <div className="rounded-lg border-[1.5px] border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="font-semibold">
                  {bookings.length === 0 ? "No bookings yet." : "No bookings match these filters."}
                </p>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {status.type === "success" && filtered.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-lg border-[1.5px] border-slate-300 bg-white">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b-[1.5px] border-slate-300 bg-slate-50 text-slate-600">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">User</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Resource</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Booked for</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filtered.slice(0, visibleCount).map((b) => {
                        const s = norm(b.status);
                        return (
                          <tr key={b._id}>
                            <td className="px-4 py-3">
                              <p className="font-semibold">
                                {b.fullName || <span className="italic text-slate-400">Deleted user</span>}
                              </p>
                              {b.email && <p className="break-all text-xs text-slate-500">{b.email}</p>}
                            </td>
                            <td className="px-4 py-3">
                              {b.resourceName || <span className="italic text-slate-400">Deleted resource</span>}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {fmt(bookedFor(b))}
                              {isUpcoming(b) && (
                                <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                                  Upcoming
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(s)}`}>
                                {label(s)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {visibleCount < filtered.length && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="rounded-lg border-[1.5px] border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:border-slate-400 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-indigo-600/40"
                    >
                      Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Per-resource breakdown */}
          <aside aria-label="Bookings by resource" className="lg:sticky lg:top-8">
            <h2 className="mb-2.5 text-sm font-semibold text-slate-600">Bookings by resource</h2>
            <div className="rounded-lg border-[1.5px] border-slate-300 bg-white p-4">
              {loading && <div className="h-32 animate-pulse rounded bg-slate-100" />}
              {status.type === "success" && resourceCounts.length === 0 && (
                <p className="text-sm text-slate-500">Nothing to show yet.</p>
              )}
              {status.type === "success" && resourceCounts.length > 0 && (
                <ul className="space-y-3">
                  {resourceCounts.map(([name, n]) => {
                    const active = resource === name;
                    return (
                      <li key={name}>
                        <button
                          type="button"
                          onClick={() => set(setResource)(active ? "all" : name)}
                          aria-pressed={active}
                          className="group block w-full text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-indigo-600/40"
                        >
                          <div className="mb-1 flex justify-between gap-3 text-sm">
                            <span className={`break-words ${active ? "font-semibold text-indigo-800" : ""}`}>{name}</span>
                            <span className="shrink-0 font-semibold">{n}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className={`h-2 rounded-full ${active ? "bg-indigo-700" : "bg-indigo-400 group-hover:bg-indigo-500"}`}
                              style={{ width: `${(n / maxResource) * 100}%` }}
                            />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
