import nodemailer from 'nodemailer';

// Configure Nodemailer for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // NOTE: Use an "App Password" if 2FA is on
  },
});

interface EmailParams {
    to: string;
    userName: string;
    petName: string;
    serviceName: string;
    dateStr: string;
    timeStr: string;
}

export async function sendBookingConfirmation({
    to,
    userName,
    petName,
    serviceName,
    dateStr,
    timeStr
}: EmailParams) {

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.warn("⚠️ GMAIL_USER or GMAIL_PASS missing. Email not sent.");
        return;
    }

    try {
        await transporter.sendMail({
            from: `"Patinhas na Lua" <${process.env.GMAIL_USER}>`,
            to: to,
            subject: '📅 Confirmação de Agendamento - Patinhas na Lua',
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Olá ${userName}! 👋</h1>
          <p>O agendamento para o(a) <strong>${petName}</strong> foi confirmado com sucesso.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>🐾 Pet:</strong> ${petName}</p>
            <p style="margin: 5px 0;"><strong>✂️ Serviço:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${dateStr}</p>
            <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> ${timeStr}</p>
          </div>

          <p>Estamos ansiosos para vos receber!</p>
          <p>Se precisar de alterar, por favor contacte-nos.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888;">Patinhas na Lua 🌙<br>Tondela</p>
        </div>
      `
        });
        console.log("✅ Email sent successfully to:", to);
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
}

export async function sendAppointmentReminder({
    to,
    userName,
    petName,
    dateStr,
    timeStr
}: Omit<EmailParams, "serviceName">) {

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;

    try {
        await transporter.sendMail({
            from: `"Patinhas na Lua" <${process.env.GMAIL_USER}>`,
            to: to,
            subject: '⏰ Lembrete: O seu agendamento é amanhã! - Patinhas na Lua',
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ea580c;">Olá ${userName}! 👋</h1>
          <p>Este é um lembrete amigável de que o <strong>${petName}</strong> tem consulta marcada para amanhã.</p>
          
          <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fdba74;">
            <p style="margin: 5px 0;"><strong>🐾 Pet:</strong> ${petName}</p>
            <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${dateStr}</p>
            <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> ${timeStr}</p>
          </div>

          <p>Se tiver algum imprevisto, agradecemos que nos avise com antecedência (WhatsApp ou Telefone).</p>
          <p>Até amanhã!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888;">Patinhas na Lua 🌙<br>Tondela</p>
        </div>
      `
        });
        console.log("✅ Reminder sent successfully to:", to);
    } catch (error) {
        console.error("❌ Failed to send reminder:", error);
    }
}

export async function sendAppointmentCancellation({
    to,
    userName,
    petName,
    serviceName,
    dateStr,
    timeStr,
    reason
}: EmailParams & { reason: string }) {

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.log("No GMAIL Interface - skipping cancellation email to " + to);
        return;
    }

    try {
        await transporter.sendMail({
            from: `"Patinhas na Lua" <${process.env.GMAIL_USER}>`,
            to: to,
            subject: '🚫 Agendamento Cancelado - Patinhas na Lua',
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Olá ${userName}.</h1>
          <p>Lamentamos informar que o agendamento para o(a) <strong>${petName}</strong> teve de ser cancelado.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
            <p style="margin: 5px 0;"><strong>Motivo:</strong> ${reason}</p>
            <hr style="border: none; border-top: 1px solid #fecaca; margin: 10px 0;" />
            <p style="margin: 5px 0;"><strong>📅 Data Original:</strong> ${dateStr}</p>
            <p style="margin: 5px 0;"><strong>✂️ Serviço:</strong> ${serviceName}</p>
          </div>

          <p>Por favor entre em contacto connosco para reagendar ou esclarecer qualquer dúvida.</p>
          <p>Pedimos desculpa pelo incómodo.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888;">Patinhas na Lua 🌙<br>Tondela</p>
        </div>
      `
        });
        console.log("✅ Cancellation email sent to:", to);
    } catch (error) {
        console.error("❌ Failed to send cancellation email:", error);
    }
}
