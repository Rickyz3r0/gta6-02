// Procedural open-world city map for Palmera City, State of Solaria:
// 6 coastal districts, multi-lane road & causeway network, 3D extruded buildings with neon signs
// and rooftop details, ocean shoreline, Mariposa Marina piers & speedboats, palm trees, and garages.

import { DISTRICTS, WORLD_BOUNDS } from './config.js';
import { clamp, createRandom } from './random.js';

export function createCityMap(seed = 77) {
  const rng = createRandom(seed);

  // Horizontal avenues and vertical boulevards across Palmera City
  const horizontalRoads = [
    { id: 'h-north-blvd', name: 'Palmera North Pkwy', y: 520, width: 130, x1: 180, x2: 3920 },
    { id: 'h-coral-ave', name: 'Coral Sunset Ave', y: 1120, width: 140, x1: 180, x2: 3920 },
    { id: 'h-central-causeway', name: 'Solaria Bay Causeway', y: 1760, width: 150, x1: 180, x2: 4020, isCauseway: true },
    { id: 'h-marina- promenade', name: 'Mariposa Marina Way', y: 2420, width: 136, x1: 180, x2: 3960 },
    { id: 'h-south-keys', name: 'Southern Keys Blvd', y: 3060, width: 126, x1: 180, x2: 3900 },
  ];

  const verticalRoads = [
    { id: 'v-west-harbor', name: 'Port Aurelia Freight Hwy', x: 520, width: 126, y1: 240, y2: 3320 },
    { id: 'v-downtown-main', name: 'Aurelia Financial Blvd', x: 1380, width: 140, y1: 240, y2: 3320 },
    { id: 'v-lagoon-east', name: 'Lagoon Eastshore Pkwy', x: 2460, width: 132, y1: 240, y2: 3320 },
    { id: 'v-neon-mile', name: 'Grand Solaria Mile', x: 3020, width: 144, y1: 240, y2: 3320 },
    { id: 'v-ocean-drive', name: 'Coral Oceanfront Drive', x: 3780, width: 146, y1: 240, y2: 3320, isCoastal: true },
  ];

  // Road intersection nodes for traffic AI routing and police roadblocks
  const intersections = [];
  for (const h of horizontalRoads) {
    for (const v of verticalRoads) {
      if (v.x >= h.x1 && v.x <= h.x2 && h.y >= v.y1 && h.y <= v.y2) {
        intersections.push({
          id: `${h.id}__${v.id}`,
          x: v.x,
          y: h.y,
          streetLabel: `${v.name} & ${h.name}`,
        });
      }
    }
  }

  // 3D Extruded Buildings with architectural styles, rooftop helipads, and glowing neon signs
  const buildings = [
    // Coral Drive Strip (Art-Deco Neon Hotels & Clubs along Oceanfront Drive)
    { id: 'b-hotel-solaris', name: 'HOTEL SOLARIS', x: 3220, y: 650, w: 410, h: 210, height3D: 64, wallColor: '#251e3e', roofColor: '#362c5a', neonColor: '#ff5e7e', style: 'artdeco', sign: 'HOTEL SOLARIS' },
    { id: 'b-club-mirage', name: 'CLUB MIRAGE 86', x: 3240, y: 900, w: 390, h: 140, height3D: 52, wallColor: '#1b2948', roofColor: '#293e6b', neonColor: '#2de2e6', style: 'artdeco', sign: 'CLUB MIRAGE' },
    { id: 'b-flamingo-palace', name: 'PALMERA ROYAL', x: 3220, y: 1250, w: 420, h: 220, height3D: 70, wallColor: '#2d1e38', roofColor: '#482e59', neonColor: '#ffb347', style: 'artdeco', sign: 'PALMERA ROYAL', hasHelipad: true },
    { id: 'b-sunset-arcade', name: 'NEON PALMS PLAZA', x: 3240, y: 1500, w: 390, h: 160, height3D: 48, wallColor: '#1a2d42', roofColor: '#264563', neonColor: '#ff2a85', style: 'artdeco', sign: 'NEON PALMS' },
    { id: 'b-coral-tower', name: 'CORAL BREEZE SUITES', x: 2340, y: 660, w: 530, h: 330, height3D: 76, wallColor: '#1e2846', roofColor: '#2c3b66', neonColor: '#2de2e6', style: 'tower', sign: 'CORAL BREEZE', hasHelipad: true },
    { id: 'b-vista-mall', name: 'SOLARIA GALLERIA', x: 2340, y: 1260, w: 540, h: 350, height3D: 54, wallColor: '#272342', roofColor: '#3b3563', neonColor: '#ff5e7e', style: 'mall', sign: 'GALLERIA' },

    // Mariposa Marina (Waterfront Luxury Pavilions, Yacht Club & Pier Warehouses)
    { id: 'b-yacht-club', name: 'MARIPOSA YACHT CLUB', x: 3220, y: 1920, w: 410, h: 340, height3D: 58, wallColor: '#172c46', roofColor: '#224268', neonColor: '#2de2e6', style: 'marina', sign: 'YACHT CLUB', hasHelipad: true },
    { id: 'b-marina-condos', name: 'AZURE HARBOR TOWERS', x: 2350, y: 1920, w: 520, h: 360, height3D: 82, wallColor: '#1b2644', roofColor: '#2a3c6b', neonColor: '#5ce1e6', style: 'tower', sign: 'AZURE HARBOR' },
    { id: 'b-pier-customs', name: 'MARINA CHARTER DEPOT', x: 2360, y: 2560, w: 510, h: 360, height3D: 46, wallColor: '#242e48', roofColor: '#36456b', neonColor: '#ffb347', style: 'warehouse', sign: 'PIER 7 DEPOT' },
    { id: 'b-ocean-pavilion', name: 'STARLIGHT PAVILION', x: 3220, y: 2570, w: 400, h: 350, height3D: 52, wallColor: '#281f44', roofColor: '#3d3066', neonColor: '#ff5e7e', style: 'artdeco', sign: 'STARLIGHT' },

    // Solaria Downtown (High-Rise Financial Skyscrapers)
    { id: 'b-aurelia-bank', name: 'AURELIA RESERVE TOWER', x: 1540, y: 660, w: 480, h: 340, height3D: 96, wallColor: '#16203a', roofColor: '#23345e', neonColor: '#ffb347', style: 'tower', sign: 'AURELIA RESERVE', hasHelipad: true },
    { id: 'b-solaria-corp', name: 'SOLARIA EXCHANGE', x: 1540, y: 1260, w: 490, h: 350, height3D: 88, wallColor: '#1c2442', roofColor: '#2d3969', neonColor: '#a855f7', style: 'tower', sign: 'EXCHANGE' },
    { id: 'b-metro-hq', name: 'SPPD CENTRAL PRECINCT', x: 700, y: 660, w: 520, h: 340, height3D: 68, wallColor: '#152238', roofColor: '#1f3457', neonColor: '#3a86ff', style: 'tower', sign: 'SPPD PRECINCT', hasHelipad: true },
    { id: 'b-media-spire', name: 'HORIZON MEDIA SPIRE', x: 700, y: 1260, w: 520, h: 360, height3D: 84, wallColor: '#231f42', roofColor: '#352f66', neonColor: '#ff2a85', style: 'tower', sign: 'HORIZON TV' },

    // Caiman Keys & Port Aurelia Docks
    { id: 'b-keys-resort', name: 'LAGOON KEY RESORT', x: 1550, y: 2570, w: 480, h: 350, height3D: 54, wallColor: '#1e3348', roofColor: '#2c4c6b', neonColor: '#2ee59d', style: 'artdeco', sign: 'LAGOON RESORT' },
    { id: 'b-port-terminal-a', name: 'PORT FREIGHT TERMINAL A', x: 700, y: 1930, w: 520, h: 340, height3D: 42, wallColor: '#282d3e', roofColor: '#3c435c', neonColor: '#ffb347', style: 'warehouse', sign: 'TERMINAL A' },
    { id: 'b-port-terminal-b', name: 'SYNDICATE SHIPYARD 4', x: 700, y: 2580, w: 520, h: 340, height3D: 44, wallColor: '#232b38', roofColor: '#354154', neonColor: '#2ee59d', style: 'warehouse', sign: 'SHIPYARD 4' },
  ];

  // Interactive Garages (Neon Respray & Repair — clears Wanted Level & repairs vehicle)
  const garages = [
    { id: 'g-coral-respray', name: 'Coral Neon Respray & Customs', x: 2920, y: 1030, radius: 75, cost: 500 },
    { id: 'g-marina-respray', name: 'Mariposa Dockside Customs', x: 2920, y: 2330, radius: 75, cost: 500 },
    { id: 'g-downtown-respray', name: 'Downtown Underground Mod Shop', x: 1290, y: 1670, radius: 75, cost: 500 },
  ];

  // Player Safehouses (Save & Load / Weapon Restock points)
  const safehouses = [
    { id: 'sh-coral-penthouse', name: 'Coral Drive Neon Safehouse', x: 3690, y: 820, radius: 65, district: 'CORAL DRIVE STRIP' },
    { id: 'sh-marina-villa', name: 'Mariposa Pier 7 Hideout', x: 3690, y: 2150, radius: 65, district: 'MARIPOSA MARINA' },
    { id: 'sh-keys-compound', name: 'Caiman Lagoon Boathouse', x: 1470, y: 2330, radius: 65, district: 'CAIMAN KEYS CAUSEWAY' },
  ];

  // Marina Piers & Docked Luxury Speedboats along the eastern ocean shoreline (x > 4060)
  const piers = [
    { id: 'pier-1', name: 'Coral Sunset Pier', x: 4040, y: 780, w: 340, h: 58, boats: [{ offset: 110, side: -1, color: '#ff5e7e' }, { offset: 230, side: 1, color: '#2de2e6' }] },
    { id: 'pier-2', name: 'Boardwalk Pavilion Pier', x: 4040, y: 1420, w: 380, h: 64, boats: [{ offset: 140, side: 1, color: '#ffb347' }, { offset: 270, side: -1, color: '#ffffff' }] },
    { id: 'pier-7', name: 'Mariposa Marina Pier 7', x: 4040, y: 2080, w: 430, h: 70, boats: [{ offset: 120, side: -1, color: '#2ee59d' }, { offset: 240, side: 1, color: '#ff2a85' }, { offset: 350, side: -1, color: '#2de2e6' }] },
    { id: 'pier-9', name: 'South Keys Charter Pier', x: 4040, y: 2780, w: 360, h: 60, boats: [{ offset: 160, side: 1, color: '#ff6b35' }] },
  ];

  // Caiman Lagoon water channel (separating Downtown/Port from Eastern Coastal Island, spanned by bridges!)
  const lagoonChannel = {
    x: 1960,
    y: 0,
    w: 390,
    h: WORLD_BOUNDS.height,
  };

  // Beach umbrellas & cabanas along the golden Coral Drive sand
  const beachUmbrellas = [
    { x: 4008, y: 690, color: '#ff5e7e' },
    { x: 4018, y: 920, color: '#2de2e6' },
    { x: 4006, y: 1230, color: '#ffb347' },
    { x: 4020, y: 1580, color: '#ff2a85' },
    { x: 4010, y: 1930, color: '#2ee59d' },
    { x: 4015, y: 2290, color: '#ff5e7e' },
    { x: 4012, y: 2610, color: '#2de2e6' },
  ];

  // Tropical Palm Trees & Streetlights along boulevards and beachfront boardwalk
  const palms = [];
  for (let y = 260; y < 3340; y += 115) {
    // Keep Pier 7 combat plaza clear for crisp sightlines
    if (Math.abs(y - 2070) > 80) {
      palms.push({ x: 3915, y, scale: 0.95 + (rng() * 0.3), phase: rng() * Math.PI * 2 });
    }
    palms.push({ x: 4015, y: y + 48, scale: 1.0 + (rng() * 0.25), phase: rng() * Math.PI * 2 });
    if (Math.abs(y - 1760) > 120 && Math.abs(y - 1120) > 110 && Math.abs(y - 2420) > 110) {
      palms.push({ x: 3115, y, scale: 0.9 + (rng() * 0.25), phase: rng() * Math.PI * 2 });
      palms.push({ x: 2925, y, scale: 0.9 + (rng() * 0.25), phase: rng() * Math.PI * 2 });
    }
  }

  function getDistrictAt(x, y) {
    for (const d of DISTRICTS) {
      if (x >= d.bounds.x && x <= d.bounds.x + d.bounds.w && y >= d.bounds.y && y <= d.bounds.y + d.bounds.h) {
        return d;
      }
    }
    return DISTRICTS[0];
  }

  function findNearestIntersection(x, y) {
    let best = intersections[0];
    let bestDist = Infinity;
    for (const node of intersections) {
      const d = Math.hypot(node.x - x, node.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = node;
      }
    }
    return best;
  }

  function isOnBridgeOrLand(x, y) {
    // Check if on horizontal road crossing lagoon or pier over ocean
    for (const h of horizontalRoads) {
      if (Math.abs(y - h.y) <= h.width * 0.56 && x >= h.x1 && x <= h.x2) return true;
    }
    for (const p of piers) {
      if (x >= p.x - 20 && x <= p.x + p.w && y >= p.y - p.h * 0.6 && y <= p.y + p.h * 0.6) return true;
    }
    // Check Caiman Lagoon channel
    if (x > lagoonChannel.x && x < lagoonChannel.x + lagoonChannel.w) return false;
    // Check Eastern Ocean shoreline
    if (x > 4060) return false;
    return true;
  }

  function resolveBuildingCollision(entityX, entityY, radius) {
    let x = clamp(entityX, 140, 4380);
    let y = clamp(entityY, 180, 3420);
    let hitBuilding = null;

    for (const b of buildings) {
      const closestX = clamp(x, b.x, b.x + b.w);
      const closestY = clamp(y, b.y, b.y + b.h);
      const dx = x - closestX;
      const dy = y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq < radius * radius) {
        hitBuilding = b;
        const dist = Math.sqrt(distSq) || 0.001;
        if (dist > 0.01) {
          x = closestX + (dx / dist) * radius;
          y = closestY + (dy / dist) * radius;
        } else {
          // Inside building box: push to nearest edge
          const leftPen = Math.abs(x - b.x);
          const rightPen = Math.abs(b.x + b.w - x);
          const topPen = Math.abs(y - b.y);
          const botPen = Math.abs(b.y + b.h - y);
          const minPen = Math.min(leftPen, rightPen, topPen, botPen);
          if (minPen === leftPen) x = b.x - radius;
          else if (minPen === rightPen) x = b.x + b.w + radius;
          else if (minPen === topPen) y = b.y - radius;
          else y = b.y + b.h + radius;
        }
      }
    }

    // Keep out of unbridged lagoon or deep ocean water
    if (!isOnBridgeOrLand(x, y)) {
      if (x > 4050) x = 4050;
      else if (x > lagoonChannel.x && x < lagoonChannel.x + lagoonChannel.w) {
        x = x < lagoonChannel.x + lagoonChannel.w * 0.5 ? lagoonChannel.x - 4 : lagoonChannel.x + lagoonChannel.w + 4;
      }
    }

    return { x, y, hitBuilding };
  }

  return {
    horizontalRoads,
    verticalRoads,
    intersections,
    buildings,
    garages,
    safehouses,
    piers,
    lagoonChannel,
    beachUmbrellas,
    palms,
    getDistrictAt,
    findNearestIntersection,
    isOnBridgeOrLand,
    resolveBuildingCollision,
  };
}
