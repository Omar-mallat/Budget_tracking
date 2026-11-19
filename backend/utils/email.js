const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendInviteEmail({ to, inviterName, familyName, role, token }) {
  const link = `${process.env.FRONTEND_URL}/accept-invite/${token}`;

  const payload = {
    from: 'Family Finance <onboarding@resend.dev>',
    to,
    subject: `${inviterName} invited you to join "${familyName}" on Family Finance`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>You've been invited! 👨‍👩‍👧‍👦</h2>
        <p><strong>${inviterName}</strong> invited you to join the <strong>${familyName}</strong> family workspace as a <strong>${role}</strong> on Family Finance.</p>
        <p>Click below to create your account and start collaborating:</p>
        <p>
          <a href="${link}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Accept Invitation
          </a>
        </p>
        <p style="color:#888;font-size:12px;">This invite link expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await resend.emails.send(payload);
    if (!error) return;
    lastError = error;
    console.warn(`sendInviteEmail attempt ${attempt} failed:`, error.message || error);
  }
  throw new Error(`Failed to send invite email after 3 attempts: ${lastError?.message || lastError}`);
}

module.exports = { sendInviteEmail };
