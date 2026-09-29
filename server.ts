/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './server/db';
import { ItemCategory, DonationItem, NGODemand } from './src/types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limits for base64 camera images
app.use(express.json({ limit: '12mb' }));

// Lazy initializer for Google GenAI client to prevent startup crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required but missing. Configure it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Geocoding and Reverse Geocoding via Gemini
app.post('/api/reverse-geocode', async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    res.status(400).json({ error: 'Latitude and Longitude are required' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const promptText = `
You are an expert geocoding system. Given the latitude and longitude:
Latitude: ${lat}
Longitude: ${lng}

Find the closest actual physical street address, including street number, name, city, state (CA), and ZIP code in San Francisco, California.
Respond strictly in JSON format matching this schema:
{
  "address": "string"
}
Do not include any other commentary, formatting, or backticks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            address: { type: Type.STRING },
          },
          required: ['address'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ address: parsed.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  } catch (error: any) {
    console.error('Reverse Geocode Error:', error);
    res.json({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  }
});

app.post('/api/geocode', async (req, res) => {
  const { address } = req.body;
  if (!address || !address.trim()) {
    res.status(400).json({ error: 'Address is required' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const promptText = `
You are an expert geocoding system. Given the physical address:
"${address}"

Determine the latitude and longitude coordinates. If the address is vague or simulated, estimate realistic coordinates in San Francisco, CA.
Respond strictly in JSON format matching this schema:
{
  "lat": number,
  "lng": number,
  "formattedAddress": "string"
}
Do not include any other commentary, formatting, or backticks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            formattedAddress: { type: Type.STRING },
          },
          required: ['lat', 'lng', 'formattedAddress'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      lat: parsed.lat || 37.7749,
      lng: parsed.lng || -122.4194,
      formattedAddress: parsed.formattedAddress || address,
    });
  } catch (error: any) {
    console.error('Geocode Error:', error);
    res.json({ lat: 37.7749, lng: -122.4194, formattedAddress: address });
  }
});

// Donor Profile API
app.get('/api/donor/profile', (req, res) => {
  res.json(db.getDonorProfile());
});

app.post('/api/donor/profile', (req, res) => {
  const updated = db.updateDonorProfile(req.body);
  res.json(updated);
});

// NGOs API
app.get('/api/ngos', (req, res) => {
  res.json(db.getNGOs());
});

app.post('/api/ngos', (req, res) => {
  const { name, email, phone, address, coordinates, description } = req.body;
  if (!name || !email || !phone || !address) {
    res.status(400).json({ error: 'Missing required NGO fields' });
    return;
  }
  const newNgo = {
    id: `ngo_${Date.now()}`,
    name,
    email,
    phone,
    address,
    coordinates: coordinates || { lat: 37.7749, lng: -122.4194 },
    description: description || 'Registered community partner focused on local sustainability and distribution.'
  };
  const added = db.addNGO(newNgo);
  res.status(201).json(added);
});

// NGO Demands API
app.get('/api/demands', (req, res) => {
  res.json(db.getDemands());
});

app.post('/api/demands', (req, res) => {
  const { category, quantityRequired, priority, expiryDate, description, ngoId, specificItem } = req.body;
  
  if (!category || !quantityRequired || !priority || !expiryDate || !ngoId) {
    res.status(400).json({ error: 'Missing required demand fields' });
    return;
  }

  const ngo = db.getNGOs().find(n => n.id === ngoId);
  if (!ngo) {
    res.status(404).json({ error: 'NGO not found' });
    return;
  }

  const demand: NGODemand = {
    id: `demand_${Date.now()}`,
    ngoId: ngo.id,
    ngoName: ngo.name,
    ngoPhone: ngo.phone,
    ngoAddress: ngo.address,
    category,
    quantityRequired: Number(quantityRequired),
    quantityFilled: 0,
    priority,
    expiryDate,
    description: description || '',
    specificItem: specificItem || (category.charAt(0).toUpperCase() + category.slice(1)),
  };

  const added = db.addDemand(demand);
  res.status(201).json(added);
});

