import { PresetLead } from "../types";

export const PRESET_LEADS: PresetLead[] = [
  {
    label: "SaaS Tech Startup",
    icon: "🚀",
    data: {
      id: "lead_saas_001",
      name: "Carlos Eduardo Silva",
      company: "Nexus AI Tech Solutions",
      phone: "+55 (11) 98765-4321",
      service: "Desenvolvimento Web & Soluções de IA",
      budget: "R$ 15.000 - R$ 25.000",
      email: "carlos.silva@nexusai.com.br",
      message: "Precisamos desenvolver um SaaS com integração da API Gemini para automação de atendimento ao cliente e painel em React.",
      source: "Formulário Landing Page (francorafael.com)"
    }
  },
  {
    label: "Cliente Particular (Empresa Vazia)",
    icon: "👤",
    data: {
      id: "lead_part_002",
      name: "Fernanda Lima de Oliveira",
      company: "", // Teste de tratamento "não informada" -> Particular
      phone: "+55 (35) 99887-6655",
      service: "E-commerce & Automações",
      budget: "R$ 5.000 - R$ 10.000",
      email: "fernanda.lima@gmail.com",
      message: "Gostaria de orçar a criação de um e-mail marketing automatizado e um site institucional rápido em Next.js.",
      source: "Formulário do Site"
    }
  },
  {
    label: "Projeto de IA Generativa",
    icon: "🤖",
    data: {
      id: "lead_ai_003",
      name: "Marcelo Albuquerque",
      company: "Inovação Digital Ltda",
      phone: "+55 (21) 97123-8899",
      service: "Agentes de IA e Chatbots",
      budget: "R$ 30.000+",
      email: "marcelo@inovacaodigital.com.br",
      message: "Buscamos implementar um agente de IA especialista para análise documental com RAG e banco vetorial.",
      source: "Anúncio Google Ads"
    }
  },
  {
    label: 'Empresa "Não Informada"',
    icon: "🏢",
    data: {
      id: "lead_naoinf_004",
      name: "Guilherme Santos",
      company: "não informada", // Teste do termo exato "não informada"
      phone: "+55 (31) 99111-2233",
      service: "Consultoria e Arquitetura Cloud",
      budget: "R$ 8.000 - R$ 12.000",
      email: "guilherme.santos@outlook.com",
      message: "Preciso de auxílio para migrar nossos microsserviços para Cloudflare Workers e otimizar tempo de carregamento.",
      source: "Indicação LinkedIn"
    }
  }
];
