import React, { useState } from "react";
import { Copy, Check, FileText, Server, ShieldCheck, CheckCircle2, Code2 } from "lucide-react";

export const OPENAPI_SPEC_YAML = `openapi: 3.0.3
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

components:
  schemas:
    LeadPayload:
      type: object
      required:
        - name
        - email
      properties:
        id:
          type: string
          description: Identificador único da conversão do lead.
        name:
          type: string
          description: Nome completo do contato.
        company:
          type: string
          description: Nome da empresa (ou "Não informada").
        phone:
          type: string
          description: Número de telefone/WhatsApp com DDD.
        service:
          type: string
          description: Tipo de serviço solicitado.
        budget:
          type: string
          description: Faixa de orçamento estimada.
        email:
          type: string
          format: email
          description: E-mail do cliente.
        message:
          type: string
          description: Mensagem adicional ou detalhes do projeto.
        source:
          type: string
          description: Canal de origem do formulário.

    SuccessResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
          example: "Formulário processado com sucesso!"
        data:
          type: object
          properties:
            id:
              type: string
            firstName:
              type: string
              example: "Rafael"
            company:
              type: string
              example: "Franco Dev & AI Solutions"
            whatsappUrl:
              type: string
              example: "https://wa.me/5535999057566?text=..."
            telegramNotification:
              type: object
              properties:
                sent:
                  type: boolean
                error:
                  type: string
                  nullable: true
            emailConfirmation:
              type: object
              properties:
                sent:
                  type: boolean
                error:
                  type: string
                  nullable: true

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
          example: "Bad Request"
        message:
          type: string
          example: "O campo 'email' é obrigatório."
`;

export const SwaggerViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"ui" | "yaml">("ui");

  const handleCopy = () => {
    navigator.clipboard.writeText(OPENAPI_SPEC_YAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>Especificação OpenAPI 3.0 (Swagger)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                v1.0.0 RESTful
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Documentação padronizada do endpoint de Webhook do Cloudflare Worker para recrutadores e desenvolvedores.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveView("ui")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === "ui"
                  ? "bg-slate-800 text-emerald-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Interface Interativa
            </button>
            <button
              type="button"
              onClick={() => setActiveView("yaml")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === "yaml"
                  ? "bg-slate-800 text-emerald-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Código YAML
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-2 border border-slate-700 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar YAML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {activeView === "ui" ? (
        <div className="space-y-6 text-xs">
          {/* Server Badge */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <div className="text-slate-300 font-bold">Production Edge Server</div>
                <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                  https://site-webhook-processor.francorafael.workers.dev
                </div>
              </div>
            </div>
            <span className="text-[11px] bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full border border-sky-500/20 font-semibold">
              Global Cloudflare Anycast (300+ Edge Locations)
            </span>
          </div>

          {/* Endpoint Card */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-mono">
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                  POST
                </span>
                <span className="text-slate-100 font-bold text-sm">/api/webhook</span>
              </div>
              <span className="text-slate-400 text-[11px]">Processar Lead & Notificar Canais</span>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Recebe o payload JSON de formulários de contato, higieniza os campos, envia notificação formatada para o Telegram, engatilha o e-mail transacional HTML via Resend API e gera o link de contato imediato do WhatsApp Fast-Track.
              </p>

              {/* Request Body Specs */}
              <div className="space-y-2">
                <div className="font-bold text-slate-200 flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <span>Request Body (application/json)</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">Campo</th>
                        <th className="pb-2">Tipo</th>
                        <th className="pb-2">Obrigatório</th>
                        <th className="pb-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      <tr>
                        <td className="py-2 text-sky-300 font-bold">name</td>
                        <td className="py-2 text-indigo-300">string</td>
                        <td className="py-2 text-emerald-400 font-bold">Sim</td>
                        <td className="py-2 text-slate-400">Nome completo do contato</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-sky-300 font-bold">email</td>
                        <td className="py-2 text-indigo-300">string (email)</td>
                        <td className="py-2 text-emerald-400 font-bold">Sim</td>
                        <td className="py-2 text-slate-400">E-mail do destinatário para envio do e-mail HTML</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-sky-300 font-bold">company</td>
                        <td className="py-2 text-indigo-300">string</td>
                        <td className="py-2 text-amber-400">Opcional</td>
                        <td className="py-2 text-slate-400">Nome da empresa (tratado automaticamente se vazio)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-sky-300 font-bold">phone</td>
                        <td className="py-2 text-indigo-300">string</td>
                        <td className="py-2 text-amber-400">Opcional</td>
                        <td className="py-2 text-slate-400">Número de telefone/WhatsApp com DDD</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-sky-300 font-bold">service</td>
                        <td className="py-2 text-indigo-300">string</td>
                        <td className="py-2 text-amber-400">Opcional</td>
                        <td className="py-2 text-slate-400">Serviço solicitado (ex: Soluções de IA)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-sky-300 font-bold">budget</td>
                        <td className="py-2 text-indigo-300">string</td>
                        <td className="py-2 text-amber-400">Opcional</td>
                        <td className="py-2 text-slate-400">Estimativa de investimento para o projeto</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response Codes */}
              <div className="space-y-2">
                <div className="font-bold text-slate-200">HTTP Responses</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-slate-900 p-3 rounded-lg border border-emerald-500/30 space-y-1">
                    <div className="font-mono font-bold text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>200 OK</span>
                    </div>
                    <p className="text-slate-400">Lead processado, e-mail enfileirado no Resend e notificação entregue no Telegram.</p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-amber-500/30 space-y-1">
                    <div className="font-mono font-bold text-amber-400">400 Bad Request</div>
                    <p className="text-slate-400">Payload JSON ausente ou falta de campos obrigatórios (nome e e-mail).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto min-h-[400px]">
          <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
            <code>{OPENAPI_SPEC_YAML}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
