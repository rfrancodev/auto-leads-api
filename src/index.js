/**
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
        id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
      const firstName = cleanName.split(/\s+/)[0] || cleanName;

      // Tratamento da Empresa
      const rawCompany = (company || "").trim();
      const isCompanyEmpty =
        !rawCompany ||
        rawCompany.toLowerCase() === "não informada" ||
        rawCompany.toLowerCase() === "nao informada";

      // Tag HTML para template de e-mail e texto simples para Telegram/WhatsApp
      const companyHtmlSpan = isCompanyEmpty
        ? `<span style="color:#94a3b8; font-style:italic;">Particular</span>`
        : escapeHtml(rawCompany);

      const plainCompany = isCompanyEmpty ? "Particular" : rawCompany;

      // 3. Geração da URL Acelerada do WhatsApp (Direct Fast-Track)
      const whatsappPhone = "5535999057566";
      const whatsappText = `Olá, Rafael!\nAcabei de enviar o formulário no seu site (francorafael.com) e gostaria de agilizar o meu atendimento sobre o projeto de ${service}.\nMeus dados para referência:\n📌 Nome: ${cleanName}\n📌 Empresa: ${plainCompany}\nAguardo seu retorno!`;

      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`;

      // 4. Disparo da Notificação via Telegram Bot API
      let telegramSuccess = false;
      let telegramError = null;

      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        try {
          const telegramMessage = `⚡ <b>NOVO LEAD RECEBIDO DO SITE!</b>\n\n` +
            `👤 <b>Nome:</b> ${escapeHtml(cleanName)} (<i>${escapeHtml(firstName)}</i>)\n` +
            `🏢 <b>Empresa:</b> ${plainCompany}\n` +
            `🛠️ <b>Serviço:</b> ${escapeHtml(service)}\n` +
            `💰 <b>Orçamento:</b> ${escapeHtml(budget)}\n` +
            `📧 <b>E-mail:</b> <code>${escapeHtml(email)}</code>\n` +
            `📞 <b>Telefone:</b> <code>${escapeHtml(phone || "Não informado")}</code>\n` +
            `📍 <b>Origem:</b> ${escapeHtml(source)}\n\n` +
            `💬 <b>Mensagem:</b>\n<i>"${escapeHtml(message || "Sem mensagem informada")}"</i>\n\n` +
            `📲 <a href="${whatsappUrl}"><b>Acelerar Atendimento via WhatsApp</b></a>`;

          const telegramRes = await fetch(
            `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
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
              "Authorization": `Bearer ${env.RESEND_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [email],
              subject: `Recebi sua mensagem, ${firstName}! Projeto: ${service}`,
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
      // Tratamento genérico de erro não previsto
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

/**
 * Função Auxiliar: Sanitização de strings para HTML
 */
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
 * Função Auxiliar: Modelo de E-mail HTML Premium (Resend)
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
  return `<!DOCTYPE html>
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
              <h1 style="margin: 0; color: #ffffff; font-size: 30px; font-weight: 700; font-family: 'Georgia', serif; line-height: 1.2;">Olá, ${escapeHtml(firstName)}!</h1>
            </td>
          </tr>

          <!-- Corpo do Conteúdo -->
          <tr>
            <td style="padding: 35px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 15px; line-height: 1.6;">
                Agradecemos o seu contato. Recebemos o seu planejamento de orçamento enviado através do nosso canal oficial (<a href="https://francorafael.com" target="_blank" style="color: #0066cc; text-decoration: underline; font-weight: 600;">francorafael.com</a>).
              </p>
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 15px; line-height: 1.6;">
                Suas informações para o segmento de <strong style="font-weight: 700; color: #111111;">${escapeHtml(service)}</strong> já foram encaminhadas para a nossa mesa de análise. Nosso prazo estimado para o primeiro contato ou envio de proposta comercial é de até <strong style="font-weight: 700; color: #111111;">24 horas úteis</strong>.
              </p>

              <!-- Seção Título do Resumo -->
              <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 13px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; border-bottom: 1px solid #eaeaea; padding-bottom: 8px;">
                Resumo dos Dados Recebidos
              </h2>
              
              <!-- Bloco de Informações Tratadas -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 8px; border: 1px solid #f0f0f0; padding: 20px;">
                <tr>
                  <td width="38%" valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Segmento Escolhido:</td>
                  <td width="62%" valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 700;">${escapeHtml(service)}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Empresa / Organização:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 700;">${companyHtmlSpan}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Orçamento Estimado:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 700;">${escapeHtml(budget || "A combinar")}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Telefone / WhatsApp:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 600;">${escapeHtml(phone || "Não informado")}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">E-mail Cadastrado:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 600;">${escapeHtml(email)}</td>
                </tr>
                <tr>
                  <td valign="top" style="color: #777777; font-size: 13px; font-weight: 600;">Sua Mensagem:</td>
                  <td valign="top" style="color: #444444; font-size: 14px; line-height: 1.5; font-style: italic;">
                    "${escapeHtml(message || "Sem mensagem adicional.")}"
                  </td>
                </tr>
              </table>

              <!-- CTA para Atendimento Acelerado -->
              <div style="margin-top: 30px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #666666; font-size: 13px;">Deseja resposta imediata? Fale diretamente comigo:</p>
                <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25d366; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 26px; border-radius: 6px; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.25);">
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
</html>`;
}
