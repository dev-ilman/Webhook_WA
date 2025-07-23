const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Set port and tokens
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const accessToken = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.PHONE_NUMBER_ID;

// Function to send a WhatsApp message
async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: message }
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log('✅ Message sent:', response.data);
  } catch (err) {
    console.error('❌ Error sending message:', err.response?.data || err.message);
  }
}

// GET: Verification endpoint
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// POST: Webhook endpoint
app.post('/', async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\n📩 Webhook received ${timestamp}\n`);
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    const from = message?.from;
    const text = message?.text?.body;

    if (from && text) {
      console.log(`Message from ${from}: ${text}`);
      
      // 🔁 Example logic
      if (text.toLowerCase().includes("book")) {
        await sendWhatsAppMessage(from, "Please enter your name to start booking.");
      } else {
        await sendWhatsAppMessage(from, `Hi there! You said: "${text}"`);
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error.message);
  }

  res.status(200).end();
});

// Start the server
app.listen(port, () => {
  console.log(`\n🚀 Server running on port ${port}\n`);
});
