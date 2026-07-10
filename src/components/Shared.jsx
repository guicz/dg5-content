import { AlertCircle, Check, ChevronRight, LoaderCircle, Search, X } from "lucide-react";
import { statusTone } from "../lib/domain";

export function Button({ children, icon: Icon, variant = "primary", busy, ...props }) {
  return (
    <button className={`button button--${variant}`} disabled={busy || props.disabled} {...props}>
      {busy ? <LoaderCircle className="spin" size={16} /> : Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({ label, children, ...props }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, tone, status }) {
  return <span className={`badge badge--${tone || statusTone(status || children)}`}>{children}</span>;
}

export function Avatar({ name, src }) {
  if (src) return <img className="avatar" src={src} alt="" />;
  const value = String(name || "DG")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return <span className="avatar avatar--fallback">{value}</span>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({ icon: Icon = AlertCircle, title, description, action }) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state__icon"><Icon size={20} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Field({ label, hint, className = "", children }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function SearchField({ value, onChange, placeholder = "Buscar" }) {
  return (
    <label className="search-field">
      <Search size={16} aria-hidden="true" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="search" />
      {value ? (
        <button type="button" onClick={() => onChange("")} aria-label="Limpar busca"><X size={14} /></button>
      ) : null}
    </label>
  );
}

export function Step({ done, active, label }) {
  return (
    <div className={`step ${done ? "is-done" : ""} ${active ? "is-active" : ""}`}>
      <span>{done ? <Check size={13} /> : <ChevronRight size={13} />}</span>
      <small>{label}</small>
    </div>
  );
}
