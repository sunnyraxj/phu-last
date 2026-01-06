
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

interface ReturnRequestEmailProps {
  orderId: string;
  returnedItems: { name: string; quantity: number }[];
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

export default function ReturnRequestEmail({
  orderId,
  returnedItems,
}: ReturnRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Return Request Received: {orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Return Request Received</Heading>
          <Section>
            <Text style={text}>
              We have received your return request for order {orderId}.
            </Text>
             <Text style={text}>
              <strong>Items to be returned:</strong>
            </Text>
            <ul>
                {returnedItems.map((p, i) => <li key={i}>{p.name} (Qty: {p.quantity})</li>)}
            </ul>
            <Text style={text}>
              Our team will review your request and get back to you within 2 business days with the next steps.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
