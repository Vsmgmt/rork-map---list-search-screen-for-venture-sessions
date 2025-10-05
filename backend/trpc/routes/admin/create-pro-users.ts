import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db';
import { ProUser, Board, BoardType } from '@/src/types/board';

const SURF_CITIES = [
  { name: 'Honolulu', lat: 21.3099, lon: -157.8581 },
  { name: 'San Diego', lat: 32.7157, lon: -117.1611 },
  { name: 'Santa Cruz', lat: 36.9741, lon: -122.0308 },
  { name: 'Bali', lat: -8.3405, lon: 115.0920 },
  { name: 'Gold Coast', lat: -28.0167, lon: 153.4000 }
];

const BOARD_BRANDS = ['Channel Islands', 'Firewire', 'Lost', 'JS', 'DHD', 'Pyzel', 'Sharp Eye', 'Catch Surf', 'Stewart', 'Takayama'];
const PICKUP_SPOTS = ['Beach parking lot', 'Surf shop downtown', 'Hotel lobby', 'Airport pickup available', 'Main beach access'];

function randomBetween(min: number, max: number): number {
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

function getBoardImageUrl(type: BoardType, brand: string, boardName: string): string {
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
    const foamBoardImages = [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ivoyo45gyuev8p4vtzqod',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/v2c40370gpyc7hvw3dpvn',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/lzgtg9f6b7vbvuqpyrjx3',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pd9mbwb6oxf5gc74mo5ld',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/gaqgrtj0t3ndeqjli0mkn',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/amcd0ehyjk6fejqanm7sl',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/93duolylej9ljdfvaz1at'
    ];
    return foamBoardImages[Math.floor(Math.random() * foamBoardImages.length)];
  } else if (isFirewire) {
    const firewireImages = [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fdr01p79y0g47fpdurtas',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fd0ulpbi1js6kp729kizx',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/kqym61u8sje7ix5aa853k',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0qljwfsb68uxerybsy3w1',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/bvgyh486yz2wwneh7wsr8',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/vu0b644ehzerjujn62ipg'
    ];
    return firewireImages[Math.floor(Math.random() * firewireImages.length)];
  } else if (isSharpEye) {
    return 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/7951tcu67euz1vjvk36zk';
  } else if (isDHD) {
    const dhdImages = [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/319h08jov9dpdkyuxfdhm',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pevonep0vdanph9dn5j3d',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zv6nhl1kdlli8q1e05kzk',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fhfvd7mgndjt0sfsxqzqh',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/x3gcnfjg0xg4htxxd7i3g'
    ];
    return dhdImages[Math.floor(Math.random() * dhdImages.length)];
  } else if (isPyzel) {
    const pyzelImages = [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/kbg1n1pp14j13wohdmvy7',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/vrfkefo9z5y0lftmvtguk',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/q0hemhd4uk77xgfzcjffe',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/grcz9njrri7cpqunkdyjy',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/95xfszp6b81k66n94nhoq'
    ];
    return pyzelImages[Math.floor(Math.random() * pyzelImages.length)];
  } else if (isChannelIslands) {
    const channelIslandsImages = [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/gih72e4cmac743nzt14n8',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/w6wfdx5xjhh786jc6ziwz',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6g93f1uzyxx98i96707eb',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/dif3tc890ldpwxyq850rc',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zn3h9h8km1sfjdwu0qqae'
    ];
    return channelIslandsImages[Math.floor(Math.random() * channelIslandsImages.length)];
  } else if (isLongboard) {
    const longboardImages = [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/wiv8j1fih6lauzkgqiy0f',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/cvafj2j2u0q0jg8o1cpe0',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/e25lw4u7a3du96r3osi8p',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/z5zv680w62242r0jss1gm',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/db8e7n7hxqof4o9kgyzzk',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/5y93yoccgyrtvdr4m20i4'
    ];
    return longboardImages[Math.floor(Math.random() * longboardImages.length)];
  } else {
    const generalBoardImages = [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/yibeyd5modqgotmxsnub5',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/a3t5t1gf64hv0hig8i04y',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/nhbx86vsz2azqtnyzmwfg'
    ];
    
    switch (type) {
      case 'longboard':
        return 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0q8809fsjc8wbcom1ad72';
      case 'sup':
        return 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zd6qsfwllzkmuogtpk6de';
      default:
        return generalBoardImages[Math.floor(Math.random() * generalBoardImages.length)];
    }
  }
}

export const createProUsersRoute = publicProcedure
  .input(z.object({}).optional())
  .mutation(async ({ ctx, input }) => {
    console.log('🏄‍♂️ Creating 5 pro users with 5 boards each...');
    
    try {
      const createdUsers: ProUser[] = [];
      const createdBoards: Board[] = [];
      
      // Create 5 pro users
      for (let i = 0; i < 5; i++) {
        const city = SURF_CITIES[i];
        const userId = `pro-new-${Date.now()}-${i + 1}`;
        
        const proUser: ProUser = {
          id: userId,
          name: `Pro Surfer ${i + 1}`,
          email: `prosurfer${i + 1}@surfboards.com`,
          phone: `+1-555-${String(i + 1).padStart(3, '0')}-${randomInt(1000, 9999)}`,
          location: city.name,
          joinedDate: new Date().toISOString(),
          totalBoards: 5,
          rating: randomBetween(4.5, 5.0),
          verified: true,
          avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + randomInt(1, 999999999)}?w=150&h=150&fit=crop&crop=face`
        };
        
        // Add pro user to database
        if ('createProUser' in db) {
          // Supabase database
          await (db as any).createProUser(proUser);
        } else if ('runAsync' in db) {
          // SQLite database
          await (db as any).runAsync(
            'INSERT INTO pro_users (id, data) VALUES (?, ?)',
            [proUser.id, JSON.stringify(proUser)]
          );
        } else {
          // Memory database - would need to implement addProUser method
          console.log('Memory database - pro user creation not fully implemented');
        }
        
        createdUsers.push(proUser);
        
        // Create 5 boards for each pro user
        const boardTypes: BoardType[] = ['shortboard', 'longboard', 'fish', 'soft-top', 'sup'];
        
        for (let j = 0; j < 5; j++) {
          const type = boardTypes[j];
          const brand = BOARD_BRANDS[Math.floor(Math.random() * BOARD_BRANDS.length)];
          const { dims, volume } = generateDimensions(type);
          const { day, week } = generatePrices(type);
          const { start, end } = generateAvailability();
          
          // Add jitter to lat/lon to avoid exact overlaps
          const latJitter = randomBetween(-0.1, 0.1);
          const lonJitter = randomBetween(-0.1, 0.1);
          
          const boardName = generateBoardName(type, brand);
          const imageUrl = getBoardImageUrl(type, brand, boardName);
          
          const boardId = `board-${userId}-${j + 1}-${Date.now()}`;
          
          const board: Board = {
            id: boardId,
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
            delivery_available: Math.random() < 0.75,
            delivery_price: 50,
            owner: proUser
          };
          
          // Add board to database
          await db.addBoard(board);
          
          createdBoards.push(board);
        }
      }
      
      console.log(`✅ Successfully created ${createdUsers.length} pro users with ${createdBoards.length} boards`);
      
      return {
        success: true,
        message: `Successfully created ${createdUsers.length} pro users with ${createdBoards.length} boards`,
        data: {
          proUsers: createdUsers,
          boards: createdBoards,
          totalProUsers: createdUsers.length,
          totalBoards: createdBoards.length
        }
      };
    } catch (error) {
      console.error('❌ Error creating pro users and boards:', error);
      throw new Error(`Failed to create pro users and boards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });