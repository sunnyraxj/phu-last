
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
  Link,
  Button
} from '@react-email/components';
import * as React from 'react';

interface NewOrderAdminEmailProps {
  orderId: string;
  customerDetails: {
    name: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  products: { name: string; quantity: number; price: number }[];
  orderDate: string;
  totalAmount: number;
  adminOrderUrl: string;
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
  border: '1px solid #e6ebf1',
  borderRadius: '8px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
  color: '#2a2a2a',
};

const section = {
  padding: '0 24px',
};

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4043',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: '20px',
};

const th = {
  borderBottom: '1px solid #eaeaea',
  padding: '12px 0',
  textAlign: 'left' as const,
  fontSize: '12px',
  color: '#666',
  textTransform: 'uppercase' as const,
};

const td = {
  borderBottom: '1px solid #eaeaea',
  padding: '12px 0',
  fontSize: '14px',
  color: '#3c4043',
};

const button = {
    backgroundColor: '#E2725B',
    borderRadius: '3px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px',
    width: '200px',
    margin: '24px auto',
};

export default function NewOrderAdminEmail({
  orderId,
  customerDetails,
  products,
  orderDate,
  totalAmount,
  adminOrderUrl
}: NewOrderAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New Order Received: {orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>New Order Received!</Heading>

          <Section style={section}>
            <Text style={text}>
              You have a new order from <strong>{customerDetails.name}</strong>.
            </Text>
            <Hr />
            <Row>
              <Column>
                <Text><strong>Order ID:</strong> {orderId}</Text>
                <Text><strong>Order Date:</strong> {orderDate}</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                 <Text><strong>Total Amount:</strong></Text>
                 <Text style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}
                 </Text>
              </Column>
            </Row>
          </Section>

          <Section style={section}>
            <Heading as="h2" style={{ fontSize: '20px', margin: '20px 0' }}>Order Items</Heading>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Product</th>
                  <th style={th}>Quantity</th>
                  <th style={{...th, textAlign: 'right'}}>Price</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i}>
                    <td style={td}>{p.name}</td>
                    <td style={td}>{p.quantity}</td>
                    <td style={{...td, textAlign: 'right'}}>
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(p.price * p.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section style={section}>
            <Hr />
            <Heading as="h2" style={{ fontSize: '20px', margin: '20px 0' }}>Customer Details</Heading>
            <Text><strong>Name:</strong> {customerDetails.name}</Text>
            <Text><strong>Email:</strong> {customerDetails.email || 'Not provided'}</Text>
            <Text><strong>Phone:</strong> {customerDetails.phone}</Text>
            <Text><strong>Shipping Address:</strong> {`${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} - ${customerDetails.pincode}`}</Text>
          </Section>
          
          <Section style={{ ...section, textAlign: 'center' }}>
            <Button style={button} href={adminOrderUrl}>
              View Order in Admin
            </Button>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
