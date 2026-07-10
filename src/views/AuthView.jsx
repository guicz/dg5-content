import { ArrowRight, Database, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { isLocalFirebase, loginLocalDemo, loginWithGoogle } from "../lib/firebase";
import { Button } from "../components/Shared";

export default function AuthView() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setBusy(true);
    setError("");
    try {
      await (isLocalFirebase ? loginLocalDemo() : loginWithGoogle());
    } catch (loginError) {
      setError(loginError.message || "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <span className="dg5-mark dg5-mark--large">DG5</span>
        <div>
          <p className="eyebrow">Content Intelligence</p>
          <h1>Conteúdo consistente começa com contexto.</h1>
          <p>O workspace interno para transformar conhecimento de cliente em planejamento, conteúdo e revisão.</p>
        </div>
        <div className="auth-points">
          <span><Database size={17} /> Histórico organizado por cliente</span>
          <span><Sparkles size={17} /> IA orientada pelo Brand Brain</span>
          <span><LockKeyhole size={17} /> Aprovação humana antes do envio</span>
        </div>
      </section>

      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-card__heading">
          <span className="auth-card__icon"><LockKeyhole size={20} /></span>
          <div><p className="eyebrow">Acesso restrito</p><h2 id="login-title">Entrar no workspace</h2></div>
        </div>
        <p>Use sua conta corporativa DG5 para continuar.</p>
        <Button onClick={login} busy={busy} icon={ArrowRight}>
          {isLocalFirebase ? "Entrar no ambiente local" : "Continuar com Google"}
        </Button>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <small>{isLocalFirebase ? "Conectado aos emuladores Firebase desta máquina." : "Somente contas @dg5.com.br."}</small>
      </section>
    </main>
  );
}
