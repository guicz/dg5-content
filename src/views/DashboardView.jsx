import { ArrowUpRight, CalendarClock, CheckCircle2, CircleAlert, Clock3, FilePenLine, Plus } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Step } from "../components/Shared";
import { formatDate, isOverdue } from "../lib/domain";

export default function DashboardView({ data, client, onNavigate }) {
  const planned = data.plannedContents
    .filter((item) => item.clientId === client.id)
    .sort((a, b) => String(a.publishDate).localeCompare(String(b.publishDate)));
  const contents = data.contents.filter((item) => item.clientId === client.id);
  const brand = data.brandBrains.find((item) => item.clientId === client.id);
  const reviews = contents.filter((item) => /revis|aprova|ajuste/i.test(item.status || ""));
  const overdue = planned.filter(isOverdue);
  const metaPending = planned.filter((item) => item.requiresMetaScheduling && !item.metaScheduled && item.publishDate <= new Date().toISOString().slice(0, 10));
  const nextItems = planned.slice(0, 5);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Visão operacional"
        title={`Bom dia. Vamos cuidar de ${client.name}.`}
        description="Prioridades, prazos e aprovações que precisam de atenção agora."
        actions={<Button icon={Plus} onClick={() => onNavigate("planning")}>Nova demanda</Button>}
      />

      <section className="metric-grid" aria-label="Resumo do cliente">
        <article className="metric"><span className="metric__icon metric__icon--yellow"><CalendarClock size={18} /></span><div><small>Planejados</small><strong>{planned.length}</strong><p>neste ciclo editorial</p></div></article>
        <article className="metric"><span className="metric__icon metric__icon--blue"><FilePenLine size={18} /></span><div><small>Em revisão</small><strong>{reviews.length}</strong><p>aguardando decisão</p></div></article>
        <article className="metric"><span className="metric__icon metric__icon--red"><CircleAlert size={18} /></span><div><small>Atrasados</small><strong>{overdue.length}</strong><p>prazo atingido</p></div></article>
        <article className="metric"><span className="metric__icon metric__icon--green"><CheckCircle2 size={18} /></span><div><small>Saúde da marca</small><strong>{client.brandHealth || 0}%</strong><p>aderência recente</p></div></article>
      </section>

      {metaPending.length ? (
        <section className="attention-banner">
          <span><CircleAlert size={19} /></span>
          <div><strong>{metaPending.length} publicação ainda não foi agendada no Meta</strong><p>O prazo chegou e o status continua pendente.</p></div>
          <Button variant="dark" onClick={() => onNavigate("planning")}>Resolver agora</Button>
        </section>
      ) : null}

      <div className="dashboard-layout">
        <section className="surface work-queue">
          <header className="surface__header">
            <div><p className="eyebrow">Fila de trabalho</p><h2>Próximas entregas</h2></div>
            <button className="text-button" onClick={() => onNavigate("planning")}>Ver planejamento <ArrowUpRight size={15} /></button>
          </header>
          {nextItems.length ? (
            <div className="data-list">
              {nextItems.map((item) => (
                <button className="data-row" key={item.id} onClick={() => onNavigate("planning")}>
                  <span className={`date-tile ${isOverdue(item) ? "is-overdue" : ""}`}><b>{formatDate(item.publishDate).split(" ")[0]}</b><small>{formatDate(item.publishDate).split(" ")[1]}</small></span>
                  <span className="data-row__main"><strong>{item.title}</strong><small>{item.channel} · {item.format} · {item.responsibleName}</small></span>
                  <Badge status={item.status}>{item.status}</Badge>
                  <ArrowUpRight size={16} className="row-arrow" />
                </button>
              ))}
            </div>
          ) : <EmptyState icon={CalendarClock} title="Nenhuma entrega planejada" description="Crie o primeiro item do calendário editorial." />}
        </section>

        <aside className="dashboard-side">
          <section className="surface progress-card">
            <header className="surface__header"><div><p className="eyebrow">Fluxo atual</p><h2>Produção</h2></div><Clock3 size={18} /></header>
            <div className="steps">
              <Step label="Briefing" done />
              <Step label="Texto" done />
              <Step label="Revisão IA" active />
              <Step label="Arte" />
              <Step label="Aprovação" />
            </div>
            <p className="progress-note">O conteúdo mais recente está aguardando ajustes leves antes de seguir para arte.</p>
            <Button variant="secondary" onClick={() => onNavigate("content")}>Abrir conteúdo</Button>
          </section>

          <section className="surface compact-panel">
            <header className="surface__header"><div><p className="eyebrow">Brand Brain</p><h2>Base ativa</h2></div><Badge status={brand?.status || "Pendente"}>{brand?.status || "Pendente"}</Badge></header>
            <p>{brand ? `O guia atual está na versão ${brand.version || 1} e orienta as próximas entregas.` : "O guia deste cliente ainda precisa ser criado e validado."}</p>
            <button className="text-button" onClick={() => onNavigate("brand")}>Consultar guia <ArrowUpRight size={15} /></button>
          </section>
        </aside>
      </div>
    </div>
  );
}
