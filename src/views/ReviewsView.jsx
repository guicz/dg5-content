import { Check, FileImage, MessageSquareText, ThumbsDown, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, Field, PageHeader } from "../components/Shared";
import { runAgent, saveRecord, uploadClientAsset } from "../lib/data";

export default function ReviewsView({ data, client, notify }) {
  const items = useMemo(() => data.contents.filter((item) => item.clientId === client.id), [data.contents, client.id]);
  const [selectedId, setSelectedId] = useState(items[0]?.id || "");
  const [comment, setComment] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const selected = items.find((item) => item.id === selectedId) || items[0];
  const creative = data.clientFiles.find((file) => file.contentId === selected?.id && file.kind === "creative");
  const creativeReview = data.creativeReviews.find((review) => review.contentId === selected?.id);

  useEffect(() => {
    if (!selectedId && items[0]) setSelectedId(items[0].id);
  }, [items, selectedId]);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selected) return;
    setBusyAction("upload");
    try {
      const asset = await uploadClientAsset({ clientId: client.id, contentId: selected.id, file, kind: "creative" });
      await saveRecord("contents", selected.id, { creativeFileId: asset.id, status: "Arte em revisão" });
      notify("Arte enviada. A revisão visual já pode ser executada.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      event.target.value = "";
      setBusyAction("");
    }
  };

  const reviewCreative = async () => {
    if (!creative || !selected) return;
    setBusyAction("review");
    try {
      const result = await runAgent("reviewCreative", { clientId: client.id, contentId: selected.id, storagePath: creative.storagePath });
      await saveRecord("creativeReviews", selected.id, {
        clientId: client.id,
        contentId: selected.id,
        status: "Consultivo",
        findings: result.findings,
        summary: result.summary,
        model: result.model,
      });
      notify("Revisão visual concluída.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const decide = async (approved) => {
    if (!selected) return;
    if (!approved && !comment.trim()) {
      notify("Informe o ajuste necessário antes de reprovar.", "error");
      return;
    }
    setBusyAction(approved ? "approve" : "reject");
    try {
      const status = approved ? "Aprovado internamente" : "Ajustes solicitados";
      await saveRecord("approvals", crypto.randomUUID(), {
        clientId: client.id,
        contentId: selected.id,
        decision: approved ? "approved" : "rejected",
        comment,
        stage: "final",
      });
      await saveRecord("contents", selected.id, { status });
      setComment("");
      notify(approved ? "Conteúdo aprovado internamente." : "Demanda devolvida para ajustes.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Controle de qualidade" title="Revisões e aprovações" description="Avalie o conjunto final de texto, arte e requisitos antes do envio ao cliente." />
      <div className="review-layout">
        <aside className="surface review-queue">
          <header><p className="eyebrow">Fila de aprovação</p><h2>{items.length} conteúdos</h2></header>
          <div>{items.map((item) => <button key={item.id} className={item.id === selected?.id ? "is-active" : ""} onClick={() => setSelectedId(item.id)}><span><strong>{item.title}</strong><small>{item.channel} · {item.format}</small></span><Badge status={item.status}>{item.status}</Badge></button>)}</div>
        </aside>

        {selected ? (
          <section className="review-workspace">
            <article className="surface review-copy">
              <header className="surface__header"><div><p className="eyebrow">Conteúdo textual</p><h2>{selected.title}</h2></div><Badge status={selected.status}>{selected.status}</Badge></header>
              <p className="review-text">{selected.text}</p>
              <div className="review-meta"><span>Origem <strong>{selected.origin || "Híbrido"}</strong></span><span>Aderência <strong>{selected.fitState || "Não revisada"}</strong></span></div>
            </article>

            <article className="surface creative-area">
              <header className="surface__header"><div><p className="eyebrow">Criativo manual</p><h2>Arte e direção</h2></div><label className="button button--secondary file-upload"><UploadCloud size={16} /><span>{creative ? "Trocar arte" : "Subir arte"}</span><input type="file" accept="image/*,application/pdf" onChange={upload} disabled={Boolean(busyAction)} /></label></header>
              {creative ? (
                <div className="creative-preview">
                  {creative.type?.startsWith("image/") ? <img src={creative.downloadURL} alt={`Criativo de ${selected.title}`} /> : <a href={creative.downloadURL} target="_blank" rel="noreferrer"><FileImage size={28} /><span>Abrir {creative.name}</span></a>}
                  <div className="creative-actions"><div><strong>{creative.name}</strong><small>Upload manual do designer</small></div><Button variant="dark" busy={busyAction === "review"} onClick={reviewCreative}>Revisar com IA</Button></div>
                </div>
              ) : <EmptyState icon={FileImage} title="Arte ainda não enviada" description="O designer deve anexar o criativo depois que o texto estiver pronto." />}
            </article>

            <article className="surface findings-panel">
              <header><p className="eyebrow">Diretor de Arte IA</p><h2>Parecer consultivo</h2></header>
              {creativeReview?.findings?.length ? <><p className="findings-summary">{creativeReview.summary}</p><div className="findings-list">{creativeReview.findings.map((finding, index) => <div key={`${finding}-${index}`}><span>{index + 1}</span><p>{finding}</p></div>)}</div></> : <EmptyState icon={MessageSquareText} title="Parecer não executado" description="Envie a arte e acione a revisão para verificar texto, legibilidade, composição e possíveis distorções." />}
            </article>

            <article className="surface approval-panel">
              <header><div><p className="eyebrow">Decisão interna</p><h2>Aprovação final</h2></div><p>Registre uma justificativa quando houver ajustes.</p></header>
              <Field label="Comentário"><textarea rows="3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Ex.: corrigir chamada da capa e aumentar contraste." /></Field>
              <div className="form-actions"><Button variant="danger" icon={ThumbsDown} busy={busyAction === "reject"} onClick={() => decide(false)}>Solicitar ajustes</Button><Button icon={Check} busy={busyAction === "approve"} onClick={() => decide(true)}>Aprovar conjunto</Button></div>
            </article>
          </section>
        ) : <section className="surface"><EmptyState title="Fila vazia" description="Os conteúdos enviados para revisão aparecerão aqui." /></section>}
      </div>
    </div>
  );
}
