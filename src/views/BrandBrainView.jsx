import { BookOpenCheck, FileStack, RefreshCw, Save, Sparkles, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, EmptyState, Field, PageHeader } from "../components/Shared";
import { runAgent, saveRecord, uploadClientAsset } from "../lib/data";

const fields = [
  ["tone", "Tom de voz"],
  ["positioning", "Posicionamento"],
  ["audience", "Público"],
  ["preferences", "Preferências"],
  ["restrictions", "Restrições"],
  ["bannedWords", "Palavras proibidas"],
  ["qualityCriteria", "Critérios de qualidade"],
  ["learnings", "Aprendizados validados"],
];

export default function BrandBrainView({ data, client, notify }) {
  const current = data.brandBrains.find((brain) => brain.clientId === client.id);
  const files = data.clientFiles.filter((file) => file.clientId === client.id && file.kind === "knowledge");
  const [form, setForm] = useState(current || { clientId: client.id, status: "Rascunho", version: 1 });
  const [tab, setTab] = useState("guide");
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => setForm(current || { clientId: client.id, status: "Rascunho", version: 1 }), [current?.id, client.id]);
  const update = (field, value) => setForm((valueNow) => ({ ...valueNow, [field]: value }));

  const save = async (status = form.status) => {
    setBusyAction("save");
    try {
      await saveRecord("brandBrains", current?.id || client.id, { ...form, clientId: client.id, status });
      notify(status === "Aprovado" ? "Brand Brain aprovado como guia oficial." : "Brand Brain salvo.");
    } finally {
      setBusyAction("");
    }
  };

  const generate = async () => {
    setBusyAction("generate");
    try {
      const result = await runAgent("generateBrandBrain", { clientId: client.id });
      const next = { ...form, ...result.brandBrain, status: "Em revisão", version: (form.version || 0) + 1 };
      setForm(next);
      await saveRecord("brandBrains", current?.id || client.id, { ...next, clientId: client.id });
      notify("Nova versão gerada para revisão do gestor.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusyAction("upload");
    try {
      await uploadClientAsset({ clientId: client.id, file, kind: "knowledge" });
      notify("Fonte adicionada ao histórico do cliente.");
    } finally {
      event.target.value = "";
      setBusyAction("");
    }
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Inteligência da marca" title="Brand Brain" description="A fonte oficial para orientar planejamento, geração, revisão e aprendizado." actions={<><Button variant="secondary" icon={RefreshCw} busy={busyAction === "generate"} onClick={generate}>Gerar nova versão</Button><Button icon={Save} busy={busyAction === "save"} onClick={() => save()}>Salvar guia</Button></>} />
      <div className="brain-header surface">
        <div className="brain-client"><span>{client.name?.[0]}</span><div><p className="eyebrow">{client.segment}</p><h2>{client.name}</h2></div></div>
        <div className="brain-stats"><span><small>Status</small><Badge status={form.status}>{form.status}</Badge></span><span><small>Versão</small><strong>v{form.version || 1}</strong></span><span><small>Fontes</small><strong>{files.length}</strong></span><span><small>Saúde</small><strong>{client.brandHealth || 0}%</strong></span></div>
      </div>
      <div className="tabs" role="tablist"><button className={tab === "guide" ? "is-active" : ""} onClick={() => setTab("guide")}>Guia da marca</button><button className={tab === "onboarding" ? "is-active" : ""} onClick={() => setTab("onboarding")}>Resumo estratégico</button><button className={tab === "sources" ? "is-active" : ""} onClick={() => setTab("sources")}>Fontes e histórico</button></div>

      {tab === "guide" ? (
        <section className="surface brain-form">
          <header className="surface__header"><div><p className="eyebrow">Diretrizes oficiais</p><h2>Identidade e critérios</h2></div><BookOpenCheck size={20} /></header>
          <div className="form-grid">{fields.map(([key, label]) => <Field label={label} key={key}><textarea rows="4" value={form[key] || ""} onChange={(event) => update(key, event.target.value)} /></Field>)}</div>
          <div className="form-actions"><Button variant="secondary" onClick={() => save("Em revisão")}>Salvar para revisão</Button><Button onClick={() => save("Aprovado")}>Aprovar como guia oficial</Button></div>
        </section>
      ) : null}

      {tab === "onboarding" ? (
        <section className="surface strategic-summary">
          <header><span><Sparkles size={20} /></span><div><p className="eyebrow">Síntese do onboarding</p><h2>Resumo estratégico inicial</h2></div></header>
          <Field label="O que a IA deve compreender primeiro sobre este cliente"><textarea rows="10" value={form.strategicSummary || ""} onChange={(event) => update("strategicSummary", event.target.value)} /></Field>
          <p>Este resumo é gerado a partir da entrevista interna, materiais enviados e decisões já validadas.</p>
        </section>
      ) : null}

      {tab === "sources" ? (
        <section className="surface sources-panel">
          <header className="surface__header"><div><p className="eyebrow">Base consultável</p><h2>Documentos e referências</h2></div><label className="button button--secondary file-upload"><UploadCloud size={16} /><span>Adicionar fonte</span><input type="file" onChange={upload} disabled={Boolean(busyAction)} /></label></header>
          {files.length ? <div className="source-list">{files.map((file) => <a href={file.downloadURL} target="_blank" rel="noreferrer" key={file.id}><span><FileStack size={18} /></span><div><strong>{file.name}</strong><small>{file.type || "Arquivo"}</small></div><Badge tone="neutral">Indexado</Badge></a>)}</div> : <EmptyState icon={UploadCloud} title="Base ainda vazia" description="Envie entrevistas, manuais, apresentações e históricos aprovados." />}
        </section>
      ) : null}
    </div>
  );
}
