import { CheckCircle2, FilePenLine, Lightbulb, RotateCcw, Save, Sparkles, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, PageHeader } from "../components/Shared";
import { runAgent, saveRecord } from "../lib/data";

export default function ContentStudioView({ data, client, notify }) {
  const planned = data.plannedContents
    .filter((item) => item.clientId === client.id)
    .sort((a, b) => String(a.publishDate).localeCompare(String(b.publishDate)));
  const contents = data.contents.filter((item) => item.clientId === client.id);
  const rows = useMemo(() => planned.map((item) => ({ ...item, content: contents.find((content) => content.plannedContentId === item.id) })), [planned, contents]);
  const [selectedPlanId, setSelectedPlanId] = useState(rows[0]?.id || "");
  const [text, setText] = useState("");
  const [artSuggestion, setArtSuggestion] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const selectedRow = rows.find((item) => item.id === selectedPlanId) || rows[0];
  const content = selectedRow?.content;

  useEffect(() => {
    setText(content?.text || "");
    setArtSuggestion(content?.artSuggestion || "");
  }, [content?.id, selectedPlanId]);

  const generate = async () => {
    if (!selectedRow) return;
    setBusyAction("generate");
    try {
      const result = await runAgent("generateContent", { clientId: client.id, plannedContentId: selectedRow.id });
      const id = content?.id || selectedRow.id;
      await saveRecord("contents", id, {
        clientId: client.id,
        plannedContentId: selectedRow.id,
        title: selectedRow.title,
        channel: selectedRow.channel,
        format: selectedRow.format,
        text: result.text,
        artSuggestion: result.artSuggestion,
        status: "Rascunho",
        origin: result.mode === "live" ? "IA" : "IA local",
        model: result.model,
      });
      setText(result.text);
      setArtSuggestion(result.artSuggestion);
      notify("Rascunho gerado com o Brand Brain do cliente.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const save = async () => {
    if (!selectedRow) return;
    setBusyAction("save");
    try {
      await saveRecord("contents", content?.id || selectedRow.id, {
        clientId: client.id,
        plannedContentId: selectedRow.id,
        title: selectedRow.title,
        channel: selectedRow.channel,
        format: selectedRow.format,
        text,
        artSuggestion,
        status: content?.status || "Rascunho",
        origin: content?.origin || "Híbrido",
      });
      notify("Conteúdo salvo.");
    } finally {
      setBusyAction("");
    }
  };

  const review = async () => {
    if (!text.trim()) return;
    setBusyAction("review");
    try {
      const result = await runAgent("reviewContent", { clientId: client.id, plannedContentId: selectedRow.id, text });
      await saveRecord("contents", content?.id || selectedRow.id, {
        text,
        artSuggestion,
        status: result.passed ? "Aguardando aprovação operacional" : "Ajustes solicitados",
        fitScoreInternal: result.score,
        fitState: result.label,
        guidance: result.guidance,
      });
      notify(result.passed ? "Texto pronto para aprovação operacional." : "A revisão encontrou pontos de melhoria.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="page-stack content-page">
      <PageHeader eyebrow="Produção assistida" title="Estúdio de conteúdo" description="Gere, ajuste e revise o texto antes de encaminhar a orientação para o designer." actions={<Button data-testid="generate-content" icon={Sparkles} busy={busyAction === "generate"} onClick={generate}>{content ? "Gerar nova versão" : "Gerar com IA"}</Button>} />
      <div className="studio-layout">
        <aside className="surface studio-list">
          <header><p className="eyebrow">Fila do cliente</p><h2>Conteúdos</h2></header>
          <div>
            {rows.map((item) => (
              <button key={item.id} className={item.id === selectedRow?.id ? "is-active" : ""} onClick={() => setSelectedPlanId(item.id)}>
                <span><strong>{item.title}</strong><small>{item.channel} · {item.format}</small></span>
                <Badge status={item.content?.status || item.status}>{item.content?.status || "Não iniciado"}</Badge>
              </button>
            ))}
          </div>
        </aside>

        <section className="surface editor-panel">
          {selectedRow ? (
            <>
              <header className="editor-header"><div><p className="eyebrow">{selectedRow.channel} · {selectedRow.format}</p><h2>{selectedRow.title}</h2></div><Badge status={content?.status || "Rascunho"}>{content?.status || "Rascunho"}</Badge></header>
              <div className="editor-toolbar"><span>Versão atual</span><div><button title="Desfazer" aria-label="Desfazer"><RotateCcw size={15} /></button><button title="Sugestão da IA" aria-label="Sugestão da IA"><WandSparkles size={15} /></button></div></div>
              <textarea className="content-editor" value={text} onChange={(event) => setText(event.target.value)} placeholder="O conteúdo será gerado ou escrito aqui." aria-label="Texto do conteúdo" />
              <div className="editor-footer"><span>{text.length} caracteres</span><div><Button variant="ghost" icon={Save} busy={busyAction === "save"} onClick={save}>Salvar</Button><Button data-testid="review-content" icon={CheckCircle2} busy={busyAction === "review"} onClick={review}>Enviar para revisão</Button></div></div>
              <section className="art-brief"><header><span><Lightbulb size={17} /></span><div><p className="eyebrow">Orientação para o designer</p><h3>Sugestão de arte</h3></div></header><textarea rows="5" value={artSuggestion} onChange={(event) => setArtSuggestion(event.target.value)} placeholder="A sugestão visual aparecerá depois da geração do texto." /></section>
            </>
          ) : <EmptyState icon={FilePenLine} title="Nenhum conteúdo no planejamento" description="Crie um item no calendário para iniciar a produção." />}
        </section>

        <aside className="surface guidance-panel">
          <header><p className="eyebrow">Revisor de conteúdo</p><h2>Orientações</h2></header>
          {content?.guidance?.length ? <div className="guidance-list">{content.guidance.map((item, index) => <article key={`${item}-${index}`}><span>{index + 1}</span><p>{item}</p></article>)}</div> : <div className="guidance-empty"><Sparkles size={22} /><strong>Pronto para revisar</strong><p>Envie o texto para receber orientações práticas de tom, clareza e aderência.</p></div>}
          {content?.fitState ? <div className="fit-summary"><span>Aderência ao guia</span><strong>{content.fitState}</strong><small>A nota técnica permanece interna.</small></div> : null}
        </aside>
      </div>
    </div>
  );
}
