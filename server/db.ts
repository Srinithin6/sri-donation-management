/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { DonationItem, NGODemand, NGO, DonorProfile, NotificationLog, ItemCategory, LocationCoordinates } from '../src/types';

// Simple file-backed DB path
const DB_FILE = path.join(process.cwd(), 'data.json');

interface DatabaseSchema {
  donorProfile: DonorProfile;
  ngos: NGO[];
  demands: NGODemand[];
  donations: DonationItem[];
  notifications: NotificationLog[];
}

const DEFAULT_DB: DatabaseSchema = {
  donorProfile: {
    id: 'donor_jane',
    name: 'Jane Donor',
    email: 'jane.donor@example.com',
    phone: '+1 (555) 432-1098',
    address: '456 Mission St, San Francisco, CA 94105',
    coordinates: { lat: 37.7892, lng: -122.3994 }, // SOMA SF
  },
  ngos: [
    {
      id: 'ngo_sf_food',
      name: 'Springfield Food Bank & Pantry',
      email: 'contact@sffoodbank.org',
      phone: '+1 (555) 901-2345',
      address: '101 Pennsylvania Ave, San Francisco, CA 94107', // ~2 km away
      coordinates: { lat: 37.7612, lng: -122.3941 },
      description: 'Dedicated to fighting hunger by distributing nutritious meals and pantry staples to low-income families.',
    },
    {
      id: 'ngo_shelter_clothes',
      name: 'Urban Hope Shelter & Closet',
      email: 'shelter@urbanhope.org',
      phone: '+1 (555) 876-5432',
      address: '830 Eddy St, San Francisco, CA 94109', // ~3.5 km away
      coordinates: { lat: 37.7828, lng: -122.4221 },
      description: 'Providing safe shelter, clothing vouchers, and career attire to people transitioning out of homelessness.',
    },
    {
      id: 'ngo_youth_tech',
      name: 'Youth Tech & Books Foundation',
      email: 'info@youthtechbooks.org',
      phone: '+1 (555) 345-6789',
      address: '2200 O\'Farrell St, San Francisco, CA 94115', // ~5 km away
      coordinates: { lat: 37.7818, lng: -122.4429 },
      description: 'Empowering children and youth with educational literature and recycled hardware/electronics for learning.',
    },
  ],
  demands: [
    {
      id: 'demand_food_1',
      ngoId: 'ngo_sf_food',
      ngoName: 'Springfield Food Bank & Pantry',
      ngoPhone: '+1 (555) 901-2345',
      ngoAddress: '101 Pennsylvania Ave, San Francisco, CA 94107',
      category: 'food',
      quantityRequired: 50,
      quantityFilled: 12,
      priority: 'High',
      expiryDate: '2026-08-31',
      description: 'Fresh vegetables, grain bags, canned beans, and shelf-stable dry ingredients.',
      specificItem: 'Canned Food & Staples',
    },
    {
      id: 'demand_utensils_1',
      ngoId: 'ngo_sf_food',
      ngoName: 'Springfield Food Bank & Pantry',
      ngoPhone: '+1 (555) 901-2345',
      ngoAddress: '101 Pennsylvania Ave, San Francisco, CA 94107',
      category: 'utensils',
      quantityRequired: 20,
      quantityFilled: 0,
      priority: 'Medium',
      expiryDate: '2026-07-25',
      description: 'Stainless steel pots, pans, ladles, and food containers for our community kitchen.',
      specificItem: 'Pots, Pans & Cookware',
    },
    {
      id: 'demand_clothing_1',
      ngoId: 'ngo_shelter_clothes',
      ngoName: 'Urban Hope Shelter & Closet',
      ngoPhone: '+1 (555) 876-5432',
      ngoAddress: '830 Eddy St, San Francisco, CA 94109',
      category: 'clothing',
      quantityRequired: 80,
      quantityFilled: 30,
      priority: 'High',
      expiryDate: '2026-09-15',
      description: 'Warm winter jackets, clean adult sweaters, boots, and business casual wear for job interviews.',
      specificItem: 'Shirts, Pants & Jackets',
    },
    {
      id: 'demand_furniture_1',
      ngoId: 'ngo_shelter_clothes',
      ngoName: 'Urban Hope Shelter & Closet',
      ngoPhone: '+1 (555) 876-5432',
      ngoAddress: '830 Eddy St, San Francisco, CA 94109',
      category: 'furniture',
      quantityRequired: 5,
      quantityFilled: 1,
      priority: 'Medium',
      expiryDate: '2026-08-15',
      description: 'Single mattresses, wooden desks, and sturdy dining chairs for family housing placements.',
      specificItem: 'Mattresses & Desks',
    },
    {
      id: 'demand_electronics_1',
      ngoId: 'ngo_youth_tech',
      ngoName: 'Youth Tech & Books Foundation',
      ngoPhone: '+1 (555) 345-6789',
      ngoAddress: '2200 O\'Farrell St, San Francisco, CA 94115',
      category: 'electronics',
      quantityRequired: 15,
      quantityFilled: 3,
      priority: 'High',
      expiryDate: '2026-08-10',
      description: 'Refurbished working tablets, laptops, and functional chargers for after-school tutoring.',
      specificItem: 'Tablets & Laptops',
    },
    {
      id: 'demand_books_1',
      ngoId: 'ngo_youth_tech',
      ngoName: 'Youth Tech & Books Foundation',
      ngoPhone: '+1 (555) 345-6789',
      ngoAddress: '2200 O\'Farrell St, San Francisco, CA 94115',
      category: 'books',
      quantityRequired: 60,
      quantityFilled: 25,
      priority: 'Low',
      expiryDate: '2026-12-31',
      description: 'Middle school novels, high school textbooks, sci-fi series, and coding reference materials.',
      specificItem: 'Educational Books',
    },
  ],
  donations: [
    {
      id: 'donation_active_1',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'clothing',
      quantity: 5,
      confidence: 0.96,
      detectedAt: '2026-08-05T09:30:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&auto=format&fit=crop&q=80',
      notes: 'Warm Winter Jackets & Sweaters (5 pcs). Clean and folded.',
      status: 'Pickup Scheduled',
      deliveryOtp: '482915',
      otpVerified: false,
      estimatedDeliveryTime: 'Today at 2:30 PM - 3:30 PM (Est. Arrival in 25 mins)',
      match: {
        ngoId: 'ngo_shelter_clothes',
        ngoName: 'Urban Hope Shelter & Closet',
        demandId: 'demand_clothing_1',
        matchScore: 98,
        reasons: ['Direct Category Fit: CLOTHING', 'Emergency Winter Need', 'High Priority Demand Match']
      },
      pickupSlot: {
        date: '2026-08-07',
        timeWindow: '2:00 PM - 4:00 PM',
        volunteerName: 'Alex Rivera (Express Courier)',
        volunteerPhone: '+1 (555) 789-0123',
        estimatedDeliveryTime: 'Today at 2:30 PM - 3:30 PM (Est. Arrival in 25 mins)',
        deliveryOtp: '482915'
      },
      trackingHistory: [
        { status: 'Draft', timestamp: '2026-08-05T09:30:00Z', note: 'Item detected via camera scanning' },
        { status: 'Matched', timestamp: '2026-08-05T10:00:00Z', note: 'Matched with Urban Hope Shelter' },
        { status: 'Pickup Scheduled', timestamp: '2026-08-06T14:15:00Z', note: 'Courier Alex assigned. Delivery OTP 482915 generated & sent via SMS.' }
      ]
    },
    {
      id: 'donation_active_2',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'food',
      quantity: 12,
      confidence: 0.98,
      detectedAt: '2026-08-04T11:00:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1584263347416-85a696b4eda7?w=400&auto=format&fit=crop&q=80',
      notes: 'Canned Soups & Pantry Beans (12 cans). Unopened with long expiration.',
      status: 'Collected',
      deliveryOtp: '739104',
      otpVerified: true,
      estimatedDeliveryTime: 'In Transit to Springfield Food Bank Hub',
      match: {
        ngoId: 'ngo_sf_food',
        ngoName: 'Springfield Food Bank & Pantry',
        demandId: 'demand_food_1',
        matchScore: 95,
        reasons: ['Direct Category Fit: FOOD', 'Canned Goods Priority']
      },
      pickupSlot: {
        date: '2026-08-06',
        timeWindow: '10:00 AM - 12:00 PM',
        volunteerName: 'Sam Chen',
        volunteerPhone: '+1 (555) 654-3210',
        estimatedDeliveryTime: 'In Transit to Springfield Food Bank Hub',
        deliveryOtp: '739104'
      },
      trackingHistory: [
        { status: 'Draft', timestamp: '2026-08-04T11:00:00Z', note: 'Item logged by donor' },
        { status: 'Pickup Scheduled', timestamp: '2026-08-05T09:00:00Z', note: 'Pickup dispatched with driver Sam' },
        { status: 'Collected', timestamp: '2026-08-06T10:45:00Z', note: 'Verified via Donor OTP (739104) at pickup handover' }
      ]
    },
    {
      id: 'hist_aug_1',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'books',
      quantity: 15,
      confidence: 0.95,
      detectedAt: '2026-08-02T10:00:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80',
      notes: 'High School STEM & Math Textbooks (15 books). Great condition.',
      status: 'Acknowledged',
      match: {
        ngoId: 'ngo_sf_edu',
        ngoName: 'Bay Area Education & Literacy',
        demandId: 'demand_books_1',
        matchScore: 97,
        reasons: ['Direct Category Fit: BOOKS', 'Textbooks Need']
      },
      trackingHistory: [
        { status: 'Delivered', timestamp: '2026-08-03T15:00:00Z', note: 'Handover complete' },
        { status: 'Acknowledged', timestamp: '2026-08-03T16:30:00Z', note: 'Receipt issued by Bay Area Education' }
      ]
    },
    {
      id: 'hist_jul_1',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'clothing',
      quantity: 24,
      confidence: 0.99,
      detectedAt: '2026-07-20T14:20:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      notes: 'Summer T-Shirts, Shirts & Pants (24 pcs). Clean & organized.',
      status: 'Acknowledged',
      match: {
        ngoId: 'ngo_shelter_clothes',
        ngoName: 'Urban Hope Shelter & Closet',
        demandId: 'demand_clothing_1',
        matchScore: 99,
        reasons: ['Direct Category Fit: CLOTHING']
      },
      trackingHistory: [
        { status: 'Acknowledged', timestamp: '2026-07-21T11:00:00Z', note: 'Receipt issued' }
      ]
    },
    {
      id: 'hist_jul_2',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'food',
      quantity: 18,
      confidence: 0.94,
      detectedAt: '2026-07-10T08:15:00Z',
      notes: 'Rice Bags & Grain Pouches (18 bags). Sealed.',
      status: 'Delivered',
      match: {
        ngoId: 'ngo_sf_food',
        ngoName: 'Springfield Food Bank & Pantry',
        demandId: 'demand_food_1',
        matchScore: 92,
        reasons: ['Direct Category Fit: FOOD']
      },
      trackingHistory: [
        { status: 'Delivered', timestamp: '2026-07-11T12:00:00Z', note: 'Delivered to pantry' }
      ]
    },
    {
      id: 'hist_jun_1',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'electronics',
      quantity: 8,
      confidence: 0.92,
      detectedAt: '2026-06-18T16:45:00Z',
      notes: 'Refurbished Laptops & Keyboards (8 units). Working condition.',
      status: 'Acknowledged',
      match: {
        ngoId: 'ngo_sf_edu',
        ngoName: 'Bay Area Education & Literacy',
        demandId: 'demand_elec_1',
        matchScore: 96,
        reasons: ['Direct Category Fit: ELECTRONICS']
      },
      trackingHistory: [
        { status: 'Acknowledged', timestamp: '2026-06-19T14:00:00Z', note: 'Receipt issued' }
      ]
    },
    {
      id: 'hist_jun_2',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'utensils',
      quantity: 20,
      confidence: 0.91,
      detectedAt: '2026-06-05T12:00:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=300&q=80',
      notes: 'Stainless Steel Cooking Pots & Plates (20 pcs). Clean.',
      status: 'Delivered',
      match: {
        ngoId: 'ngo_sf_food',
        ngoName: 'Springfield Food Bank & Pantry',
        demandId: 'demand_utensil_1',
        matchScore: 90,
        reasons: ['Direct Category Fit: UTENSILS']
      },
      trackingHistory: [
        { status: 'Delivered', timestamp: '2026-06-06T10:00:00Z', note: 'Delivered' }
      ]
    },
    {
      id: 'hist_may_1',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'clothing',
      quantity: 35,
      confidence: 0.98,
      detectedAt: '2026-05-15T09:00:00Z',
      notes: 'Children Clothing & Blankets (35 pcs). Excellent condition.',
      status: 'Acknowledged',
      match: {
        ngoId: 'ngo_shelter_clothes',
        ngoName: 'Urban Hope Shelter & Closet',
        demandId: 'demand_clothing_1',
        matchScore: 98,
        reasons: ['Direct Category Fit: CLOTHING']
      },
      trackingHistory: [
        { status: 'Acknowledged', timestamp: '2026-05-16T11:00:00Z', note: 'Receipt issued' }
      ]
    },
    {
      id: 'hist_apr_1',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'food',
      quantity: 22,
      confidence: 0.97,
      detectedAt: '2026-04-12T10:30:00Z',
      notes: 'Canned Vegetables & Cooking Oils (22 items).',
      status: 'Acknowledged',
      match: {
        ngoId: 'ngo_sf_food',
        ngoName: 'Springfield Food Bank & Pantry',
        demandId: 'demand_food_1',
        matchScore: 95,
        reasons: ['Direct Category Fit: FOOD']
      },
      trackingHistory: [
        { status: 'Acknowledged', timestamp: '2026-04-13T16:00:00Z', note: 'Receipt issued' }
      ]
    },
    {
      id: 'hist_mar_1',
      donorId: 'donor_jane',
      donorName: 'Jane Donor',
      donorPhone: '+1 (555) 432-1098',
      donorAddress: '456 Mission St, San Francisco, CA 94105',
      category: 'books',
      quantity: 30,
      confidence: 0.93,
      detectedAt: '2026-03-22T14:10:00Z',
      notes: 'Storybooks & Novels for Library (30 books).',
      status: 'Delivered',
      match: {
        ngoId: 'ngo_sf_edu',
        ngoName: 'Bay Area Education & Literacy',
        demandId: 'demand_books_1',
        matchScore: 94,
        reasons: ['Direct Category Fit: BOOKS']
      },
      trackingHistory: [
        { status: 'Delivered', timestamp: '2026-03-23T11:30:00Z', note: 'Delivered' }
      ]
    }
  ],
  notifications: [
    {
      id: 'notif_init_1',
      recipient: 'jane.donor@example.com',
      channel: 'Email',
      message: 'Welcome to SmartShare Donation Hub! Create an impact by sharing your clothing, food, and electronics.',
      sentAt: '2026-07-01T10:00:00Z',
    },
  ],
};

