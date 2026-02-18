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

// Internal schema for prompt output
const PromptOutputSchema = z.object({
  message: z.string().describe('The personalized and formatted notification message.'),
  bookingDetailsLinkFragment: z.string().nullable().optional().describe('Relative path or ID for booking details.'),
  emailContactTarget: z.string().nullable().optional().describe('Email address to contact.'),
  emailContactSubject: z.string().nullable().optional().describe('Subject for the email.'),
  whatsappContactTargetPhone: z.string().nullable().optional().describe('Phone number for WhatsApp contact.'),
  whatsappContactMessage: z.string().nullable().optional().describe('Message for WhatsApp chat.'),
  telegramContactTargetHandleOrPhone: z.string().nullable().optional().describe('Telegram handle or phone number for contact.'),
});

// Prompt input schema including booleans to avoid complex logic in Handlebars
const PromptInputSchema = GenerateBookingNotificationInputSchema.extend({
  isMinGroupReachedEvent: z.boolean(),
  isCustomMessageEvent: z.boolean(),
  isBookerRecipient: z.boolean(),
  isFacilitatorRecipient: z.boolean(),
  isAdminRecipient: z.boolean(),
});

const generateNotificationPrompt = ai.definePrompt({
  name: 'generateBookingNotificationPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: PromptOutputSchema},
  prompt: `You are an intelligent notification service for Maroma Experiences. Your task is to generate a personalized, professional, and friendly notification message for a booking event, tailored to the specific recipient.

---
Event Type: {{{eventType}}}
Recipient: {{{recipientType}}}
Booking ID: {{{bookingDetails.bookingId}}}
Tour Name: {{{bookingDetails.tourName}}}
Date: {{{bookingDetails.tourDate}}}
Time: {{{bookingDetails.tourTime}}}
Guests: {{{bookingDetails.numberOfGuests}}}
Booked By: {{{bookingDetails.bookedBy}}}

{{#if isMinGroupReachedEvent}}
Current Booked Spaces: {{{currentBookedSpaces}}}
Minimum Group Size: {{{minGroupSize}}}
{{/if}}

{{#if isCustomMessageEvent}}
Custom Message: {{{customMessageText}}}
{{/if}}

Booking Details Base URL: {{{bookingDetailsBaseUrl}}}
Support Email: {{{supportEmailAddress}}}
Support WhatsApp Number: {{{supportWhatsappNumber}}}
Support Telegram Handle: {{{supportTelegramHandle}}}
---

Instructions for Notification Message:
1. Start with a suitable greeting based on the recipient type (e.g., "Dear {{{bookingDetails.bookedBy}}}", "Hello Admin").
2. Clearly state the purpose of the notification.
3. Maintain a professional yet friendly tone.
4. Ensure the message is concise.

Instructions for Link Components (only provide components if highly relevant for the recipient):
- bookingDetailsLinkFragment: Provide '{{{bookingDetails.bookingId}}}' if relevant.
- emailContactTarget: support email or booker email based on recipient.
- emailContactSubject: Descriptive subject line.
- whatsappContactTargetPhone: Appropriate support or booker phone.
- whatsappContactMessage: Prepared message for WhatsApp.
- telegramContactTargetHandleOrPhone: Handle or phone with + prefix.`,
});

const generateBookingNotificationFlow = ai.defineFlow(
  {
    name: 'generateBookingNotificationFlow',
    inputSchema: GenerateBookingNotificationInputSchema,
    outputSchema: GenerateBookingNotificationOutputSchema,
  },
  async (input) => {
    // Pre-calculate booleans for the prompt template to avoid logic-in-template errors
    const promptInput = {
      ...input,
      isMinGroupReachedEvent: input.eventType === 'minimum_group_size_reached',
      isCustomMessageEvent: input.eventType === 'custom_message',
      isBookerRecipient: input.recipientType === 'booker',
      isFacilitatorRecipient: input.recipientType === 'facilitator',
      isAdminRecipient: input.recipientType === 'admin',
    };

    const { output } = await generateNotificationPrompt(promptInput);

    const result: GenerateBookingNotificationOutput = {
      message: output!.message,
      bookingDetailsLink: null,
      emailContactLink: null,
      whatsappContactLink: null,
      telegramContactLink: null,
    };

    if (output!.bookingDetailsLinkFragment) {
      result.bookingDetailsLink = `${input.bookingDetailsBaseUrl}/${output!.bookingDetailsLinkFragment}`;
    }

    if (output!.emailContactTarget && output!.emailContactSubject) {
      result.emailContactLink = `mailto:${output!.emailContactTarget}?subject=${encodeURIComponent(output!.emailContactSubject)}`;
    }

    if (output!.whatsappContactTargetPhone && output!.whatsappContactMessage) {
      result.whatsappContactLink = `https://wa.me/${output!.whatsappContactTargetPhone}?text=${encodeURIComponent(output!.whatsappContactMessage)}`;
    }

    if (output!.telegramContactTargetHandleOrPhone) {
      result.telegramContactLink = `https://t.me/${output!.telegramContactTargetHandleOrPhone}`;
    }

    return result;
  }
);

export async function generateBookingNotification(input: GenerateBookingNotificationInput): Promise<GenerateBookingNotificationOutput> {
  return generateBookingNotificationFlow(input);
}
