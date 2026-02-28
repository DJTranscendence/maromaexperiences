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
 * Internal helper to interface with Postmark API
 */
async function postmarkRequest(payload: any) {
  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": POSTMARK_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        From: SENDER_EMAIL,
        MessageStream: "outbound"
      }),
    });

    const data = await response.json();
    return { ok: response.ok, data };
  } catch (err: any) {
    return { ok: false, data: { Message: err.message } };
  }
}

/**
 * Sends an email to the customer and a separate, distinct alert to the admin.
 * This separate-dispatch approach ensures high visibility in the admin's inbox
 * and prevents thread-grouping issues in Gmail.
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

  // 1. Send the primary email to the Customer
  const customerResult = await postmarkRequest({
    To: to,
    Subject: subject,
    TextBody: textBody,
    HtmlBody: htmlBody || textBody.replace(/\n/g, '<br>')
  });

  // 2. Send a separate alert to the Admin
  // We use a distinct subject prefix to ensure it stands out in the admin console.
  await postmarkRequest({
    To: ADMIN_EMAIL,
    Subject: `[ADMIN ALERT] ${subject}`,
    TextBody: `--- ADMINISTRATIVE NOTIFICATION ---\n\nRecipient: ${to}\nOriginal Subject: ${subject}\n\nMessage Content:\n------------------------------\n${textBody}\n------------------------------\n\nView recent bookings: https://maromaexperience.com/admin`,
  });

  if (!customerResult.ok) {
    console.error("Postmark API Error (Customer):", customerResult.data);
    return { success: false, error: customerResult.data.Message || "Failed to send email" };
  }

  return { success: true, messageId: customerResult.data.MessageID };
}
