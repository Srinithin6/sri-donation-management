/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ItemCategory = 'clothing' | 'food' | 'books' | 'electronics' | 'furniture' | 'utensils';

export type ItemStatus =
  | 'Draft'
  | 'Matched'
  | 'Packaging Notified'
  | 'Pickup Scheduled'
  | 'Collected'
  | 'Delivered'
  | 'Acknowledged';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface DonorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  coordinates: LocationCoordinates;
}

export interface DonationItem {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorAddress: string;
  category: ItemCategory;
  quantity: number;
  confidence: number;
  detectedAt: string;
  imageUrl?: string; // Base64 or sample URL
  notes: string;
  status: ItemStatus;
  match?: {
    ngoId: string;
    ngoName: string;
    demandId: string;
    matchScore: number;
    reasons: string[];
  };
  pickupSlot?: {
    date: string;
    timeWindow: string;
    volunteerName: string;
    volunteerPhone: string;
    estimatedDeliveryTime?: string;
    deliveryOtp?: string;
  };
  deliveryOtp?: string;
  otpVerified?: boolean;
  estimatedDeliveryTime?: string;
  trackingHistory: {
    status: ItemStatus;
    timestamp: string;
    note: string;
  }[];
}

export interface NGO {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  coordinates: LocationCoordinates;
  description: string;
}

export interface NGODemand {
  id: string;
  ngoId: string;
  ngoName: string;
  ngoPhone: string;
  ngoAddress: string;
  category: ItemCategory;
  quantityRequired: number;
  quantityFilled: number;
  priority: 'Low' | 'Medium' | 'High';
  expiryDate: string;
  description: string;
  specificItem?: string;
}

export interface MatchResult {
  donationItemId: string;
  demandId: string;
  ngoId: string;
  ngoName: string;
  matchScore: number; // 0 to 100
  reasons: string[];
}

export interface NotificationLog {
  id: string;
  recipient: string;
  channel: 'SMS' | 'Email' | 'WhatsApp';
  message: string;
  sentAt: string;
}

export interface PackagingChecklist {
  category: ItemCategory;
  title: string;
  steps: string[];
}
