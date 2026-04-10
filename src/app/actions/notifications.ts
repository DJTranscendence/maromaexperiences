'use server';

/**
 * @fileOverview Server actions for handling email notifications via Postmark.
 */

const POSTMARK_API_KEY = "28bd521a-3c8c-4d7e-bf77-ed84a7c5689d";
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
    
    if (!response.ok) {
      console.error("Postmark API Response Error:", {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
    }

    return { ok: response.ok, data };
  } catch (err: any) {
    console.error("Postmark Fetch Error:", err.message);
    return { ok: false, data: { Message: err.message } };
  }
}

/**
 * Sends an email to the customer and a separate, distinct alert to the admin.
 */
export async function sendEmailNotification({
  to,
  subject,
  textBody,
  htmlBody
}: EmailParams) {
  if (!to) {
    console.warn("Attempted to send notification without recipient email.");
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
  // Failure here doesn't stop the customer result, but we await it for sequencing
  await postmarkRequest({
    To: ADMIN_EMAIL,
    Subject: `[ADMIN ALERT] ${subject}`,
    TextBody: `--- ADMINISTRATIVE NOTIFICATION ---\n\nRecipient: ${to}\nOriginal Subject: ${subject}\n\nMessage Content:\n------------------------------\n${textBody}\n------------------------------\n\nView recent bookings: https://maromaexperience.com/admin`,
  });

  if (!customerResult.ok) {
    return { 
      success: false, 
      error: customerResult.data.Message || "Postmark delivery failed. Check server logs." 
    };
  }

  return { success: true, messageId: customerResult.data.MessageID };
}
