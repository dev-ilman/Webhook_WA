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

  const msgBody = entry.text?.body?.trim().toLowerCase();
  const from = entry.from;

  console.log(`[INCOMING] ${from}: ${msgBody}`);

  // Flow logic
  if (["hi", "hello", "hey"].includes(msgBody)) {
    await sendMessage(from,
      "Welcome to XYZ Hospital. Please select a service:\n" +
      "1. Book a Doctor\n2. Home Lab Request\n3. Ambulance Service\n4. Other Hospital Services"
    );
  } else if (msgBody === "1") {
    await sendMessage(from,
      "Choose your required department:\n" +
      "1. Dental Care\n2. Renal Care\n3. Cardiac Care\n4. Eye Care\n5. Pulmonology Unit\n6. Liver Care"
    );
  } else if (msgBody === "2" || msgBody === "3") {
    await sendMessage(from, "Please share your address for the request.");
  } else if (["4"].includes(msgBody)) {
    await sendMessage(from,
      "Please select from the following:\n" +
      "1. Wellness Center\n2. Radiology\n3. Surgical Care\n4. Physiotherapy Unit\n5. Laboratory Services\n" +
      "6. Endoscopy Unit\n7. Wound Clinic\n8. Gynecology & Obstetrics\n9. 24 Hours Pharmacy"
    );
  } else if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(msgBody)) {
    await sendMessage(from, "Feature under development 🚧");
  } else {
    await sendMessage(from, "Thank you! Your request is under development 🚧");
  }

  res.sendStatus(200);
});

// Start server
app.listen(port, () => {
  console.log(`\n✅ Server listening on port ${port}`);
});
