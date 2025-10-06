import { supabase } from './supabase';
import { ProUser } from '@/src/types/board';

const PRO_USERS_DATA: Omit<ProUser, 'id'>[] = [
  {
    name: 'Marcus Rodriguez',
    email: 'marcus@waveridersrentals.com',
    phone: '+1-310-555-0199',
    location: 'Santa Cruz',
    joinedDate: new Date().toISOString(),
    totalBoards: 0,
    rating: 4.8,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8cqe04ampu7qlz037go5g'
  },
  {
    name: 'Isabella Chen',
    email: 'isabella@oceanwaveboards.com',
    phone: '+1-858-555-0277',
    location: 'San Diego',
    joinedDate: new Date().toISOString(),
    totalBoards: 0,
    rating: 4.9,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/muzq2f5ee08pcsjfucs6f'
  },
  {
    name: 'Keanu Patel',
    email: 'keanu@alohaboardrentals.com',
    phone: '+1-808-555-0344',
    location: 'Honolulu',
    joinedDate: new Date().toISOString(),
    totalBoards: 0,
    rating: 4.7,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/whhktsqzefoxdo6e4k449'
  },
  {
    name: 'Olivia Santos',
    email: 'olivia@coastalboards.com',
    phone: '+1-949-555-0422',
    location: 'Kona',
    joinedDate: new Date().toISOString(),
    totalBoards: 0,
    rating: 4.9,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/v9t3gs6psai2ittle3znc'
  },
  {
    name: 'Liam O\'Brien',
    email: 'liam@surfboardhq.com',
    phone: '+1-831-555-0588',
    location: 'Santa Cruz',
    joinedDate: new Date().toISOString(),
    totalBoards: 0,
    rating: 4.6,
    verified: true,
    avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/e0kypkhsg1py7f7ysk3iq'
  }
];

function generateBoardsForOwner(ownerId: string, ownerName: string, ownerLocation: string, count: number = 3): any[] {
  const boards = [];
  const boardTypes = ['shortboard', 'longboard', 'fish', 'soft-top', 'sup'];
  const brands = ['Channel Islands', 'Firewire', 'Lost', 'Pyzel', 'DHD'];
  
  const boardImages = {
    shortboard: [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/yibeyd5modqgotmxsnub5',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/a3t5t1gf64hv0hig8i04y',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/nhbx86vsz2azqtnyzmwfg'
    ],
    longboard: [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/wiv8j1fih6lauzkgqiy0f',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/cvafj2j2u0q0jg8o1cpe0',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/e25lw4u7a3du96r3osi8p'
    ],
    fish: [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/gih72e4cmac743nzt14n8',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/w6wfdx5xjhh786jc6ziwz'
    ],
    'soft-top': [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ivoyo45gyuev8p4vtzqod',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/v2c40370gpyc7hvw3dpvn',
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/lzgtg9f6b7vbvuqpyrjx3'
    ],
    sup: [
      'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zd6qsfwllzkmuogtpk6de'
    ]
  };

  for (let i = 0; i < count; i++) {
    const boardType = boardTypes[i % boardTypes.length];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const images = boardImages[boardType as keyof typeof boardImages];
    const imageUrl = images[Math.floor(Math.random() * images.length)];
    
    let dimensions = '';
    let pricePerDay = 0;
    
    switch (boardType) {
      case 'shortboard':
        dimensions = `5'10" x 19.5" x 2.5"`;
        pricePerDay = 35;
        break;
      case 'longboard':
        dimensions = `9'2" x 22.5" x 3.0"`;
        pricePerDay = 50;
        break;
      case 'fish':
        dimensions = `5'8" x 21.0" x 2.75"`;
        pricePerDay = 40;
        break;
      case 'soft-top':
        dimensions = `8'0" x 22.0" x 3.25"`;
        pricePerDay = 30;
        break;
      case 'sup':
        dimensions = `10'6" x 32.0" x 5.0"`;
        pricePerDay = 60;
        break;
    }

    boards.push({
      short_name: `${brand} ${boardType.charAt(0).toUpperCase() + boardType.slice(1)}`,
      location: ownerLocation,
      board_type: boardType,
      price_per_day: pricePerDay,
      description: `High-quality ${boardType} perfect for all skill levels. Well-maintained and ready to ride.`,
      images: [imageUrl],
      owner_id: ownerId,
      owner_name: ownerName,
      owner_avatar: '',
      owner_rating: 0,
      owner_reviews_count: 0,
      rating: 4.5 + Math.random() * 0.5,
      reviews_count: Math.floor(Math.random() * 20) + 5,
      available: true,
      dimensions_detail: dimensions
    });
  }
  
  return boards;
}

export async function seedFiveProUsers() {
  console.log('🌱 Starting to seed 5 pro users with boards...');
  
  try {
    const createdUsers: any[] = [];
    
    for (const userData of PRO_USERS_DATA) {
      console.log(`📝 Creating pro user: ${userData.name}...`);
      
      const proUserData = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        location: userData.location,
        joined_date: userData.joinedDate,
        boards_count: 3,
        rating: userData.rating,
        is_verified: userData.verified,
        avatar_url: userData.avatarUrl
      };
      
      const { data: proUser, error: userError } = await supabase
        .from('pro_users')
        .insert([proUserData])
        .select()
        .single();
      
      if (userError) {
        console.error(`❌ Error creating user ${userData.name}:`, userError);
        throw userError;
      }
      
      console.log(`✅ Created pro user: ${proUser.name} (ID: ${proUser.id})`);
      createdUsers.push(proUser);
      
      console.log(`🏄 Creating 3 boards for ${proUser.name}...`);
      const boards = generateBoardsForOwner(proUser.id, proUser.name, proUser.location, 3);
      
      for (const board of boards) {
        board.owner_id = proUser.id;
        board.owner_name = proUser.name;
        board.owner_avatar = proUser.avatar_url;
        board.owner_rating = proUser.rating;
      }
      
      const { data: createdBoards, error: boardsError } = await supabase
        .from('boards')
        .insert(boards)
        .select();
      
      if (boardsError) {
        console.error(`❌ Error creating boards for ${proUser.name}:`, boardsError);
        throw boardsError;
      }
      
      console.log(`✅ Created ${createdBoards?.length || 0} boards for ${proUser.name}`);
    }
    
    console.log('🎉 Successfully seeded 5 pro users with 15 total boards!');
    
    return {
      success: true,
      message: `Successfully created ${createdUsers.length} pro users with ${createdUsers.length * 3} boards`,
      users: createdUsers
    };
    
  } catch (error) {
    console.error('❌ Error seeding pro users:', error);
    throw error;
  }
}
