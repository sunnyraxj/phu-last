
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

interface NewOrderAdminEmailProps {
  orderId: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
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


export default function NewOrderAdminEmail({
  orderId,
  customerName,
  orderDate,
  totalAmount,
}: NewOrderAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New Order Received: {orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>New Order Received!</Heading>
          <Section>
            <Text style={text}>
              You have received a new order on Purbanchal Hasta Udyog.
            </Text>
            <Text style={text}>
              <strong>Order ID:</strong> {orderId}
            </Text>
            <Text style={text}>
              <strong>Customer Name:</strong> {customerName}
            </Text>
            <Text style={text}>
              <strong>Order Date:</strong> {orderDate}
            </Text>
            <Text style={text}>
              <strong>Total Amount:</strong> {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
