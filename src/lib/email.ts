
'use server';

import { Resend } from 'resend';
import NewOrderAdminEmail from '@/emails/NewOrderAdminEmail';
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail';
import OrderCancelledEmail from '@/emails/OrderCancelledEmail';
import ReturnRequestEmail from '@/emails/ReturnRequestEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'onboarding@resend.dev';

type OrderPayload = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  totalAmount: number;
};

type OrderConfirmationPayload = OrderPayload & {
  products: { name: string; quantity: number }[];
  expectedDeliveryDate: string;
};

type OrderCancelledPayload = {
    orderId: string;
    customerEmail: string;
    cancellationReason: string;
    refundStatus: string;
}

type ReturnRequestPayload = {
    orderId: string;
    customerEmail: string;
    returnedItems: { name: string; quantity: number }[];
}

export async function sendNewOrderAdminNotification(payload: OrderPayload) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('ADMIN_EMAIL environment variable is not set.');
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: 'New Order Received',
      react: NewOrderAdminEmail({
          orderId: payload.orderId,
          customerName: payload.customerName,
          orderDate: payload.orderDate,
          totalAmount: payload.totalAmount,
      })
    });
  } catch (error) {
    console.error('Failed to send admin new order notification:', error);
  }
}

export async function sendOrderConfirmation(payload: OrderConfirmationPayload) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: payload.customerEmail,
      subject: 'Your Order is Confirmed!',
      react: OrderConfirmationEmail({
          orderId: payload.orderId,
          customerName: payload.customerName,
          products: payload.products,
          totalAmount: payload.totalAmount,
          expectedDeliveryDate: payload.expectedDeliveryDate,
      })
    });
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
}

export async function sendOrderCancellation(payload: OrderCancelledPayload) {
    try {
        await resend.emails.send({
            from: fromEmail,
            to: payload.customerEmail,
            subject: 'Your Order Has Been Cancelled',
            react: OrderCancelledEmail({
                orderId: payload.orderId,
                cancellationReason: payload.cancellationReason,
                refundStatus: payload.refundStatus,
            })
        });
    } catch (error) {
        console.error('Failed to send order cancellation email:', error);
    }
}

export async function sendReturnRequestConfirmation(payload: ReturnRequestPayload) {
    try {
        await resend.emails.send({
            from: fromEmail,
            to: payload.customerEmail,
            subject: 'We Received Your Return Request',
            react: ReturnRequestEmail({
                orderId: payload.orderId,
                returnedItems: payload.returnedItems,
            })
        });
    } catch (error) {
        console.error('Failed to send return request confirmation email:', error);
    }
}
