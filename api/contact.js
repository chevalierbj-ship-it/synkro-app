import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email où recevoir les messages de contact
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'chevalierbj@gmail.com';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, email et message sont requis' });
  }

  // Validation email basique
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  // Vérification anti-spam basique (honeypot serait côté front)
  if (name.length > 100 || email.length > 100 || message.length > 5000) {
    return res.status(400).json({ error: 'Données invalides' });
  }

  console.log(`📧 New contact message from ${name} (${email})`);

  try {
    // Envoyer l'email à l'admin via Resend
    await resend.emails.send({
      from: 'Synkro Contact <noreply@getsynkro.com>',
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[Synkro Contact] ${subject || 'Nouveau message'} - ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 24px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📬 Nouveau message de contact</h1>
          </div>

          <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 16px 16px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>De :</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Email :</strong></td>
                <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #8B5CF6;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Sujet :</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${subject || 'Non spécifié'}</td>
              </tr>
            </table>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="margin: 0 0 12px 0; color: #6b7280;"><strong>Message :</strong></p>
            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${message}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Ce message a été envoyé depuis le formulaire de contact de Synkro.<br>
              Vous pouvez répondre directement à cet email pour contacter ${name}.
            </p>
          </div>
        </div>
      `,
    });

    // Envoyer un email de confirmation à l'utilisateur
    await resend.emails.send({
      from: 'Synkro <noreply@getsynkro.com>',
      to: email,
      subject: '✨ Message bien reçu ! - Synkro',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Coucou ${name} ! 👋</h1>
          </div>

          <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0; line-height: 1.6;">
              Merci pour ton message ! On l'a bien reçu et on te répond très vite (généralement sous 24h).
            </p>

            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
                <strong>Ton message :</strong>
              </p>
              <p style="margin: 0; color: #374151; white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>

            <p style="font-size: 16px; color: #374151; margin: 0 0 8px 0;">
              À très vite ! ✨
            </p>

            <p style="font-size: 16px; color: #8B5CF6; margin: 0; font-weight: 600;">
              L'équipe Synkro
            </p>
          </div>
        </div>
      `,
    });

    console.log('✅ Contact emails sent successfully');

    return res.status(200).json({
      success: true,
      message: 'Message envoyé avec succès'
    });

  } catch (error) {
    console.error('❌ Error sending contact email:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
}
