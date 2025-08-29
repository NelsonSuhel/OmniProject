import React, { useState, useEffect, useRef } from 'react';
import { Izipay } from '@izipay/checkout-sdk-js-dev';

interface IzipayPaymentFormProps {
  amount: number;
  currency: string;
  orderId: string;
  customer: {
    email: string;
  };
  onPaymentSuccess: (response: any) => void; // New prop
  onPaymentError: (error: any) => void;     // New prop
}

const IzipayPaymentForm: React.FC<IzipayPaymentFormProps> = ({ amount, currency, orderId, customer, onPaymentSuccess, onPaymentError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const izipayContainerRef = useRef<HTMLDivElement>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          orderId,
          customer,
        }),
      });

      const data = await response.json();

      if (response.ok && data.formToken && data.publicKey) {
        if (izipayContainerRef.current) {
          const izipayInstance = new Izipay({
            publicKey: data.publicKey,
            formToken: data.formToken,
            lang: 'es', // or 'en'
          });

          const form = await izipayInstance.createForm({
            container: izipayContainerRef.current,
            action: 'pay', // 'pay' or 'register'
            showAmount: true,
            onSuccess: (response) => {
              console.log('Payment successful:', response);
              onPaymentSuccess(response); // Call the new prop
            },
            onError: (error) => {
              console.error('Payment error:', error);
              setError(error.message || 'An error occurred during payment.');
              onPaymentError(error); // Call the new prop
            },
          });

          form.render();
        }
      } else {
        setError(data.error || 'Failed to get payment token from API.');
        onPaymentError(data.error || 'Failed to get payment token from API.'); // Call onPaymentError for API issues
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError('An unexpected error occurred.');
      onPaymentError(err); // Call onPaymentError for network issues
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div ref={izipayContainerRef} id="izipay-form"></div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        {loading ? 'Cargando...' : 'Pagar con Izipay'}
      </button>
    </div>
  );
};

export default IzipayPaymentForm;