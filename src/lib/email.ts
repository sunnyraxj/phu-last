
'use server';

import { Resend } from 'resend';
import NewOrderAdminEmail from '@/emails/NewOrderAdminEmail';
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail';
import OrderCancelledEmail from '@/emails/OrderCancelledEmail';
import ReturnRequestEmail from '@/emails/ReturnRequestEmail';
import { ReactElement } from 'react';

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

type Order = {
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

type AdminEmailPayload = {
  orderId: string;
  customerDetails: ShippingDetails;
  products: ProductInfo[];
  orderDate: string;
  totalAmount: number;
};

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

async function sendEmail(to: string | string[], subject: string, react: ReactElement) {
    const companyName = 'Purbanchal Hasta Udyog';
    const from = `${companyName} <${fromEmail}>`;

    try {
        await resend.emails.send({ from, to, subject, react });
    } catch (error) {
        console.error(`Email sending failed for subject "${subject}" to "${to}":`, error);
        // Do not re-throw, as email failure should not block application flow.
    }
}


export async function sendNewOrderAdminNotification(payload: AdminEmailPayload) {
  const toEmail = 'purubanchalhastaudyog@gmail.com';
  const adminOrderUrl = `${siteUrl}/admin/orders`;

  const subject = `New Order Received | Order #${payload.orderId.substring(0,8)} | ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payload.totalAmount)}`;

  await sendEmail(toEmail, subject, NewOrderAdminEmail({
    orderId: payload.orderId,
    customerDetails: payload.customerDetails,
    products: payload.products,
    orderDate: payload.orderDate,
    totalAmount: payload.totalAmount,
    adminOrderUrl,
  }));
}

export async function sendOrderConfirmation(payload: CustomerConfirmationPayload) {
  const { order, products, companySettings } = payload;
  if (!order.shippingDetails.email) {
      console.error(`Order confirmation for order ${order.id} failed: No customer email.`);
      return;
  }
  
  const subject = `Order Confirmation – ${order.id}`;

  await sendEmail(order.shippingDetails.email, subject, OrderConfirmationEmail({
    order,
    products,
    companySettings,
  }));
}

export async function sendOrderCancellation(payload: OrderCancelledPayload) {
    const subject = `Your Purbanchal Hasta Udyog Order has been Cancelled (#${payload.orderId.substring(0,8)})`;
    await sendEmail(payload.customerEmail, subject, OrderCancelledEmail({
        orderId: payload.orderId,
        cancellationReason: payload.cancellationReason,
        refundStatus: payload.refundStatus,
    }));
}

export async function sendReturnRequestConfirmation(payload: ReturnRequestPayload) {
    const subject = `We've Received Your Return Request for Order #${payload.orderId.substring(0,8)}`;
    await sendEmail(payload.customerEmail, subject, ReturnRequestEmail({
        orderId: payload.orderId,
        returnedItems: payload.returnedItems,
    }));
}
