
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  orderId: string;
  customerName: string;
  products: { name: string; quantity: number }[];
  totalAmount: number;
  expectedDeliveryDate: string;
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '48px',
};

const text = {
  margin: '0 0 16px',
};

export default function OrderConfirmationEmail({
  orderId,
  customerName,
  products,
  totalAmount,
  expectedDeliveryDate,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order Confirmed: {orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Your Order is Confirmed!</Heading>
          <Section>
            <Text style={text}>
              Hi {customerName},
            </Text>
            <Text style={text}>
              Thank you for your order. We've received it and are getting it ready for shipment.
            </Text>
            <Text style={text}>
              <strong>Order ID:</strong> {orderId}
            </Text>
            <Text style={text}>
              <strong>Items:</strong>
            </Text>
            <ul>
                {products.map((p, i) => <li key={i}>{p.name} (Qty: {p.quantity})</li>)}
            </ul>
             <Text style={text}>
              <strong>Total Amount:</strong> {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}
            </Text>
            <Text style={text}>
              <strong>Expected Delivery:</strong> {expectedDeliveryDate}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
