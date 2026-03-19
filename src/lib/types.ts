
export type TourType = 'group' | 'workshop' | 'corporate' | 'school';

export interface Tour {
  id: string;
  name: string;
  description: string;
  highlights: string[];
  location: string;
  duration: string;
  price: number;
  childPrice?: number;
  type: TourType;
  capacity: number;
  bookedSpaces: number;
  imageUrl: string;
  minGroupSize: number;
  scheduledDates: string[];
  /** Map of date strings (YYYY-MM-DD) to facilitator emails */
  facilitatorAssignments?: Record<string, string>;
  isActive?: boolean;
  status?: 'live' | 'coming-soon';
  tourOwnerId?: string;
  facilitatorEmail?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Booking {
  id: string;
  tourId: string;
  userId: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  date: string;
  bookingType: TourType;
  totalPrice: number;
}
