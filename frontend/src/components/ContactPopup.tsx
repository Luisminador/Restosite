import { useState, FormEvent, useEffect } from 'react';

const ContactPopup = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (isSubmitted && countdown === null) {
      setCountdown(59);
    }

    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isSubmitted, countdown]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/callback-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      console.log('Svar från server:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Något gick fel');
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Fel vid anrop:', err);
      setError('Kunde inte skicka förfrågan. Försök igen senare.');
    }
  };

  const getStatusMessage = () => {
    if (countdown === null) return '';
    if (countdown === 0) return 'Agent ansluter nu!';
    return `Agent ansluter om ${countdown} sekunder...`;
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-6 transform transition-all duration-300 ease-in-out">
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefonnummer
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="070-123 45 67"
              required
              pattern="[0-9+\-\s]+"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Skicka
          </button>
        </form>
      ) : (
        <div className="text-center">
          <div className="animate-pulse text-lg font-medium text-gray-900">
            {getStatusMessage()}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {countdown === 0 ? (
              'Tack för ditt tålamod!'
            ) : (
              'Vi uppskattar ditt tålamod'
            )}
          </div>
          {countdown !== null && countdown > 0 && (
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 59) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactPopup; 