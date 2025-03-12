import express, { RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Temporär lagring av telefonnummer
const phoneNumbers: string[] = [];

interface CallbackRequest {
  phoneNumber: string;
}

// Validera telefonnummer (stödjer internationella format)
const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Regex som accepterar:
  // - Valfritt '+' i början
  // - Siffror, mellanslag, bindestreck och parenteser
  // - Minst 8 siffror totalt
  const phoneRegex = /^\+?[\d\s-()]{8,}$/;
  
  // Ta bort alla icke-siffror för att räkna längden
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  return phoneRegex.test(phoneNumber) && digitsOnly.length >= 8 && digitsOnly.length <= 15;
};

app.use(cors());
app.use(express.json());

const homeHandler: RequestHandler = (_req, res) => {
  res.json({ message: 'Välkommen till API:et!' });
};

const callbackHandler: RequestHandler = async (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    res.status(400).json({ 
      success: false, 
      message: 'Telefonnummer saknas' 
    });
    return;
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    res.status(400).json({
      success: false,
      message: 'Ogiltigt telefonnummerformat'
    });
    return;
  }

  // Spara telefonnumret i arrayen
  phoneNumbers.push(phoneNumber);
  console.log('Sparade nummer:', phoneNumbers);

  res.status(200).json({ 
    success: true, 
    message: 'Callback-förfrågan mottagen',
    queuePosition: phoneNumbers.length
  });
};

// Lägg till en GET-endpoint för att se sparade nummer (endast för testning)
const getNumbersHandler: RequestHandler = (_req, res) => {
  res.json({
    success: true,
    numbers: phoneNumbers
  });
};

app.get('/', homeHandler);
app.post('/callback-request', callbackHandler);
app.get('/callback-requests', getNumbersHandler);

app.listen(port, () => {
  console.log(`Server är igång på port ${port}`);
}); 