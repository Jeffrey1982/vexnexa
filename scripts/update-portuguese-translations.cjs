/**
 * Adds missing Portuguese translations for all new sections
 */
const fs = require('fs');
const path = require('path');
const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

function loadLocale(locale) {
  const fp = path.join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function saveLocale(locale, data) {
  const fp = path.join(MESSAGES_DIR, `${locale}.json`);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`  Updated ${locale}.json`);
}

// ─── FOR-AGENCIES ───────────────────────────────────────────
const forAgencies = {
  hero: {
    title: "Relatórios de acessibilidade que sua agência pode",
    titleHighlight: "realmente entregar",
    subtitle: "Analise sites de clientes para problemas WCAG 2.2, exporte relatórios personalizados, configure monitoramento contínuo e gerencie acessibilidade em todo seu portfólio — tudo de uma única plataforma.",
    ctaPrimary: "Iniciar análise gratuita",
    ctaSecondary: "Ver relatório de exemplo",
    noCreditCard: "Conta gratuita necessária. Nenhum cartão de crédito necessário."
  },
  painPoints: {
    title: "Desafios comuns enfrentados por agências",
    subtitle: "Acessibilidade está se tornando uma expectativa dos clientes, não um item opcional.",
    p1: { 
      title: "Clientes perguntam sobre acessibilidade mas você carece de um processo repetível", 
      description: "Sem um fluxo de trabalho padronizado, cada revisão de acessibilidade leva mais tempo do que deveria. VexNexa oferece um processo escaneável, relatável e monitorável desde o primeiro dia." 
    },
    p2: { 
      title: "Você não pode escalar auditorias manuais em mais de 10 sites de clientes", 
      description: "Testes manuais são importantes mas caros. Análises automatizadas fornecem cobertura base em todo seu portfólio para que você possa focar o esforço manual onde realmente importa." 
    },
    p3: { 
      title: "Relatórios parecem inconsistentes ou pouco profissionais", 
      description: "Resultados genéricos de análise não impressionam clientes. VexNexa exporta relatórios PDF e DOCX personalizados sob seu próprio logo com priorização clara de problemas." 
    }
  },
  workflows: {
    title: "Por que VexNexa se adapta aos fluxos de trabalho de agências",
    subtitle: "Ferramentas práticas alinhadas com a forma como as agências já trabalham com clientes.",
    w1: { title: "Analise qualquer site de cliente em minutos", description: "Digite uma URL e receba uma auditoria WCAG 2.2 completa com problemas classificados por gravidade. Nenhuma configuração necessária por cliente." },
    w2: { title: "Exporte relatórios de marca branca", description: "Gere relatórios PDF e DOCX personalizados com seu logo, cores e informações de contato. Prontos para compartilhar com clientes." },
    w3: { title: "Programe análises recorrentes", description: "Configure monitoramento semanal ou mensal. Receba alertas quando as pontuações caírem ou novos problemas críticos aparecerem." },
    w4: { title: "Gerencie múltiplos clientes de um único painel", description: "Organize sites por cliente. Acompanhe pontuações, tendências e problemas abertos em todo seu portfólio." },
    w5: { title: "Detecte regressões antes que seus clientes", description: "Após um redesenho, migração ou novo lançamento — VexNexa detecta regressões de acessibilidade automaticamente." },
    w6: { title: "Suporte à prontidão EAA para clientes europeus", description: "Ajude clientes a fortalecer sua supervisão contínua de acessibilidade com monitoramento permanente e evidências de melhoria." }
  },
  included: {
    title: "Incluído nos planos Business e Enterprise",
    i1: "Relatórios PDF e DOCX de marca branca",
    i2: "Logo, cores e texto de rodapé personalizados",
    i3: "Painel multi-site",
    i4: "Análises programadas com alertas por e-mail",
    i5: "Acesso de equipe baseado em funções",
    i6: "Cobertura WCAG 2.2 AA com axe-core",
    i7: "Priorização de problemas por gravidade",
    i8: "Hospedado na UE, conforme ao RGPD"
  },
  agencyWorkflow: {
    title: "Como agências usam VexNexa",
    subtitle: "Um fluxo de trabalho de acessibilidade rentável em quatro passos.",
    stepLabel: "Passo",
    s1: { title: "Onboarding de cliente", description: "Analise o site deles no primeiro dia — auditoria de referência instantânea." },
    s2: { title: "Entregar relatório personalizado", description: "PDF de marca branca em 24 horas, pronto para compartilhar." },
    s3: { title: "Corrigir e monitorar", description: "Programe análises recorrentes, acompanhe melhorias ao longo do tempo." },
    s4: { title: "Reter e fazer upsell", description: "Monitoramento contínuo como serviço mensal para seus clientes." }
  },
  pilotBanner: {
    badge: "Vagas limitadas",
    title: "Junte-se ao Programa de Parceiros Piloto",
    subtitle: "Obtenha acesso nível Business, suporte direto e ajude a moldar VexNexa — enquanto oferece acessibilidade aos seus clientes desde o primeiro dia.",
    ctaPrimary: "Saiba mais",
    ctaSecondary: "Inscreva-se agora"
  },
  finalCta: {
    title: "Comece a oferecer acessibilidade aos seus clientes",
    subtitle: "Crie uma conta gratuita, analise seu primeiro site de cliente e descubra como VexNexa se integra ao seu fluxo de trabalho.",
    ctaPrimary: "Iniciar análise gratuita",
    ctaSecondary: "Ver relatório de exemplo",
    ctaTertiary: "Entre em contato"
  }
};

