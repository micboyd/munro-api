import { Resend } from "resend";

export async function sendConfirmationEmail({ username, token }) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const confirmUrl = `${process.env.APP_URL ?? "https://munrolocator.com"}/confirm?token=${token}`;
    const from = process.env.EMAIL_FROM ?? "noreply@munrolocator.com";

    await resend.emails.send({
        from,
        to: username,
        subject: "Confirm your Munro Locator account",
        html: `
            <p>Hi ${username},</p>
            <p>Thanks for registering. Click the link below to confirm your account:</p>
            <p><a href="${confirmUrl}">${confirmUrl}</a></p>
            <p>This link expires in 24 hours.</p>
            <p>If you didn't create an account, you can ignore this email.</p>
        `,
    });
}
