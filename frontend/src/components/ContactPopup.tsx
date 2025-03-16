import { useState, FormEvent } from 'react';

const ContactPopup = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/callback-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Något gick fel');
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Fel vid anrop:', err);
      setError('Kunde inte skicka förfrågan. Försök igen senare.');
    }
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
            Agent ansluter...
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Vi återkommer inom kort
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactPopup; 