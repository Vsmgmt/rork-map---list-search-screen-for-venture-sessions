export interface SeedProUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar_url: string;
  bio: string;
  rating: number;
}

export const SEED_PRO_USERS: SeedProUser[] = [
  {
    id: 'seed-pro-1',
    name: 'Keanu Reeves',
    email: 'keanu@surfhi.com',
    phone: '+1-808-555-1001',
    location: 'Honolulu, HI',
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Pro surf coach with 15 years of experience. Specialized in big wave riding and surf safety.',
    rating: 4.9,
  },
  {
    id: 'seed-pro-2',
    name: 'Leilani Nakamura',
    email: 'leilani@alohasurf.com',
    phone: '+1-808-555-1002',
    location: 'Kona, HI',
    avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Local surf instructor and ocean conservationist. Teaching beginners to advanced surfers since 2010.',
    rating: 4.8,
  },
  {
    id: 'seed-pro-3',
    name: 'Jake "Barrel" Thompson',
    email: 'jake@northshoresurf.com',
    phone: '+1-808-555-1003',
    location: 'Haleiwa, HI',
    avatar_url: 'https://randomuser.me/api/portraits/men/67.jpg',
    bio: 'North Shore local and former competitive surfer. Expert in all board types and surf conditions.',
    rating: 4.9,
  },
  {
    id: 'seed-pro-4',
    name: 'Maria Santos',
    email: 'maria@waikikiboards.com',
    phone: '+1-808-555-1004',
    location: 'Waikiki, HI',
    avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg',
    bio: 'Waikiki beach expert specializing in longboard and SUP instruction. Family-friendly lessons.',
    rating: 4.7,
  },
  {
    id: 'seed-pro-5',
    name: 'Kai Moana',
    email: 'kai@mauisurf.com',
    phone: '+1-808-555-1005',
    location: 'Lahaina, HI',
    avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg',
    bio: 'Maui surf guide and board rental specialist. Expert knowledge of West Maui breaks.',
    rating: 4.8,
  },
  {
    id: 'seed-pro-6',
    name: 'Sophie Martinez',
    email: 'sophie@pipelinesurf.com',
    phone: '+1-808-555-1006',
    location: 'Sunset Beach, HI',
    avatar_url: 'https://randomuser.me/api/portraits/women/65.jpg',
    bio: 'Pipeline and Sunset Beach specialist. Pro surfer with 20+ years of ocean experience.',
    rating: 5.0,
  },
  {
    id: 'seed-pro-7',
    name: 'Makoa Williams',
    email: 'makoa@hilosurf.com',
    phone: '+1-808-555-1007',
    location: 'Hilo, HI',
    avatar_url: 'https://randomuser.me/api/portraits/men/41.jpg',
    bio: 'Big Island surf instructor focusing on safety and fun. Great with kids and beginners.',
    rating: 4.6,
  },
  {
    id: 'seed-pro-8',
    name: 'Alana Kealoha',
    email: 'alana@kauaiboards.com',
    phone: '+1-808-555-1008',
    location: 'Poipu, HI',
    avatar_url: 'https://randomuser.me/api/portraits/women/89.jpg',
    bio: 'Kauai native and professional surf coach. Expert in reading Hawaiian surf conditions.',
    rating: 4.9,
  },
  {
    id: 'seed-pro-9',
    name: 'Duke Anderson',
    email: 'duke@diamondheadsurf.com',
    phone: '+1-808-555-1009',
    location: 'Diamond Head, HI',
    avatar_url: 'https://randomuser.me/api/portraits/men/73.jpg',
    bio: 'Named after Duke Kahanamoku. Passionate about preserving Hawaiian surf culture and traditions.',
    rating: 4.8,
  },
  {
    id: 'seed-pro-10',
    name: 'Nani Chang',
    email: 'nani@kahalaoahu.com',
    phone: '+1-808-555-1010',
    location: 'Kahala, HI',
    avatar_url: 'https://randomuser.me/api/portraits/women/90.jpg',
    bio: 'Elite surf coach and former national champion. Specializes in competition training and technique.',
    rating: 5.0,
  },
];
