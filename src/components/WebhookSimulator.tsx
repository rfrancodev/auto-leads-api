import React, { useState } from "react";
import { WebhookPayload, EnvCredentials, WorkerResponse } from "../types";
import { PRESET_LEADS } from "../utils/presets";
import { Play, Settings, RefreshCw, CheckCircle2, AlertTriangle, Key, Sparkles } from "lucide-react";

interface Props {
  payload: WebhookPayload;
  onChangePayload: (newPayload: WebhookPayload) => void;
  envCredentials: EnvCredentials;
  onChangeEnv: (newEnv: EnvCredentials) => void;
  onExecuteWebhook: () => Promise<void>;
  isLoading: boolean;
  lastResponse: WorkerResponse | null;
}

export const WebhookSimulator: React.FC<Props> = ({
  payload,
  onChangePayload,
  envCredentials,
  onChangeEnv,
  onExecuteWebhook,
  isLoading,
  lastResponse
}) => {
  const [showEnvSettings, setShowEnvSettings] = useState(false);

  const handleFieldChange = (field: keyof WebhookPayload, value: string) => {
    onChangePayload({
      ...payload,
      [field]: value
    });
  };

  const handleApplyPreset = (preset: typeof PRESET_LEADS[0]) => {
    onChangePayload({
      ...preset.data,
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    });
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Simulador de Webhook (POST Form)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Preencha os dados abaixo para testar em tempo real a lógica do Cloudflare Worker.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowEnvSettings(!showEnvSettings)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors border ${
            showEnvSettings
              ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Configurar Segredos (env)</span>
        </button>
      </div>

      {/* Preset Buttons */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Carregar Exemplos Rápidos:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_LEADS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/40 text-left transition-all text-xs text-slate-200 flex items-center space-x-2 group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">{preset.icon}</span>
              <span className="truncate font-medium">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Env Settings Panel (Accordion) */}
      {showEnvSettings && (
        <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 text-slate-200 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Credenciais de Teste para Disparo Real (Opcional)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Se deixado em branco, a execução simula a resposta do Worker
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                TELEGRAM_BOT_TOKEN:
              </label>
              <input
                type="password"
                value={envCredentials.telegramBotToken}
                onChange={(e) => onChangeEnv({ ...envCredentials, telegramBotToken: e.target.value })}
                placeholder="Ex: 123456789:AA..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                TELEGRAM_CHAT_ID:
              </label>
              <input
                type="text"
                value={envCredentials.telegramChatId}
                onChange={(e) => onChangeEnv({ ...envCredentials, telegramChatId: e.target.value })}
                placeholder="Ex: 987654321"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                RESEND_API_KEY:
              </label>
              <input
                type="password"
                value={envCredentials.resendApiKey}
                onChange={(e) => onChangeEnv({ ...envCredentials, resendApiKey: e.target.value })}
                placeholder="Ex: re_12345..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                EMAIL_FROM:
              </label>
              <input
                type="text"
                value={envCredentials.emailFrom}
                onChange={(e) => onChangeEnv({ ...envCredentials, emailFrom: e.target.value })}
                placeholder="Rafael Franco <contato@francorafael.com>"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-medium text-slate-300 mb-1">
            Nome Completo <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={payload.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            placeholder="Ex: Rafael Franco"
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1 flex justify-between">
            <span>Empresa / Organização</span>
            <button
              type="button"
              onClick={() => handleFieldChange("company", "não informada")}
              className="text-[10px] text-sky-400 hover:underline"
            >
              Definir "não informada"
            </button>
          </label>
          <input
            type="text"
            value={payload.company}
            onChange={(e) => handleFieldChange("company", e.target.value)}
            placeholder="Ex: Google ou Deixe Vazio para Particular"
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1">
            E-mail do Cliente <span className="text-rose-400">*</span>
          </label>
          <input
            type="email"
            value={payload.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            placeholder="Ex: contato@francorafael.com"
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1">
            Telefone / WhatsApp
          </label>
          <input
            type="text"
            value={payload.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            placeholder="Ex: +55 (35) 99905-7566"
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1">
            Serviço Solicitado
          </label>
          <select
            value={payload.service}
            onChange={(e) => handleFieldChange("service", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
          >
            <option value="Desenvolvimento Web & Soluções de IA">Desenvolvimento Web & Soluções de IA</option>
            <option value="Criação de Agente de IA / Chatbot">Criação de Agente de IA / Chatbot</option>
            <option value="Integração de APIs & Cloudflare Workers">Integração de APIs & Cloudflare Workers</option>
            <option value="Plataforma SaaS sob medida">Plataforma SaaS sob medida</option>
            <option value="Consultoria Arquitetura Cloud">Consultoria Arquitetura Cloud</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1">
            Orçamento Estimado
          </label>
          <select
            value={payload.budget}
            onChange={(e) => handleFieldChange("budget", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
          >
            <option value="A combinar / Não informado">A combinar / Não informado</option>
            <option value="R$ 3.000 - R$ 5.000">R$ 3.000 - R$ 5.000</option>
            <option value="R$ 5.000 - R$ 10.000">R$ 5.000 - R$ 10.000</option>
            <option value="R$ 10.000 - R$ 25.000">R$ 10.000 - R$ 25.000</option>
            <option value="Acima de R$ 25.000">Acima de R$ 25.000</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block font-medium text-slate-300 mb-1">
            Mensagem do Lead
          </label>
          <textarea
            rows={2}
            value={payload.message}
            onChange={(e) => handleFieldChange("message", e.target.value)}
            placeholder="Escreva detalhes da mensagem ou requisitos do projeto..."
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
          />
        </div>
      </div>

      {/* Action Button & Status Output */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Endpoint local em escuta: <code className="bg-slate-950 px-2 py-0.5 rounded text-sky-300">POST /api/webhook</code></span>
        </div>

        <button
          type="button"
          onClick={onExecuteWebhook}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Executando Worker...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Disparar Webhook (POST)</span>
            </>
          )}
        </button>
      </div>

      {/* Execution Feedback Banner */}
      {lastResponse && (
        <div className={`p-4 rounded-xl border text-xs ${
          lastResponse.success
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
            : "bg-rose-950/40 border-rose-500/30 text-rose-200"
        }`}>
          <div className="flex items-start space-x-3">
            {lastResponse.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold text-sm">
                {lastResponse.message}
              </div>
              {lastResponse.data && (
                <div className="text-[11px] opacity-90 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span>ID: <code>{lastResponse.data.id}</code></span>
                  <span>Primeiro Nome Extraído: <strong>{lastResponse.data.firstName}</strong></span>
                  <span>Empresa Formatada: <strong>{lastResponse.data.company}</strong></span>
                  <span>Telegram: {lastResponse.data.telegramNotification?.sent ? "✅ Enviado" : "ℹ️ Simulado"}</span>
                  <span>E-mail Resend: {lastResponse.data.emailConfirmation?.sent ? "✅ Enviado" : "ℹ️ Simulado"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
