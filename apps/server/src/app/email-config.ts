
export interface IEmailConfig {
  from: string;
  host: string;
  port: number;
  tls: boolean;
  username?: string;
  password?: string;
}
