📋 PLANO DE FRONTEND - SISTEMA DE RELATÓRIOS
VISÃO GERAL
Sistema web para criação de relatórios de venda com seções customizáveis e produtos vindos via API externa. O usuário preenche informações de cliente/vendedor, cria seções personalizadas (ex: Quarto 1, Sala), adiciona produtos por código e gera PDF final.

PÁGINAS NECESSÁRIAS
1. Header/Navegação Global

Logo/nome da aplicação
Menu de navegação principal
Botão de usuário/logout (se tiver autenticação)

2. Página Principal - Criação de Relatório

Seção de Informações Gerais

Campo: Cliente (texto)
Campo: Vendedor (texto)
Campo: Contato (texto/telefone)
Data automática ou campo de data


Seção de Seções Customizáveis

Lista de seções criadas
Botão "Adicionar Seção"
Cada seção tem:

Nome editável (ex: "Quarto 1", "Sala de Estar")
Botão deletar
Botão reordenar (arrastar ou setas)
Lista de produtos dentro da seção




Seção de Produtos (dentro de cada seção)

Campo: Código do produto (input)
Campo: Unidades (quantidade)
Campo: Margem de lucro (%)



Botão remover produto


Ações Finais

Botão "Gerar PDF"
Botão "Limpar/Nova Orçamento"



3. Página de Listagem (opcional, se houver salvamento)

Lista de relatórios salvos
Filtros (cliente, data, vendedor)
Ações: Visualizar, Deletar, Gerar PDF


COMPONENTES PRINCIPAIS
Formulários

FormularioCliente - campos cliente, vendedor, contato
InputCodigoProduto - busca produto via API
InputMargem - campo numérico com %
InputUnidades - campo numérico

Cards/Seções

CardSecao - container de cada seção customizada


Listas/Tabelas

ListaSecoes - renderiza todas seções criadas
ListaProdutos - produtos dentro de cada seção
TabelaRelatorios - lista relatórios salvos (se aplicável)

Botões/Ações

BotaoAdicionarSecao
BotaoAdicionarProduto
BotaoGerarPDF
BotaoExcluir

Feedback/Estado

Loading - spinner durante busca de produto
AlertaErro - quando API falha ou código inválido
AlertaSucesso - confirmação de ações
Modal - confirmações de exclusão


FUNCIONALIDADES CHAVE

Busca de Produtos

Input de código → API call → Retorna dados → Preenche campos automaticamente
Validação de código (existe/não existe)
Tratamento de erro (produto não encontrado)


Gestão de Seções

Criar nova seção com nome customizado
Editar nome da seção
Deletar seção (com confirmação)
Reordenar seções (arrastar ou botões up/down)


Gestão de Produtos

Adicionar múltiplos produtos por seção
Definir unidades e margem por produto
Remover produto
Reordenar produtos dentro da seção


Cálculos Automáticos

Preço final = Preço base + (Preço base × Margem %)
Subtotal por seção (soma produtos)
Total geral do relatório


Geração de PDF

Botão que envia dados para backend
Backend gera PDF com template
Download automático ou visualização


Persistência (se necessário)

Salvar como rascunho
Editar relatórios salvos
Listar histórico




FLUXO DE DADOS
1. Usuário preenche Cliente/Vendedor/Contato
2. Usuário cria Seção (ex: "Quarto 1")
3. Dentro da seção, digita Código do Produto
4. Frontend chama API externa → Recebe dados do produto
5. Usuário preenche Unidades e Margem
7. Usuário repete passos 2-6 para mais seções/produtos
8. Usuário clica "Gerar PDF"
9. Frontend envia JSON completo para backend
10. Backend gera PDF e retorna para download


VALIDAÇÕES NECESSÁRIAS

Cliente/Vendedor/Contato não vazios
Código de produto válido (existe na API)
Unidades > 0
Margem >= 0
Pelo menos 1 seção criada
Pelo menos 1 produto adicionado


RESPONSIVIDADE

Desktop: layout em colunas, tabelas
Tablet: empilhar seções, manter funcionalidade
Mobile: formulário vertical, botões full-width


CONSIDERAÇÕES TÉCNICAS

Estado global (Context API, Redux, Zustand) para gerenciar relatório
Debounce na busca de produtos por código
Cache de produtos já buscados
Lazy loading se lista de relatórios for grande
Otimização de re-renders (React.memo, useMemo)


PRONTO PARA DESENVOLVIMENTO! 🚀