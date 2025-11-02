import { Session, SessionLevel, SessionType } from '../types/session';
import { PRO_USERS, SURF_CITIES } from './seed-pro-users';

const SESSION_DESCRIPTIONS = {
  beginner: [
    'Learn the fundamentals of surfing in a safe, supportive environment',
    'Perfect introduction to surfing for first-timers',
    'Build confidence in the water with expert guidance',
    'Master the basics from paddling to standing up'
  ],
  intermediate: [
    'Take your surfing to the next level with advanced techniques',
    'Refine your style and tackle bigger waves',
    'Learn to read waves and improve positioning',
    'Advanced maneuvers and carving techniques'
  ],
  advanced: [
    'Elite coaching for experienced surfers',
    'Master advanced techniques and aerial maneuvers',
    'Fine-tune your competitive edge',
    'Push your limits with expert guidance'
  ]
};

const LESSON_INCLUDES = [
  'All equipment provided (board, wetsuit, rashguard)',
  'Professional instruction',
  'Safety briefing and ocean awareness',
  'Photos/videos of your session'
];

const TOUR_INCLUDES = [
  'Guided tour of best local surf spots',
  'Transportation between locations',
  'Local surf knowledge and tips',
  'Equipment available if needed'
];

const CAMP_INCLUDES = [
  'Multi-day intensive training',
  'Video analysis and feedback',
  'Nutrition and fitness guidance',
  'All equipment provided',
  'Certificate of completion'
];

const SESSION_INCLUDES = [
  'One-on-one coaching',
  'Personalized feedback',
  'Equipment provided',
  'Flexible scheduling'
];

const SESSION_IMAGES = [
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1459745930869-8f2e9a46a8a3?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1455264745730-cb4fef2bdc18?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1468770938479-b06e30a11e9e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1467377791767-c929b5dc9a23?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1414490929659-9a12b7e31907?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502129225840-72a1f5d51549?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1433190152045-5a94184895da?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502129225840-72a1f5d51549?w=800&h=600&fit=crop'
];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function generateSessionName(type: SessionType, level: SessionLevel, location: string): string {
  const levelPrefix = level.charAt(0).toUpperCase() + level.slice(1);
  
  switch (type) {
    case 'lesson':
      return `${levelPrefix} Surf Lesson - ${location}`;
    case 'tour':
      return `${levelPrefix} Surf Tour - ${location}`;
    case 'camp':
      return `${levelPrefix} Surf Camp - ${location}`;
    case 'session':
      return `Private ${levelPrefix} Session - ${location}`;
    default:
      return `${levelPrefix} Surf Experience`;
  }
}

function generateSessionPrice(type: SessionType, level: SessionLevel): number {
  let basePrice = 0;
  
  switch (type) {
    case 'lesson':
      basePrice = level === 'beginner' ? 80 : level === 'intermediate' ? 100 : 120;
      break;
    case 'tour':
      basePrice = level === 'beginner' ? 150 : level === 'intermediate' ? 200 : 250;
      break;
    case 'camp':
      basePrice = level === 'beginner' ? 500 : level === 'intermediate' ? 700 : 900;
      break;
    case 'session':
      basePrice = level === 'beginner' ? 120 : level === 'intermediate' ? 150 : 200;
      break;
  }
  
  return basePrice + randomInt(-10, 20);
}

function generateSessionDuration(type: SessionType): number {
  switch (type) {
    case 'lesson':
      return randomInt(90, 120);
    case 'tour':
      return randomInt(180, 300);
    case 'camp':
      return randomInt(3, 7);
    case 'session':
      return randomInt(60, 90);
    default:
      return 90;
  }
}

function getSessionIncludes(type: SessionType): string[] {
  switch (type) {
    case 'lesson':
      return LESSON_INCLUDES;
    case 'tour':
      return TOUR_INCLUDES;
    case 'camp':
      return CAMP_INCLUDES;
    case 'session':
      return SESSION_INCLUDES;
    default:
      return LESSON_INCLUDES;
  }
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

export function getSessions(count: number = 60): Session[] {
  const sessions: Session[] = [];
  
  const types: SessionType[] = ['lesson', 'tour', 'camp', 'session'];
  const levels: SessionLevel[] = ['beginner', 'intermediate', 'advanced'];
  
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const level = levels[i % levels.length];
    const city = SURF_CITIES[i % SURF_CITIES.length];
    const instructor = PRO_USERS[i % PRO_USERS.length];
    
    const latJitter = randomBetween(-0.25, 0.25);
    const lonJitter = randomBetween(-0.25, 0.25);
    
    const name = generateSessionName(type, level, city.name);
    const price = generateSessionPrice(type, level);
    const duration = generateSessionDuration(type);
    const { start, end } = generateAvailability();
    
    const description = SESSION_DESCRIPTIONS[level][Math.floor(Math.random() * SESSION_DESCRIPTIONS[level].length)];
    const imageUrl = SESSION_IMAGES[i % SESSION_IMAGES.length];
    
    sessions.push({
      id: `session-${i + 1}`,
      name,
      type,
      level,
      duration,
      price,
      description,
      location: city.name,
      lat: city.lat + latJitter,
      lon: city.lon + lonJitter,
      available_start: start,
      available_end: end,
      max_participants: type === 'session' ? 1 : type === 'lesson' ? randomInt(4, 8) : type === 'tour' ? randomInt(6, 12) : randomInt(10, 20),
      imageUrl: imageUrl,
      image_url: imageUrl,
      instructor: {
        ...instructor,
        bio: `Professional surf instructor with ${randomInt(5, 15)}+ years of experience teaching surfers of all levels.`
      },
      includes: getSessionIncludes(type)
    });
  }
  
  for (let i = sessions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sessions[i], sessions[j]] = [sessions[j], sessions[i]];
  }
  
  return sessions;
}
