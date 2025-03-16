// Find your application key and secret at dashboard.sinch.com/settings/access-keys
// Find your Sinch numbers at dashboard.sinch.com/numbers/your-numbers/numbers
const APPLICATION_KEY = "99bc6f48-28ad-4a07-99c5-f490b63949cb";
const APPLICATION_SECRET = "evoVO2PX20OT66wB4/KpDg==";
const SINCH_NUMBER = "+447418629604";
const LOCALE = "sv-SE";  // ISO 639 language code + ISO 3166-1 alpha-2 country code
const TO_NUMBER = "+46702655524";

const basicAuthentication = APPLICATION_KEY + ":" + APPLICATION_SECRET;

const fetch = require('cross-fetch');
const ttsBody = {
  method: 'ttsCallout',
  ttsCallout: {
    cli: SINCH_NUMBER,
    destination: {
      type: 'number',
      endpoint: TO_NUMBER
    },
    locale: LOCALE,
    text: 'Detta är ett test samtal från Sinch',
  }
};

fetch("https://calling.api.sinch.com/calling/v1/callouts", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Basic ' + Buffer.from(basicAuthentication).toString('base64')
  },
  body: JSON.stringify(ttsBody)
}).then(res => res.json()).then(json => console.log(json)); 