export class JSONDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = { ...DEFAULT_DB };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          donorProfile: parsed.donorProfile || DEFAULT_DB.donorProfile,
          ngos: parsed.ngos || DEFAULT_DB.ngos,
          demands: parsed.demands || DEFAULT_DB.demands,
          donations: (parsed.donations && parsed.donations.length > 0) 
            ? parsed.donations.map((d: any) => {
                if (d.pickupSlot && !d.deliveryOtp) {
                  const otp = Math.floor(100000 + Math.random() * 900000).toString();
                  d.deliveryOtp = otp;
                  d.pickupSlot.deliveryOtp = otp;
                }
                return d;
              })
            : DEFAULT_DB.donations,
          notifications: parsed.notifications || DEFAULT_DB.notifications,
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading database, using default values:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  getDonorProfile(): DonorProfile {
    return this.data.donorProfile;
  }

  updateDonorProfile(profile: Partial<DonorProfile>) {
    this.data.donorProfile = { ...this.data.donorProfile, ...profile };
    this.save();
    return this.data.donorProfile;
  }

  getNGOs(): NGO[] {
    return this.data.ngos;
  }

  addNGO(ngo: NGO) {
    this.data.ngos.push(ngo);
    this.save();
    return ngo;
  }

  getDemands(): NGODemand[] {
    return this.data.demands;
  }

  addDemand(demand: NGODemand) {
    this.data.demands.push(demand);
    this.save();
    return demand;
  }

  updateDemand(demandId: string, updates: Partial<NGODemand>) {
    const idx = this.data.demands.findIndex(d => d.id === demandId);
    if (idx !== -1) {
      this.data.demands[idx] = { ...this.data.demands[idx], ...updates };
      this.save();
      return this.data.demands[idx];
    }
    return null;
  }

  getDonations(): DonationItem[] {
    return this.data.donations;
  }

  addDonation(item: DonationItem) {
    this.data.donations.unshift(item);
    this.save();
    return item;
  }

  updateDonation(itemId: string, updates: Partial<DonationItem>) {
    const idx = this.data.donations.findIndex(d => d.id === itemId);
    if (idx !== -1) {
      const original = this.data.donations[idx];
      const trackingHistory = [...original.trackingHistory];

      // If status changed, record it in history
      if (updates.status && updates.status !== original.status) {
        trackingHistory.push({
          status: updates.status,
          timestamp: new Date().toISOString(),
          note: `Donation status updated to ${updates.status}`,
        });
        updates.trackingHistory = trackingHistory;
      }

      this.data.donations[idx] = { ...original, ...updates };
      this.save();
      return this.data.donations[idx];
    }
    return null;
  }

  deleteDemand(demandId: string) {
    const idx = this.data.demands.findIndex(d => d.id === demandId);
    if (idx !== -1) {
      const removed = this.data.demands.splice(idx, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  deleteDonation(itemId: string) {
    const idx = this.data.donations.findIndex(d => d.id === itemId);
    if (idx !== -1) {
      const removed = this.data.donations.splice(idx, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  getNotifications(): NotificationLog[] {
    return this.data.notifications;
  }

  addNotification(channel: 'SMS' | 'Email' | 'WhatsApp', recipient: string, message: string) {
    const notif: NotificationLog = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      recipient,
      channel,
      message,
      sentAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.save();
    console.log(`[SIMULATED NOTIFICATION - ${channel}] To: ${recipient} | Msg: ${message}`);
    return notif;
  }

  // Haversine distance in km
  calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Match ranking algorithm
  findMatchesForDonation(item: { category: ItemCategory; quantity: number }): any[] {
    const donor = this.getDonorProfile();
    const activeDemands = this.getDemands().filter(
      d => d.category === item.category && (d.quantityRequired - d.quantityFilled) > 0
    );

    const matches = activeDemands.map(demand => {
      const ngo = this.getNGOs().find(n => n.id === demand.ngoId);
      if (!ngo) return null;

      const distance = this.calculateDistance(donor.coordinates, ngo.coordinates);
      const remainingNeeded = demand.quantityRequired - demand.quantityFilled;

      let score = 50; // Base matching score for same category
      const reasons: string[] = [`Matches requested category: "${item.category.toUpperCase()}" (Base +50 pts)`];

      // Priority points
      if (demand.priority === 'High') {
        score += 20;
        reasons.push('NGO marked this category as HIGH Priority (+20 pts)');
      } else if (demand.priority === 'Medium') {
        score += 10;
        reasons.push('NGO marked this category as MEDIUM Priority (+10 pts)');
      } else {
        score += 5;
        reasons.push('NGO marked this category as LOW Priority (+5 pts)');
      }

      // Proximity points
      if (distance < 2.5) {
        score += 15;
        reasons.push(`Highly convenient proximity: ${distance.toFixed(1)} km away (+15 pts)`);
      } else if (distance < 6.0) {
        score += 10;
        reasons.push(`Moderate proximity: ${distance.toFixed(1)} km away (+10 pts)`);
      } else {
        score += 5;
        reasons.push(`Geographically feasible distance: ${distance.toFixed(1)} km away (+5 pts)`);
      }

      // Quantity fit points
      if (item.quantity <= remainingNeeded) {
        score += 15;
        reasons.push(`Perfect quantity coverage: donation fits 100% of the remaining demand (+15 pts)`);
      } else {
        score += 10;
        reasons.push(`Partial supply fit: donation completely covers need and yields a surplus (+10 pts)`);
      }

      // Normalize max score to 100
      const finalScore = Math.min(Math.round(score), 100);

      return {
        demandId: demand.id,
        ngoId: demand.ngoId,
        ngoName: demand.ngoName,
        ngoPhone: demand.ngoPhone,
        ngoAddress: demand.ngoAddress,
        matchScore: finalScore,
        reasons,
        distance: parseFloat(distance.toFixed(2)),
        demandPriority: demand.priority,
        demandRemaining: remainingNeeded,
        specificItem: demand.specificItem,
      };
    }).filter(Boolean);

    // Sort by score descending
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const db = new JSONDatabase();
