export function lonLatToXY(lon: number, lat: number, W: number, H: number) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return { x, y };
}

interface MarkerPosition {
  x: number;
  y: number;
  id: string;
}

export function jitterOverlappingMarkers(
  markers: MarkerPosition[],
  threshold: number = 8
): MarkerPosition[] {
  const adjusted: MarkerPosition[] = [];
  
  for (const marker of markers) {
    let finalX = marker.x;
    let finalY = marker.y;
    let collisionCount = 0;
    const maxSteps = 8;
    
    while (collisionCount < maxSteps) {
      const hasCollision = adjusted.some(
        placed => 
          Math.sqrt(
            Math.pow(placed.x - finalX, 2) + 
            Math.pow(placed.y - finalY, 2)
          ) < threshold
      );
      
      if (!hasCollision) break;
      
      collisionCount++;
      const radius = 4 * collisionCount;
      const angle = (Math.PI / 4) * collisionCount; // 45 degrees per step
      finalX = marker.x + radius * Math.cos(angle);
      finalY = marker.y + radius * Math.sin(angle);
    }
    
    adjusted.push({ x: finalX, y: finalY, id: marker.id });
  }
  
  return adjusted;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}