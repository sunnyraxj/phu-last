
'use client';

import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { useEffect } from 'react';
import './label.css';

type CompanySettings = {
    companyName?: string;
    companyAddress?: string;
    gstin?: string;
};

type ShippingDetails = {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
};

type Order = {
  id: string;
  customerId: string;
  shippingDetails: ShippingDetails;
  totalAmount: number;
};

export default function ShippingLabelPage() {
  const { orderId } = useParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const orderRef = useMemoFirebase(() => doc(firestore, 'orders', orderId as string), [firestore, orderId]);
  const { data: order, isLoading: orderLoading } = useDoc<Order>(orderRef);

  const settingsRef = useMemoFirebase(() => doc(firestore, 'companySettings', 'main'), [firestore]);
  const { data: settings, isLoading: settingsLoading } = useDoc<CompanySettings>(settingsRef);
  
  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userData, isLoading: userIsLoading } = useDoc<{role: string}>(userDocRef);

  useEffect(() => {
    // Security check: ensure only admins can view labels
    if (!isUserLoading && !userIsLoading && (!user || userData?.role !== 'admin')) {
        router.push('/login');
    }
  }, [user, userData, isUserLoading, userIsLoading, router]);

  useEffect(() => {
    // Automatically trigger print dialog when data is loaded
    if (!orderLoading && !settingsLoading && order && settings) {
        // Delay slightly to ensure rendering is complete
        setTimeout(() => window.print(), 500);
    }
  }, [orderLoading, settingsLoading, order, settings]);
  
  const isLoading = orderLoading || settingsLoading || isUserLoading;

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <PottersWheelSpinner />
        </div>
    );
  }

  if (!order || !settings) {
    return <div className="p-10">Order or company settings not found.</div>;
  }
  
  const isPrepaid = order.totalAmount > 0; // Simple logic, adjust as needed

  return (
    <div className="shipping-label-container">
      <div className="label-content">
        <div className="section return-address">
          <p className="label-title">FROM (Return Address):</p>
          <p className="font-bold">{settings.companyName}</p>
          <p className="text-sm whitespace-pre-line">{settings.companyAddress}</p>
        </div>
        
        <div className="section shipping-address">
          <p className="label-title">TO:</p>
          <p className="font-bold text-lg">{order.shippingDetails.name}</p>
          <p className="text-base whitespace-pre-line">{`${order.shippingDetails.address}, ${order.shippingDetails.city}, ${order.shippingDetails.state} - ${order.shippingDetails.pincode}`}</p>
          <p className="font-bold mt-2">Contact: {order.shippingDetails.phone}</p>
        </div>

        <div className="section footer">
          <div className="order-id">
            <p className="label-title">Order ID:</p>
            <p className="font-mono text-xs">{order.id}</p>
          </div>
           <div className="payment-status">
              <p className={`font-bold text-2xl border-2 border-black p-2 rounded-md ${!isPrepaid && 'bg-yellow-300'}`}>
                {isPrepaid ? "PREPAID" : "COD"}
              </p>
              {!isPrepaid && (
                  <p className="font-bold text-lg mt-1">
                    Collect: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}
                  </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
