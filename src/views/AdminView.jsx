import { Bot, KeyRound, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Badge, Button, Field, PageHeader } from "../components/Shared";
import { db } from "../lib/firebase";
import { saveRecord } from "../lib/data";

const defaults = {
  textGenerationProvider: "openai",
  textGenerationModel: "gpt-4.1-mini",
  reviewProvider: "anthropic",
  reviewModel: "claude-sonnet-4-5",
  visionProvider: "gemini",
  visionModel: "gemini-2.5-flash",
  routingMode: "adaptive",
};

export default function AdminView({ notify }) {
  const [config, setConfig] = useState(defaults);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "aiGateway", "default")).then((snapshot) => {
      if (snapshot.exists()) setConfig((current) => ({ ...current, ...snapshot.data() }));
    }).catch(() => {});
  }, []);

  const update = (field, value) => setConfig((current) => ({ ...current, [field]: value }));
  const save = async () => {
    setBusy(true);
    try {
      await saveRecord("aiGateway", "default", config);
      notify("Configuração do AI Gateway salva.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Área técnica" title="Administração" description="Configurações internas do orquestrador e da infraestrutura. Esta área não aparece no fluxo do operador." actions={<Button icon={Save} busy={busy} onClick={save}>Salvar configuração</Button>} />
      <div className="admin-grid">
        <section className="surface gateway-panel">
          <header className="surface__header"><div className="heading-with-icon"><span><Bot size={20} /></span><div><p className="eyebrow">AI Gateway</p><h2>Roteamento por tarefa</h2></div></div><Badge tone="success">Ativo</Badge></header>
          <div className="gateway-row"><div><strong>Geração textual</strong><small>Legendas, roteiros, pautas e variações</small></div><Field label="Provedor"><select value={config.textGenerationProvider} onChange={(event) => update("textGenerationProvider", event.target.value)}><option value="openai">OpenAI</option><option value="anthropic">Claude</option><option value="gemini">Gemini</option></select></Field><Field label="Modelo"><input value={config.textGenerationModel} onChange={(event) => update("textGenerationModel", event.target.value)} /></Field></div>
          <div className="gateway-row"><div><strong>Revisão de conteúdo</strong><small>Aderência, clareza e restrições do Brand Brain</small></div><Field label="Provedor"><select value={config.reviewProvider} onChange={(event) => update("reviewProvider", event.target.value)}><option value="openai">OpenAI</option><option value="anthropic">Claude</option><option value="gemini">Gemini</option></select></Field><Field label="Modelo"><input value={config.reviewModel} onChange={(event) => update("reviewModel", event.target.value)} /></Field></div>
          <div className="gateway-row"><div><strong>Direção de arte</strong><small>Análise visual do criativo e do conjunto final</small></div><Field label="Provedor"><select value={config.visionProvider} onChange={(event) => update("visionProvider", event.target.value)}><option value="openai">OpenAI</option><option value="anthropic">Claude</option><option value="gemini">Gemini</option></select></Field><Field label="Modelo"><input value={config.visionModel} onChange={(event) => update("visionModel", event.target.value)} /></Field></div>
        </section>

        <aside className="admin-side">
          <section className="surface admin-card"><span><SlidersHorizontal size={19} /></span><div><p className="eyebrow">Orquestrador</p><h2>Modo adaptativo</h2><p>O agente considera tarefa, cliente, qualidade anterior, custo e disponibilidade antes de escolher o modelo.</p></div><label className="switch"><input type="checkbox" checked={config.routingMode === "adaptive"} onChange={(event) => update("routingMode", event.target.checked ? "adaptive" : "fixed")} /><span /></label></section>
          <section className="surface admin-card"><span><KeyRound size={19} /></span><div><p className="eyebrow">Secret Manager</p><h2>Chaves protegidas</h2><p>As chaves não passam pelo navegador e são lidas somente pelas Cloud Functions.</p></div><Badge tone="warning">Configurar</Badge></section>
          <section className="surface admin-card"><span><ShieldCheck size={19} /></span><div><p className="eyebrow">Auditoria</p><h2>AILog obrigatório</h2><p>Cada chamada registra provedor, modelo, motivo da escolha, duração e modo de execução.</p></div><Badge tone="success">Ativo</Badge></section>
        </aside>
      </div>
    </div>
  );
}
