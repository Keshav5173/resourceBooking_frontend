
import { useCallback, useEffect, useState } from "react";
import { getResources, createBooking } from "../services/booking.service.js";
import api, { logout } from "../services/auth.services.js";
import BookingCalendar from "./BookingCalender.jsx";
import { ErrorComponent } from "../components/errorComponent.jsx";
import profileLogo from "../assets/profileLogo.png";
import resourceHubLogo from "../assets/resourceHubLogo.png";
import { useNavigate } from "react-router-dom";

const pad = (n) => String(n).padStart(2, "0");

function isBookedToday(resource) {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${pad(
    now.getMonth() + 1
  )}-${pad(now.getDate())}`;

  return resource.bookedDates?.some(
    (b) => new Date(b.date).toISOString().slice(0, 10) === todayKey
  );
}

function ResourceSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-stone-200 bg-white p-5">
      <div className="h-12 w-12 rounded-xl bg-stone-200" />
      <div className="mt-5 h-4 w-2/3 rounded bg-stone-200" />
      <div className="mt-3 h-3 w-full rounded bg-stone-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-stone-200" />
      <div className="mt-6 h-10 w-full rounded-lg bg-stone-200" />
    </div>
  );
}

export default function Dashboard() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [activeResource, setActiveResource] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [user, setUser] = useState(null);
  const [profileClicked, setProfileClicked] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const navigate = useNavigate();
  const clearError = useCallback(() => setError(""), []);

  const loadResources = useCallback(async () => {
    setLoading(true);

    try {
      setResources(await getResources());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      try {
        const response = await api.get("/user/profile");
        if (active) setUser(response.data.data);
      } catch (err) {
        console.error("Failed to load profile", err);
        if (active) setProfileError("Could not load profile.");
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!menuOpen && !profileClicked) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setProfileClicked(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, profileClicked]);

  const handleConfirm = async (isoDate) => {
    setSubmitting(true);

    try {
      await createBooking({
        resourceId: activeResource._id,
        date: isoDate,
      });

      setNotice(`${activeResource.name} booked successfully.`);
      setActiveResource(null);
      await loadResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user?.role === "admin";
  const menuItems = [
    { label: "Booking History", path: "/previousbooking", adminOnly: false },
    { label: "Create Resource", path: "/createresource", adminOnly: true },
    { label: "Booking Stats", path: "/bookingstats", adminOnly: true },
    ].filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {/* Hamburger menu */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="relative z-[60] flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <span className="relative block h-5 w-6">
                <span
                  className={`absolute left-0 top-1/2 h-0.5 w-6 rounded-full bg-stone-800 transition-transform duration-300 ${
                    menuOpen ? "rotate-45" : "-translate-y-2"
                  }`}
                />
                <span
                  className={`absolute left-0 top-1/2 h-0.5 w-6 rounded-full bg-stone-800 transition-opacity duration-200 ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 top-1/2 h-0.5 w-6 rounded-full bg-stone-800 transition-transform duration-300 ${
                    menuOpen ? "-rotate-45" : "translate-y-2"
                  }`}
                />
              </span>
            </button>

            {/* Resource Hub logo */}
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="Go to dashboard"
              className="min-w-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <img
                src={resourceHubLogo}
                alt="Resource Hub"
                className="block w-36 max-w-full object-contain sm:w-44 md:w-52"
              />
            </button>
          </div>

          {/* Profile button */}
          <button
            type="button"
            onClick={() => setProfileClicked(true)}
            aria-label="Open profile"
            aria-expanded={profileClicked}
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-50 transition hover:border-teal-600 hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <img
              src={profileLogo}
              alt=""
              className="h-8 w-8 object-contain"
            />
          </button>
        </div>
      </header>

      {/* Sidebar backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          menuOpen
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        aria-label="Main navigation"
        aria-hidden={!menuOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-stone-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-stone-200 px-5">
          <span className="text-lg font-bold text-stone-900">
            Navigation
          </span>

          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
            tabIndex={menuOpen ? 0 : -1}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            &times;
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-4">
          {menuItems.map(({ label, path }, index) => (
            <button
                key={path}
                type="button"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => {
                setMenuOpen(false);
                navigate(path);
                }}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-stone-700 transition hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold text-stone-600">
                {index + 1}
                </span>
                {label}
            </button>
            ))}
        </nav>

        <div className="border-t border-stone-200 p-4">
          <p className="text-xs text-stone-500">
            Resource Hub
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Manage your bookings
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-teal-700">
              Workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Resources
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500 sm:text-base">
              Find a resource, check its availability, and book a date that
              works for you.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-teal-600" />
            {resources.length} {resources.length === 1 ? "resource" : "resources"}
          </div>
        </section>

        {loading && resources.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <ResourceSkeleton key={i} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-700">
              +
            </div>

            <h2 className="mt-5 text-lg font-semibold text-stone-900">
              No resources yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
              There are no resources to display. You can create one from the
              navigation menu.
            </p>

            <button
              type="button"
              onClick={loadResources}
              className="mt-6 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              Reload resources
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => {
              const busy = isBookedToday(resource);

              return (
                <article
                  key={resource._id}
                  className="group flex min-h-60 flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-xl font-bold text-teal-800 transition group-hover:bg-teal-100">
                      {resource.name?.[0]?.toUpperCase() || "R"}
                    </div>

                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        busy
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          busy ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                      {busy ? "Booked today" : "Free today"}
                    </span>
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-stone-900">
                    {resource.name}
                  </h2>

                  <p className="mt-2 flex-1 text-sm leading-6 text-stone-500">
                    {resource.detail || "No description available."}
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveResource(resource)}
                    className="mt-6 w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                  >
                    Book resource
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {loading && resources.length > 0 && (
          <p className="mt-5 text-center text-sm text-stone-500">
            Refreshing resources...
          </p>
        )}
      </main>

      {/* Booking calendar */}
      {activeResource && (
        <BookingCalendar
          resource={activeResource}
          onConfirm={handleConfirm}
          onClose={() => setActiveResource(null)}
          submitting={submitting}
        />
      )}

      {/* Success notification */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[70] w-max max-w-[90vw] -translate-x-1/2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-medium text-white shadow-xl"
        >
          {notice}
        </div>
      )}

      {/* Profile modal */}
      {profileClicked && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setProfileClicked(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Profile"
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-md flex-col items-center gap-5 rounded-3xl bg-white px-6 py-10 text-stone-900 shadow-2xl sm:px-10"
          >
            <button
              type="button"
              onClick={() => setProfileClicked(false)}
              aria-label="Close profile"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-2xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              &times;
            </button>

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
              <img
                src={profileLogo}
                alt=""
                className="h-14 w-14 object-contain"
              />
            </div>

            <h2 className="text-xl font-bold">Your Profile</h2>

            {profileLoading && (
              <p className="text-sm text-stone-500">Loading profile...</p>
            )}

            {!profileLoading && profileError && (
              <p className="text-sm text-red-600">{profileError}</p>
            )}

            {!profileLoading && !profileError && user && (
              <div className="w-full space-y-4">
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Full Name
                  </p>
                  <p className="mt-1 break-words font-semibold">
                    {user.fullName}
                  </p>
                </div>

                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Role
                  </p>
                  <p className="mt-1 font-semibold">{user.role}</p>
                </div>

                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Email
                  </p>
                  <p className="mt-1 break-all font-semibold">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => logout()}
              className="mt-2 w-full rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
            >
              Log out
            </button>
          </div>
        </div>
      )}

      <ErrorComponent message={error} onClose={clearError} />
    </div>
  );
}
