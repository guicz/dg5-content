import { onAuthStateChanged } from "firebase/auth";
import { Database, LoaderCircle, X } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import AppShell from "./components/AppShell";
import { Button } from "./components/Shared";
import { bootstrapDemoWorkspace, ensureProfile, subscribeWorkspace, workspaceCollections } from "./lib/data";
import { auth } from "./lib/firebase";
import AuthView from "./views/AuthView";

const AdminView = lazy(() => import("./views/AdminView"));
const BrandBrainView = lazy(() => import("./views/BrandBrainView"));
const ClientsView = lazy(() => import("./views/ClientsView"));
const ContentStudioView = lazy(() => import("./views/ContentStudioView"));
const DashboardView = lazy(() => import("./views/DashboardView"));
const PlanningView = lazy(() => import("./views/PlanningView"));
const ReviewsView = lazy(() => import("./views/ReviewsView"));

const emptyData = Object.fromEntries(workspaceCollections.map((name) => [name, []]));
const validViews = new Set(["dashboard", "clients", "planning", "content", "reviews", "brand", "admin"]);

function initialView() {
  const value = window.location.hash.slice(1);
  return validViews.has(value) ? value : "dashboard";
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [data, setData] = useState(emptyData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState(initialView);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [toast, setToast] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setReady(false);
      return undefined;
    }

    let unsubscribe = () => {};
    ensureProfile(user)
      .then(() => {
        unsubscribe = subscribeWorkspace(
          (nextData, isReady) => {
            setData(nextData);
            setReady(isReady);
            setError("");
          },
          (snapshotError) => setError(snapshotError.message),
        );
      })
      .catch((profileError) => setError(profileError.message));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedClientId && data.clients[0]) setSelectedClientId(data.clients[0].id);
    if (selectedClientId && data.clients.length && !data.clients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(data.clients[0].id);
    }
  }, [data.clients, selectedClientId]);

  useEffect(() => {
    const syncHash = () => setView(initialView());
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const client = useMemo(() => data.clients.find((item) => item.id === selectedClientId) || data.clients[0], [data.clients, selectedClientId]);
  const notifications = data.notifications.filter((item) => item.status !== "read");

  const navigate = (nextView) => {
    setView(nextView);
    window.history.replaceState(null, "", `#${nextView}`);
  };

  const notify = (message, tone = "success") => setToast({ message, tone });

  const bootstrap = async () => {
    setBootstrapping(true);
    try {
      await bootstrapDemoWorkspace();
      notify("Workspace inicial criado.");
    } catch (bootstrapError) {
      notify(bootstrapError.message, "error");
    } finally {
      setBootstrapping(false);
    }
  };

  if (user === undefined) return <LoadingScreen label="Preparando o workspace" />;
  if (!user) return <AuthView />;
  if (error) return <ErrorScreen message={error} />;
  if (!ready) return <LoadingScreen label="Conectando ao Firebase" />;
  if (!data.clients.length) return <EmptyWorkspace user={user} onBootstrap={bootstrap} busy={bootstrapping} />;

  const commonProps = { data, client, notify };
  const content = {
    dashboard: <DashboardView {...commonProps} onNavigate={navigate} />,
    clients: <ClientsView {...commonProps} onClientChange={setSelectedClientId} />,
    planning: <PlanningView {...commonProps} />,
    content: <ContentStudioView {...commonProps} />,
    reviews: <ReviewsView {...commonProps} />,
    brand: <BrandBrainView {...commonProps} />,
    admin: <AdminView notify={notify} />,
  }[view];

  return (
    <>
      <AppShell
        view={view}
        onViewChange={navigate}
        clients={data.clients}
        selectedClientId={client.id}
        onClientChange={setSelectedClientId}
        user={user}
        notifications={notifications}
      >
        <Suspense fallback={<div className="module-loading"><LoaderCircle className="spin" size={20} /><span>Carregando módulo</span></div>}>
          {content}
        </Suspense>
      </AppShell>
      {toast ? <div className={`toast toast--${toast.tone}`} role="status"><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Fechar aviso"><X size={16} /></button></div> : null}
    </>
  );
}

function LoadingScreen({ label }) {
  return <main className="state-screen"><span className="dg5-mark">DG5</span><LoaderCircle className="spin" size={24} /><p>{label}</p></main>;
}

function ErrorScreen({ message }) {
  return <main className="state-screen state-screen--error"><span className="dg5-mark">DG5</span><h1>Não foi possível conectar</h1><p>{message}</p><small>Confirme se os emuladores ou o projeto Firebase estão disponíveis.</small></main>;
}

function EmptyWorkspace({ user, onBootstrap, busy }) {
  return (
    <main className="empty-workspace">
      <span className="dg5-mark dg5-mark--large">DG5</span>
      <span className="empty-workspace__icon"><Database size={24} /></span>
      <h1>Seu workspace está pronto para começar.</h1>
      <p>Crie a estrutura inicial para validar os fluxos com a conta {user.email}.</p>
      <Button onClick={onBootstrap} busy={busy}>Criar dados iniciais</Button>
    </main>
  );
}
