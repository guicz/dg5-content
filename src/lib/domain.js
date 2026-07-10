export const channels = ["Instagram", "LinkedIn", "Facebook", "Blog", "E-mail", "YouTube"];
export const formats = ["Feed", "Carrossel", "Reels", "Stories", "Artigo", "Roteiro", "Pauta"];
export const priorities = ["Baixa", "Normal", "Alta", "Urgente"];

export function requiresMetaScheduling(channel, format) {
  return channel === "Instagram" && ["Feed", "Carrossel", "Reels", "Stories"].includes(format);
}

export function formatDate(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(`${value}T12:00:00`))
    .replace(".", "");
}

export function formatDateLong(value) {
  if (!value) return "Sem data definida";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${value}T12:00:00`));
}

export function isOverdue(item, today = new Date().toISOString().slice(0, 10)) {
  return Boolean(item.publishDate && item.publishDate <= today && item.status !== "Publicado");
}

export function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function statusTone(status = "") {
  if (/aprovado|publicado|agendado|ativo/i.test(status)) return "success";
  if (/reprovado|atrasado|erro/i.test(status)) return "danger";
  if (/revis|ajuste|pendente|produ/i.test(status)) return "warning";
  return "neutral";
}

export function monthGrid(reference = new Date()) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: date.toDateString() === new Date().toDateString(),
    };
  });
}