app.put('/api/demands/:id', (req, res) => {
  const { id } = req.params;
  const { quantityFilled, quantityRequired, priority, expiryDate, description, specificItem } = req.body;
  
  const original = db.getDemands().find(d => d.id === id);
  if (!original) {
    res.status(404).json({ error: 'Demand not found' });
    return;
  }

  const updates: Partial<NGODemand> = {};
  if (quantityFilled !== undefined) updates.quantityFilled = Number(quantityFilled);
  if (quantityRequired !== undefined) updates.quantityRequired = Number(quantityRequired);
  if (priority !== undefined) updates.priority = priority;
  if (expiryDate !== undefined) updates.expiryDate = expiryDate;
  if (description !== undefined) updates.description = description;
  if (specificItem !== undefined) updates.specificItem = specificItem;

  const updated = db.updateDemand(id, updates);
  res.json(updated);
});

// Donation Items API
app.get('/api/donations', (req, res) => {
  res.json(db.getDonations());
});

app.post('/api/donations', (req, res) => {
  const { category, quantity, confidence, imageUrl, notes, status } = req.body;
  if (!category || !quantity) {
    res.status(400).json({ error: 'Missing category or quantity' });
    return;
  }

  const donor = db.getDonorProfile();

  const item: DonationItem = {
    id: `donation_${Date.now()}`,
    donorId: donor.id,
    donorName: donor.name,
    donorPhone: donor.phone,
    donorAddress: donor.address,
    category: category as ItemCategory,
    quantity: Number(quantity),
    confidence: Number(confidence || 1.0),
    detectedAt: new Date().toISOString(),
    imageUrl: imageUrl || '',
    notes: notes || '',
    status: status || 'Draft',
    trackingHistory: [
      {
        status: status || 'Draft',
        timestamp: new Date().toISOString(),
        note: 'Donation recorded in catalog',
      },
    ],
  };

  const added = db.addDonation(item);
  res.status(201).json(added);
});

// Update Donation Status / Slot / NGO Match
app.put('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const original = db.getDonations().find(d => d.id === id);
  if (!original) {
    res.status(404).json({ error: 'Donation item not found' });
    return;
  }

  const updated = db.updateDonation(id, updates);

  // If a match is formed, auto-record a notification simulated log and increment filled count of matched demand
  if (updates.status === 'Matched' && original.status !== 'Matched' && updates.match?.demandId) {
    const demand = db.getDemands().find(d => d.id === updates.match.demandId);
    if (demand) {
      const quantityToAdd = updates.quantity || original.quantity || 0;
      const newFilled = Math.min(demand.quantityRequired, demand.quantityFilled + quantityToAdd);
      db.updateDemand(demand.id, { quantityFilled: newFilled });
    }
  }

  if (updates.match && (!original.match || original.match.ngoId !== updates.match.ngoId)) {
    const ngo = db.getNGOs().find(n => n.id === updates.match.ngoId);
    if (ngo) {
      db.addNotification(
        'Email',
        ngo.email,
        `Donation Available Alert: Compatible ${updates.category || original.category} (${updates.quantity || original.quantity} pcs) matched to your active demand!`
      );
    }
  }

  // If pickup scheduled, generate OTP & notify donor and NGO volunteer
  if (updates.pickupSlot) {
    const otp = updates.deliveryOtp || updates.pickupSlot.deliveryOtp || original.deliveryOtp || Math.floor(100000 + Math.random() * 900000).toString();
    const estTime = updates.estimatedDeliveryTime || updates.pickupSlot.estimatedDeliveryTime || `${updates.pickupSlot.date} between ${updates.pickupSlot.timeWindow}`;
    
    updates.deliveryOtp = otp;
    updates.estimatedDeliveryTime = estTime;
    updates.pickupSlot.deliveryOtp = otp;
    updates.pickupSlot.estimatedDeliveryTime = estTime;

    if (!original.pickupSlot || original.pickupSlot.date !== updates.pickupSlot.date) {
      const donor = db.getDonorProfile();
      db.addNotification(
        'SMS',
        original.donorPhone || donor.phone,
        `SmartShare Pickup Scheduled! Driver ${updates.pickupSlot.volunteerName} will arrive on ${updates.pickupSlot.date} (${updates.pickupSlot.timeWindow}). Delivery Confirmation OTP: ${otp}. Please share code with driver upon pickup.`
      );
      db.addNotification(
        'WhatsApp',
        updates.pickupSlot.volunteerPhone,
        `Task Dispatched: Please collect ${updates.quantity || original.quantity} pcs of ${updates.category || original.category} from ${original.donorName || donor.name} at ${original.donorAddress || donor.address} on ${updates.pickupSlot.date}. Verify donor OTP at handover.`
      );
    }
  }

  // Re-run update to save added OTP fields
  const finalUpdated = db.updateDonation(id, updates);
  res.json(finalUpdated);
});

