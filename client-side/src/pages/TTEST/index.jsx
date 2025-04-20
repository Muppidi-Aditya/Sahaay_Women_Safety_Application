import { useState } from 'react';
import { Phone, CheckCircle, XCircle } from 'lucide-react';

export default function CallMeButton() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('idle'); // idle, loading, success, error

  const initiateCall = async () => {
    if (!phoneNumber) {
      alert('Please enter your phone number');
      return;
    }
    
    setCallStatus('loading');
    
    try {
      // This would be your API endpoint to trigger a call
      const response = await fetch('/api/make-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }
      
      setCallStatus('success');
      setTimeout(() => setCallStatus('idle'), 5000);
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallStatus('error');
      setTimeout(() => setCallStatus('idle'), 5000);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-xl font-bold text-center text-gray-800">Get a Phone Call</h2>
      
      <div className="mb-4">
        <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-700">
          Your Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>
      
      <button
        onClick={initiateCall}
        disabled={callStatus === 'loading'}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium transition-all ${
          callStatus === 'loading' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {callStatus === 'loading' ? (
          <>Processing</>
        ) : callStatus === 'success' ? (
          <>
            <CheckCircle size={20} />
            Call Initiated
          </>
        ) : callStatus === 'error' ? (
          <>
            <XCircle size={20} />
            Failed to Call
          </>
        ) : (
          <>
            <Phone size={20} />
            Call Me Now
          </>
        )}
      </button>
      
      {callStatus === 'success' && (
        <p className="mt-4 text-sm text-green-600 text-center">
          You should receive a call shortly!
        </p>
      )}
      
      {callStatus === 'error' && (
        <p className="mt-4 text-sm text-red-600 text-center">
          There was a problem initiating your call. Please try again.
        </p>
      )}
    </div>
  );
}