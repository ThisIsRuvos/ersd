
export interface IEmailRequest {
  subject: string;
  message: string;
}

export interface IEmailExportRequest {
  exportTypeOrigin: 'Subscription' | 'Person' | 'Both' | '';
}
