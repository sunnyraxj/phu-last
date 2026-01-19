
'use server';

import { Resend } from 'resend';
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail';
import OrderCancelledEmail from '@/emails/OrderCancelledEmail';
import ReturnRequestEmail from '@/emails/ReturnRequestEmail';
import { ReactElement } from 'react';
import { render } from '@react-email/components';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const siteUrl = process.env.SITE_URL || 'http://localhost:9002';

type ShippingDetails = {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email?: string;
}

export type Order = {
  id: string;
  customerId: string;
  orderDate: { seconds: number; nanoseconds: number; };
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  gstAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  status: 'pending-payment-approval' | 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'order-confirmed';
  shippingDetails: ShippingDetails;
  paymentMethod?: 'UPI_PARTIAL' | 'UPI_FULL';
  paymentDetails?: {
      advanceAmount: number;
      remainingAmount: number;
      utr: string;
      paymentPercentage: number;
  };
};

type ProductInfo = {
  name: string;
  quantity: number;
  price: number;
};

type CompanySettings = {
    companyName?: string;
    companyAddress?: string;
    gstin?: string;
    invoiceLogoUrl?: string;
} | null;

type CustomerConfirmationPayload = {
    order: Order;
    products: ProductInfo[];
    companySettings: CompanySettings;
};

type OrderCancelledPayload = {
    orderId: string;
    customerEmail: string;
    cancellationReason: string;
    refundStatus: string;
};

type ReturnRequestPayload = {
    orderId: string;
    customerEmail: string;
    returnedItems: { name: string; quantity: number }[];
};

type SendEmailPayload = {
    to: string | string[];
    subject: string;
    html: string;
    bcc?: string | string[];
}

async function sendEmail({ to, subject, html, bcc }: SendEmailPayload) {
    const companyName = 'Purbanchal Hasta Udyog';
    const from = `${companyName} <${fromEmail}>`;

    // Ensure 'to' and 'bcc' are arrays
    const toArray = Array.isArray(to) ? to : [to];
    const bccArray = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;
    
    const payload = {
        from,
        to: toArray,
        subject,
        html,
        bcc: bccArray,
    };

    console.log("Sending email with payload:", { ...payload, html: '...' }); // Log payload without large HTML

    try {
        const { data, error } = await resend.emails.send(payload);

        if (error) {
          console.error(`Resend API Error for subject "${subject}" to "${to}":`, error);
          return;
        }

        console.log(`Email sent successfully to ${to}. Message ID: ${data?.id}`);

    } catch (error) {
        console.error(`Email sending failed for subject "${subject}" to "${to}":`, error);
        // Do not re-throw, as email failure should not block application flow.
    }
}

export async function sendOrderConfirmation(payload: CustomerConfirmationPayload) {
  const { order, products, companySettings } = payload;
  if (!order.shippingDetails.email) {
      console.error(`Order confirmation for order ${order.id} failed: No customer email.`);
      return;
  }
  
  const subject = `Order Confirmation – ${order.id}`;
  
  try {
    const html = render(OrderConfirmationEmail({
      order,
      products,
      companySettings,
    }));
    
    await sendEmail({
        to: order.shippingDetails.email,
        subject,
        html,
        bcc: 'sunnyraxj@gmail.com'
    });
  } catch (renderError) {
      console.error(`Failed to render OrderConfirmationEmail for order ${order.id}:`, renderError);
  }
}

export async function sendOrderCancellation(payload: OrderCancelledPayload) {
    const subject = `Your Purbanchal Hasta Udyog Order has been Cancelled (#${payload.orderId.substring(0,8)})`;
    try {
        const html = render(OrderCancelledEmail({
            orderId: payload.orderId,
            cancellationReason: payload.cancellationReason,
            refundStatus: payload.refundStatus,
        }));
        await sendEmail({
            to: payload.customerEmail, 
            subject, 
            html
        });
    } catch(renderError) {
        console.error(`Failed to render OrderCancelledEmail for order ${payload.orderId}:`, renderError);
    }
}

export async function sendReturnRequestConfirmation(payload: ReturnRequestPayload) {
    const subject = `We've Received Your Return Request for Order #${payload.orderId.substring(0,8)}`;
    try {
        const html = render(ReturnRequestEmail({
            orderId: payload.orderId,
            returnedItems: payload.returnedItems,
        }));
        await sendEmail({
            to: payload.customerEmail, 
            subject, 
            html
        });
    } catch (renderError) {
        console.error(`Failed to render ReturnRequestEmail for order ${payload.orderId}:`, renderError);
    }
}
