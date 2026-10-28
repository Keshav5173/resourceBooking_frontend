import { useState } from "react";
import { createResource } from "../services/booking.service"; 
import { useNavigate } from "react-router-dom";

const MAX_DETAIL = 200;

const inputBase =
  "w-full rounded-lg border-[1.5px] bg-white px-3.5 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4 disabled:opacity-60";
const inputOk = "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20";
const inputBad = "border-red-600 focus:border-red-600 focus:ring-red-600/20";

export default function CreateResource() {
  const [form, setForm] = useState({ name: "", detail: "" });
  const [touched, setTouched] = useState({ name: false, detail: false });
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const name = form.name.trim();
  const detail = form.detail.trim();
  const errors = {
    name: !name ? "Enter a name for the resource." : "",
    detail: !detail ? "Add some details about the resource." : "",
  };
  const submitting = status.type === "loading";

  const navigate = useNavigate();

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (status.type === "success" || status.type === "error") setStatus({ type: "idle", message: "" });
  };

  const handleSubmit = async () => {
    setTouched({ name: true, detail: true });
    if (errors.name || errors.detail) return;

    setStatus({ type: "loading", message: "" });
    try {
      const data = await createResource({ name, detail });

      setStatus({ type: "success", message: data.message || "Resource created." });
      setForm({ name: "", detail: "" });
      setTouched({ name: false, detail: false });
      navigate("/dashboard");
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  const reset = () => {
    setForm({ name: "", detail: "" });
    setTouched({ name: false, detail: false });
    setStatus({ type: "idle", message: "" });
  };

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-12 font-sans text-slate-900">
      <div className="mx-auto grid max-w-4xl items-start gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-10">
        <section>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Create resource</h1>
          <p className="mb-7 max-w-[46ch] text-[15px] leading-relaxed text-slate-600">
            Give the resource a name and describe what it is. You can see how it will look on the right.
          </p>

          {status.type === "success" && (
            <div role="status" className="mb-5 rounded-lg bg-green-100 px-3.5 py-3 text-sm text-green-800">
              {status.message}
            </div>
          )}
          {status.type === "error" && (
            <div role="alert" className="mb-5 rounded-lg bg-red-100 px-3.5 py-3 text-sm text-red-800">
              {status.message}
            </div>
          )}

          <div className="mb-5">
            <label htmlFor="cr-name" className="mb-1.5 block text-sm font-semibold">
              Name
            </label>
            <input
              id="cr-name"
              type="text"
              value={form.name}
              onChange={update("name")}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              aria-invalid={touched.name && !!errors.name}
              aria-describedby="cr-name-msg"
              placeholder="e.g. Onboarding checklist"
              disabled={submitting}
              className={`${inputBase} ${touched.name && errors.name ? inputBad : inputOk}`}
            />
            <p id="cr-name-msg" className="mt-1.5 min-h-[18px] text-[13px] text-red-700">
              {touched.name ? errors.name : ""}
            </p>
          </div>

          <div className="mb-5">
            <label htmlFor="cr-detail" className="mb-1.5 block text-sm font-semibold">
              Details
            </label>
            <textarea
              id="cr-detail"
              value={form.detail}
              onChange={update("detail")}
              onBlur={() => setTouched((t) => ({ ...t, detail: true }))}
              maxLength={MAX_DETAIL}
              aria-invalid={touched.detail && !!errors.detail}
              aria-describedby="cr-detail-msg"
              placeholder="What is this resource and who is it for?"
              disabled={submitting}
              className={`${inputBase} min-h-[150px] resize-y leading-normal ${
                touched.detail && errors.detail ? inputBad : inputOk
              }`}
            />
            <div id="cr-detail-msg" className="mt-1.5 flex min-h-[18px] justify-between gap-3 text-[13px]">
              <span className="text-red-700">{touched.detail ? errors.detail : ""}</span>
              <span className="text-slate-500">
                {form.detail.length}/{MAX_DETAIL}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-indigo-600/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create resource"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={submitting}
              className="rounded-lg px-2 py-3 text-[15px] font-semibold text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-indigo-600/40 disabled:opacity-60"
            >
              Clear form
            </button>
          </div>
        </section>

        <aside aria-label="Preview" className="md:sticky md:top-8">
          <h2 className="mb-2.5 text-sm font-semibold text-slate-600">Preview</h2>
          <div className="rounded-lg border-[1.5px] border-l-[5px] border-slate-300 border-l-indigo-600 bg-white p-5">
            <h3 className={`mb-2.5 break-words text-xl font-semibold leading-snug ${name ? "" : "italic text-slate-400"}`}>
              {name || "Resource name"}
            </h3>
            <p
              className={`whitespace-pre-wrap break-words text-[15px] leading-relaxed ${
                detail ? "" : "italic text-slate-400"
              }`}
            >
              {form.detail || "Details will appear here as you type."}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
