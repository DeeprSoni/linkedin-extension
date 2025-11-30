declare module 'nodemailer' {
  export type Transporter = {
    sendMail: (mailOptions: any) => Promise<any>;
  };

  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: { user?: string; pass?: string };
  }

  const nodemailer: {
    createTransport: (options: TransportOptions) => Transporter;
  };

  export default nodemailer;
}
