import { CalendarDays, Check, ChevronLeft, ChevronRight, ListFilter, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Field, PageHeader } from "../components/Shared";
import { channels, formatDateLong, formats, monthGrid, priorities, requiresMetaScheduling } from "../lib/domain";
import { saveRecord } from "../lib/data";

const emptyItem = (client) => ({
  clientId: client.id,
  title: "",
  channel: "Instagram",
  format: "Feed",
  objective: "",
  publishDate: new Date().toISOString().slice(0, 10),
  priority: "Normal",
  status: "Briefing",
  responsibleName: client.responsibleName || "Patricia",
  responsibleEmail: client.responsibleEmail || "patricia@dg5.com.br",
  campaign: "",
  editorialLine: "",
  metaScheduled: false,
});

export default function PlanningView({ data, client, notify }) {
  const [reference, setReference] = useState(new Date());
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const days = useMemo(() => monthGrid(reference), [reference]);
  const items = data.plannedContents.filter((item) => item.clientId === client.id);
  const selected = draft || items.find((item) => item.id === selectedId);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(reference);

  const shiftMonth = (offset) => setReference(new Date(reference.getFullYear(), reference.getMonth() + offset, 1));
  const update = (field, value) => setDraft((current) => ({ ...(current || selected || emptyItem(client)), [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    const values = draft || selected;
    if (!values) return;
    setBusy(true);
    try {
      const id = await saveRecord("plannedContents", values.id || null, {
        ...values,
        clientId: client.id,
        requiresMetaScheduling: requiresMetaScheduling(values.channel, values.format),
      });
      setSelectedId(id);
      setDraft(null);
      notify("Planejamento salvo.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const markScheduled = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await saveRecord("plannedContents", selected.id, { metaScheduled: true, status: "Agendado no Meta" });
      setDraft(null);
      notify("Status atualizado para Agendado no Meta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Calendário editorial" title="Planejamento" description="Organize campanhas, linhas editoriais, responsáveis e datas de publicação." actions={<Button icon={Plus} onClick={() => { setSelectedId(""); setDraft(emptyItem(client)); }}>Novo conteúdo</Button>} />
      <div className="planning-layout">
        <section className="surface calendar-panel">
          <header className="calendar-toolbar">
            <div><button className="icon-button" onClick={() => shiftMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={18} /></button><h2>{monthLabel}</h2><button className="icon-button" onClick={() => shiftMonth(1)} aria-label="Próximo mês"><ChevronRight size={18} /></button></div>
            <span><CalendarDays size={16} /> {items.length} conteúdos</span>
          </header>
          <div className="calendar-weekdays">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {days.map((day) => {
              const dayItems = items.filter((item) => item.publishDate === day.date);
              return (
                <div key={day.date} className={`${day.inMonth ? "" : "is-outside"} ${day.isToday ? "is-today" : ""}`}>
                  <span>{day.day}</span>
                  {dayItems.slice(0, 2).map((item) => <button key={item.id} className={`calendar-event channel-${item.channel.toLowerCase()}`} onClick={() => { setSelectedId(item.id); setDraft(null); }}><i />{item.title}</button>)}
                  {dayItems.length > 2 ? <small>+ {dayItems.length - 2} itens</small> : null}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="surface planning-detail">
          {selected ? (
            <form onSubmit={save}>
              <header className="surface__header"><div><p className="eyebrow">Item selecionado</p><h2>{selected.id ? "Editar conteúdo" : "Novo conteúdo"}</h2></div>{selected.status ? <Badge status={selected.status}>{selected.status}</Badge> : null}</header>
              <Field label="Título"><input required value={selected.title || ""} onChange={(event) => update("title", event.target.value)} /></Field>
              <div className="form-grid form-grid--compact">
                <Field label="Canal"><select value={selected.channel} onChange={(event) => update("channel", event.target.value)}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></Field>
                <Field label="Formato"><select value={selected.format} onChange={(event) => update("format", event.target.value)}>{formats.map((format) => <option key={format}>{format}</option>)}</select></Field>
                <Field label="Publicação"><input required type="date" value={selected.publishDate || ""} onChange={(event) => update("publishDate", event.target.value)} /></Field>
                <Field label="Prioridade"><select value={selected.priority || "Normal"} onChange={(event) => update("priority", event.target.value)}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></Field>
              </div>
              <Field label="Objetivo"><textarea rows="3" value={selected.objective || ""} onChange={(event) => update("objective", event.target.value)} /></Field>
              <Field label="Campanha"><input value={selected.campaign || ""} onChange={(event) => update("campaign", event.target.value)} /></Field>
              <Field label="Linha editorial"><input value={selected.editorialLine || ""} onChange={(event) => update("editorialLine", event.target.value)} /></Field>
              <div className="planning-date"><CalendarDays size={16} /><span>{formatDateLong(selected.publishDate)}</span></div>
              <div className="form-actions"><Button icon={Save} busy={busy}>Salvar</Button>{requiresMetaScheduling(selected.channel, selected.format) && !selected.metaScheduled && selected.id ? <Button type="button" variant="secondary" icon={Check} onClick={markScheduled}>Marcar agendado</Button> : null}</div>
            </form>
          ) : (
            <div className="select-prompt"><span><ListFilter size={22} /></span><h2>Selecione um conteúdo</h2><p>Clique em um item do calendário para consultar ou editar os detalhes.</p></div>
          )}
        </aside>
      </div>
    </div>
  );
}
