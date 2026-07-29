export const WORKER_CODE = `/**
 * Cloudflare Worker - Processador de Webhook de Formulário
 * 
 * Engenharia & Tecnologia - Rafael Franco
 * Responsabilidades:
 * 1. Processar e validar payload JSON do formulário
 * 2. Tratar dados (primeiro nome, formatação de empresa, URL WhatsApp acelerada)
 * 3. Enviar notificação em tempo real via Telegram Bot API
 * 4. Disparar e-mail de confirmação premium para o cliente via Resend API
 * 5. Gerenciar respostas CORS e erros
 */

export default {
  async fetch(request, env, ctx) {
    // Configuração de cabeçalhos CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Content-Type": "application/json; charset=UTF-8"
    };

    // Trata requisições Preflight CORS (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Validação do método HTTP - Apenas POST é permitido
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method Not Allowed",
          message: "Apenas requisições POST são aceitas neste endpoint."
        }),
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      // 1. Leitura e validação do Payload JSON
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Bad Request",
            message: "O corpo da requisição deve ser um JSON válido."
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      const {
        id = \`lead_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`,
        name = "",
        company = "",
        phone = "",
        service = "Desenvolvimento Web & IA",
        budget = "Não informado",
        email = "",
        message = "",
        source = "Formulário do Site (francorafael.com)"
      } = payload;

      // Validação de campos obrigatórios
      if (!name || !name.trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Bad Request",
            message: "O campo 'name' (nome) é obrigatório."
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      if (!email || !email.trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Bad Request",
            message: "O campo 'email' é obrigatório."
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 2. Lógica de Negócio e Formatação de Dados
      const cleanName = name.trim();
      const firstName = cleanName.split(/\\s+/)[0] || cleanName;

      // Tratamento da Empresa
      const rawCompany = (company || "").trim();
      const isCompanyEmpty =
        !rawCompany ||
        rawCompany.toLowerCase() === "não informada" ||
        rawCompany.toLowerCase() === "nao informada";

      // Tag HTML para template de e-mail e texto simples para Telegram/WhatsApp
      const companyHtmlSpan = isCompanyEmpty
        ? \`<span style="color:#94a3b8; font-style:italic;">Particular</span>\`
        : escapeHtml(rawCompany);

      const plainCompany = isCompanyEmpty ? "Particular" : rawCompany;

      // 3. Geração da URL Acelerada do WhatsApp (Direct Fast-Track)
      const whatsappPhone = "5535999057566";
      const whatsappText = \`Olá, Rafael!\\nAcabei de enviar o formulário no seu site (francorafael.com) e gostaria de agilizar o meu atendimento sobre o projeto de \${service}.\\nMeus dados para referência:\\n📌 Nome: \${cleanName}\\n📌 Empresa: \${plainCompany}\\nAguardo seu retorno!\`;

      const whatsappUrl = \`https://wa.me/\${whatsappPhone}?text=\${encodeURIComponent(whatsappText)}\`;

      // 4. Disparo da Notificação via Telegram Bot API
      let telegramSuccess = false;
      let telegramError = null;

      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        try {
          const telegramMessage = \`⚡ <b>NOVO LEAD RECEBIDO DO SITE!</b>\\n\\n\` +
            \`👤 <b>Nome:</b> \${escapeHtml(cleanName)} (<i>\${escapeHtml(firstName)}</i>)\\n\` +
            \`🏢 <b>Empresa:</b> \${plainCompany}\\n\` +
            \`🛠️ <b>Serviço:</b> \${escapeHtml(service)}\\n\` +
            \`💰 <b>Orçamento:</b> \${escapeHtml(budget)}\\n\` +
            \`📧 <b>E-mail:</b> <code>\${escapeHtml(email)}</code>\\n\` +
            \`📞 <b>Telefone:</b> <code>\${escapeHtml(phone || "Não informado")}</code>\\n\` +
            \`📍 <b>Origem:</b> \${escapeHtml(source)}\\n\\n\` +
            \`💬 <b>Mensagem:</b>\\n<i>"\${escapeHtml(message || "Sem mensagem informada")}"</i>\\n\\n\` +
            \`📲 <a href="\${whatsappUrl}"><b>Acelerar Atendimento via WhatsApp</b></a>\`;

          const telegramRes = await fetch(
            \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendMessage\`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: telegramMessage,
                parse_mode: "HTML",
                disable_web_page_preview: false
              })
            }
          );

          const telegramJson = await telegramRes.json();
          telegramSuccess = telegramJson.ok === true;
          if (!telegramSuccess) {
            telegramError = telegramJson.description || "Erro ao disparar mensagem no Telegram.";
          }
        } catch (err) {
          telegramError = err.message;
        }
      } else {
        telegramError = "Credenciais do Telegram não configuradas no ambiente (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).";
      }

      // 5. Geração e Disparo de E-mail Premium via Resend API
      let emailSuccess = false;
      let emailError = null;

      const htmlEmail = generateResendHtmlEmail({
        firstName,
        cleanName,
        companyHtmlSpan,
        phone,
        email,
        service,
        budget,
        message,
        whatsappUrl
      });

      if (env.RESEND_API_KEY) {
        try {
          const fromEmail = env.EMAIL_FROM || "Rafael Franco <contato@francorafael.com>";
          
          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": \`Bearer \${env.RESEND_API_KEY}\`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [email],
              subject: \`Recebi sua mensagem, \${firstName}! Projeto: \${service}\`,
              html: htmlEmail
            })
          });

          const resendJson = await resendRes.json();
          emailSuccess = resendRes.ok && !!resendJson.id;
          if (!emailSuccess) {
            emailError = resendJson.message || resendJson.error || "Erro ao enviar e-mail via Resend.";
          }
        } catch (err) {
          emailError = err.message;
        }
      } else {
        emailError = "Chave da Resend não configurada no ambiente (RESEND_API_KEY).";
      }

      // 6. Retorno da Resposta de Sucesso Estruturada
      return new Response(
        JSON.stringify({
          success: true,
          message: "Formulário processado com sucesso!",
          data: {
            id,
            firstName,
            company: plainCompany,
            whatsappUrl,
            telegramNotification: {
              sent: telegramSuccess,
              error: telegramError
            },
            emailConfirmation: {
              sent: emailSuccess,
              error: emailError
            }
          }
        }),
        { status: 200, headers: corsHeaders }
      );

    } catch (globalError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Internal Server Error",
          message: globalError.message || "Ocorreu um erro interno ao processar a solicitação."
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  }
};

function escapeHtml(str) {
  if (typeof str !== "string") return str || "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Modelo de E-mail HTML Premium (Resend)
 * Estilo "Atendimento Exclusivo" - Header Escuro com Borda Dourada (#c5a85c), Tipografia Serif e Tabela de Resumo
 */
function generateResendHtmlEmail({
  firstName,
  cleanName,
  companyHtmlSpan,
  phone,
  email,
  service,
  budget,
  message,
  whatsappUrl
}) {
  return \`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recebemos seu planejamento de orçamento - Rafael Franco</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcfcfc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fcfcfc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Card Principal -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #f0f0f0;">
          
          <!-- Cabeçalho Escuro Exclusivo -->
          <tr>
            <td style="background: linear-gradient(180deg, #1a1a1a 0%, #111111 100%); padding: 40px 35px 35px 35px; border-bottom: 4px solid #c5a85c;">
              <p style="margin: 0 0 10px 0; color: #c5a85c; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Atendimento Exclusivo</p>
              <h1 style="margin: 0; color: #ffffff; font-size: 30px; font-weight: 700; font-family: 'Georgia', serif; line-height: 1.2;">Olá, \${escapeHtml(firstName)}!</h1>
            </td>
          </tr>

          <!-- Corpo do Conteúdo -->
          <tr>
            <td style="padding: 35px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 15px; line-height: 1.6;">
                Agradecemos o seu contato. Recebemos o seu planejamento de orçamento enviado através do nosso canal oficial (<a href="https://francorafael.com" target="_blank" style="color: #0066cc; text-decoration: underline; font-weight: 600;">francorafael.com</a>).
              </p>
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 15px; line-height: 1.6;">
                Suas informações para o segmento de <strong style="font-weight: 700; color: #111111;">\${escapeHtml(service)}</strong> já foram encaminhadas para a nossa mesa de análise. Nosso prazo estimado para o primeiro contato ou envio de proposta comercial é de até <strong style="font-weight: 700; color: #111111;">24 horas úteis</strong>.
              </p>

              <!-- Seção Título do Resumo -->
              <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 13px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; border-bottom: 1px solid #eaeaea; padding-bottom: 8px;">
                Resumo dos Dados Recebidos
              </h2>
              
              <!-- Bloco de Informações Tratadas -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 8px; border: 1px solid #f0f0f0; padding: 20px;">
                <tr>
                  <td width="38%" valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Segmento Escolhido:</td>
                  <td width="62%" valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 700;">\${escapeHtml(service)}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Empresa / Organização:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 700;">\${companyHtmlSpan}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Orçamento Estimado:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 700;">\${escapeHtml(budget || "A combinar")}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Telefone / WhatsApp:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 600;">\${escapeHtml(phone || "Não informado")}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">E-mail Cadastrado:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 600;">\${escapeHtml(email)}</td>
                </tr>
                <tr>
                  <td valign="top" style="color: #777777; font-size: 13px; font-weight: 600;">Sua Mensagem:</td>
                  <td valign="top" style="color: #444444; font-size: 14px; line-height: 1.5; font-style: italic;">
                    "\${escapeHtml(message || "Sem mensagem adicional.")}"
                  </td>
                </tr>
              </table>

              <!-- CTA para Atendimento Acelerado -->
              <div style="margin-top: 30px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #666666; font-size: 13px;">Deseja resposta imediata? Fale diretamente comigo:</p>
                <a href="\${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25d366; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 26px; border-radius: 6px; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.25);">
                  📲 Acelerar Atendimento via WhatsApp &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Rodapé Técnico -->
          <tr>
            <td style="background-color: #fafafa; padding: 20px 35px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                Este é um e-mail automático enviado pelo sistema de triagem de <strong>francorafael.com</strong>.<br>
                Engenharia de Software & Soluções de IA — Rafael Franco.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>\`;
}
`;

export const WRANGLER_TOML = `name = "site-webhook-processor"
main = "src/index.js"
compatibility_date = "2024-09-25"
compatibility_flags = [ "nodejs_compat" ]

[vars]
EMAIL_FROM = "Rafael Franco <contato@francorafael.com>"
ALLOWED_ORIGIN = "*"

[env.staging]
name = "site-webhook-processor-staging"
[env.staging.vars]
ALLOWED_ORIGIN = "https://staging.francorafael.com"
`;

export const ENV_EXAMPLE = `# ==============================================================================
# CONFIGURAÇÕES DE AMBIENTE E SEGREDOS - CLOUDFLARE WORKER
# ==============================================================================

# 1. NOTIFICAÇÕES TELEGRAM BOT API
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyZ"
TELEGRAM_CHAT_ID="987654321"

# 2. DISPARO DE E-MAILS RESEND
RESEND_API_KEY="re_123456789_abcdefghijklmnopqrstuvwxyz"
EMAIL_FROM="Rafael Franco <contato@francorafael.com>"

# 3. SEGURANÇA E CORS
ALLOWED_ORIGIN="*"
`;

export const GITIGNORE = `# Cloudflare Workers e segredos
.env
.env.local
.env.*.local
.dev.vars
.wrangler/

# Dependências
node_modules/

# Compilação e Bundles
dist/
build/
`;

export const PACKAGE_JSON = `{
  "name": "site-webhook-processor",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "resend": "^4.0.0"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}`;

export const README_MD = `# ⚡ Serverless Webhook Automation Engine & Lead Processor
> **Desenvolvido por Rafael Franco** | *Arquitetura Serverless em Edge Computing com Cloudflare Workers, Resend Email API, Telegram Bot API & WhatsApp Fast-Track*

---

## 🎯 Visão Geral & Competências Técnicas

Este projeto consiste em um **Engine Serverless de Alta Performance** concebido para capturar, validar, higienizar e processar webhooks de formulários web em tempo de execução ultra-rápido (*Cold Start de ~0ms*), operando na infraestrutura global de borda (*Edge Locations*) da Cloudflare.

Construído com foco em **Engenharia de Software, Resiliência e Segurança**, a solução resolve o problema crítico de perda de *leads* e latência de atendimento em plataformas digitais através de uma orquestração multicanal em tempo real:

- **Edge Computing Performance**: Execução nativa no runtime V8 do Cloudflare Workers em mais de 300 cidades no mundo.
- **Notificação Multicanal Instantânea**: Notifica a equipe de vendas no **Telegram Bot API** com formatação HTML e links diretos, dispara e-mail transacional estilizado via **Resend API** e gera o link de contato direto via **WhatsApp Fast-Track**.
- **Segurança & Zero-Hardcoding**: Chaves de API e tokens são gerenciados com criptografia no *Cloudflare Secrets Store*, sem expor valores sensíveis em código ou controle de versão (\`.gitignore\` estrito).
- **Validação & Higienização Inteligente**: Extração automática do primeiro nome para atendimento humanizado, escape de caracteres HTML para prevenir injeções de script (XSS) e tratamento para empresas não informadas.
- **Developer Experience (DX) & Test Bench**: Interface interativa completa integrada para simulação de webhooks, teste de credenciais e visualização ao vivo dos e-mails e alertas.

---

## 📐 Diagrama da Arquitetura de Execução

\`\`\`
                    ┌─────────────────────────┐
                    │ Cliente / Webform Site  │
                    └────────────┬────────────┘
                                 │ POST /api/webhook (JSON)
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│        Cloudflare Edge Worker (300+ Edge Locations Global)       │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 1. Validação de Método & Headers CORS Preflight (OPTIONS)    │ │
│ │ 2. Sanitização do JSON & Higienização do Nome/Empresa         │ │
│ │ 3. Construção do Link Acelerado para WhatsApp                │ │
│ └──────────────────────────────┬───────────────────────────────┘ │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │ (Processamento Assíncrono Paralelo)           │
         ▼                                               ▼
┌──────────────────────────┐                   ┌──────────────────────────┐
│   Telegram Bot API       │                   │    Resend Email API      │
│ ┌──────────────────────┐ │                   │ ┌──────────────────────┐ │
│ │ Notificação HTML em  │ │                   │ │ E-mail Transacional   │ │
│ │ Tempo Real no Chat   │ │                   │ │ HTML com Branding     │ │
│ └──────────────────────┘ │                   │ └──────────────────────┘ │
└──────────────────────────┘                   └──────────────────────────┘
         │                                               │
         └───────────────────────┬───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │ Resposta JSON Estruturada│
                    │ Status 200 OK           │
                    └─────────────────────────┘
\`\`\`

---

## 💡 Aplicação em Outros Projetos e Casos de Uso Reais

A arquitetura desacoplada e modular dessa API permite sua rápida adaptação para diversos cenários de mercado:

### 1. Checkout Abandonado e Recuperação em E-Commerce
* **Desafio**: Clientes que preenchem o formulário inicial de checkout mas não concluem a compra.
* **Solução**: O webhook aciona o Worker no momento do abandono. O sistema envia um e-mail transacional com cupom de desconto via Resend e notifica o time de suporte no Telegram com o link direto do WhatsApp do cliente para um contato proativo.

### 2. Qualified Lead Routing para SaaS B2B
* **Desafio**: Encaminhamento agilizado de pedidos de demonstração para os executivos de contas (*SDRs*).
* **Solução**: O Worker analisa a faixa orçamentária (*budget*) enviada no payload e roteia a mensagem para canais específicos no Telegram de acordo com o porte do cliente, disparando um e-mail de confirmação imediato com o link do Calendly para agendamento.

### 3. Agendamento Acelerado para Imobiliárias e Serviços de Alto Valor
* **Desafio**: Clientes que solicitam propostas de imobiliárias ou consultorias precisam de atendimento imediato sob risco de buscar concorrentes.
* **Solução**: O Worker gera uma mensagem pré-formatada e codificada no WhatsApp Fast-Track (\`https://wa.me/55...\`), permitindo que a equipe de vendas inicie o diálogo em 1 clique com todos os dados do formulário já preenchidos.

---

## 🧪 Interface Simuladora de Testes (DX Dashboard)

Para garantir facilidade de homologação por recrutadores e desenvolvedores sem a necessidade de ferramentas externas como Postman ou Curl, o projeto inclui um **Dashboard Interativo de Testes**:

### Orientação Básica de Uso:
1. **Seleção de Presets de Teste**: Clique nos botões de preset (ex: *Lead Completo*, *Sem Empresa*, *Orçamento Elevado*) para carregar estruturas de dados reais no editor JSON.
2. **Edição do Payload**: Modifique nome, e-mail ou mensagem diretamente na tela.
3. **Injeção de Credenciais de Teste**: Caso deseje testar seus próprios robôs do Telegram ou chaves da Resend, preencha a aba de credenciais de ambiente.
4. **Disparo do Webhook**: Clique em **"Disparar Webhook de Teste"**.
5. **Inspeção de Resultados**:
   - Veja o status da resposta HTTP (200 OK, tempo de execução em milissegundos).
   - Inspecione a visualização gráfica da mensagem entregue no Telegram.
   - Visualize a renderização completa do E-mail HTML enviado via Resend.
   - Clique no botão do WhatsApp Fast-Track para verificar a mensagem gerada.

---

## 📖 Especificação OpenAPI 3.0 (Swagger)

\`\`\`yaml
openapi: 3.0.3
info:
  title: Site Webhook Processor API
  description: Serverless Edge API para recebimento de webhooks de formulários, notificações no Telegram e envio de e-mails via Resend.
  version: 1.0.0
  contact:
    name: Rafael Franco
    email: contato@francorafael.com
    url: https://francorafael.com
servers:
  - url: https://site-webhook-processor.francorafael.workers.dev
    description: Servidor de Produção na Edge da Cloudflare
  - url: http://localhost:3000
    description: Servidor Local de Desenvolvimento e Simulação
paths:
  /api/webhook:
    post:
      summary: Processa um novo lead proveniente de formulário web
      operationId: processLeadWebhook
      tags:
        - Webhook
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LeadPayload'
            example:
              id: "lead_99213"
              name: "Rafael Franco"
              company: "Franco Dev & AI Solutions"
              phone: "+5535999057566"
              service: "Desenvolvimento Web & Soluções de IA"
              budget: "R$ 10.000 - R$ 20.000"
              email: "contato@francorafael.com"
              message: "Gostaria de criar um assistente de IA integrado ao meu portal."
              source: "Formulário do Site (francorafael.com)"
      responses:
        '200':
          description: Lead processado e notificações enviadas com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'
        '400':
          description: Erro de validação no payload enviado (Ex: falta de nome ou e-mail).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '405':
          description: Método HTTP não permitido (Apenas POST é aceito).
        '500':
          description: Erro interno no processamento do Worker.
\`\`\`

---

## 🔑 Segurança e Gestão de Segredos (Zero Hardcoding)

Todas as chaves de API e tokens sensíveis são mantidos em cofres criptografados da Cloudflare:

\`\`\`bash
# Registrar Token do Bot do Telegram
npx wrangler secret put TELEGRAM_BOT_TOKEN --env=""

# Registrar ID do Chat do Telegram
npx wrangler secret put TELEGRAM_CHAT_ID --env=""

# Registrar Chave de API da Resend
npx wrangler secret put RESEND_API_KEY --env=""
\`\`\`

---

## 🚢 Passo a Passo para Deploy em Produção

1. **Instalar Wrangler CLI**:
   \`\`\`bash
   npm install -g wrangler
   \`\`\`

2. **Autenticar na conta Cloudflare**:
   \`\`\`bash
   npx wrangler login
   \`\`\`

3. **Deploy com 1 Comando**:
   \`\`\`bash
   npx wrangler deploy --env=""
   \`\`\`

---

### 👤 Autor & Contato
**Rafael Franco** - Engenheiro de Software & Especialista em Soluções Web & IA  
- E-mail: \`contato@francorafael.com\`  
- Website: \`https://francorafael.com\`  
- WhatsApp: \`+55 (35) 99905-7566\`
`;

