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
  const { htmlSpan: companyHtml } = formatCompany(payload.company);
  const service = payload.service || "Desenvolvimento Web & IA";
  const budget = payload.budget || "Não informado";
  const email = payload.email || "email@exemplo.com";
  const phone = payload.phone || "Não informado";
  const message = payload.message || "";
  const waUrl = generateWhatsappUrl(payload);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9; }
    .card { max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; border-top: 4px solid #3b82f6; }
    .badge { display: inline-block; background-color: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .btn-wa { display: inline-block; background-color: #25d366; color: #052e16; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 10px 15px -3px rgba(37, 211, 102, 0.3); }
    .table-data { width: 100%; background-color: #1e293b; border-radius: 10px; border: 1px solid #334155; border-collapse: separate; }
    .table-data td { padding: 12px 16px; border-bottom: 1px solid #334155; font-size: 14px; }
    .table-data tr:last-child td { border-bottom: none; }
  </style>
</head>
<body>
  <div style="padding: 24px 12px;">
    <div class="card">
      <div class="header">
        <div class="badge">✦ Recebido com Sucesso</div>
        <h1 style="margin:0; color:#fff; font-size:24px; font-weight:700;">Olá, ${escapeHtml(firstName)}!</h1>
        <p style="margin:8px 0 0 0; color:#94a3b8; font-size:15px; line-height:1.5;">
          Obrigado pelo contato. Recebi os detalhes do seu projeto e entrarei em contato em breve.
        </p>
      </div>

      <div style="padding: 32px;">
        <div style="background-color: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.25); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
          <p style="margin: 0 0 12px 0; color: #e2e8f0; font-size: 14px; font-weight: 500;">
            🚀 Precisa de atendimento prioritário em tempo real?
          </p>
          <a href="${waUrl}" target="_blank" class="btn-wa">
            Acelerar Atendimento via WhatsApp &rarr;
          </a>
        </div>

        <h3 style="margin: 0 0 16px 0; color: #38bdf8; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          📌 Resumo da Solicitação
        </h3>

        <table class="table-data">
          <tr>
            <td style="color:#94a3b8; font-weight:600; width:35%;">Nome Completo:</td>
            <td style="color:#f8fafc; font-weight:500;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8; font-weight:600;">Empresa:</td>
            <td style="color:#f8fafc; font-weight:500;">${companyHtml}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8; font-weight:600;">Serviço Requisitado:</td>
            <td style="color:#38bdf8; font-weight:600;">${escapeHtml(service)}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8; font-weight:600;">Orçamento Estimado:</td>
            <td style="color:#f8fafc; font-weight:500;">${escapeHtml(budget)}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8; font-weight:600;">E-mail:</td>
            <td style="color:#f8fafc; font-weight:500;">${escapeHtml(email)}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8; font-weight:600;">Telefone:</td>
            <td style="color:#f8fafc; font-weight:500;">${escapeHtml(phone)}</td>
          </tr>
        </table>

        ${message ? `
        <div style="margin-top:24px; margin-bottom:28px;">
          <h4 style="margin:0 0 8px 0; color:#94a3b8; font-size:12px; text-transform:uppercase;">Sua Mensagem:</h4>
          <div style="background-color:#1a2333; border-left:3px solid #3b82f6; border-radius:0 8px 8px 0; padding:14px 18px; color:#cbd5e1; font-style:italic; font-size:14px; line-height:1.6;">
            "${escapeHtml(message)}"
          </div>
        </div>
        ` : ''}

        <p style="margin: 24px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Estou analisando as especificações técnicas da sua demanda. Caso tenha urgência ou queira acrescentar links ou documentos de apoio, você pode responder diretamente a este e-mail ou me chamar no WhatsApp.
        </p>

        <div style="border-top: 1px solid #1e293b; padding-top: 24px;">
          <div style="color: #ffffff; font-size: 16px; font-weight: 700;">Rafael Franco</div>
          <div style="color: #38bdf8; font-size: 13px; font-weight: 500; margin-top:2px;">Desenvolvimento Web & Soluções de IA</div>
          <div style="margin-top: 8px;">
            <a href="https://francorafael.com" target="_blank" style="color: #94a3b8; font-size: 13px; text-decoration: none;">🌐 francorafael.com</a>
          </div>
        </div>
      </div>

      <div style="background-color: #090d16; padding: 20px 32px; text-align: center; border-top: 1px solid #1e293b;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">
          Mensagem gerada automaticamente via Cloudflare Workers & Resend API.<br>
          © ${new Date().getFullYear()} Rafael Franco. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
