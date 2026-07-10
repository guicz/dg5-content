import { Building2, FileText, Paperclip, Plus, Save, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, Field, PageHeader, SearchField } from "../components/Shared";
import { saveRecord, uploadClientAsset } from "../lib/data";

const blankClient = {
  name: "",
  segment: "",
  status: "Ativo",
  channels: [],
  responsibleName: "",
  responsibleEmail: "",
  notes: "",
};

export default function ClientsView({ data, client, onClientChange, notify }) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(client || blankClient);
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm(creating ? blankClient : client || blankClient), [client, creating]);

  const filtered = useMemo(() => data.clients.filter((item) => `${item.name} ${item.segment}`.toLowerCase().includes(query.toLowerCase())), [data.clients, query]);
  const files = data.clientFiles.filter((file) => file.clientId === client?.id && file.kind === "knowledge");

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const id = await saveRecord("clients", creating ? null : client.id, {
        ...form,
        channels: Array.isArray(form.channels) ? form.channels : String(form.channels).split(",").map((item) => item.trim()).filter(Boolean),
      });
      setCreating(false);
      onClientChange(id);
      notify("Cliente salvo com sucesso.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !client) return;
    setBusy(true);
    try {
      await uploadClientAsset({ clientId: client.id, file, kind: "knowledge" });
      notify("Arquivo adicionado à base do cliente.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Carteira" title="Clientes" description="Dados, responsáveis e fontes que alimentam a inteligência de cada marca." actions={<Button icon={Plus} onClick={() => setCreating(true)}>Novo cliente</Button>} />
      <div className="master-detail">
        <aside className="surface master-list">
          <SearchField value={query} onChange={setQuery} placeholder="Buscar cliente" />
          <div className="client-stack">
            {filtered.map((item) => (
              <button key={item.id} className={item.id === client?.id && !creating ? "is-active" : ""} onClick={() => { onClientChange(item.id); setCreating(false); }}>
                <span className="client-symbol">{item.name?.[0]}</span>
                <span><strong>{item.name}</strong><small>{item.segment}</small></span>
                <Badge status={item.status}>{item.status}</Badge>
              </button>
            ))}
          </div>
        </aside>

        <section className="surface detail-panel">
          <header className="surface__header detail-heading">
            <div className="heading-with-icon"><span><Building2 size={20} /></span><div><p className="eyebrow">{creating ? "Novo cadastro" : "Perfil do cliente"}</p><h2>{creating ? "Adicionar cliente" : client?.name}</h2></div></div>
            {!creating && client ? <Badge status={client.status}>{client.status}</Badge> : null}
          </header>
          <form className="form-grid" onSubmit={save}>
            <Field label="Nome do cliente"><input required value={form.name || ""} onChange={(event) => update("name", event.target.value)} /></Field>
            <Field label="Segmento"><input required value={form.segment || ""} onChange={(event) => update("segment", event.target.value)} /></Field>
            <Field label="Responsável interno"><input value={form.responsibleName || ""} onChange={(event) => update("responsibleName", event.target.value)} /></Field>
            <Field label="E-mail do responsável"><input type="email" value={form.responsibleEmail || ""} onChange={(event) => update("responsibleEmail", event.target.value)} /></Field>
            <Field label="Canais" hint="Separe os canais por vírgula."><input value={Array.isArray(form.channels) ? form.channels.join(", ") : form.channels || ""} onChange={(event) => update("channels", event.target.value)} /></Field>
            <Field label="Status"><select value={form.status || "Ativo"} onChange={(event) => update("status", event.target.value)}><option>Ativo</option><option>Pausado</option><option>Em onboarding</option><option>Encerrado</option></select></Field>
            <Field label="Observações estratégicas" className="field--full"><textarea rows="4" value={form.notes || ""} onChange={(event) => update("notes", event.target.value)} /></Field>
            <div className="form-actions field--full"><Button icon={Save} busy={busy}>Salvar cliente</Button>{creating ? <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button> : null}</div>
          </form>

          {!creating && client ? (
            <section className="document-section">
              <header><div><p className="eyebrow">Base de conhecimento</p><h3>Arquivos internos</h3></div><label className="button button--secondary file-upload"><UploadCloud size={16} /><span>Enviar arquivo</span><input type="file" onChange={upload} disabled={busy} /></label></header>
              {files.length ? <div className="file-grid">{files.map((file) => <a key={file.id} href={file.downloadURL} target="_blank" rel="noreferrer"><span><FileText size={18} /></span><div><strong>{file.name}</strong><small>{Math.max(1, Math.round((file.size || 0) / 1024))} KB</small></div><Paperclip size={15} /></a>)}</div> : <EmptyState icon={UploadCloud} title="Nenhum arquivo enviado" description="Adicione manuais, planejamentos, PDFs e referências do cliente." />}
            </section>
          ) : null}
        </section>
      </div>
    </div>
  );
}
