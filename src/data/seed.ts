import { Board, BoardType, ProUser } from '../types/board';

const SURF_CITIES = [
  { name: 'Honolulu', lat: 21.3099, lon: -157.8581 },
  { name: 'Kona', lat: 19.6400, lon: -155.9969 },
  { name: 'San Diego', lat: 32.7157, lon: -117.1611 },
  { name: 'Santa Cruz', lat: 36.9741, lon: -122.0308 },
  { name: 'Bali', lat: -8.3405, lon: 115.0920 },
  { name: 'Gold Coast', lat: -28.0167, lon: 153.4000 },
  { name: 'Hossegor', lat: 43.6647, lon: -1.3967 },
  { name: 'Ericeira', lat: 38.9631, lon: -9.4170 },
  { name: 'Taghazout', lat: 30.5456, lon: -9.7103 },
  { name: 'Chiba', lat: 35.6050, lon: 140.1233 },
  { name: 'Lisbon', lat: 38.7223, lon: -9.1393 },
  { name: 'Puerto Escondido', lat: 15.8720, lon: -97.0767 },
];

const BOARD_BRANDS = ['Channel Islands', 'Firewire', 'Lost', 'JS', 'DHD', 'Pyzel', 'Sharp Eye', 'Catch Surf', 'Stewart', 'Takayama'];
const PICKUP_SPOTS = ['Beach parking lot', 'Surf shop downtown', 'Hotel lobby', 'Airport pickup available', 'Main beach access'];

const PRO_USERS: ProUser[] = [
  {
    id: 'pro-1',
    name: 'Jake Thompson',
    email: 'jake@surfrentals.com',
    phone: '+1-808-555-0123',
    location: 'Honolulu',
    joinedDate: '2023-01-15',
    totalBoards: 8,
    rating: 4.9,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8cqe04ampu7qlz037go5g'
  },
  {
    id: 'pro-2',
    name: 'Maria Santos',
    email: 'maria@oceanboards.com',
    phone: '+1-619-555-0456',
    location: 'San Diego',
    joinedDate: '2022-08-20',
    totalBoards: 12,
    rating: 4.8,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/v9t3gs6psai2ittle3znc'
  },
  {
    id: 'pro-3',
    name: 'Kai Nakamura',
    email: 'kai@bigislandsurf.com',
    phone: '+1-808-555-0789',
    location: 'Kona',
    joinedDate: '2023-03-10',
    totalBoards: 6,
    rating: 4.7,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/whhktsqzefoxdo6e4k449'
  },
  {
    id: 'pro-4',
    name: 'Sophie Martinez',
    email: 'sophie@santacruzboards.com',
    phone: '+1-831-555-0234',
    location: 'Santa Cruz',
    joinedDate: '2022-11-05',
    totalBoards: 10,
    rating: 4.9,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/muzq2f5ee08pcsjfucs6f'
  },
  {
    id: 'pro-5',
    name: 'Wayan Surya',
    email: 'wayan@balisurf.id',
    phone: '+62-361-555-0567',
    location: 'Bali',
    joinedDate: '2023-02-28',
    totalBoards: 15,
    rating: 4.8,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/k3l2cj81ppz9gtyn25eyp'
  },
  {
    id: 'pro-6',
    name: 'Liam O\'Connor',
    email: 'liam@goldcoastrentals.au',
    phone: '+61-7-555-0890',
    location: 'Gold Coast',
    joinedDate: '2022-12-12',
    totalBoards: 9,
    rating: 4.6,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/e0kypkhsg1py7f7ysk3iq'
  },
  {
    id: 'pro-7',
    name: 'Pierre Dubois',
    email: 'pierre@hossegorsurf.fr',
    phone: '+33-5-555-0123',
    location: 'Hossegor',
    joinedDate: '2023-04-18',
    totalBoards: 7,
    rating: 4.7,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/9sxedsc691g8db0951qui'
  },
  {
    id: 'pro-8',
    name: 'João Silva',
    email: 'joao@ericeiraboards.pt',
    phone: '+351-261-555-0456',
    location: 'Ericeira',
    joinedDate: '2022-09-30',
    totalBoards: 11,
    rating: 4.8,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pwe7ic96pbj5q1m0e8zb3'
  },
  {
    id: 'pro-9',
    name: 'Youssef Alami',
    email: 'youssef@taghazoutsurf.ma',
    phone: '+212-528-555-0789',
    location: 'Taghazout',
    joinedDate: '2023-01-22',
    totalBoards: 5,
    rating: 4.5,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ulgzcfu6gha13sbd1a3qq'
  },
  {
    id: 'pro-10',
    name: 'Hiroshi Tanaka',
    email: 'hiroshi@chibasurf.jp',
    phone: '+81-43-555-0234',
    location: 'Chiba',
    joinedDate: '2022-10-15',
    totalBoards: 8,
    rating: 4.9,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/y0vffwaih195cwyxu8lpv'
  },
  {
    id: 'pro-11',
    name: 'Ana Costa',
    email: 'ana@lisbonboards.pt',
    phone: '+351-21-555-0567',
    location: 'Lisbon',
    joinedDate: '2023-05-08',
    totalBoards: 13,
    rating: 4.7,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ypab9klm9adxtf4w33vpl'
  },
  {
    id: 'pro-12',
    name: 'Carlos Mendez',
    email: 'carlos@puertosurf.mx',
    phone: '+52-954-555-0890',
    location: 'Puerto Escondido',
    joinedDate: '2022-07-25',
    totalBoards: 6,
    rating: 4.6,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xrc4i80atsf4i22uhwk6o'
  }
];