// Verify Donor OTP Endpoint
app.post('/api/donations/:id/verify-otp', (req, res) => {
  const { id } = req.params;
  const { otp, targetStatus } = req.body;
  const item = db.getDonations().find(d => d.id === id);

  if (!item) {
    res.status(404).json({ error: 'Donation item not found' });
    return;
  }

  const expectedOtp = item.deliveryOtp || item.pickupSlot?.deliveryOtp;
  if (!expectedOtp || !otp || otp.toString().trim() !== expectedOtp.toString().trim()) {
    res.status(400).json({ error: 'Invalid OTP code. Please enter the correct 6-digit confirmation OTP provided by the donor.' });
    return;
  }

  const nextStatus = targetStatus || (item.status === 'Pickup Scheduled' ? 'Collected' : 'Delivered');
  const updatedHistory = [
    ...(item.trackingHistory || []),
    {
      status: nextStatus as any,
      timestamp: new Date().toISOString(),
      note: `Handover verified via Donor OTP (${otp}) by courier.`
    }
  ];

  const updated = db.updateDonation(id, {
    status: nextStatus as any,
    otpVerified: true,
    trackingHistory: updatedHistory
  });

  db.addNotification(
    'SMS',
    item.donorPhone || db.getDonorProfile().phone,
    `SmartShare Handover Confirmed! OTP ${otp} verified successfully. Item "${item.notes.split('.')[0]}" is now marked as ${nextStatus}.`
  );

  res.json({ success: true, updated, message: `OTP ${otp} verified successfully!` });
});

// Send/Resend Donor OTP SMS Endpoint
app.post('/api/donations/:id/send-otp', (req, res) => {
  const { id } = req.params;
  const { deliveryTime } = req.body;
  const item = db.getDonations().find(d => d.id === id);

  if (!item) {
    res.status(404).json({ error: 'Donation item not found' });
    return;
  }

  const otp = item.deliveryOtp || Math.floor(100000 + Math.random() * 900000).toString();
  const estTime = deliveryTime || item.estimatedDeliveryTime || (item.pickupSlot ? `${item.pickupSlot.date} during ${item.pickupSlot.timeWindow}` : 'Within 30-45 mins');

  const updatedPickupSlot = item.pickupSlot ? {
    ...item.pickupSlot,
    deliveryOtp: otp,
    estimatedDeliveryTime: estTime
  } : undefined;

  const updated = db.updateDonation(id, {
    deliveryOtp: otp,
    estimatedDeliveryTime: estTime,
    pickupSlot: updatedPickupSlot
  });

  db.addNotification(
    'SMS',
    item.donorPhone || db.getDonorProfile().phone,
    `SmartShare Delivery OTP: Your 6-digit confirmation code is ${otp}. Estimated Arrival: ${estTime}. Share this code with the driver upon pickup/delivery.`
  );

  res.json({ success: true, otp, estimatedDeliveryTime: estTime, updated, message: `OTP ${otp} dispatched via SMS to ${item.donorPhone || 'donor'}` });
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  res.json(db.getNotifications());
});

app.post('/api/notifications/test', (req, res) => {
  const { channel, recipient, message } = req.body;
  if (!channel || !recipient || !message) {
    res.status(400).json({ error: 'Missing channel, recipient or message' });
    return;
  }
  const notif = db.addNotification(channel, recipient, message);
  res.json(notif);
});

