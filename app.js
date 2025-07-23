// Import Express and Axios
const express = require('express');
const axios = require('axios');

// Express app setup
const app = express();
app.use(express.json());

// Config
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const whatsappToken = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.PHONE_NUMBER_ID;

// Util: send message to WhatsApp
const sendMessage = async (to, message) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('Failed to send message:', err?.response?.data || err.message);
  }
};

// Webhook verification
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Webhook listener
app.post('/', async (req, res) => {
  const entry = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!entry) return res.sendStatus(200);

  const msgBody = entry.text?.body?.trim().toUpperCase();
  const from = entry.from;

  console.log(`[INCOMING] ${from}: ${msgBody}`);

  // Flow logic
  if (["HI", "HELLO", "HEY"].includes(msgBody)) {
    await sendMessage(from,
      "Welcome to King's Hospital. Please select a service:\n" +
      "1. Book a Doctor\n2. Home Lab Request\n3. Ambulance Service\n4. Other Hospital Services"
    );
  } else if (msgBody === "1") {
    await sendMessage(from,
      "Contact the following number to book an appointment: 94117743743"
    );
  } else if (msgBody === "2") {
    await sendMessage(from, "Contact the following number to place a homelab request: 9876543212");
  } else if (msgBody === "3") {
    await sendMessage(from, "Contact the following number to request ambulance service: 9876543515");
  } else if (msgBody === "4") {
    await sendMessage(from,
      "Please select from the following:\n" +
      "A. Wellness Center\nB. Radiology\nC. Surgical Care\nD. Physiotherapy Unit\nE. Laboratory Services\n" +
      "F. Endoscopy Unit\nG. Wound Clinic\nH. Gynecology & Obstetrics\nI. 24 Hours Pharmacy"
    );
  } else if (["A", "B", "C", "D", "E", "F", "G", "H", "I"].includes(msgBody)) {
    await sendMessage(from, "Contact this number for customer support: 044-121345");
  } else {
    await sendMessage(from, "Thank you! Your response has been recorded.");
  }

  res.sendStatus(200);
});

// Start server
app.listen(port, () => {
  console.log(`\n✅ Server listening on port ${port}`);
});
