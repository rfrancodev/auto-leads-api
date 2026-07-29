import React, { useState } from "react";
import { Copy, Check, FileCode, Terminal, Lock, Package, FileText, ExternalLink } from "lucide-react";

interface FileEntry {
  filename: string;
  path: string;
  language: string;
  icon: React.ReactNode;
  content: string;
  description: string;
}

interface Props {
  workerCode: string;
  wranglerToml: string;
  envExample: string;
  gitignore: string;
  packageJson: string;
  readmeMd: string;
}

export const CodeExplorer: React.FC<Props> = ({
  workerCode,
  wranglerToml,
  envExample,
  gitignore,
  packageJson,
  readmeMd
}) => {
  const files: FileEntry[] = [
    {
      filename: "src/index.js",
      path: "src/index.js",
      language: "javascript",
      icon: <FileCode className="w-4 h-4 text-sky-400" />,
      content: workerCode,
      description: "Código fonte do Cloudflare Module Worker (CORS, Telegram Bot API, Resend Email, WhatsApp Link)"
    },
    {
      filename: "wrangler.toml",
      path: "wrangler.toml",
      language: "toml",
      icon: <Terminal className="w-4 h-4 text-orange-400" />,
      content: wranglerToml,
      description: "Manifesto de configuração e deploy do Cloudflare Workers"
    },
    {
      filename: ".env.example",
      path: ".env.example",
      language: "bash",
      icon: <Lock className="w-4 h-4 text-emerald-400" />,
      content: envExample,
      description: "Modelo de variáveis de ambiente e documentação dos segredos"
    },
    {
      filename: ".gitignore",
      path: ".gitignore",
      language: "bash",
      icon: <Lock className="w-4 h-4 text-rose-400" />,
      content: gitignore,
      description: "Regras de exclusão do Git protegendo .env e .dev.vars"
    },
    {
      filename: "package.json",
      path: "package.json",
      language: "json",
      icon: <Package className="w-4 h-4 text-purple-400" />,
      content: packageJson,
      description: "Dependências do projeto incluindo SDK Resend"
    },
    {
      filename: "README.md",
      path: "README.md",
      language: "markdown",
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      content: readmeMd,
      description: "Guia completo de deploy com comandos do CLI Wrangler e registro de segredos"
    }
  ];

  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = files[selectedFileIdx];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden space-y-0">
      {/* Top Header */}
      <div className="bg-slate-950 border-b border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <span>Explorador de Arquivos Gerados</span>
            <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-sky-400 border border-slate-700">
              6 Arquivos Prontos
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Copie o código fonte dos arquivos individualmente para subir no repositório ou Cloudflare.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all hover:scale-105"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Copiado com Sucesso!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar {activeFile.filename}</span>
            </>
          )}
        </button>
      </div>

      {/* File Navigation Tabs */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2 flex flex-wrap gap-1.5 overflow-x-auto">
        {files.map((file, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedFileIdx(idx)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              selectedFileIdx === idx
                ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            {file.icon}
            <span>{file.filename}</span>
          </button>
        ))}
      </div>

      {/* File Description Banner */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
        <span className="font-mono text-sky-400 font-medium">{activeFile.path}</span>
        <span className="text-slate-400 italic hidden sm:inline">{activeFile.description}</span>
      </div>

      {/* Code Editor Preview Box */}
      <div className="p-4 bg-slate-950 overflow-x-auto min-h-[480px]">
        <pre className="text-xs font-mono text-slate-200 leading-relaxed font-normal">
          <code>{activeFile.content}</code>
        </pre>
      </div>
    </div>
  );
};
