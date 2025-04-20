const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const mysql = require('mysql2/promise'); // Using promise-based MySQL
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;
const axios = require('axios');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Twilio Configuration
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);


const google_gemini_api_key = process.env.GOOGLE_GEMINI_API_KEY

const genAI = new GoogleGenerativeAI(google_gemini_api_key);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: `
    🧠 Identity & Role
    You are Sahaaya, an AI-powered digital companion embedded in the Sahaay application – a women's safety platform designed to protect, support, and empower women in distress or high-risk situations. Your core identity is that of a compassionate, calm, reliable, and culturally sensitive virtual assistant. You serve as both an emotional anchor and a practical guide during critical moments.

    🎯 Mission Statement
    Your mission is to:

    Ensure user safety through fast, intelligent responses.

    Guide women step-by-step during emergencies.

    Empower users with knowledge about their rights, safety practices, and mental wellness.

    Offer reassurance and emotional calmness in high-stress situations.

    💡 Capabilities & Functions
    1. 🚨 Emergency Assistance (Active Safety Layer)
    Trigger emergency protocols based on voice/text cues (e.g., "Help me", "I'm in danger", "Activate emergency mode").

    Immediately:

    Share live location with pre-registered emergency contacts.

    Send alert messages.

    Record audio (if permission is granted).

    Activate loud siren or flashlight as a deterrent.

    Display nearest:

    Police stations

    Hospitals

    Safe houses or women's shelters

    24/7 emergency helplines

    2. 🎙️ Conversational & Voice Command Assistant
    Respond instantly to natural language commands like:

    "Call my emergency contact"

    "Where is the nearest police station?"

    "Guide me out of here"

    Maintain calm tone, empathy, and clarity, especially when the user is panicked or scared.

    Auto-detect urgency and switch to safety-first mode when threat keywords are used.

    3. 📍 Contextual Awareness
    Use location data to:

    Suggest safe routes.

    Avoid dark or unsafe streets.

    Recommend women-friendly travel options.

    Adapt responses based on time of day (e.g., heightened sensitivity during night hours).

    4. 🧘‍♀️ Emotional Support Layer
    Offer:

    Calming techniques (deep breathing, grounding exercises).

    Motivational and comforting messages.

    Connection to professional mental health helplines (like iCall, Fortis Mental Health Line, etc.)

    Listen without judgment and provide gentle responses that show understanding.

    5. ⚖️ Legal Awareness & Rights
    Explain key women's rights and laws in India (e.g. IPC Sections 354, 509, Domestic Violence Act).

    Help file police complaints online in supported states.

    Provide templates or walkthroughs for writing FIRs or reporting cybercrimes.

    Give tips on handling police interaction confidently.

    6. 📚 Education & Preparedness
    Share safety tips proactively:

    "5 ways to protect yourself in public"

    "What to do if someone follows you"

    "Apps/tools that can silently call for help"

    Provide checklists for personal safety kits or traveling alone.

    ✅ Personality & Tone
    Always warm, patient, respectful, and non-judgmental.

    Use short, helpful, and clear step-by-step instructions in emergencies.

    Display confidence and reassurance without being overly robotic.

    Be encouraging and empowering – uplift the user.

    ❌ Restrictions
    Do NOT make any medical or legal claims or decisions – provide general info only.

    Do NOT share user data or location without explicit consent or command.

    Do NOT dismiss or minimize the user's concern – always validate and prioritize their safety.

    🌍 Cultural & Regional Awareness
    Use Indian context and local dialect sensitivity (e.g., refer to local helplines like 112, 1091).

    Be inclusive of different regions, cities, and safety scenarios (urban, rural, public transport, etc.).

    Respect privacy, religion, culture, and emotional state of the user at all times.`

});

// MySQL Database Configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database successfully');
    connection.release();
  } catch (error) {
    console.error('Failed to connect to MySQL database:', error);
    process.exit(1);
  }
})();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = require('./sahaay-e386a-firebase-adminsdk-fbsvc-b82c9dd46f.json');
} catch (error) {
  console.error('Failed to load service account file:', error);
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

// Helper function to add user to MySQL database
async function addUserToDatabase(userData) {
  try {
    const { uid, email, displayName, phoneNumber } = userData;
    console.log(userData)
    const query = `
      INSERT INTO users (uid, email, username, phn_number, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    const [result] = await pool.execute(query, [uid, email, displayName || null, phoneNumber || null]);
    console.log('User added to database with ID');
    return result.insertId;
  } catch (error) {
    console.error('Error adding user to database:', error);
    throw error;
  }
}

app.post('/api/signin/', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create a custom token for the user
    const userRecord = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.json({ 
      success: true, 
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

app.post('/api/signup/', async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber } = req.body;
    console.log(req.body)
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create a new user with email and password
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || null,
    });

    // Create a custom token for the newly created user
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    // Add user to MySQL database
    try {
      const dbUserId = await addUserToDatabase({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        phoneNumber: phoneNumber
      });
      
      res.status(201).json({ 
        success: true, 
        token: customToken,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          dbUserId: dbUserId
        }
      });
    } catch (dbError) {
      // If database insertion fails, delete the Firebase user to maintain consistency
      await admin.auth().deleteUser(userRecord.uid);
      throw new Error(`User created in Firebase but database insertion failed: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
});

app.get('/api/getdata', async (req, res) => {
  try {
    const { uid } = req.query;
    
    if (!uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'UID parameter is required' 
      });
    }

    // Query to get user information from MySQL
    const query = `
      SELECT uid, email, username, phn_number, created_at
      FROM users
      WHERE uid = ?
    `;
    
    const [rows] = await pool.execute(query, [uid]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const user = rows[0];
    
    res.json({ 
      success: true, 
      user: user 
    });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user data',
      message: error.message 
    });
  }
});

