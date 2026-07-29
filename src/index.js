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
 * Estilo "Engenharia & Tecnologia" - Clean, Dark Tech Elements, High Contrast
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Contato - Rafael Franco</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f1f5f9;">
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f17; padding: 32px 16px;">
    <tr>
      <td align="center">
        
        <!-- CARTÃO PRINCIPAL -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5);">
          
          <!-- CABEÇALHO COM GRADIENTE & BORDAS DE ENGENHARIA -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 32px 28px 32px; border-top: 4px solid #3b82f6; text-align: left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      ✦ Recebido com Sucesso
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.3;">
                      Olá, ${escapeHtml(firstName)}!
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 15px; line-height: 1.5;">
                      Obrigado pelo contato. Recebi os detalhes do seu projeto e entrarei em contato em breve.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTEÚDO PRINCIPAL -->
          <tr>
            <td style="padding: 32px; background-color: #0f172a;">
              
              <!-- BANNER DE WHATSAPP ACELERADO (BOTÃO DE DESTAQUE) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.25); border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 12px 0; color: #e2e8f0; font-size: 14px; font-weight: 500;">
                      🚀 Precisa de atendimento prioritário em tempo real?
                    </p>
                    <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25d366; color: #052e16; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 10px 15px -3px rgba(37, 211, 102, 0.3); transition: all 0.2s ease;">
                      Acelerar Atendimento via WhatsApp &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- RESUMO DOS DADOS ENVIADOS -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #38bdf8; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                  📌 Resumo da Solicitação
                </h3>
                
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 10px; border: 1px solid #334155; border-collapse: separate;">
                  <tr>
                    <td width="35%" style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 13px; font-weight: 600;">Nome Completo:</td>
                    <td width="65%" style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #f8fafc; font-size: 14px; font-weight: 500;">${escapeHtml(cleanName)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 13px; font-weight: 600;">Empresa:</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #f8fafc; font-size: 14px; font-weight: 500;">${companyHtmlSpan}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 13px; font-weight: 600;">Serviço Requisitado:</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #38bdf8; font-size: 14px; font-weight: 600;">${escapeHtml(service)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 13px; font-weight: 600;">Orçamento Estimado:</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #f8fafc; font-size: 14px; font-weight: 500;">${escapeHtml(budget)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 13px; font-weight: 600;">E-mail:</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #f8fafc; font-size: 14px; font-weight: 500;">${escapeHtml(email)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; color: #94a3b8; font-size: 13px; font-weight: 600;">Telefone / WhatsApp:</td>
                    <td style="padding: 12px 16px; color: #f8fafc; font-size: 14px; font-weight: 500;">${escapeHtml(phone || "Não informado")}</td>
                  </tr>
                </table>
              </div>

              ${message ? `
              <!-- MENSAGEM DO CLIENTE -->
              <div style="margin-bottom: 28px;">
                <h3 style="margin: 0 0 10px 0; color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Sua Mensagem:
                </h3>
                <div style="background-color: #1a2333; border-left: 3px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 14px 18px; color: #cbd5e1; font-size: 14px; line-height: 1.6; font-style: italic;">
                  "${escapeHtml(message)}"
                </div>
              </div>
              ` : ''}

              <!-- SEÇÃO DE COMPROMISSO -->
              <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Estou analisando as especificações técnicas da sua demanda. Caso tenha urgência ou queira acrescentar links ou documentos de apoio, você pode responder diretamente a este e-mail ou me chamar no WhatsApp.
              </p>

              <!-- ASSINATURA TECNOLÓGICA -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #1e293b; padding-top: 24px;">
                <tr>
                  <td>
                    <div style="color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: -0.2px;">
                      Rafael Franco
                    </div>
                    <div style="color: #38bdf8; font-size: 13px; font-weight: 500; margin-top: 2px;">
                      Desenvolvimento Web & Soluções de IA
                    </div>
                    <div style="margin-top: 8px;">
                      <a href="https://francorafael.com" target="_blank" style="color: #94a3b8; font-size: 13px; text-decoration: none; font-weight: 500;">
                        🌐 francorafael.com
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- RODAPÉ -->
          <tr>
            <td style="background-color: #090d16; padding: 20px 32px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                Mensagem gerada automaticamente via Cloudflare Workers & Resend API.<br>
                © ${new Date().getFullYear()} Rafael Franco. Todos os direitos reservados.
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
