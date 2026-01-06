
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

interface OrderCancelledEmailProps {
  orderId: string;
  cancellationReason: string;
  refundStatus: string;
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

export default function OrderCancelledEmail({
  orderId,
  cancellationReason,
  refundStatus
}: OrderCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order Cancelled: {orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Your Order Has Been Cancelled</Heading>
          <Section>
            <Text style={text}>
              We're sorry to inform you that your order has been cancelled.
            </Text>
            <Text style={text}>
              <strong>Order ID:</strong> {orderId}
            </Text>
            <Text style={text}>
              <strong>Reason:</strong> {cancellationReason}
            </Text>
             <Text style={text}>
              <strong>Refund Status:</strong> {refundStatus}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
