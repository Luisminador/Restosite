import express, { RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Ladda miljövariabler
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Kontrollera att nödvändiga miljövariabler finns
const requiredEnvVars = [
  'SINCH_PROJECT_ID',
  'SINCH_API_KEY',
  'SINCH_PHONE_NUMBER',
  'SINCH_CALLBACK_URL',
  'SALES_PHONE_NUMBERS'
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Miljövariabel ${envVar} saknas`);
  }
}

// Hjälpfunktion för att skapa Basic Auth header
const getAuthHeader = () => {
  const [accessKeyId, keySecret] = (process.env.SINCH_API_KEY as string).split(':');
  const auth = Buffer.from(`${accessKeyId}:${keySecret}`).toString('base64');
  return `Basic ${auth}`;
};

interface CallbackRequest {
  phoneNumber: string;
}

// Array för att lagra telefonnummer och deras status
interface CallbackEntry {
  phoneNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  callId?: string;
}

const callbackQueue: CallbackEntry[] = [];

// Validera telefonnummer
const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Regex för svenska telefonnummer:
  // - Börjar med 07, 08, 031, etc eller +46
  // - Tillåter mellanslag, bindestreck och parenteser
  // - Kräver 8-12 siffror totalt
  const swedishPhoneRegex = /^(?:(?:\+46|0)[ -]?[1-9](?:[ -]?\d){7,11}|(?:08|0\d{1,3})[ -]?\d{5,8})$/;
  
  // Rensa bort alla icke-siffror för att kontrollera längden
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  const isValidLength = digitsOnly.length >= 8 && digitsOnly.length <= 12;
  
  return swedishPhoneRegex.test(phoneNumber) && isValidLength;
};

// Formatera telefonnummer till E.164-format
const formatToE164 = (phoneNumber: string): string => {
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return '+46' + digitsOnly.substring(1);
  }
  return phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
};

// Funktion för att ringa upp säljare
const callSalesAgent = async (customerNumber: string): Promise<{ success: boolean; callId?: string }> => {
  const salesNumbers = JSON.parse(process.env.SALES_PHONE_NUMBERS!) as string[];
  
  for (const salesNumber of salesNumbers) {
    try {
      const response = await fetch(`https://calling.api.sinch.com/calling/v1/callouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from("99bc6f48-28ad-4a07-99c5-f490b63949cb:evoVO2PX20OT66wB4/KpDg==").toString('base64')
        },
        body: JSON.stringify({
          method: 'ttsCallout',
          ttsCallout: {
            cli: "+447418629604",
            destination: {
              type: 'number',
              endpoint: formatToE164(salesNumber)
            },
            locale: 'sv-SE',
            text: 'Hej! En kund vill bli uppringd. Tryck 1 för att acceptera samtalet.',
            enableAce: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Sinch API error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Ringer säljare på ${salesNumber}, Call ID: ${data.callId}`);
      
      return { success: true, callId: data.callId };
    } catch (error) {
      console.error(`Fel vid uppringning av säljare ${salesNumber}:`, error);
    }
  }
  
  return { success: false };
};

// Funktion för att skicka SMS
const sendSMS = async (to: string, message: string): Promise<void> => {
  try {
    const response = await fetch(`https://sms.api.sinch.com/xms/v1/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from("99bc6f48-28ad-4a07-99c5-f490b63949cb:evoVO2PX20OT66wB4/KpDg==").toString('base64')
      },
      body: JSON.stringify({
        from: "+447418629604",
        to: [formatToE164(to)],
        body: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Sinch SMS API error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`SMS skickat till ${to}`);
  } catch (error) {
    console.error('Fel vid SMS-utskick:', error);
    throw error;
  }
};

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// POST endpoint för callback-requests
const handleCallback: RequestHandler = async (req, res) => {
  console.log('Inkommande callback-förfrågan:', req.body);
  const { phoneNumber } = req.body;

  // Validera att telefonnummer finns
  if (!phoneNumber) {
    console.log('Telefonnummer saknas i förfrågan');
    res.status(400).json({
      success: false,
      message: 'Telefonnummer saknas'
    });
    return;
  }

  // Validera telefonnummerformat
  if (!isValidPhoneNumber(phoneNumber)) {
    console.log('Ogiltigt telefonnummerformat:', phoneNumber);
    res.status(400).json({
      success: false,
      message: 'Ogiltigt telefonnummerformat. Ange ett giltigt svenskt telefonnummer.'
    });
    return;
  }

  try {
    console.log('Formaterar telefonnummer:', phoneNumber);
    const formattedNumber = formatToE164(phoneNumber);
    console.log('Formaterat nummer:', formattedNumber);
    
    const callbackEntry: CallbackEntry = {
      phoneNumber: formattedNumber,
      status: 'pending',
      timestamp: new Date()
    };
    callbackQueue.push(callbackEntry);

    // Försök ringa upp en säljare
    console.log('Försöker ringa upp säljare...');
    const { success, callId } = await callSalesAgent(formattedNumber);
    console.log('Resultat från uppringning:', { success, callId });

    if (success && callId) {
      callbackEntry.status = 'processing';
      callbackEntry.callId = callId;
      res.status(200).json({
        success: true,
        message: 'En säljare kommer att ringa upp dig strax',
        queueNumber: callbackQueue.length
      });
    } else {
      console.log('Ingen säljare tillgänglig, skickar SMS...');
      // Om ingen säljare är tillgänglig, skicka SMS
      await sendSMS(
        formattedNumber,
        'Tyvärr är alla våra säljare upptagna just nu. Vi återkommer så snart som möjligt.'
      );
      res.status(200).json({
        success: true,
        message: 'Vi har tagit emot din förfrågan och skickat dig ett SMS',
        queueNumber: callbackQueue.length
      });
    }
  } catch (error) {
    console.error('Detaljerat fel vid hantering av callback:', error);
    if (error instanceof Error) {
      console.error('Felmeddelande:', error.message);
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({
      success: false,
      message: 'Ett tekniskt fel uppstod. Försök igen senare.'
    });
  }
};

// Webhook för att hantera samtalsstatus
const handleCallStatus: RequestHandler = (req, res) => {
  const { callId, status } = req.body;
  
  // Hitta och uppdatera relevant callback i kön
  const callback = callbackQueue.find(entry => entry.callId === callId);
  if (callback) {
    if (status === 'COMPLETED') {
      callback.status = 'completed';
    } else if (status === 'FAILED' || status === 'BUSY' || status === 'NO_ANSWER') {
      callback.status = 'failed';
    }
  }
  
  console.log(`Samtalsstatus för ${callId}: ${status}`);
  res.sendStatus(200);
};

app.post('/callback-request', handleCallback);
app.post('/call-status', handleCallStatus);

// Starta servern
app.listen(port, () => {
  console.log(`Server är igång på port ${port}`);
}); 