// AI Real-Time Camera Item Detection API (uses Gemini Multimodal analysis)
app.post('/api/detect-items', async (req, res) => {
  const { base64Image, mockItemName } = req.body;

  try {
    // If the user chooses to "simulate" or webcam is unavailable
    if (mockItemName) {
      const mockResult = generateMockInference(mockItemName);
      res.json(mockResult);
      return;
    }

    if (!base64Image) {
      res.status(400).json({ error: 'Missing base64Image data' });
      return;
    }

    const ai = getGeminiClient();
    
    // Split metadata prefix (e.g. "data:image/jpeg;base64,") if present
    const cleanBase64 = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64,
      },
    };

    const promptText = `
You are an expert real-time object detection engine (like a fine-tuned MobileNet or YOLOv8 Nano model) specialized in identifying items for community donation.
Analyze the provided camera frame image. Identify the primary items or clusters of items visible.
Classify them strictly into one of the following donation categories:
- 'clothing'
- 'food'
- 'books'
- 'electronics'
- 'furniture'
- 'utensils'

For the primary detected item, provide:
1. The classified 'category' (strictly one of the six categories above).
2. The estimated 'quantity' (an integer count, minimum 1).
3. A 'confidence' score (a float between 0.60 and 0.99 indicating identification confidence).
4. A friendly 'itemName' describing what the item is.
5. Helpful 'notes' detailing the condition or visual features.

Return a JSON array containing a single item matching the specification.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [imagePart, { text: promptText }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: 'Strictly one of: clothing, food, books, electronics, furniture, utensils.',
              },
              quantity: {
                type: Type.INTEGER,
                description: 'The estimated quantity of items detected.',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score between 0.60 and 0.99.',
              },
              itemName: {
                type: Type.STRING,
                description: 'Human-readable descriptive name, e.g. "Canned Tomato Soup" or "Denim Jacket".',
              },
              notes: {
                type: Type.STRING,
                description: 'Short observations on condition or color.',
              },
            },
            required: ['category', 'quantity', 'confidence', 'itemName'],
          },
        },
      },
    });

    const text = response.text || '[]';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('AI Inference Error:', error);
    res.status(500).json({ error: error.message || 'AI Inference failed' });
  }
});

// Custom Dynamic Packaging Checklist Generation via Gemini
app.post('/api/generate-checklist', async (req, res) => {
  const { category, itemName, notes } = req.body;

  try {
    const ai = getGeminiClient();

    const promptText = `
Given a donation item for community matching:
Item Name: "${itemName || 'Item'}"
Category: "${category || 'General'}"
Donor Description/Notes: "${notes || 'No description provided'}"

Generate a highly practical, custom 4-step preparation and packaging checklist guiding the donor on how to pack and prepare this specific item safely for pickup.
Be very specific to the category. For food, highlight seals and shelf-life checks. For clothing, highlight wash and secure bag packs. For electronics, highlight resets and cord management.
Return the result strictly as a JSON array of 4 concise strings (each maximum 15 words).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const text = response.text || '[]';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('AI Checklist Error:', error);
    // Provide a fallback high-quality list based on category
    const fallback = getFallbackChecklist(category as ItemCategory);
    res.json(fallback);
  }
});

// NGO Matching Engine & Proximity Match Transparency API
app.get('/api/donations/:id/matches', (req, res) => {
  const { id } = req.params;
  const donation = db.getDonations().find(d => d.id === id);
  if (!donation) {
    res.status(404).json({ error: 'Donation item not found' });
    return;
  }

  const matches = db.findMatchesForDonation({
    category: donation.category,
    quantity: donation.quantity,
  });

  res.json({
    donationItem: {
      id: donation.id,
      category: donation.category,
      quantity: donation.quantity,
      address: donation.donorAddress,
    },
    matches,
  });
});

