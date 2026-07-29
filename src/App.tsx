import React, { useState } from "react";
import { WebhookPayload, EnvCredentials, WorkerResponse } from "./types";
import { PRESET_LEADS } from "./utils/presets";
import { Header } from "./components/Header";
import { WebhookSimulator } from "./components/WebhookSimulator";
import { LivePreviews } from "./components/LivePreviews";
import { CodeExplorer } from "./components/CodeExplorer";
import { DeployGuide } from "./components/DeployGuide";
import { SwaggerViewer } from "./components/SwaggerViewer";
import { Play, FileCode, Rocket, BookOpen, Sparkles } from "lucide-react";

// Code strings for file explorer
import {
  WORKER_CODE,
  WRANGLER_TOML,
  ENV_EXAMPLE,
  GITIGNORE,
  PACKAGE_JSON,
  README_MD
} from "./utils/codeStrings";

export default function App() {
  const [activeMainTab, setActiveMainTab] = useState<"simulator" | "code" | "swagger" | "deploy">("simulator");

  const [payload, setPayload] = useState<WebhookPayload>(PRESET_LEADS[0].data);

  const [envCredentials, setEnvCredentials] = useState<EnvCredentials>({
    telegramBotToken: "",
    telegramChatId: "",
    resendApiKey: "",
    emailFrom: "Rafael Franco <contato@francorafael.com>"
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<WorkerResponse | null>(null);

  const handleExecuteWebhook = async () => {
    setIsLoading(true);
    setLastResponse(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (envCredentials.telegramBotToken) headers["x-telegram-bot-token"] = envCredentials.telegramBotToken;
      if (envCredentials.telegramChatId) headers["x-telegram-chat-id"] = envCredentials.telegramChatId;
      if (envCredentials.resendApiKey) headers["x-resend-api-key"] = envCredentials.resendApiKey;
      if (envCredentials.emailFrom) headers["x-email-from"] = envCredentials.emailFrom;

      const response = await fetch("/api/webhook", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const data: WorkerResponse = await response.json();
      setLastResponse(data);
    } catch (err: any) {
      setLastResponse({
        success: false,
        message: "Erro de comunicação com o servidor local do simulador.",
        error: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white pb-16">
      {/* Top Header */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMainTab("simulator")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeMainTab === "simulator"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Simulador & Previews ao Vivo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("code")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeMainTab === "code"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Código do Worker</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("swagger")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeMainTab === "swagger"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>OpenAPI / Swagger 3.0</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("deploy")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeMainTab === "deploy"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Rocket className="w-4 h-4" />
              <span>Guia de Deploy (CLI)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Resend HTML + Telegram Bot + WhatsApp Fast-Track</span>
          </div>
        </div>

        {/* Tab 1: Simulator & Live Previews */}
        {activeMainTab === "simulator" && (
          <div className="space-y-6">
            <WebhookSimulator
              payload={payload}
              onChangePayload={setPayload}
              envCredentials={envCredentials}
              onChangeEnv={setEnvCredentials}
              onExecuteWebhook={handleExecuteWebhook}
              isLoading={isLoading}
              lastResponse={lastResponse}
            />

            <LivePreviews
              payload={payload}
              lastResponse={lastResponse}
            />
          </div>
        )}

        {/* Tab 2: Code Explorer */}
        {activeMainTab === "code" && (
          <CodeExplorer
            workerCode={WORKER_CODE}
            wranglerToml={WRANGLER_TOML}
            envExample={ENV_EXAMPLE}
            gitignore={GITIGNORE}
            packageJson={PACKAGE_JSON}
            readmeMd={README_MD}
          />
        )}

        {/* Tab 3: OpenAPI Swagger Spec */}
        {activeMainTab === "swagger" && (
          <SwaggerViewer />
        )}

        {/* Tab 4: Deploy Guide */}
        {activeMainTab === "deploy" && (
          <DeployGuide />
        )}
      </main>
    </div>
  );
}
