import React from "react";
import { Terminal, ShieldAlert, Key, CheckCircle2, Rocket, Cloud, Lock } from "lucide-react";

export const DeployGuide: React.FC = () => {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">
            Guia Rápido de Deploy & Registro de Segredos (Wrangler CLI)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Siga estes 4 passos para colocar seu Cloudflare Worker no ar em menos de 2 minutos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Step 1 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-sky-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px]">1</span>
            <span>1. Criar o arquivo wrangler.toml na pasta local</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            O Wrangler precisa do arquivo <code className="text-sky-300">wrangler.toml</code> na pasta <code className="text-sky-300">api-leads</code> para saber o nome do Worker:
          </p>
          <pre className="bg-slate-900 p-3 rounded-lg font-mono text-emerald-300 border border-slate-800">
            {`# Crie o arquivo wrangler.toml na pasta api-leads
name = "site-webhook-processor"
main = "src/index.js"
compatibility_date = "2024-09-25"
compatibility_flags = ["nodejs_compat"]`}
          </pre>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px]">2</span>
            <span>2. Autenticar & Enviar os Segredos</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Com o arquivo <code className="text-sky-300">wrangler.toml</code> presente, envie os segredos (ou use <code className="text-sky-300">--name site-webhook-processor</code>):
          </p>
          <pre className="bg-slate-900 p-3 rounded-lg font-mono text-emerald-300 border border-slate-800">
            npx wrangler secret put TELEGRAM_BOT_TOKEN{"\n"}
            npx wrangler secret put TELEGRAM_CHAT_ID{"\n"}
            npx wrangler secret put RESEND_API_KEY
          </pre>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">3</span>
            <span>3. Salvar os arquivos do código (src/index.js)</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Crie a pasta <code className="text-sky-300">src</code> dentro de <code className="text-sky-300">api-leads</code> e cole o código do Worker em <code className="text-sky-300">src/index.js</code>.
          </p>
          <pre className="bg-slate-900 p-3 rounded-lg font-mono text-emerald-300 border border-slate-800">
            mkdir -p src{"\n"}
            # Salve o código de src/index.js nessa pasta
          </pre>
        </div>

        {/* Step 4 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">4</span>
            <span>4. Publicar para a Nuvem Cloudflare</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Implante o Worker para obter sua URL pública instantânea:
          </p>
          <pre className="bg-slate-900 p-3 rounded-lg font-mono text-emerald-300 border border-slate-800">
            npx wrangler deploy
          </pre>
        </div>
      </div>

      {/* Security Best Practices Reminder */}
      <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl text-xs text-amber-200 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-300">Lembrete de Segurança & Boas Práticas:</div>
          <p className="opacity-90 leading-relaxed text-[11px]">
            Certifique-se de que o arquivo <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300">.env</code> e <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300">.dev.vars</code> permaneçam listados dentro do <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300">.gitignore</code> para evitar vazamento acidental de tokens no GitHub.
          </p>
        </div>
      </div>
    </div>
  );
};
