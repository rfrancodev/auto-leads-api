export interface WebhookPayload {
  id: string;
  name: string;
  company: string;
  phone: string;
  service: string;
  budget: string;
  email: string;
  message: string;
  source: string;
}

export interface WorkerResponse {
  success: boolean;
  message: string;
  error?: string;
  data?: {
    id: string;
    firstName: string;
    company: string;
    whatsappUrl: string;
    telegramNotification?: {
      sent: boolean;
      error?: string | null;
    };
    emailConfirmation?: {
      sent: boolean;
      error?: string | null;
    };
  };
}

export interface EnvCredentials {
  telegramBotToken: string;
  telegramChatId: string;
  resendApiKey: string;
  emailFrom: string;
}

export interface PresetLead {
  label: string;
  icon: string;
  data: WebhookPayload;
}
