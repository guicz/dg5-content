import {
  Bell,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  CircleGauge,
  FileCheck2,
  LogOut,
  Menu,
  PanelLeftClose,
  PenLine,
  Settings2,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { logout } from "../lib/firebase";
import { Avatar, IconButton } from "./Shared";

const navigation = [
  ["dashboard", "Início", CircleGauge],
  ["clients", "Clientes", UsersRound],
  ["planning", "Planejamento", CalendarDays],
  ["content", "Conteúdo", PenLine],
  ["reviews", "Revisões", FileCheck2],
  ["brand", "Brand Brain", BrainCircuit],
];

export default function AppShell({ children, view, onViewChange, clients, selectedClientId, onClientChange, user, notifications }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentClient = clients.find((client) => client.id === selectedClientId);

  const goTo = (nextView) => {
    onViewChange(nextView);
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="sidebar__brand">
          <span className="dg5-mark">DG5</span>
          <div><strong>Content Intelligence</strong><small>Operação interna</small></div>
          <IconButton label="Fechar menu" onClick={() => setMobileOpen(false)}><X size={18} /></IconButton>
        </div>

        <nav className="sidebar__nav" aria-label="Módulos do sistema">
          <p className="nav-label">Workspace</p>
          {navigation.map(([id, label, Icon]) => (
            <button key={id} className={view === id ? "is-active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => goTo(id)}>
              <Icon size={18} /><span>{label}</span>
              {id === "reviews" && notifications.length ? <b>{notifications.length}</b> : null}
            </button>
          ))}
          <p className="nav-label nav-label--spaced">Sistema</p>
          <button className={view === "admin" ? "is-active" : ""} aria-current={view === "admin" ? "page" : undefined} onClick={() => goTo("admin")}>
            <Settings2 size={18} /><span>Administração</span>
          </button>
        </nav>

        <div className="sidebar__user">
          <Avatar name={user.displayName || user.email} src={user.photoURL} />
          <div><strong>{user.displayName || "Patricia DG5"}</strong><small>{user.email}</small></div>
          <IconButton label="Sair" onClick={logout}><LogOut size={17} /></IconButton>
        </div>
      </aside>

      {mobileOpen ? <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} /> : null}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar__left">
            <IconButton label="Abrir menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></IconButton>
            <PanelLeftClose size={18} className="desktop-only muted-icon" />
            <div className="client-switcher">
              <span className="client-dot">{currentClient?.name?.[0] || "D"}</span>
              <select value={selectedClientId} onChange={(event) => onClientChange(event.target.value)} aria-label="Cliente atual">
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </div>
          </div>
          <div className="topbar__right">
            <span className="sync-state"><i /> Firebase conectado</span>
            <IconButton label={`${notifications.length} notificações`}><Bell size={18} />{notifications.length ? <b>{notifications.length}</b> : null}</IconButton>
          </div>
        </header>
        <main className="workspace__main">{children}</main>
      </div>
    </div>
  );
}
