

'use client';

import emailjs from '@emailjs/browser';

// --- IMPORTANT ACTION REQUIRED ---
// You must replace these placeholder values with your actual EmailJS credentials.
// You can find these in your EmailJS account dashboard.
const EMAILJS_SERVICE_ID = 'service_gd2jmid';
const EMAILJS_PUBLIC_KEY = 'L0h_Kneyxaq62URRV'; // Found in Account > API Keys

// --- Template IDs ---
// Create these templates in your EmailJS dashboard and paste the IDs here.
const TEMPLATE_NEW_ORDER_ADMIN = 'template_f8evyzv';
const TEMPLATE_NEW_ORDER_CUSTOMER = 'template_lui0arc';
const TEMPLATE_ORDER_CONFIRMED = 'YOUR_ORDER_CONFIRMED_TEMPLATE_ID';
const TEMPLATE_ORDER_SHIPPED = 'YOUR_ORDER_SHIPPED_TEMPLATE_ID';
const TEMPLATE_ORDER_DELIVERED = 'YOUR_ORDER_DELIVERED_TEMPLATE_ID';

const ADMIN_EMAIL = 'purbanchalhastaudyog@gmail.com';

// Common parameters that can be used in your EmailJS templates.
// Example: In your template, you can use {{ order_id }} to display the order ID.
export type TemplateParams = {
    to_email: string;
    to_name: string;
    order_id: string;
    order_date: string;
    total_amount: string;
    admin_email?: string;
    invoice_url?: string;
};

const sendEmail = (templateId: string, params: TemplateParams) => {
    if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'L0h_Kneyxaq62URRV') {
        console.error("EmailJS Public Key is not configured in src/lib/email.ts. Using placeholder.");
    }
    if (!templateId || templateId.includes('YOUR_')) {
        console.warn(`EmailJS Template ID '${templateId}' is not configured; skipping this email.`);
        return; // Skip this specific email but don't block others.
    }

    emailjs.send(EMAILJS_SERVICE_ID, templateId, params, EMAILJS_PUBLIC_KEY)
        .then((response) => {
            console.log(`EmailJS SUCCESS for template ${templateId}!`, response.status, response.text);
        })
        .catch((err) => {
            console.error(`EmailJS FAILED for template ${templateId}...`, err);
        });
};

// --- Email Trigger Functions ---

export const triggerNewOrderEmails = (orderData: { id: string; shippingDetails: { name: string, email: string }; orderDate: Date; totalAmount: number; }) => {
    const commonParams = {
        order_id: orderData.id.substring(0, 8),
        order_date: orderData.orderDate.toLocaleDateString(),
        total_amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(orderData.totalAmount),
        invoice_url: `https://purbanchal-hasta-udyog.com/order-confirmation/${orderData.id}`
    };

    // 1. Send to Admin
    sendEmail(TEMPLATE_NEW_ORDER_ADMIN, {
        ...commonParams,
        to_email: ADMIN_EMAIL,
        to_name: 'Admin',
        admin_email: ADMIN_EMAIL,
    });

    // 2. Send to Customer
    sendEmail(TEMPLATE_NEW_ORDER_CUSTOMER, {
        ...commonParams,
        to_email: orderData.shippingDetails.email,
        to_name: orderData.shippingDetails.name,
    });
};

export const triggerStatusUpdateEmail = (status: 'order-confirmed' | 'shipped' | 'delivered', orderData: { id: string; shippingDetails: { name: string, email: string }; totalAmount: number; }) => {
    let templateId = '';
    switch (status) {
        case 'order-confirmed':
            templateId = TEMPLATE_ORDER_CONFIRMED;
            break;
        case 'shipped':
            templateId = TEMPLATE_ORDER_SHIPPED;
            break;
        case 'delivered':
            templateId = TEMPLATE_ORDER_DELIVERED;
            break;
        default:
            console.error("Invalid status for email trigger:", status);
            return;
    }
    
    const params: TemplateParams = {
        to_email: orderData.shippingDetails.email,
        to_name: orderData.shippingDetails.name,
        order_id: orderData.id.substring(0, 8),
        order_date: '', // Not always available here, can be added if needed
        total_amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(orderData.totalAmount),
        invoice_url: `https://purbanchal-hasta-udyog.com/order-confirmation/${orderData.id}`
    };

    sendEmail(templateId, params);
};
