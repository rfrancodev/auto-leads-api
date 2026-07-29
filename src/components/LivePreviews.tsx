import React, { useState } from "react";
import { WebhookPayload, WorkerResponse } from "../types";
import { generateEmailHtmlPreview, generateTelegramPreview, generateWhatsappUrl } from "../utils/helpers";
import { Mail, Send, MessageSquare, Code, Smartphone, Monitor, Copy, Check, ExternalLink } from "lucide-react";

interface Props {
  payload: WebhookPayload;
  lastResponse: WorkerResponse | null;
}

export const LivePreviews: React.FC<Props> = ({ payload, lastResponse }) => {
  const [activeTab, setActiveTab] = useState<"email" | "telegram" | "whatsapp" | "json">("email");
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");
  const [copiedLink, setCopiedLink] = useState(false);

  const emailHtml = generateEmailHtmlPreview(payload);
  const telegramText = generateTelegramPreview(payload);
  const whatsappUrl = generateWhatsappUrl(payload);

  const handleCopyWhatsappLink = () => {
    navigator.clipboard.writeText(whatsappUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Tab Navigation Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "email"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <span>E-mail Resend HTML</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("telegram")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "telegram"
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Send className="w-4 h-4 text-indigo-400" />
            <span>Notificação Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "whatsapp"
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Acelerado</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("json")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "json"
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Code className="w-4 h-4 text-purple-400" />
            <span>Resposta JSON</span>
          </button>
        </div>

        {/* Viewport Toggles for Email */}
        {activeTab === "email" && (
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewportMode("desktop")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-colors ${
                viewportMode === "desktop" ? "bg-slate-800 text-sky-400" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Visualização Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode("mobile")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-colors ${
                viewportMode === "mobile" ? "bg-slate-800 text-sky-400" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Visualização Mobile"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Content 1: Resend HTML Email Render */}
      {activeTab === "email" && (
        <div className="p-4 sm:p-6 bg-slate-950 flex justify-center items-start min-h-[520px]">
          <div
            className={`transition-all duration-300 w-full ${
              viewportMode === "mobile"
                ? "max-w-[380px] border-8 border-slate-800 rounded-[32px] overflow-hidden shadow-2xl bg-black my-2"
                : "max-w-3xl"
            }`}
          >
            {viewportMode === "mobile" && (
              <div className="bg-slate-900 text-slate-400 text-[10px] text-center py-1 font-mono border-b border-slate-800">
                iPhone Preview (Resend HTML)
              </div>
            )}
            <iframe
              title="Resend Email Preview"
              srcDoc={emailHtml}
              className="w-full h-[580px] bg-slate-950 rounded-xl border border-slate-800"
            />
          </div>
        </div>
      )}

      {/* Tab Content 2: Telegram Bot Preview */}
      {activeTab === "telegram" && (
        <div className="p-6 bg-slate-950 min-h-[520px] flex items-center justify-center">
          <div className="max-w-md w-full bg-[#17212b] border border-[#2b3a4a] rounded-2xl p-4 shadow-2xl text-slate-200 text-sm space-y-3">
            {/* Telegram Header */}
            <div className="flex items-center space-x-3 pb-3 border-b border-[#2b3a4a]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                🤖
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">Lead Notification Bot</h4>
                <p className="text-xs text-slate-400">bot @francorafael_lead_bot</p>
              </div>
            </div>

            {/* Chat Bubble */}
            <div className="bg-[#182533] p-4 rounded-2xl border border-[#2b3a4a] space-y-3 text-xs leading-relaxed text-slate-200 font-sans">
              <div className="font-bold text-sky-400 text-sm flex items-center justify-between">
                <span>⚡ NOVO LEAD RECEBIDO DO SITE!</span>
                <span className="text-[10px] text-slate-400 font-normal">11:06 AM</span>
              </div>

              <div className="space-y-1.5">
                <div>👤 <b>Nome:</b> {payload.name || "Cliente"} (<i>{payload.name?.trim().split(" ")[0] || "Cliente"}</i>)</div>
                <div>🏢 <b>Empresa:</b> {payload.company?.trim() ? payload.company : "Particular"}</div>
                <div>🛠️ <b>Serviço:</b> {payload.service || "Desenvolvimento Web & IA"}</div>
                <div>💰 <b>Orçamento:</b> {payload.budget || "A combinar"}</div>
                <div>📧 <b>E-mail:</b> <code className="bg-[#101721] px-1.5 py-0.5 rounded text-sky-300 font-mono">{payload.email || "contato@francorafael.com"}</code></div>
                <div>📞 <b>Telefone:</b> <code className="bg-[#101721] px-1.5 py-0.5 rounded text-sky-300 font-mono">{payload.phone || "Não informado"}</code></div>
                <div>📍 <b>Origem:</b> {payload.source || "Formulário do Site"}</div>
              </div>

              {payload.message && (
                <div className="pt-2 border-t border-[#2b3a4a]">
                  <div className="text-slate-400 font-medium mb-1">💬 <b>Mensagem:</b></div>
                  <div className="italic text-slate-300 bg-[#101721] p-2.5 rounded-lg border-l-2 border-sky-500">
                    "{payload.message}"
                  </div>
                </div>
              )}

              {/* Inline Action Button in Telegram */}
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-center transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>📲 Acelerar Atendimento via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: WhatsApp Link Inspector */}
      {activeTab === "whatsapp" && (
        <div className="p-6 bg-slate-950 min-h-[520px] space-y-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <MessageSquare className="w-5 h-5" />
                  <span>URL Acelerada do WhatsApp (Direct Fast-Track)</span>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                  +55 35 99905-7566
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  URL Gerada Dinamicamente:
                </label>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 break-all">
                  {whatsappUrl}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleCopyWhatsappLink}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-2 transition-colors border border-slate-700"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Testar Link no WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Text Message Structure */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Texto Decodificado da Mensagem de Aceleração:
              </h4>
              <div className="bg-slate-950 p-4 rounded-xl text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-800">
                {`Olá, Rafael!
Acabei de enviar o formulário no seu site (francorafael.com) e gostaria de agilizar o meu atendimento sobre o projeto de ${payload.service || 'desenvolvimento'}.
Meus dados para referência:
📌 Nome: ${payload.name || 'Cliente'}
📌 Empresa: ${payload.company?.trim() ? payload.company : 'Particular'}
Aguardo seu retorno!`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: JSON Output */}
      {activeTab === "json" && (
        <div className="p-6 bg-slate-950 min-h-[520px]">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Retorno da Chamada ao Worker (HTTP 200 OK):
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                application/json
              </span>
            </div>

            <pre className="bg-slate-900 p-4 rounded-xl text-xs font-mono text-emerald-300 border border-slate-800 overflow-x-auto leading-relaxed">
              {JSON.stringify(
                lastResponse || {
                  success: true,
                  message: "Aguardando disparo do webhook...",
                  payloadEnviado: payload
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
