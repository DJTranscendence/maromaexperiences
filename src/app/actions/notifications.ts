'use server';

/**
 * @fileOverview Server actions for handling email notifications via Postmark.
 */

const POSTMARK_API_KEY = "05f9ac9f-6a50-4119-8924-410f25432adc";
const SENDER_EMAIL = "booking@maromaexperience.com";
const ADMIN_EMAIL = "indispirit@gmail.com";

interface EmailParams {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
}

/**
 * Sends an email via Postmark and CCs the admin.
 */
export async function sendEmailNotification({
  to,
  subject,
  textBody,
  htmlBody
}: EmailParams) {
  if (!to) {
    return { success: false, error: "Recipient email is required" };
  }

  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": POSTMARK_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        From: SENDER_EMAIL,
        To: to,
        Cc: ADMIN_EMAIL, 
        Subject: subject,
        TextBody: textBody,
        HtmlBody: htmlBody || textBody.replace(/\n/g, '<br>'),
        MessageStream: "outbound"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Postmark API Error:", data);
      return { success: false, error: data.Message || "Failed to send email" };
    }

    return { success: true, messageId: data.MessageID };
  } catch (err: any) {
    console.error("Network error sending email:", err);
    return { success: false, error: err.message };
  }
}