// ─── BLOG ───────────────────────────────────────────
const blog = {
  title: "Ideias & Atualizações",
  subtitle: "Últimos desenvolvimentos em acessibilidade web e conformidade WCAG",
  empty: "Nenhuma postagem de blog encontrada. Volte mais tarde para novo conteúdo!",
  writtenBy: "Escrito por:",
  metadata: {
    title: "Blog - VexNexa",
    description: "Últimas notícias, dicas e insights sobre acessibilidade web e conformidade WCAG."
  }
};

// ─── SAMPLE REPORT ───────────────────────────────────────
const sampleReport = {
  badge: "Relatório de Exemplo",
  title: "Como um relatório de acessibilidade VexNexa se parece",
  titleHighlight: "se parece",
  subtitle: "Este é um relatório de exemplo baseado em dados de análise realistas. Planos Business e Enterprise podem colocar em marca branca com seu próprio logo, cores e nome da empresa.",
  ctaPrimary: "Analise seu próprio site",
  ctaSecondary: "Saiba mais sobre marca branca",
  executiveSummary: "Resumo Executivo",
  scoreTitle: "Pontuação de Acessibilidade",
  severityCritical: "Crítico",
  severitySerious: "Grave",
  severityModerate: "Moderado",
  severityMinor: "Menor",
  downloadTitle: "Baixe o relatório de exemplo completo",
  downloadSubtitle: "Veja exatamente o que seus clientes receberão — personalizado, estruturado e pronto para compartilhar.",
  downloadBranded: "Solicitar exemplo PDF",
  downloadWhiteLabel: "Solicitar exemplo de marca branca",
  downloadNote: "Enviaremos um relatório de exemplo personalizado em 1 dia útil.",
  exportTitle: "Exportar como PDF ou DOCX — com sua marca",
  exportSubtitle: "Planos Business e Enterprise incluem exportações de marca branca. Substitua a marca VexNexa por seu próprio logo, nome da empresa, cores e texto de rodapé. Relatórios exportam como PDF compartilhável ou DOCX editável.",
  exportLearnMore: "Saiba mais sobre relatórios de marca branca"
};

// ─── PRICING NEW SECTIONS ────────────────────────────────────
const pricingNew = {
  pilotBanner: {
    badge: "Piloto para Agências",
    title: "Primeiro mês do plano Business no preço Pro",
    subtitle: "Novo na VexNexa? Comece com todos os recursos Business — relatórios de marca branca, 10 sites e suporte prioritário — por apenas €59,99 no primeiro mês. Sem compromisso. Cancele a qualquer momento.",
    cta: "Reserve sua vaga piloto"
  },
  noCreditCard: "Nenhum cartão de crédito necessário · Cancele a qualquer momento"
};

// ─── APPLY UPDATES ──────────────────────────────────────────
console.log('Processing Portuguese translations...');
const data = loadLocale('pt');

// Add missing namespaces
data.forAgencies = forAgencies;
data.blog = blog;
data.sampleReport = sampleReport;

// Add pricing new sections
if (!data.pricing) data.pricing = {};
if (!data.pricing.page) data.pricing.page = {};
data.pricing.page.pilotBanner = pricingNew.pilotBanner;
data.pricing.page.noCreditCard = pricingNew.noCreditCard;

saveLocale('pt', data);

console.log('\nDone! Portuguese translations updated for all missing sections.');
