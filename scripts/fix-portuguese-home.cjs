/**
 * Updates Portuguese home section to match the new structure
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

const portugueseHome = {
  hero: {
    title: "Monitoramento de acessibilidade de marca branca para",
    titleHighlight: "agências e equipes voltadas para a UE",
    subtitle: "Analise sites, detecte regressões de acessibilidade após cada lançamento e entregue relatórios personalizados que suportam conformidade WCAG 2.2 e prontidão EAA.",
    ctaPrimary: "Inicie sua análise gratuita",
    ctaSecondary: "Ver relatório de exemplo",
    noCreditCard: "Conta gratuita necessária. Nenhum cartão de crédito necessário.",
    imageAlt: "Painel de análise de acessibilidade VexNexa mostrando relatórios WCAG detalhados e priorização de problemas"
  },
  socialProof: {
    title: "Confiado por agências em toda a Europa",
    logo1: "Parceiro de Agência",
    logo2: "Estúdio Digital", 
    logo3: "Equipe Web",
    logo4: "Compliance Co."
  },
  trustStrip: {
    automated: "Verificações automatizadas em minutos",
    branded: "Relatórios personalizados para clientes e partes interessadas",
    continuous: "Monitoramento contínuo para sites ativos"
  },
  whyTeams: {
    title: "Por que as equipes escolhem VexNexa",
    subtitle: "Ferramentas de acessibilidade operacional que se encaixam em como você já trabalha.",
    catchIssues: {
      title: "Detecte problemas antes dos clientes",
      description: "Execute análises contra critérios WCAG 2.2 e veja problemas priorizados com detalhes em nível de elemento. Corrija o que mais importa primeiro."
    },
    whiteLabel: {
      title: "Transforme análises em relatórios de marca branca",
      description: "Exporte relatórios PDF e DOCX personalizados sob seu próprio logo. Compartilhe relatórios de acessibilidade profissionais com clientes e partes interessadas."
    },
    monitor: {
      title: "Monitore acessibilidade após cada lançamento",
      description: "Programe análises recorrentes. Seja alertado quando as pontuações caírem ou novos problemas críticos aparecerem. Prevenha regressões de alcançar a produção."
    }
  },
  builtFor: {
    title: "Construído para agências e equipes voltadas para a UE",
    subtitle: "Seja você gerenciando um site ou cinquenta, VexNexa oferece as ferramentas de fluxo de trabalho para entregar sites acessíveis.",
    agencies: {
      title: "Agências e estúdios web",
      description: "Analise sites de clientes, exporte relatórios personalizados e entregue monitoramento contínuo como serviço. Gerencie múltiplos projetos de clientes de um painel."
    },
    compliance: {
      title: "Equipes de conformidade internas",
      description: "Acompanhe acessibilidade em toda sua organização. Programe análises após cada implantação. Construa evidências de supervisão contínua de acessibilidade para prontidão EAA."
    },
    partners: {
      title: "Parceiros gerenciando múltiplos sites",
      description: "Monitore acessibilidade em um portfólio de sites. Detecte regressões cedo. Entregue relatórios claros e priorizados às partes interessadas."
    }
  },
  whatYouGet: {
    title: "O que você recebe com",
    titleHighlight: "VexNexa",
    subtitle: "Tudo que você precisa para analisar, relatar e monitorar — sem o ruído.",
    c1: "Análise WCAG 2.2 AA com motor axe-core®",
    c2: "Problemas classificados por gravidade: Crítico, Grave, Moderado, Menor",
    c3: "Exportação PDF e DOCX com marca branca",
    c4: "Monitoramento contínuo com análises programadas",
    c5: "Alertas de regressão de pontuação por e-mail",
    c6: "Gerenciamento multi-site de um painel",
    c7: "Colaboração em equipe com acesso baseado em funções",
    c8: "Infraestrutura hospedada na UE, conforme ao RGPD",
    cta: "Inicie sua análise gratuita",
    axeCoreBadge: "Desenvolvido com axe-core® — o mecanismo de teste de acessibilidade mais confiável do mundo"
  },
  testimonials: {
    title: "O que parceiros piloto dizem",
    subtitle: "Feedback inicial de agências testando VexNexa em seus fluxos de trabalho.",
    t1: { 
      quote: "VexNexa nos economizou horas por cliente. Os relatórios de marca branca parecem que nós mesmos construímos.", 
      attribution: "Parceiro piloto — Agência digital, Países Baixos" 
    },
    t2: { 
      quote: "Finalmente temos um fluxo de trabalho de acessibilidade repetível. Analise, relate, monitore — pronto.", 
      attribution: "Parceiro piloto — Estúdio web, Alemanha" 
    },
    t3: { 
      quote: "A priorização foi o que nos vendeu. Sabemos exatamente o que corrigir primeiro para cada cliente.", 
      attribution: "Parceiro piloto — Equipe de conformidade, Bélgica" 
    }
  },
  sampleReport: {
    title: "Veja como um relatório se parece",
    subtitle: "Profissional, estruturado e pronto para compartilhar com clientes ou partes interessadas. Navegue por um relatório de exemplo real com pontuações de acessibilidade, problemas priorizados e orientações de remediação.",
    ctaPrimary: "Ver relatório de exemplo",
    ctaSecondary: "Saiba mais sobre relatórios de marca branca"
  },
  agencyOffer: {
    badge: "Oferta da agência",
    title: "Obtenha um relatório de acessibilidade personalizado para um site",
    subtitle: "Veja como VexNexa pode se adequar ao fluxo de trabalho da sua agência com um relatório de exemplo e um caminho prático de configuração para monitoramento contínuo.",
    ctaPrimary: "Ver relatório de exemplo",
    ctaSecondary: "Entre em contato conosco sobre uso da agência"
  },
  workflow: {
    title: "Como VexNexa se adequa ao seu fluxo de trabalho",
    subtitle: "Analise, revise, relate. Repita conforme seus sites evoluem.",
    stepLabel: "Passo",
    s1: { title: "Analise um site", description: "Digite uma URL, obtenha uma auditoria WCAG 2.2 completa com problemas priorizados por gravidade e contexto em nível de elemento." },
    s2: { title: "Revise problemas priorizados", description: "Veja exatamente o que está errado, por que importa e como corrigir. Filtre por gravidade, critério WCAG ou elemento de página." },
    s3: { title: "Compartilhe relatórios e monitore ao longo do tempo", description: "Exporte relatórios personalizados. Programe análises recorrentes. Seja notificado quando as pontuações mudarem. Construa um ciclo de melhoria contínua." }
  },
  pilotBanner: {
    badge: "Vagas limitadas",
    title: "Junte-se ao Programa de Parceiros Piloto",
    subtitle: "Obtenha acesso nível Business, suporte direto e ajude a moldar VexNexa — enquanto entrega acessibilidade aos seus clientes desde o primeiro dia.",
    ctaPrimary: "Saiba mais",
    ctaSecondary: "Inscreva-se agora"
  },
  faqSection: {
    q1: { 
      question: "VexNexa pode garantir conformidade legal?", 
      answer: "Nenhuma ferramenta pode garantir 100% de conformidade legal. VexNexa detecta e relata problemas de acessibilidade, ajuda a priorizar correções e suporta prontidão WCAG e EAA. Para avaliação de risco legal, considere combinar análises automatizadas com revisão especializada." 
    },
    q2: { 
      question: "Preciso de uma conta para analisar?", 
      answer: "Sim, uma conta gratuita é necessária. Isso nos permite salvar seus resultados, fornecer exportações e acompanhar melhorias ao longo do tempo. Nenhum cartão de crédito necessário para começar." 
    },
    q3: { 
      question: "Posso exportar relatórios personalizados para clientes?", 
      answer: "Sim. Exportações PDF e DOCX estão disponíveis em planos pagos. Planos Business e Enterprise incluem relatórios de marca branca com seu próprio logo, cores e detalhes de contato." 
    },
    q4: { 
      question: "Como funciona o monitoramento contínuo?", 
      answer: "Programe análises automáticas diárias, semanais ou mensais. VexNexa alerta por e-mail quando as pontuações caem ou novos problemas críticos aparecem. Acompanhe tendências ao longo do tempo do seu painel." 
    },
    q5: { 
      question: "VexNexa é uma sobreposição de acessibilidade?", 
      answer: "Não. Analisamos a estrutura do seu código e relatamos violações WCAG reais. Nunca injetamos widgets ou scripts em seu site. Nossos relatórios ajudam desenvolvedores a corrigir problemas na fonte." 
    },
    q6: { 
      question: "Que suporte está disponível?", 
      answer: "Todos os usuários recebem suporte por e-mail. Tentamos responder em 1 dia útil. Planos Business e Enterprise incluem suporte prioritário com tempos de resposta mais rápidos." 
    }
  },
  finalCta: {
    title: "Comece a monitorar acessibilidade hoje",
    subtitle: "Crie sua conta gratuita, execute sua primeira análise e veja resultados em minutos. Faça upgrade quando precisar de monitoramento, relatórios e gerenciamento multi-site.",
    ctaPrimary: "Inicie sua análise gratuita",
    ctaSecondary: "Ver preços"
  }
};

console.log('Processing Portuguese home section...');
const data = loadLocale('pt');

// Update home section with complete structure
data.home = portugueseHome;

saveLocale('pt', data);

console.log('\nDone! Portuguese home section updated with complete translations.');
