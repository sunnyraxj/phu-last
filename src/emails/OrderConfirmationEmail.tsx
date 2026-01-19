
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
  Img
} from '@react-email/components';
import * as React from 'react';

type ShippingDetails = {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email?: string;
};

type Order = {
  id: string;
  orderDate: { seconds: number; };
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  gstAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  shippingDetails: ShippingDetails;
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

interface OrderConfirmationEmailProps {
  order: Order;
  products: ProductInfo[];
  companySettings: CompanySettings;
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

const priceRow = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
};

export default function OrderConfirmationEmail({
  order,
  products,
  companySettings,
}: OrderConfirmationEmailProps) {

  const formatDate = (timestamp: { seconds: number }) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <Html>
      <Head />
      <Preview>Order Confirmation – {order.id}</Preview>
      <Body style={main}>
        <Container style={container}>
          {companySettings?.invoiceLogoUrl && (
             <Section style={{...section, textAlign: 'center'}}>
                <Img src={companySettings.invoiceLogoUrl} width="150" alt="Company Logo" />
            </Section>
          )}
          <Heading style={heading}>Your Order is Confirmed!</Heading>
          <Section style={section}>
            <Text style={text}>
              Hi {order.shippingDetails.name},
            </Text>
            <Text style={text}>
              Thank you for your order from {companySettings?.companyName || 'Purbanchal Hasta Udyog'}. We're excited for you to receive your items.
            </Text>
            <Hr />
             <Row>
              <Column>
                <Text><strong>Order ID:</strong> {order.id}</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                 <Text><strong>Order Date:</strong> {formatDate(order.orderDate)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={section}>
            <Heading as="h2" style={{ fontSize: '20px', margin: '20px 0' }}>Order Summary</Heading>
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
                        {formatCurrency(p.price * p.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          
          <Section style={{...section, width: '100%', maxWidth: '300px', marginLeft: 'auto', marginTop: '20px' }}>
            <div style={priceRow}>
                <Text>Subtotal</Text>
                <Text>{formatCurrency(order.subtotal)}</Text>
            </div>
             <div style={priceRow}>
                <Text>Shipping</Text>
                <Text>{order.shippingFee > 0 ? formatCurrency(order.shippingFee) : 'Free'}</Text>
            </div>
            {order.cgstAmount != null && order.cgstAmount > 0 && (
                <div style={priceRow}>
                    <Text>CGST</Text>
                    <Text>{formatCurrency(order.cgstAmount)}</Text>
                </div>
            )}
            {order.sgstAmount != null && order.sgstAmount > 0 && (
                <div style={priceRow}>
                    <Text>SGST</Text>
                    <Text>{formatCurrency(order.sgstAmount)}</Text>
                </div>
            )}
             {order.igstAmount != null && order.igstAmount > 0 && (
                <div style={priceRow}>
                    <Text>IGST</Text>
                    <Text>{formatCurrency(order.igstAmount)}</Text>
                </div>
            )}
            <Hr />
            <div style={{...priceRow, fontWeight: 'bold'}}>
                <Text>Total</Text>
                <Text>{formatCurrency(order.totalAmount)}</Text>
            </div>
          </Section>
          
          <Section style={section}>
             <Hr />
            <Row>
              <Column>
                <Heading as="h3" style={{ fontSize: '16px', margin: '20px 0 10px 0' }}>Billed To</Heading>
                <Text style={{...text, fontSize: '14px', margin: 0}}>{order.shippingDetails.name}</Text>
                <Text style={{...text, fontSize: '14px', margin: 0}}>{`${order.shippingDetails.address}, ${order.shippingDetails.city}, ${order.shippingDetails.state} - ${order.shippingDetails.pincode}`}</Text>
              </Column>
            </Row>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
