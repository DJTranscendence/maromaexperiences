import { Tour } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const MOCK_TOURS: Tour[] = [
  {
    id: '1',
    name: 'Coastal Sunset Expedition',
    description: 'Explore the rugged coastline and hidden caves as the sun dips below the horizon.',
    highlights: ['Cave exploration', 'Sunset photography', 'Marine life observation'],
    location: 'The Maroma Campus',
    duration: '3 hours',
    price: 85,
    type: 'group',
    capacity: 20,
    bookedSpaces: 12,
    minGroupSize: 8,
    imageUrl: PlaceHolderImages[0].imageUrl,
    scheduledDates: ['2024-06-15', '2024-06-22', '2024-06-29']
  },
  {
    id: '2',
    name: 'Artisanal Pottery Workshop',
    description: 'Learn the ancient art of wheel-thrown pottery from master artisans.',
    highlights: ['Clay techniques', 'Firing process', 'Custom glaze'],
    location: 'The Maroma Spa',
    duration: '4 hours',
    price: 120,
    type: 'workshop',
    capacity: 10,
    bookedSpaces: 9,
    minGroupSize: 4,
    imageUrl: PlaceHolderImages[1].imageUrl,
    scheduledDates: ['2024-07-01', '2024-07-08']
  },
  {
    id: '3',
    name: 'Historical Quarter Walk',
    description: 'A deep dive into the architecture and legends of the old town.',
    highlights: ['Medieval architecture', 'Secret gardens', 'Legend storytelling'],
    location: 'The Maroma Campus',
    duration: '2 hours',
    price: 45,
    type: 'school',
    capacity: 50,
    bookedSpaces: 0,
    minGroupSize: 15,
    imageUrl: PlaceHolderImages[2].imageUrl,
    scheduledDates: ['2024-06-18', '2024-06-25']
  },
  {
    id: '4',
    name: 'Leadership & Connection Retreat',
    description: 'Tailored experiences for corporate teams to strengthen bonds and vision.',
    highlights: ['Collaborative challenges', 'Strategy sessions', 'Private catering'],
    location: 'The Maroma Spa',
    duration: 'Full day',
    price: 500,
    type: 'corporate',
    capacity: 30,
    bookedSpaces: 0,
    minGroupSize: 10,
    imageUrl: PlaceHolderImages[3].imageUrl,
    scheduledDates: ['Flexible - On Request']
  }
];