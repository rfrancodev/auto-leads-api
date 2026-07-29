import { WebhookPayload } from "../types";

export function getFirstName(name: string): string {
  if (!name) return "Cliente";
  const trimmed = name.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

export function formatCompany(company: string): { isParticular: boolean; htmlSpan: string; plain: string } {
  const raw = (company || "").trim();
  const isParticular =
    !raw ||
    raw.toLowerCase() === "não informada" ||
    raw.toLowerCase() === "nao informada";

  return {
    isParticular,
    htmlSpan: isParticular
      ? '<span style="color:#94a3b8; font-style:italic;">Particular</span>'
      : escapeHtml(raw),
    plain: isParticular ? "Particular" : raw
  };
}

export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateWhatsappUrl(payload: WebhookPayload): string {
  const phone = "5535999057566";
  const { plain } = formatCompany(payload.company);
  const text = `Olá, Rafael!\nAcabei de enviar o formulário no seu site (francorafael.com) e gostaria de agilizar o meu atendimento sobre o projeto de ${payload.service || "desenvolvimento"}.\nMeus dados para referência:\n📌 Nome: ${payload.name || "Cliente"}\n📌 Empresa: ${plain}\nAguardo seu retorno!`;
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function generateTelegramPreview(payload: WebhookPayload): string {
  const name = payload.name || "Nome Não Informado";
  const firstName = getFirstName(name);
  const { plain: company } = formatCompany(payload.company);
  const service = payload.service || "Desenvolvimento Web & IA";
  const budget = payload.budget || "A combinar";
  const email = payload.email || "email@exemplo.com";
  const phone = payload.phone || "Não informado";
  const message = payload.message || "Sem mensagem informada";
  const source = payload.source || "Formulário do Site";
  const waUrl = generateWhatsappUrl(payload);

  return `⚡ <b>NOVO LEAD RECEBIDO DO SITE!</b>

👤 <b>Nome:</b> ${escapeHtml(name)} (<i>${escapeHtml(firstName)}</i>)
🏢 <b>Empresa:</b> ${escapeHtml(company)}
🛠️ <b>Serviço:</b> ${escapeHtml(service)}
💰 <b>Orçamento:</b> ${escapeHtml(budget)}
📧 <b>E-mail:</b> <code>${escapeHtml(email)}</code>
📞 <b>Telefone:</b> <code>${escapeHtml(phone)}</code>
📍 <b>Origem:</b> ${escapeHtml(source)}

💬 <b>Mensagem:</b>
<i>"${escapeHtml(message)}"</i>

📲 <a href="${waUrl}"><b>Acelerar Atendimento via WhatsApp</b></a>`;
}

export function generateEmailHtmlPreview(payload: WebhookPayload): string {
  const firstName = getFirstName(payload.name);
  const name = payload.name || "Cliente";
  const { plain: companyPlain } = formatCompany(payload.company);
  const service = payload.service || "Desenvolvimento Web & IA";
  const budget = payload.budget || "A combinar";
  const email = payload.email || "email@exemplo.com";
  const phone = payload.phone || "Não informado";
  const message = payload.message || "Gostaria de criar um assistente de IA integrado ao meu portal.";
  const waUrl = generateWhatsappUrl(payload);

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
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 700;">${escapeHtml(companyPlain)}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Orçamento Estimado:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 700;">${escapeHtml(budget)}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">Telefone / WhatsApp:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 600;">${escapeHtml(phone)}</td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom: 12px; color: #777777; font-size: 13px; font-weight: 600;">E-mail Cadastrado:</td>
                  <td valign="top" style="padding-bottom: 12px; color: #111111; font-size: 14px; font-weight: 600;">${escapeHtml(email)}</td>
                </tr>
                <tr>
                  <td valign="top" style="color: #777777; font-size: 13px; font-weight: 600;">Sua Mensagem:</td>
                  <td valign="top" style="color: #444444; font-size: 14px; line-height: 1.5; font-style: italic;">
                    "${escapeHtml(message)}"
                  </td>
                </tr>
              </table>

              <!-- CTA para Atendimento Acelerado -->
              <div style="margin-top: 30px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #666666; font-size: 13px;">Deseja resposta imediata? Fale diretamente comigo:</p>
                <a href="${waUrl}" target="_blank" style="display: inline-block; background-color: #25d366; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 26px; border-radius: 6px; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.25);">
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
