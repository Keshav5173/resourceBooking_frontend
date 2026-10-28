import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen w-full bg-[#F4F1EA] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm tracking-wide text-[#B0693F] mb-2">{eyebrow}</p>
          <h1 className="font-serif text-3xl text-[#262624] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-[#6B6759]">{subtitle}</p>
          )}
        </div>

        <div className="bg-white border border-[#E8E4DA] rounded-2xl shadow-sm px-8 py-8">
          {children}
        </div>

        {footer && (
          <p className="mt-6 text-center text-sm text-[#6B6759]">{footer}</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, required = true }) {
  return (
    <label className="block mb-5">
      <span className="block text-sm text-[#44413A] mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-[#DEDACD] bg-[#FBFAF6] px-3.5 py-2.5
                   text-[#262624] placeholder-[#A7A296]
                   focus:outline-none focus:ring-2 focus:ring-[#D97757]/40 focus:border-[#D97757]
                   transition-colors"
      />
    </label>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full rounded-lg bg-[#D97757] text-white font-medium py-2.5
                 hover:bg-[#C4643F] active:bg-[#B0552F]
                 focus:outline-none focus:ring-2 focus:ring-[#D97757]/50 focus:ring-offset-2 focus:ring-offset-white
                 transition-colors"
    >
      {children}
    </button>
  );
}





import {login, register} from "../services/auth.services.js";
import { ErrorComponent } from "../components/errorComponent.jsx";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const response = await login({ email, password });
      console.log(response);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || "Incorrect email or Username password";
      setError(message);
    }
  }

  return (
    <>
    <ErrorComponent message={error} onClose={() => setError("")} />
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/" className="text-[#D97757] hover:text-[#C4643F] font-medium">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Field
          label="Email"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email or username"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <div className="flex items-center justify-between mb-6 text-sm">
          <label className="flex items-center gap-2 text-[#6B6759]">
            <input type="checkbox" className="rounded border-[#DEDACD] text-[#D97757] focus:ring-[#D97757]/40" />
            Remember me
          </label>
          <a href="#" className="text-[#D97757] hover:text-[#C4643F]">Forgot password?</a>
        </div>

        <PrimaryButton type="submit">Log in</PrimaryButton>
      </form>

      
      
    </AuthShell>
    </>

  );
}

export function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register({ fullName, email, password });
      await login({email, password});
      console.log("signing up", { fullName, email, password });
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || "Something went wrong. Please try again.";
      setError(message);
    }
  }

  return (
    <>    
    <ErrorComponent message={error} onClose={() => setError("")} />
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-[#D97757] hover:text-[#C4643F] font-medium">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Field
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Keshav Bhardwaj"
        />
        
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="keshav@gmail.com"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />

        <p className="text-xs text-[#A7A296] mb-6 leading-relaxed">
          By creating an account, you agree to our{" "}
          <a href="#" className="underline hover:text-[#6B6759]">Terms</a> and{" "}
          <a href="#" className="underline hover:text-[#6B6759]">Privacy Policy</a>.
        </p>

        <PrimaryButton type="submit">Create account</PrimaryButton>
      </form>

      
    </AuthShell>
    </>

  );
}
