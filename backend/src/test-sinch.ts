import dotenv from 'dotenv';

// Ladda miljövariabler
dotenv.config();

async function testSinchConfiguration() {
  console.log('Testar Sinch-konfiguration...\n');

  // 1. Kontrollera att alla miljövariabler finns
  const requiredVars = [
    'SINCH_PROJECT_ID',
    'SINCH_API_KEY',
    'SINCH_PHONE_NUMBER',
    'SALES_PHONE_NUMBERS'
  ];

  console.log('1. Kontrollerar miljövariabler:');
  for (const varName of requiredVars) {
    console.log(`   ${varName}: ${process.env[varName] ? '✓ Finns' : '✗ Saknas'}`);
  }

  // 2. Validera API-nyckelformat
  const apiKey = process.env.SINCH_API_KEY || '';
  const [accessKeyId, keySecret] = apiKey.split(':');
  console.log('\n2. Validerar API-nyckel format:');
  console.log(`   Access Key ID: ${accessKeyId ? '✓ Finns' : '✗ Saknas'}`);
  console.log(`   Key Secret: ${keySecret ? '✓ Finns' : '✗ Saknas'}`);

  // 3. Testa API-anslutning
  console.log('\n3. Testar API-anslutning:');
  try {
    const auth = Buffer.from(`${accessKeyId}:${keySecret}`).toString('base64');
    const response = await fetch(`https://calling.api.sinch.com/calling/v1/projects/${process.env.SINCH_PROJECT_ID}/numbers`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (response.ok) {
      console.log('   ✓ API-anslutning lyckades');
      const data = await response.json();
      console.log('   Svar:', JSON.stringify(data, null, 2));
    } else {
      console.log(`   ✗ API-anslutning misslyckades (${response.status})`);
      console.log('   Felmeddelande:', await response.text());
    }
  } catch (error) {
    console.log('   ✗ API-anslutning misslyckades');
    console.log('   Fel:', error);
  }

  // 4. Validera telefonnummer
  console.log('\n4. Validerar telefonnummer:');
  try {
    const salesNumbers = JSON.parse(process.env.SALES_PHONE_NUMBERS || '[]');
    console.log(`   Säljarnummer: ${salesNumbers.join(', ')}`);
    console.log(`   Sinch-nummer: ${process.env.SINCH_PHONE_NUMBER}`);
  } catch (error) {
    console.log('   ✗ Fel vid parsning av SALES_PHONE_NUMBERS');
  }
}

testSinchConfiguration(); 