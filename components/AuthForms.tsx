"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { forgot, join, resetPassword, signIn, type FormState } from "@/app/actions";

function Password({ label, value, onChange, invalid, describedBy, autoComplete, hint }: {
  label: string; value: string; onChange: (v: string) => void; invalid: boolean; describedBy?: string; autoComplete: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw">
        <input id={id} className="input" name="password" type={show ? "text" : "password"} autoComplete={autoComplete} required value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} aria-describedby={describedBy} spellCheck={false} />
        <button type="button" className="pw-toggle" onClick={() => setShow((x) => !x)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

const Err = ({ id, s, f }: { id: string; s: FormState; f: "email" | "password" | "name" }) =>
  s?.error && s.field === f ? (
    <p className="err" id={id} role="alert">
      {s.error}
    </p>
  ) : null;

/** Free account: email and password (a name if they like). Errors sit under the field they belong to, and nothing typed is lost. */
export function JoinForm({ vault, next, min, whop = false }: { vault?: string; next?: string; min: number; whop?: boolean }) {
  const [state, action, pending] = useActionState(join, undefined);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const ids = { e: useId(), p: useId(), n: useId() };
  const essentials = vault === "essentials";
  return (
    <form action={action} className="auth-form" noValidate>
      <div className="stack-s">
        <h1 className="d2">{essentials ? "First, your free account." : "Create your free account."}</h1>
        <p className="body">{essentials ? "Then one checkout on Whop opens the Essentials Vault. Your Free Vault opens either way." : "The Free Vault opens the moment you are in. No card."}</p>
      </div>
      {whop && (
        <>
          <a className="btn btn-ink btn-wide" href={`/api/auth/whop?next=${encodeURIComponent(essentials ? "/members/unlock" : next || "/members")}`}>
            Continue with Whop
          </a>
          <p className="or">or with your email</p>
        </>
      )}
      <input type="hidden" name="vault" value={vault ?? ""} />
      <input type="hidden" name="next" value={next ?? ""} />
      {state?.error && !state.field && <p className="form-err" role="alert">{state.error}</p>}
      <div className="field">
        <label htmlFor="join-email">Email</label>
        <input id="join-email" className="input" name="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={state?.field === "email"} aria-describedby={state?.field === "email" ? ids.e : undefined} />
        <Err id={ids.e} s={state} f="email" />
      </div>
      <Password label="Password" value={pw} onChange={setPw} invalid={state?.field === "password"} describedBy={state?.field === "password" ? ids.p : undefined} autoComplete="new-password" hint={`At least ${min} characters.`} />
      <Err id={ids.p} s={state} f="password" />
      <div className="field">
        <label htmlFor="join-name">
          First name <span className="opt">optional</span>
        </label>
        <input id="join-name" className="input" name="name" type="text" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <button className="btn btn-wide" type="submit" disabled={pending}>
        {pending ? "Creating your account…" : essentials ? "Create account and continue" : "Create free account"}
      </button>
      <p className="small">
        Already a member?{" "}
        <Link className="lnk" href={`/signin${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
          Sign in
        </Link>
        . By joining you agree to the{" "}
        <Link className="lnk" href="/terms">
          Terms
        </Link>
        .
      </p>
    </form>
  );
}

export function SignInForm({ next, whop }: { next?: string; whop: boolean }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const ids = { e: useId(), p: useId() };
  return (
    <form action={action} className="auth-form" noValidate>
      <div className="stack-s">
        <h1 className="d2">Welcome back.</h1>
        <p className="body">Sign in to open your vault.</p>
      </div>
      {whop && (
        <>
          <a className="btn btn-ink btn-wide" href={`/api/auth/whop${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
            Continue with Whop
          </a>
          <p className="or">or with your email</p>
        </>
      )}
      <input type="hidden" name="next" value={next ?? ""} />
      {state?.error && !state.field && <p className="form-err" role="alert">{state.error}</p>}
      <div className="field">
        <label htmlFor="in-email">Email</label>
        <input id="in-email" className="input" name="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={state?.field === "email"} aria-describedby={state?.field === "email" ? ids.e : undefined} />
        <Err id={ids.e} s={state} f="email" />
      </div>
      <Password label="Password" value={pw} onChange={setPw} invalid={state?.field === "password"} describedBy={state?.field === "password" ? ids.p : undefined} autoComplete="current-password" />
      <Err id={ids.p} s={state} f="password" />
      <button className="btn btn-wide" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="small">
        New here?{" "}
        <Link className="lnk" href={`/join${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
          Create a free account
        </Link>
        .{" "}
        <Link className="lnk" href="/forgot">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

/** Ask for a reset link. After sending it shows the same calm note whether or not the email has an account. */
export function ForgotForm() {
  const [state, action, pending] = useActionState(forgot, undefined);
  const [email, setEmail] = useState("");
  const eid = useId();
  if (state?.sent)
    return (
      <div className="auth-form">
        <div className="stack-s">
          <h1 className="d2">Check your email.</h1>
          <p className="body">
            If <strong>{state.email}</strong> has a DS Universe account, a link to choose a new password is on its way. It works once, for 30 minutes.
          </p>
        </div>
        <p className="small">Nothing after a few minutes? Look in spam, check the address for a typo, or write to <a className="lnk" href="mailto:support@dsuniverse.net">support@dsuniverse.net</a>.</p>
        <p className="small">
          <Link className="lnk" href="/signin">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  return (
    <form action={action} className="auth-form" noValidate>
      <div className="stack-s">
        <h1 className="d2">Forgot your password?</h1>
        <p className="body">Enter the email you joined with and we will send you a link to choose a new one.</p>
      </div>
      <div className="field">
        <label htmlFor="fg-email">Email</label>
        <input id="fg-email" className="input" name="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!state?.error} aria-describedby={state?.error ? eid : undefined} />
        {state?.error && (
          <p className="err" id={eid} role="alert">
            {state.error}
          </p>
        )}
      </div>
      <button className="btn btn-wide" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send the link"}
      </button>
      <p className="small">
        Remembered it?{" "}
        <Link className="lnk" href="/signin">
          Sign in
        </Link>
        . Joined with Whop? Use Continue with Whop on the sign-in page, no password needed.
      </p>
    </form>
  );
}

/** Choose a new password from the emailed link. */
export function ResetForm({ token, email, min }: { token: string; email: string; min: number }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  const [pw, setPw] = useState("");
  const pid = useId();
  if (state?.expired)
    return (
      <div className="auth-form">
        <p className="form-err" role="alert">
          {state.error}
        </p>
        <Link className="btn btn-wide" href="/forgot">
          Send a new link
        </Link>
      </div>
    );
  return (
    <form action={action} className="auth-form" noValidate>
      <div className="stack-s">
        <h1 className="d2">Choose a new password.</h1>
        <p className="body">
          For <strong>{email}</strong>. You will be signed in as soon as it is saved.
        </p>
      </div>
      <input type="hidden" name="token" value={token} />
      <input type="email" name="email" value={email} autoComplete="username" readOnly hidden />
      <Password label="New password" value={pw} onChange={setPw} invalid={!!state?.error} describedBy={state?.error ? pid : undefined} autoComplete="new-password" hint={`At least ${min} characters.`} />
      {state?.error && (
        <p className="err" id={pid} role="alert">
          {state.error}
        </p>
      )}
      <button className="btn btn-wide" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save and sign in"}
      </button>
    </form>
  );
}