function randomBetween(min: number, max: number): number {
  if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
    throw new Error('Invalid range parameters');
  }
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function generateBoardName(type: BoardType, brand: string): string {
  const models = {
    'soft-top': ['Foamie', 'Catch', 'Log', 'Cruiser'],
    'longboard': ['Noserider', 'Logger', 'Classic', 'Performer'],
    'shortboard': ['Rocket', 'Phantom', 'Flash', 'Blade', 'Whip'],
    'fish': ['Twin', 'Retro', 'Keel', 'Swallow'],
    'sup': ['Paddle', 'Touring', 'All-Around', 'Race']
  };
  const model = models[type][Math.floor(Math.random() * models[type].length)];
  return `${brand} ${model}`;
}

function generateDimensions(type: BoardType): { dims: string; volume: number } {
  let length: string;
  let volume: number;
  
  switch (type) {
    case 'soft-top':
      const softFeet = randomInt(7, 9);
      const softInches = randomInt(0, 11);
      length = `${softFeet}'${softInches}"`;
      volume = randomInt(55, 80);
      break;
    case 'longboard':
      const longFeet = randomInt(8, 10);
      const longInches = randomInt(0, 11);
      length = `${longFeet}'${longInches}"`;
      volume = randomInt(60, 85);
      break;
    case 'shortboard':
      const shortFeet = randomInt(5, 6);
      const shortInches = randomInt(4, 11);
      length = `${shortFeet}'${shortInches}"`;
      volume = randomInt(24, 38);
      break;
    case 'fish':
      const fishFeet = randomInt(5, 6);
      const fishInches = randomInt(6, 11);
      length = `${fishFeet}'${fishInches}"`;
      volume = randomInt(28, 42);
      break;
    case 'sup':
      const supFeet = randomInt(9, 12);
      const supInches = randomInt(0, 11);
      length = `${supFeet}'${supInches}"`;
      volume = randomInt(200, 350);
      break;
  }
  
  const width = randomBetween(18, 22).toFixed(1);
  const thickness = randomBetween(2.25, 3).toFixed(2);
  
  return {
    dims: `${length} x ${width}" x ${thickness}"`,
    volume
  };
}

function generatePrices(type: BoardType): { day: number; week: number } {
  let dayPrice: number;
  
  switch (type) {
    case 'soft-top':
      dayPrice = randomInt(25, 45);
      break;
    case 'longboard':
      dayPrice = randomInt(35, 60);
      break;
    case 'shortboard':
      dayPrice = randomInt(20, 40);
      break;
    case 'fish':
      dayPrice = randomInt(25, 45);
      break;
    case 'sup':
      dayPrice = randomInt(40, 70);
      break;
  }
  
  return {
    day: dayPrice,
    week: Math.round(dayPrice * 5)
  };
}

function generateAvailability(): { start: string; end: string } {
  const startMonth = randomInt(1, 12);
  const startDay = randomInt(1, 28);
  const endMonth = randomInt(startMonth, 12);
  const endDay = endMonth === startMonth ? randomInt(startDay, 28) : randomInt(1, 28);
  
  const start = new Date(2025, startMonth - 1, startDay).toISOString();
  const end = new Date(2025, endMonth - 1, endDay).toISOString();
  
  return { start, end };
}