// Add phone number to uid_phn_number table
app.post('/api/add-phone', async (req, res) => {
  try {
    const { uid, phn_number } = req.body;

    // Basic validation
    if (!uid || !phn_number) {
      return res.status(400).json({
        success: false,
        error: 'Both uid and phone number are required'
      });
    }

    // Simple phone number format validation
    if (!/^\d{10,15}$/.test(phn_number)) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be 10-15 digits'
      });
    }

    // Insert into database
    const [result] = await pool.execute(
      'INSERT INTO uid_phn_number (uid, phn_number) VALUES (?, ?)',
      [uid, phn_number]
    );

    res.status(201).json({
      success: true,
      message: 'Phone number added successfully'
    });

  } catch (error) {
    console.error('Error adding phone number:', error);
    
    // Handle duplicate entry
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'This phone number already exists for the user'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to add phone number',
      message: error.message
    });
  }
});

// Get all phone numbers for a user
app.get('/api/get-phones/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const [rows] = await pool.execute(
      'SELECT phn_number FROM uid_phn_number WHERE uid = ?',
      [uid]
    );

    res.json({
      success: true,
      phoneNumbers: rows.map(row => row.phn_number)
    });

  } catch (error) {
    console.error('Error fetching phone numbers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch phone numbers',
      message: error.message
    });
  }
});

// Delete a phone number
app.delete('/api/delete-phone', async (req, res) => {
  try {
    const { uid, phn_number } = req.body;

    if (!uid || !phn_number) {
      return res.status(400).json({
        success: false,
        error: 'Both uid and phone number are required'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM uid_phn_number WHERE uid = ? AND phn_number = ?',
      [uid, phn_number]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Phone number not found for this user'
      });
    }

    res.json({
      success: true,
      message: 'Phone number deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting phone number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete phone number',
      message: error.message
    });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { message, phn_list, latitude, longitude } = req.body;

    if (!message || !phn_list || !Array.isArray(phn_list)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    let location = 'Unknown';

    if (latitude && longitude) {
      // Use OpenStreetMap or any free API for reverse geocoding
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json'
        },
        headers: {
          'User-Agent': 'SahaayApp/1.0'
        }
      });

      location = geoRes.data?.address?.city || geoRes.data?.display_name || 'Unknown';
    }

    const finalMessage = `${message} (Location: ${location})`;

    console.log("Sending message:", finalMessage);
    console.log("To:", phn_list);

    return res.status(200).json({
      success: true,
      sentMessage: finalMessage,
      location,
      phn_list
    });

  } catch (error) {
    console.error('Error in /api/send-message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message
    });
  }
});

app.post('/api/ask-sahaaya', async (req, res) => {
  try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
          return res.status(400).json({
              success: false,
              error: 'Valid prompt string is required'
          });
      }

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.json({
          success: true,
          response: text
      });

  } catch (error) {
      console.error('Gemini API error:', error);
      
      // Simplified error handling
      res.status(500).json({
          success: false,
          error: 'AI service unavailable',
          message: 'Please try again later'
      });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { message, phn_list, latitude, longitude } = req.body;

    if (!message || !phn_list || !Array.isArray(phn_list)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Get location details
    let locationDetails = 'Location unknown';
    let mapsLink = '';

    if (latitude && longitude) {
      // Get human-readable address
      try {
        const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json'
          },
          headers: {
            'User-Agent': 'SahaayApp/1.0'
          }
        });
        
        locationDetails = geoRes.data?.display_name || 'Nearby coordinates';
      } catch (geoError) {
        console.error('Geocoding error:', geoError.message);
      }

      mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    }

    // Format the final message
    const finalMessage = `🚨 EMERGENCY ALERT 🚨\n\n${message}\n\n📍 Location: ${locationDetails}\n\n🗺️ Map: ${mapsLink}`;

    // Send messages via Twilio WhatsApp
    const sendResults = [];
    
    for (const phoneNumber of phn_list) {
      try {
        // Format Indian numbers correctly (assuming numbers are stored as 91XXXXXXXXXX)
        const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `whatsapp:+91${phoneNumber.replace(/\D/g, '').slice(-10)}`;
        
        const result = await twilioClient.messages.create({
          body: finalMessage,
          from: twilioWhatsAppNumber,
          to: formattedNumber
        });

        sendResults.push({
          phoneNumber,
          status: 'success',
          sid: result.sid
        });
      } catch (twilioError) {
        console.error(`Failed to send to ${phoneNumber}:`, twilioError.message);
        sendResults.push({
          phoneNumber,
          status: 'failed',
          error: twilioError.message
        });
      }
    }

    // Check if any messages were sent successfully
    const successfulSends = sendResults.filter(r => r.status === 'success').length;

    if (successfulSends === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send all messages',
        results: sendResults
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully sent ${successfulSends} of ${phn_list.length} messages`,
      results: sendResults,
      location: locationDetails,
      mapsLink
    });

  } catch (error) {
    console.error('Error in /api/send-message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message
    });
  }
});

app.post('/api/make-call', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    async function createCall() {
      const call = await client.calls.create({
        from: "+15755777074",
        to: phoneNumber,
        twiml: "<Response><Say>Ahoy, World!</Say></Response>",
      });
    
      console.log(call.sid);
      return call;
    }
    
    const call = await createCall();
    
    // Send response back to client
    res.status(200).json({
      success: true,
      message: 'Call initiated successfully',
      callSid: call.sid
    });
  } catch (error) {
    console.error('Error making call:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make call',
      message: error.message
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    console.log('Server closed');
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Keep the process running but log the error
});