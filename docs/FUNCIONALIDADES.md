# Inventario funcional

Estado observado no codigo e no ambiente publicado em 13/07/2026.

Legenda:

- **Implementado:** existe no codigo e possui fluxo utilizavel.
- **Parcial:** existe, mas nao cumpre todo o escopo previsto.
- **Nao implementado:** consta no plano, mas ainda nao existe como fluxo funcional.

## Acesso e workspace

- **Implementado:** login Google, logout e restricao de dominio `@dg5.com.br`.
- **Implementado:** perfil automatico; Patricia recebe `admin` e os demais recebem `operator`.
- **Implementado:** navegacao responsiva, seletor de cliente e sincronizacao Firestore em tempo real.
- **Parcial:** papeis nao geram experiencias diferentes para operador, designer e aprovador.

## Painel inicial

- **Implementado:** totais de planejados, itens em revisao, atrasados e saude da marca.
- **Implementado:** proximas entregas, prazos, status e alerta de Meta pendente.
- **Implementado:** resumo do Brand Brain atual.
- **Parcial:** o bloco visual das etapas de producao e demonstrativo, nao calculado por demanda.
- **Parcial:** o sino mostra quantidade, mas nao abre uma central de notificacoes.

## Clientes e arquivos

- **Implementado:** criar, editar, buscar e alternar clientes.
- **Implementado:** nome, segmento, responsavel, e-mail, canais, status e observacoes.
- **Implementado:** upload de imagens, PDF, apresentacoes, documentos e texto ate 25 MB.
- **Implementado:** metadados e caminhos no Storage vinculados ao cliente.
- **Nao implementado:** exclusao de cliente/arquivo e controle de acesso por carteira.

## Brand Brain e onboarding

- **Implementado:** tom, posicionamento, publico, preferencias, restricoes, palavras proibidas, qualidade e aprendizados.
- **Implementado:** resumo estrategico, status e numero da versao.
- **Implementado:** geracao por IA usando dados do cliente e ate quatro documentos de 10 MB.
- **Implementado:** revisao humana e aprovacao como guia oficial.
- **Parcial:** a versao anterior e sobrescrita.
- **Nao implementado:** entrevista estruturada, importacao de site/redes e consulta conversacional da memoria.

## Planejamento editorial

- **Implementado:** calendario mensal e navegacao entre meses.
- **Implementado:** titulo, canal, formato, objetivo, data, prioridade, campanha e linha editorial.
- **Implementado:** Instagram, LinkedIn, Facebook, Blog, E-mail e YouTube.
- **Implementado:** Feed, Carrossel, Reels, Stories, Artigo, Roteiro e Pauta.
- **Parcial:** responsavel e e-mail sao preenchidos por padrao, mas nao editados nessa tela.
- **Nao implementado:** planejamento mensal em lote, upload de planejamento, visao semanal e filtros avancados.

## Agendamento no Meta

- **Implementado:** aplicabilidade automatica para formatos do Instagram.
- **Implementado:** marcacao manual `Agendado no Meta`.
- **Implementado:** verificacao diaria de itens vencidos e criacao de notificacao deterministica.
- **Parcial:** a mensagem de e-mail e gravada em `mail`, mas nao e enviada externamente.
- **Nao implementado:** link, print ou observacao como evidencia e publicacao pela API Meta.

## Estudio de conteudo

- **Implementado:** fila vinculada aos itens do planejamento.
- **Implementado:** geracao com cliente, Brand Brain e briefing editorial.
- **Implementado:** texto e sugestao de arte na mesma resposta, sempre com texto primeiro.
- **Implementado:** edicao manual, salvamento, origem e contador de caracteres.
- **Parcial:** gerar novamente sobrescreve o conteudo; nao existe historico de versoes/variacoes.
- **Parcial:** os icones de desfazer e sugestao na barra ainda nao executam acoes.

## Revisao textual

- **Implementado:** avaliacao de tom, clareza, posicionamento, restricoes e palavras proibidas.
- **Implementado:** limiar interno de 70%, orientacoes praticas e mudanca de status.
- **Implementado:** a nota numerica nao aparece na interface operacional.
- **Parcial:** a nota permanece no documento Firestore e nao esta isolada do acesso tecnico do operador.

## AI Gateway e agentes

- **Implementado:** OpenAI, Gemini e adaptador Anthropic no backend.
- **Implementado:** escolha de provedor/modelo por geracao, revisao, Brand Brain e visao.
- **Implementado:** configuracao administrativa, modo fixo/adaptativo e segredos no Secret Manager.
- **Implementado:** nova tentativa por outro provedor quando a aderencia fica abaixo do esperado.
- **Implementado:** `aiLogs` com tarefa, cliente, provedor, modelo, motivo, duracao e solicitante.
- **Parcial:** desempenho por cliente/modelo pode ser consultado, mas nao e agregado automaticamente.
- **Parcial:** Claude esta implementado, mas sem chave real.

## Criativos e Diretor de Arte IA

- **Implementado:** upload e troca manual de criativo vinculado ao conteudo.
- **Implementado:** visualizacao de imagem e abertura de PDF.
- **Implementado:** parecer consultivo de portugues, legibilidade, hierarquia, composicao, contraste e marca.
- **Implementado:** verificacao de artefatos como dedos extras, rostos irreais e objetos incoerentes.
- **Parcial:** a revisao automatica aceita somente imagens de ate 12 MB; PDF apenas pode ser armazenado/aberto.

## Aprovacao interna

- **Implementado:** aprovar ou solicitar ajustes.
- **Implementado:** comentario obrigatorio ao reprovar e registro em `approvals`.
- **Parcial:** existe uma unica decisao final; nao ha aprovacao operacional seguida de aprovacao administrativa.
- **Parcial:** a fila nao filtra por responsavel, papel ou etapa.

## Feedback e aprendizado

- **Nao implementado:** registro estruturado do retorno externo do cliente.
- **Nao implementado:** candidatos de aprendizado gerados por IA.
- **Nao implementado:** validacao e incorporacao do aprendizado ao Brand Brain.

## Dados, seguranca e operacao

- **Implementado:** Firestore, Storage, Functions Gen2, Hosting, Scheduler, Secret Manager e emuladores.
- **Implementado:** regras de dominio DG5, limites de upload e cabecalhos basicos de seguranca.
- **Implementado:** fallback deterministico quando o provedor de IA falha ou nao tem chave.
- **Parcial:** as colecoes operacionais nao estao isoladas por papel ou cliente.
- **Nao implementado:** painel de logs, relatorios, portal do cliente, self-service e geracao automatica de arte.