export function getBoards(count: number = 100): Board[] {
  const boards: Board[] = [];
  
  // Distribution: soft-top ~20%, longboard ~25%, shortboard ~30%, fish ~15%, sup ~10%
  const typeDistribution: BoardType[] = [
    ...Array(20).fill('soft-top'),
    ...Array(25).fill('longboard'),
    ...Array(30).fill('shortboard'),
    ...Array(15).fill('fish'),
    ...Array(10).fill('sup')
  ];
  
  for (let i = 0; i < count; i++) {
    const type = typeDistribution[i] as BoardType;
    const city = SURF_CITIES[i % SURF_CITIES.length];
    const brand = BOARD_BRANDS[Math.floor(Math.random() * BOARD_BRANDS.length)];
    const { dims, volume } = generateDimensions(type);
    const { day, week } = generatePrices(type);
    const { start, end } = generateAvailability();
    
    // Add jitter to lat/lon to avoid exact overlaps
    const latJitter = randomBetween(-0.25, 0.25);
    const lonJitter = randomBetween(-0.25, 0.25);
    
    const boardName = generateBoardName(type, brand);
    
    // Set image URL based on board type and brand/name
    let imageUrl = '';
    const isCatchSurf = brand.toLowerCase().includes('catch surf') || 
                       boardName.toLowerCase().includes('catch surf') ||
                       boardName.toLowerCase().includes('foamie') ||
                       type === 'soft-top';
    
    const isChannelIslands = brand.toLowerCase().includes('channel islands') && 
                            !boardName.toLowerCase().includes('foamie') && 
                            !boardName.toLowerCase().includes('soft top') &&
                            type !== 'soft-top';
    
    const isLongboard = type === 'longboard' && 
                       !boardName.toLowerCase().includes('foamie') && 
                       !boardName.toLowerCase().includes('soft top') &&
                       !isCatchSurf;
    
    const isPyzel = brand.toLowerCase().includes('pyzel') || 
                   boardName.toLowerCase().includes('pyzel');
    
    const isDHD = brand.toLowerCase().includes('dhd') || 
                 boardName.toLowerCase().includes('dhd');
    
    const isSharpEye = brand.toLowerCase().includes('sharp eye') || 
                      boardName.toLowerCase().includes('sharp eye') ||
                      brand.toLowerCase().includes('sharpeye') || 
                      boardName.toLowerCase().includes('sharpeye');
    
    const isFirewire = brand.toLowerCase().includes('firewire') || 
                      boardName.toLowerCase().includes('firewire');
    
    if (isCatchSurf) {
      // Use the new foam board images for soft-top, foamie, or Catch Surf boards
      const foamBoardImages = [
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ivoyo45gyuev8p4vtzqod', // Red/cream foam board
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/v2c40370gpyc7hvw3dpvn', // Green/cream foam board
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/lzgtg9f6b7vbvuqpyrjx3', // Pink Odyssea foam board
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pd9mbwb6oxf5gc74mo5ld', // Blue foam longboard
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/gaqgrtj0t3ndeqjli0mkn', // Blue/white striped foam board
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/amcd0ehyjk6fejqanm7sl', // Blue foam SUP/longboard
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/93duolylej9ljdfvaz1at'  // Teal/white foam longboard
      ];
      imageUrl = foamBoardImages[Math.floor(Math.random() * foamBoardImages.length)];
    } else if (isFirewire) {
      // Use Firewire images for Firewire boards
      const firewireImages = [
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fdr01p79y0g47fpdurtas',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fd0ulpbi1js6kp729kizx',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/kqym61u8sje7ix5aa853k',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0qljwfsb68uxerybsy3w1',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/bvgyh486yz2wwneh7wsr8',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/vu0b644ehzerjujn62ipg'
      ];
      imageUrl = firewireImages[Math.floor(Math.random() * firewireImages.length)];
    } else if (isSharpEye) {
      // Use Sharpeye images for Sharpeye boards
      const sharpeyeImages = [
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/7951tcu67euz1vjvk36zk'
      ];
      imageUrl = sharpeyeImages[Math.floor(Math.random() * sharpeyeImages.length)];
    } else if (isDHD) {
      // Use DHD images for DHD boards
      const dhdImages = [
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/319h08jov9dpdkyuxfdhm',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pevonep0vdanph9dn5j3d',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zv6nhl1kdlli8q1e05kzk',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fhfvd7mgndjt0sfsxqzqh',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/x3gcnfjg0xg4htxxd7i3g'
      ];
      imageUrl = dhdImages[Math.floor(Math.random() * dhdImages.length)];
    } else if (isPyzel) {
      // Use Pyzel images for Pyzel boards
      const pyzelImages = [
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/kbg1n1pp14j13wohdmvy7',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/vrfkefo9z5y0lftmvtguk',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/q0hemhd4uk77xgfzcjffe',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/grcz9njrri7cpqunkdyjy',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/95xfszp6b81k66n94nhoq'
      ];
      imageUrl = pyzelImages[Math.floor(Math.random() * pyzelImages.length)];
    } else if (isChannelIslands) {
      // Use Channel Islands images for Channel Islands boards (excluding foamie/soft-top)
      const channelIslandsImages = [
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/gih72e4cmac743nzt14n8',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/w6wfdx5xjhh786jc6ziwz',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6g93f1uzyxx98i96707eb',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/dif3tc890ldpwxyq850rc',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zn3h9h8km1sfjdwu0qqae'
      ];
      imageUrl = channelIslandsImages[Math.floor(Math.random() * channelIslandsImages.length)];
    } else if (isLongboard) {
      // Use longboard images for longboards (excluding foamie/soft-top)
      const longboardImages = [
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/wiv8j1fih6lauzkgqiy0f',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/cvafj2j2u0q0jg8o1cpe0',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/e25lw4u7a3du96r3osi8p',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/z5zv680w62242r0jss1gm',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/db8e7n7hxqof4o9kgyzzk',
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/5y93yoccgyrtvdr4m20i4'
      ];
      imageUrl = longboardImages[Math.floor(Math.random() * longboardImages.length)];
    } else {
      // Use the new surfboard images for general boards
      const generalBoardImages = [
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/yibeyd5modqgotmxsnub5', // White surfboards with black trim
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/a3t5t1gf64hv0hig8i04y', // White surfboards with black trim (different angle)
        'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/nhbx86vsz2azqtnyzmwfg'  // Black surfboard with orange trim
      ];
      
      switch (type) {
        case 'longboard':
          // Fallback for longboards that might be soft-top/foamie
          imageUrl = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0q8809fsjc8wbcom1ad72';
          break;
        case 'shortboard':
          // Use new images for shortboards
          imageUrl = generalBoardImages[Math.floor(Math.random() * generalBoardImages.length)];
          break;
        case 'fish':
          // Use new images for fish boards
          imageUrl = generalBoardImages[Math.floor(Math.random() * generalBoardImages.length)];
          break;
        case 'sup':
          imageUrl = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zd6qsfwllzkmuogtpk6de';
          break;
        default:
          imageUrl = generalBoardImages[Math.floor(Math.random() * generalBoardImages.length)];
          break;
      }
    }
    
    // 75% of boards have delivery available
    const deliveryAvailable = Math.random() < 0.75;
    const deliveryPrice = 50;
    
    // Assign owner based on location, with some randomness
    const locationOwners = PRO_USERS.filter(user => user.location === city.name);
    let owner: ProUser;
    
    if (locationOwners.length > 0) {
      // 80% chance to use local owner, 20% chance to use random owner
      if (Math.random() < 0.8) {
        owner = locationOwners[Math.floor(Math.random() * locationOwners.length)];
      } else {
        owner = PRO_USERS[Math.floor(Math.random() * PRO_USERS.length)];
      }
    } else {
      // If no local owner, use random owner
      owner = PRO_USERS[Math.floor(Math.random() * PRO_USERS.length)];
    }
    
    boards.push({
      id: `board-${i + 1}`,
      short_name: boardName,
      dimensions_detail: dims,
      volume_l: volume,
      price_per_day: day,
      price_per_week: week,
      available_start: start,
      available_end: end,
      location: city.name,
      pickup_spot: PICKUP_SPOTS[Math.floor(Math.random() * PICKUP_SPOTS.length)],
      lat: city.lat + latJitter,
      lon: city.lon + lonJitter,
      type,
      imageUrl,
      delivery_available: deliveryAvailable,
      delivery_price: deliveryPrice,
      owner
    });
  }
  
  // Shuffle the array to mix types across cities
  for (let i = boards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [boards[i], boards[j]] = [boards[j], boards[i]];
  }
  
  return boards;
}

export function getProUsers(): ProUser[] {
  return PRO_USERS;
}