// Helper for local mock generation when camera permission is absent or simulated
function generateMockInference(mockName: string) {
  const normalized = mockName.toLowerCase();
  let category: ItemCategory = 'clothing';
  let quantity = 1;
  let notes = 'Detected in clean condition';
  let itemName = mockName;

  if (normalized.includes('shirt') || normalized.includes('pant') || normalized.includes('clothes') || normalized.includes('jacket')) {
    category = 'clothing';
    quantity = 3;
    notes = 'Clean adult shirts/jackets, gently worn.';
  } else if (normalized.includes('can') || normalized.includes('soup') || normalized.includes('rice') || normalized.includes('food') || normalized.includes('grain')) {
    category = 'food';
    quantity = 6;
    notes = 'Unopened, shelf-stable packages. Expiry looks intact.';
  } else if (normalized.includes('book') || normalized.includes('textbook') || normalized.includes('novel')) {
    category = 'books';
    quantity = 5;
    notes = 'Paperbacks and educational content. Sturdy spines.';
  } else if (normalized.includes('phone') || normalized.includes('tablet') || normalized.includes('laptop') || normalized.includes('charger') || normalized.includes('cable')) {
    category = 'electronics';
    quantity = 1;
    notes = 'Powers on successfully. Screen is scratch-free.';
  } else if (normalized.includes('chair') || normalized.includes('table') || normalized.includes('desk') || normalized.includes('furniture')) {
    category = 'furniture';
    quantity = 1;
    notes = 'Solid wood frame structure, minimal wear on legs.';
  } else if (normalized.includes('pan') || normalized.includes('pot') || normalized.includes('plate') || normalized.includes('spoon') || normalized.includes('utensils')) {
    category = 'utensils';
    quantity = 8;
    notes = 'Stainless steel or ceramic kitchenware. Clean and stacked.';
  }

  return [{
    category,
    quantity,
    confidence: parseFloat((0.85 + Math.random() * 0.14).toFixed(2)),
    itemName,
    notes,
  }];
}

function getFallbackChecklist(category: ItemCategory): string[] {
  switch (category) {
    case 'clothing':
      return [
        'Wash, thoroughly dry, and fold all garments carefully.',
        'Sort items by size or age group to ease distribution.',
        'Place items in heavy-duty, sealed plastic bags.',
        'Label the bags "CLEAN CLOTHING" clearly with a marker.',
      ];
    case 'food':
      return [
        'Verify all canned items expire at least 30 days out.',
        'Wipe exterior surfaces of metal or glass jars.',
        'Separate dry products from liquids into different boxes.',
        'Do not pack opened or crushed storage bags.',
      ];
    case 'books':
      return [
        'Group educational literature separately from novels.',
        'Wipe book covers free of dust with a dry cloth.',
        'Stack horizontally in sturdy boxes to protect corners.',
        'Keep total box weight under 10kg for volunteer safety.',
      ];
    case 'electronics':
      return [
        'Perform a complete factory reset on digital items.',
        'Secure power supply cords and remote controls together.',
        'Wrap glass panels in thick newspaper or bubble wraps.',
        'Tape a note confirming the device functions properly.',
      ];
    case 'furniture':
      return [
        'Clean surfaces thoroughly with wood or upholstery cleaner.',
        'Disassemble detachable legs or shelves if possible.',
        'Keep all assembly hardware in a taped zip bag.',
        'Wrap glass or fragile tabletops in protective blankets.',
      ];
    case 'utensils':
      return [
        'Wash all plates, pots, and silverware with warm soap.',
        'Wrap glass or ceramic plates in clean paper.',
        'Secure sharp cutlery edges in cardboard sheaths.',
        'Seal in a strong box labeled "FRAGILE GLASSWARE".',
      ];
    default:
      return [
        'Ensure the item is clean and free of dust or oils.',
        'Check that all original parts and pieces are grouped.',
        'Pack inside a box with bubble wrap padding.',
        'Write the category name on the outside of the pack.',
      ];
  }
}

app.delete('/api/demands/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteDemand(id);
  if (!deleted) {
    res.status(404).json({ error: 'Demand not found' });
    return;
  }
  res.json({ success: true, deleted });
});

app.delete('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteDonation(id);
  if (!deleted) {
    res.status(404).json({ error: 'Donation not found' });
    return;
  }
  res.json({ success: true, deleted });
});

// Wildcard 404 for unhandled API endpoints to prevent Vite from returning HTML index.html
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Express error handling middleware for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ==========================================
// SERVE FRONTEND (Vite / Static)
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartShare Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
