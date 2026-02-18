'use server';
/**
 * @fileOverview A Genkit flow for generating personalized booking notifications.
 *
 * - generateBookingNotification - A function that handles the notification generation process.
 * - GenerateBookingNotificationInput - The input type for the generateBookingNotification function.
 * - GenerateBookingNotificationOutput - The return type for the generateBookingNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BookingDetailsSchema = z.object({
  bookingId: z.string().describe('Unique identifier for the booking.'),
  tourName: z.string().describe('Name of the tour or workshop booked.'),
  tourDate: z.string().describe('Date of the tour (e.g., "YYYY-MM-DD").'),
  tourTime: z.string().describe('Time of the tour (e.g., "HH:MM AM/PM").'),
  numberOfGuests: z.number().describe('Number of guests included in the booking.'),
  bookedBy: z.string().describe("Name of the person who made the booking."),
  bookerEmail: z.string().email().describe("Email address of the booker."),
  bookerPhone: z.string().optional().describe("Phone number of the booker for WhatsApp/Telegram contact, if available. Format: E.164 (e.g., '+1234567890')."),
});
export type BookingDetails = z.infer<typeof BookingDetailsSchema>;

const GenerateBookingNotificationInputSchema = z.object({
  eventType: z.enum([
    'booking_confirmation',
    'minimum_group_size_reached',
    'booking_update',
    'booking_reminder',
    'cancellation',
    'custom_message'
  ]).describe('Type of booking event triggering the notification.'),
  recipientType: z.enum(['booker', 'facilitator', 'admin']).describe('Type of recipient for the notification.'),
  bookingDetails: BookingDetailsSchema.describe('Detailed information about the booking.'),
  currentBookedSpaces: z.number().optional().describe('Current number of booked spaces, relevant for "minimum_group_size_reached" event type.'),
  minGroupSize: z.number().optional().describe('Minimum group size required for the tour, relevant for "minimum_group_size_reached" event type.'),
  customMessageText: z.string().optional().describe('Optional custom message text to be incorporated for "custom_message" event type.'),
  bookingDetailsBaseUrl: z.string().url().describe('Base URL for the booking details page (e.g., "https://maroma.com/bookings").'),
  supportEmailAddress: z.string().email().describe('Maroma Experiences support email address.'),
  supportWhatsappNumber: z.string().optional().describe('Maroma Experiences support WhatsApp number, if available. Format: E.164 (e.g., "+1234567890").'),
  supportTelegramHandle: z.string().optional().describe('Maroma Experiences support Telegram handle (e.g., "maromasupport"), if available.'),
});
export type GenerateBookingNotificationInput = z.infer<typeof GenerateBookingNotificationInputSchema>;

const GenerateBookingNotificationOutputSchema = z.object({
  message: z.string().describe('The personalized and formatted notification message.'),
  bookingDetailsLink: z.string().url().nullable().optional().describe('Full URL to view booking details, if relevant. Null if not relevant.'),
  emailContactLink: z.string().url().nullable().optional().describe('Full mailto: URL for direct email contact, if relevant. Null if not relevant.'),
  whatsappContactLink: z.string().url().nullable().optional().describe('Full URL for direct WhatsApp chat, if relevant. Null if not relevant.'),
  telegramContactLink: z.string().url().nullable().optional().describe('Full URL for direct Telegram chat, if relevant. Null if not relevant.'),
});
export type GenerateBookingNotificationOutput = z.infer<typeof GenerateBookingNotificationOutputSchema>;

// Internal schema for prompt output, which will then be processed into the final output schema
const PromptOutputSchema = z.object({
  message: z.string().describe('The personalized and formatted notification message.'),
  bookingDetailsLinkFragment: z.string().nullable().optional().describe('Relative path or ID for booking details, e.g., "{{bookingId}}". Null if not relevant. Flow will combine with base URL.'),
  emailContactTarget: z.string().nullable().optional().describe('Email address to contact. Null if not relevant.'),
  emailContactSubject: z.string().nullable().optional().describe('Subject for the email. Null if not relevant.'),
  whatsappContactTargetPhone: z.string().nullable().optional().describe('Phone number for WhatsApp contact. Null if not relevant.'),
  whatsappContactMessage: z.string().nullable().optional().describe('Message for WhatsApp chat. Null if not relevant.'),
  telegramContactTargetHandleOrPhone: z.string().nullable().optional().describe('Telegram handle or phone number for contact. Null if not relevant. For phone numbers, ensure to prefix with "+".'),
});

const generateNotificationPrompt = ai.definePrompt({
  name: 'generateBookingNotificationPrompt',
  input: {schema: GenerateBookingNotificationInputSchema},
  output: {schema: PromptOutputSchema},
  prompt: `You are an intelligent notification service for Maroma Experiences. Your task is to generate a personalized, professional, and friendly notification message for a booking event, tailored to the specific recipient. You must also intelligently decide which contact options are relevant and provide the necessary components for constructing their links.\n\nUse the provided information to craft the message and identify link components.\n\n---\nEvent Type: {{{eventType}}}\nRecipient: {{{recipientType}}}\nBooking ID: {{{bookingDetails.bookingId}}}\nTour Name: {{{bookingDetails.tourName}}}\nDate: {{{bookingDetails.tourDate}}}\nTime: {{{bookingDetails.tourTime}}}\nGuests: {{{bookingDetails.numberOfGuests}}}\nBooked By: {{{bookingDetails.bookedBy}}}\nBooker Email: {{{bookingDetails.bookerEmail}}}\nBooker Phone: {{{bookingDetails.bookerPhone}}}\n\n{{#if (eq eventType "minimum_group_size_reached")}}\nCurrent Booked Spaces: {{{currentBookedSpaces}}}\nMinimum Group Size: {{{minGroupSize}}}\n{{/if}}\n\n{{#if (eq eventType "custom_message")}}\nCustom Message: {{{customMessageText}}}\n{{/if}}\n\nBooking Details Base URL: {{{bookingDetailsBaseUrl}}}\nSupport Email: {{{supportEmailAddress}}}\nSupport WhatsApp Number: {{{supportWhatsappNumber}}}\nSupport Telegram Handle: {{{supportTelegramHandle}}}\n---\n\nInstructions for Notification Message:\n1.  Start with a suitable greeting based on the recipient type (e.g., "Dear {{{bookingDetails.bookedBy}}}", "Hello Admin").\n2.  Clearly state the purpose of the notification, referencing the event type and booking details.\n3.  Maintain a professional yet friendly tone appropriate for Maroma Experiences.\n4.  Ensure the message is concise and easy to understand.\n\nInstructions for Link Components (only provide components if highly relevant for the recipient and event type, otherwise leave the corresponding field null):\n-   **bookingDetailsLinkFragment**:\n    -   Include '{{{bookingDetails.bookingId}}}' if:\n        -   '{{eventType}}' is 'booking_confirmation', 'booking_update', 'booking_reminder', or 'minimum_group_size_reached'.\n        -   OR '{{recipientType}}' is 'admin' or 'facilitator'.\n    -   Otherwise, leave null.\n-   **emailContactTarget**:\n    -   If '{{recipientType}}' is 'booker': Provide '{{{supportEmailAddress}}}'.\n    -   If '{{recipientType}}' is 'facilitator' or 'admin': Provide '{{{bookingDetails.bookerEmail}}}'.\n    -   Otherwise, leave null.\n-   **emailContactSubject**:\n    -   If '{{recipientType}}' is 'booker': Provide "Regarding Your Maroma Booking for {{{bookingDetails.tourName}}} (ID: {{{bookingDetails.bookingId}}})"\n    -   If '{{recipientType}}' is 'facilitator' or 'admin': Provide "Regarding Booking {{{bookingDetails.bookingId}}} for {{{bookingDetails.tourName}}}"\n    -   Otherwise, leave null.\n-   **whatsappContactTargetPhone**:\n    -   If '{{recipientType}}' is 'booker' AND '{{{supportWhatsappNumber}}}' is provided: Provide '{{{supportWhatsappNumber}}}'.\n    -   If '{{recipientType}}' is 'facilitator' or 'admin' AND '{{{bookingDetails.bookerPhone}}}' is provided: Provide '{{{bookingDetails.bookerPhone}}}'.\n    -   Otherwise, leave null.\n-   **whatsappContactMessage**:\n    -   If '{{recipientType}}' is 'booker' AND '{{{supportWhatsappNumber}}}' is provided: Provide "Hello Maroma Support, I have a question about booking {{{bookingDetails.bookingId}}} ({{{bookingDetails.tourName}}})."\n    -   If '{{recipientType}}' is 'facilitator' or 'admin' AND '{{{bookingDetails.bookerPhone}}}' is provided: Provide "Hello {{{bookingDetails.bookedBy}}}, regarding your booking {{{bookingDetails.bookingId}}} for {{{bookingDetails.tourName}}}."\n    -   Otherwise, leave null.\n-   **telegramContactTargetHandleOrPhone**:\n    -   If '{{recipientType}}' is 'booker' AND '{{{supportTelegramHandle}}}' is provided: Provide '{{{supportTelegramHandle}}}'.\n    -   If '{{recipientType}}' is 'facilitator' or 'admin' AND '{{{bookingDetails.bookerPhone}}}' is provided: Provide '+{{{bookingDetails.bookerPhone}}}'.\n    -   Otherwise, leave null.\n`,
});

const generateBookingNotificationFlow = ai.defineFlow(
  {
    name: 'generateBookingNotificationFlow',
    inputSchema: GenerateBookingNotificationInputSchema,
    outputSchema: GenerateBookingNotificationOutputSchema,
  },
  async (input) => {
    const { output } = await generateNotificationPrompt(input);

    const result: GenerateBookingNotificationOutput = {
      message: output!.message,
      bookingDetailsLink: null,
      emailContactLink: null,
      whatsappContactLink: null,
      telegramContactLink: null,
    };

    // Construct booking details link
    if (output!.bookingDetailsLinkFragment) {
      result.bookingDetailsLink = `${input.bookingDetailsBaseUrl}/${output!.bookingDetailsLinkFragment}`;
    }

    // Construct email contact link
    if (output!.emailContactTarget && output!.emailContactSubject) {
      result.emailContactLink = `mailto:${output!.emailContactTarget}?subject=${encodeURIComponent(output!.emailContactSubject)}`;
    }

    // Construct WhatsApp contact link
    if (output!.whatsappContactTargetPhone && output!.whatsappContactMessage) {
      result.whatsappContactLink = `https://wa.me/${output!.whatsappContactTargetPhone}?text=${encodeURIComponent(output!.whatsappContactMessage)}`;
    }

    // Construct Telegram contact link
    if (output!.telegramContactTargetHandleOrPhone) {
      // The prompt is expected to handle the '+' prefix for phone numbers.
      result.telegramContactLink = `https://t.me/${output!.telegramContactTargetHandleOrPhone}`;
    }

    return result;
  }
);

export async function generateBookingNotification(input: GenerateBookingNotificationInput): Promise<GenerateBookingNotificationOutput> {
  return generateBookingNotificationFlow(input);
}
