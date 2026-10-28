import { useMemo, useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n) => String(n).padStart(2, "0");

// "YYYY-MM-DD" key for a calendar cell (no timezone shifting)
const toKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

export default function BookingCalendar({
  resource,
  onConfirm,
  onClose,
  submitting = false,
  error = "",
}) {
  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selected, setSelected] = useState(null); // "YYYY-MM-DD"

  // Backend sends UTC midnight, so the first 10 chars of the ISO string are the booked day.
  const booked = useMemo(() => {
    const map = new Map();
    resource.bookedDates?.forEach((b) =>
      map.set(new Date(b.date).toISOString().slice(0, 10), b.status)
    );
    return map;
  }, [resource]);

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const monthLabel = new Date(view.year, view.month).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isCurrentMonth =
    view.year === today.getFullYear() && view.month === today.getMonth();

  const changeMonth = (delta) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(`${selected}T00:00:00.000Z`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Book ${resource.name}`}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Book {resource.name}
            </h2>
            <p className="text-sm text-stone-500">Pick an available date</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-stone-400 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => changeMonth(-1)}
            disabled={isCurrentMonth}
            className="rounded px-2 py-1 text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-stone-900">{monthLabel}</span>
          <button
            onClick={() => changeMonth(1)}
            className="rounded px-2 py-1 text-stone-700 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-xs text-stone-400">
              {d}
            </div>
          ))}

          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;

            const key = toKey(view.year, view.month, day);
            const status = booked.get(key);
            const isPast = key < todayKey;
            const isBooked = status !== undefined;
            const disabled = isPast || isBooked;
            const isSelected = selected === key;

            let style = "text-stone-800 hover:bg-teal-50";
            if (isSelected) style = "bg-teal-700 text-white";
            else if (isBooked)
              style = "bg-stone-100 text-stone-400 line-through cursor-not-allowed";
            else if (isPast) style = "text-stone-300 cursor-not-allowed";

            return (
              <button
                key={key}
                disabled={disabled}
                onClick={() => setSelected(key)}
                title={isBooked ? `Booked (${status})` : undefined}
                aria-pressed={isSelected}
                className={`aspect-square rounded-md text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${style} ${
                  key === todayKey && !isSelected ? "ring-1 ring-stone-300" : ""
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-teal-700" /> Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-stone-200" /> Booked
          </span>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            {selected
              ? new Date(`${selected}T00:00:00Z`).toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })
              : "No date selected"}
          </p>
          <button
            onClick={handleConfirm}
            disabled={!selected || submitting}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
