import { useCallback, useEffect, useMemo, useState } from "react";
import { getBookingHistory } from "../services/booking.service.js"; 

const FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const isUpcoming = (booking) => {
  const d = new Date(booking.date);
  return !Number.isNaN(d.getTime()) && d >= startOfToday();
};

const formatDate = (value, fmt) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : fmt.format(d);
};

function SkeletonRow() {
  return (
    <li className="animate-pulse rounded-lg border-[1.5px] border-slate-200 bg-white p-5">
      <div className="mb-3 h-5 w-1/3 rounded bg-slate-200" />
      <div className="mb-2 h-4 w-3/4 rounded bg-slate-100" />
      <div className="h-4 w-1/2 rounded bg-slate-100" />
    </li>
  );
}

function BookingItem({ booking }) {
  const upcoming = isUpcoming(booking);
  const resource = booking.resourceId; // populated: { _id, name, detail } or null if deleted

  return (
    <li
      className={`rounded-lg border-[1.5px] border-l-[5px] border-slate-300 bg-white p-5 ${
        upcoming ? "border-l-indigo-600" : "border-l-slate-300"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="break-words text-lg font-semibold leading-snug">
          {resource?.name || <span className="italic text-slate-400">Resource no longer available</span>}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            upcoming ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-700"
          }`}
        >
          {upcoming ? "Upcoming" : "Past"}
        </span>
      </div>

      {resource?.detail && (
        <p className="mt-2 line-clamp-2 break-words text-[15px] leading-relaxed text-slate-600">{resource.detail}</p>
      )}

      <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Booked for</dt>
          <dd className="font-semibold">{formatDate(booking.date, dateFmt)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Booked on</dt>
          <dd className="font-semibold">{formatDate(booking.createdAt, timeFmt)}</dd>
        </div>
      </dl>
    </li>
  );
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState({ type: "loading", message: "" });
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setStatus({ type: "loading", message: "" });
    try {
      const data = await getBookingHistory();
      setBookings(Array.isArray(data) ? data : []);
      setStatus({ type: "success", message: "" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const upcoming = bookings.filter(isUpcoming).length;
    return { all: bookings.length, upcoming, past: bookings.length - upcoming };
  }, [bookings]);

  const visible = useMemo(() => {
    if (filter === "upcoming") return bookings.filter(isUpcoming);
    if (filter === "past") return bookings.filter((b) => !isUpcoming(b));
    return bookings;
  }, [bookings, filter]);

  const loading = status.type === "loading";

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-12 font-sans text-slate-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Booking history</h1>
        <p className="mb-6 text-[15px] leading-relaxed text-slate-600">
          Every resource you have booked, newest first.
        </p>

        <div role="tablist" aria-label="Filter bookings" className="mb-5 flex gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                disabled={loading}
                className={`rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-indigo-600/40 disabled:opacity-60 ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "border-[1.5px] border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {f.label}
                {status.type === "success" && <span className="ml-1.5 opacity-80">{counts[f.id]}</span>}
              </button>
            );
          })}
        </div>

        {status.type === "error" && (
          <div role="alert" className="rounded-lg bg-red-100 p-4 text-sm text-red-800">
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

        {loading && (
          <ul className="space-y-4" aria-busy="true" aria-label="Loading bookings">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </ul>
        )}

        {status.type === "success" && visible.length === 0 && (
          <div className="rounded-lg border-[1.5px] border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold">
              {bookings.length === 0
                ? "You have not booked anything yet."
                : `No ${filter} bookings.`}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {bookings.length === 0
                ? "Book a resource and it will show up here."
                : "Switch the filter to see your other bookings."}
            </p>
          </div>
        )}

        {status.type === "success" && visible.length > 0 && (
          <ul className="space-y-4">
            {visible.map((b) => (
              <BookingItem key={b._id} booking={b} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
