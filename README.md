# ⚡ Serverless Webhook Automation Engine & Lead Processor
> **Desenvolvido por Rafael Franco** | *Arquitetura Serverless em Edge Computing com Cloudflare Workers, Resend Email API, Telegram Bot API & WhatsApp Fast-Track*

---

## 🎯 Visão Geral & Competências Técnicas

Este projeto consiste em um **Engine Serverless de Alta Performance** concebido para capturar, validar, higienizar e processar webhooks de formulários web em tempo de execução ultra-rápido (*Cold Start de ~0ms*), operando na infraestrutura global de borda (*Edge Locations*) da Cloudflare.

Construído com foco em **Engenharia de Software, Resiliência e Segurança**, a solução resolve o problema crítico de perda de *leads* e latência de atendimento em plataformas digitais através de uma orquestração multicanal em tempo real:

- **Edge Computing Performance**: Execução nativa no runtime V8 do Cloudflare Workers em mais de 300 cidades no mundo.
- **Notificação Multicanal Instantânea**: Notifica a equipe de vendas no **Telegram Bot API** com formatação HTML e links diretos, dispara e-mail transacional estilizado via **Resend API** e gera o link de contato direto via **WhatsApp Fast-Track**.
- **Segurança & Zero-Hardcoding**: Chaves de API e tokens são gerenciados com criptografia no *Cloudflare Secrets Store*, sem expor valores sensíveis em código ou controle de versão (`.gitignore` estrito).
- **Validação & Higienização Inteligente**: Extração automática do primeiro nome para atendimento humanizado, escape de caracteres HTML para prevenir injeções de script (XSS) e tratamento para empresas não informadas.
- **Developer Experience (DX) & Test Bench**: Interface interativa completa integrada para simulação de webhooks, teste de credenciais e visualização ao vivo dos e-mails e alertas.

---

## 📐 Diagrama da Arquitetura de Execução

```
                    ┌─────────────────────────┐
                    │ Cliente / Webform Site  │
                    └────────────┬────────────┘
                                 │ POST /api/webhook (JSON)
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│        Cloudflare Edge Worker (300+ Edge Locations Global)       │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 1. Validação de Método & Headers CORS Preflight (OPTIONS)    │ │
│ │ 2. Sanitização do JSON & Higienização do Nome/Empresa         │ │
│ │ 3. Construção do Link Acelerado para WhatsApp                │ │
│ └──────────────────────────────┬───────────────────────────────┘ │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │ (Processamento Assíncrono Paralelo)           │
         ▼                                               ▼
┌──────────────────────────┐                   ┌──────────────────────────┐
│   Telegram Bot API       │                   │    Resend Email API      │
│ ┌──────────────────────┐ │                   │ ┌──────────────────────┐ │
│ │ Notificação HTML em  │ │                   │ │ E-mail Transacional   │ │
│ │ Tempo Real no Chat   │ │                   │ │ HTML com Branding     │ │
│ └──────────────────────┘ │                   │ └──────────────────────┘ │
└──────────────────────────┘                   └──────────────────────────┘
         │                                               │
         └───────────────────────┬───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │ Resposta JSON Estruturada│
                    │ Status 200 OK           │
                    └─────────────────────────┘
```

---

## 💡 Aplicação em Outros Projetos e Casos de Uso Reais

A arquitetura desacoplada e modular dessa API permite sua rápida adaptação para diversos cenários de mercado:

### 1. Checkout Abandonado e Recuperação em E-Commerce
* **Desafio**: Clientes que preenchem o formulário inicial de checkout mas não concluem a compra.
* **Solução**: O webhook aciona o Worker no momento do abandono. O sistema envia um e-mail transacional com cupom de desconto via Resend e notifica o time de suporte no Telegram com o link direto do WhatsApp do cliente para um contato proativo.

### 2. Qualified Lead Routing para SaaS B2B
* **Desafio**: Encaminhamento agilizado de pedidos de demonstração para os executivos de contas (*SDRs*).
* **Solução**: O Worker analisa a faixa orçamentária (*budget*) enviada no payload e roteia a mensagem para canais específicos no Telegram de acordo com o porte do cliente, disparando um e-mail de confirmação imediato com o link do Calendly para agendamento.

### 3. Agendamento Acelerado para Imobiliárias e Serviços de Alto Valor
* **Desafio**: Clientes que solicitam propostas de imobiliárias ou consultorias precisam de atendimento imediato sob risco de buscar concorrentes.
* **Solução**: O Worker gera uma mensagem pré-formatada e codificada no WhatsApp Fast-Track (`https://wa.me/55...`), permitindo que a equipe de vendas inicie o diálogo em 1 clique com todos os dados do formulário já preenchidos.

---

## 🧪 Interface Simuladora de Testes (DX Dashboard)

Para garantir facilidade de homologação por recrutadores e desenvolvedores sem a necessidade de ferramentas externas como Postman ou Curl, o projeto inclui um **Dashboard Interativo de Testes**:

### Orientação Básica de Uso:
1. **Seleção de Presets de Teste**: Clique nos botões de preset (ex: *Lead Completo*, *Sem Empresa*, *Orçamento Elevado*) para carregar estruturas de dados reais no editor JSON.
2. **Edição do Payload**: Modifique nome, e-mail ou mensagem diretamente na tela.
3. **Injeção de Credenciais de Teste**: Caso deseje testar seus próprios robôs do Telegram ou chaves da Resend, preencha a aba de credenciais de ambiente.
4. **Disparo do Webhook**: Clique em **"Disparar Webhook de Teste"**.
5. **Inspeção de Resultados**:
   - Veja o status da resposta HTTP (200 OK, tempo de execução em milissegundos).
   - Inspecione a visualização gráfica da mensagem entregue no Telegram.
   - Visualize a renderização completa do E-mail HTML enviado via Resend.
   - Clique no botão do WhatsApp Fast-Track para verificar a mensagem gerada.

---

## 📖 Especificação OpenAPI 3.0 (Swagger)

```yaml
openapi: 3.0.3
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
```

---

## 🔑 Segurança e Gestão de Segredos (Zero Hardcoding)

Todas as chaves de API e tokens sensíveis são mantidos em cofres criptografados da Cloudflare:

```bash
# Registrar Token do Bot do Telegram
npx wrangler secret put TELEGRAM_BOT_TOKEN --env=""

# Registrar ID do Chat do Telegram
npx wrangler secret put TELEGRAM_CHAT_ID --env=""

# Registrar Chave de API da Resend
npx wrangler secret put RESEND_API_KEY --env=""
```

---

## 🚢 Passo a Passo para Deploy em Produção

1. **Instalar Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Autenticar na conta Cloudflare**:
   ```bash
   npx wrangler login
   ```

3. **Deploy com 1 Comando**:
   ```bash
   npx wrangler deploy --env=""
   ```

---

### 👤 Autor & Contato
**Rafael Franco** - Engenheiro de Software & Especialista em Soluções Web & IA  
- E-mail: `rfrancodev@gmail.com`  
- Website: `https://francorafael.com`  
- WhatsApp: `+55 (35) 99905-7566`
