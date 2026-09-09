"use client";
import { useId, useState, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, FlaskConical, X } from "lucide-react";
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Alert({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`alert ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Empty({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="empty">
      <FlaskConical size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="button primary" href={href}>
          {cta}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Badge({
  children,
  kind = "",
}: {
  children: ReactNode;
  kind?: string;
}) {
  return <span className={`badge ${kind}`}>{children}</span>;
}
export function SaveForm({
  children,
  onSubmit,
  label = "Salvar",
  onDone,
}: {
  children: ReactNode;
  onSubmit: (form: FormData) => Promise<unknown>;
  label?: string;
  onDone?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      await onSubmit(data);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="stack">
      {children}
      {error && <Alert error>{error}</Alert>}
      <div className="form-footer">
        <button className="button primary" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={18} /> : null}
          {pending ? "Salvando…" : label}
        </button>
      </div>
    </form>
  );
}
export function Dialog({
  title,
  close,
  children,
  size = "md",
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  size?: "md" | "wide";
}) {
  const id = useId();
  return (
    <dialog
      className={`modal ${size === "wide" ? "wide" : ""}`}
      aria-labelledby={id}
      ref={(node) => {
        if (node && !node.open) node.showModal();
      }}
      onCancel={close}
      onClick={(e) => {
        // O <dialog> ocupa toda a viewport para o backdrop, entao um clique fora
        // da caixa chega aqui com coordenadas fora do proprio retangulo.
        const box = e.currentTarget.getBoundingClientRect();
        const outside =
          e.clientX < box.left ||
          e.clientX > box.right ||
          e.clientY < box.top ||
          e.clientY > box.bottom;
        if (outside) close();
      }}
    >
      <div className="modal-header">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" aria-label="Fechar" onClick={close}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export const value = (form: FormData, key: string) =>
  String(form.get(key) || "").trim();
