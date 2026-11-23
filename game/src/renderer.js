// High-DPI 2.5D/3D-Perspective Neon-Sunset Open-World Renderer for Palmera City, State of Solaria.
// Renders animated turquoise ocean & lagoon surf, boardwalk & sandy beach, multi-lane asphalt roads,
// 3D perspective-extruded art-deco & glass towers with neon signage, detailed vehicles with headlight
// cones & siren pavement reflections, pedestrians, gunfire tracers, explosions, and chopper searchlight.

import { PALETTE, WORLD_BOUNDS } from './config.js';

export function createWorldRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let viewWidth = window.innerWidth;
  let viewHeight = window.innerHeight;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;
    canvas.width = Math.round(viewWidth * dpr);
    canvas.height = Math.round(viewHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawOceanAndCoast(world) {
    const t = world.elapsed;
    // Deep sunset coastal ground base
    ctx.fillStyle = '#152536';
    ctx.fillRect(0, 0, WORLD_BOUNDS.width, WORLD_BOUNDS.height);

    // Tropical city blocks turf / urban concrete undertone
    ctx.fillStyle = '#182436';
    ctx.fillRect(140, 180, 3840, 3260);

    // Subtle sunset coastal glow wash over the eastern districts
    const coastalWash = ctx.createLinearGradient(2400, 0, 4400, 0);
    coastalWash.addColorStop(0, 'rgba(255, 94, 126, 0.04)');
    coastalWash.addColorStop(0.7, 'rgba(255, 165, 85, 0.14)');
    coastalWash.addColorStop(1, 'rgba(45, 226, 230, 0.16)');
    ctx.fillStyle = coastalWash;
    ctx.fillRect(2400, 180, 2000, 3260);

    // Caiman Keys Lagoon Water Channel
    const lag = world.cityMap.lagoonChannel;
    const lagGrad = ctx.createLinearGradient(lag.x, 0, lag.x + lag.w, 0);
    lagGrad.addColorStop(0, '#0a2947');
    lagGrad.addColorStop(0.5, '#114d73');
    lagGrad.addColorStop(1, '#0a2947');
    ctx.fillStyle = lagGrad;
    ctx.fillRect(lag.x, 0, lag.w, WORLD_BOUNDS.height);

    // Lagoon water shimmer waves & cruising lagoon speedboats
    ctx.strokeStyle = 'rgba(92, 225, 230, 0.28)';
    ctx.lineWidth = 2;
    for (let y = 120; y < WORLD_BOUNDS.height; y += 78) {
      const waveShift = Math.sin(t * 1.9 + y * 0.02) * 18;
      ctx.beginPath();
      ctx.moveTo(lag.x + 28 + waveShift, y);
      ctx.quadraticCurveTo(lag.x + lag.w * 0.5 + waveShift, y - 10, lag.x + lag.w - 28 + waveShift, y);
      ctx.stroke();
    }

    // Two tropical boats cruising across the lagoon channel near the Causeway Bridge
    const lagoonBoats = [
      { x: lag.x + 115, y: 1550 + Math.sin(t * 0.9) * 18, angle: Math.PI * 0.5, color: '#ff5e7e' },
      { x: lag.x + 275, y: 1960 - Math.sin(t * 1.1) * 18, angle: -Math.PI * 0.5, color: '#2de2e6' },
    ];
    for (const lb of lagoonBoats) {
      ctx.save();
      ctx.translate(lb.x, lb.y);
      ctx.rotate(lb.angle);
      // White wake trail
      ctx.strokeStyle = 'rgba(202, 250, 255, 0.42)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-26, -6);
      ctx.lineTo(-92, -22);
      ctx.moveTo(-26, 6);
      ctx.lineTo(-92, 22);
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.quadraticCurveTo(14, -12, -26, -10);
      ctx.lineTo(-28, 10);
      ctx.quadraticCurveTo(14, 12, 30, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = lb.color;
      ctx.fillRect(-14, -6, 24, 12);
      ctx.restore();
    }

    // Golden Beach Sand & Wooden Oceanfront Boardwalk
    ctx.fillStyle = '#5a3d2b'; // Boardwalk
    ctx.fillRect(3880, 160, 74, 3300);
    ctx.strokeStyle = 'rgba(255, 210, 160, 0.14)';
    ctx.lineWidth = 1;
    for (let y = 160; y < 3460; y += 14) {
      ctx.beginPath();
      ctx.moveTo(3880, y);
      ctx.lineTo(3954, y);
      ctx.stroke();
    }

    // Golden sunset sandy beach
    const sandGrad = ctx.createLinearGradient(3954, 0, 4085, 0);
    sandGrad.addColorStop(0, '#c89b6e');
    sandGrad.addColorStop(0.75, '#dfb585');
    sandGrad.addColorStop(1, '#9c8369');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(3954, 160, 128, 3300);

    // Eastern Tropical Ocean with sunset specular reflections
    const oceanGrad = ctx.createLinearGradient(4068, 0, 4800, 0);
    oceanGrad.addColorStop(0, '#177e96');
    oceanGrad.addColorStop(0.22, '#0d4e74');
    oceanGrad.addColorStop(0.65, '#072748');
    oceanGrad.addColorStop(1, '#041429');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(4068, 0, 732, WORLD_BOUNDS.height);

    // Animated shoreline surf foam ribbon
    ctx.strokeStyle = 'rgba(202, 250, 255, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let y = 120; y < 3480; y += 28) {
      const fx = 4072 + Math.sin(t * 2.4 + y * 0.03) * 8;
      if (y === 120) ctx.moveTo(fx, y);
      else ctx.lineTo(fx, y);
    }
    ctx.stroke();

    // Sunset golden shimmer bars on the water
    ctx.fillStyle = 'rgba(255, 162, 110, 0.2)';
    for (let y = 180; y < 3420; y += 64) {
      const sx = 4140 + Math.sin(t * 1.6 + y * 0.04) * 24;
      ctx.fillRect(sx, y, 88 + (y % 40), 3);
    }

    // Colorful coastal beach umbrellas along the sandy beach
    if (world.cityMap.beachUmbrellas) {
      for (const umb of world.cityMap.beachUmbrellas) {
        ctx.save();
        ctx.translate(umb.x, umb.y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        ctx.beginPath();
        ctx.arc(6, 7, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = umb.color;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 1.5;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
          ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Mariposa Marina & Coastal Piers with Docked Luxury Boats
    for (const pier of world.cityMap.piers) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(pier.x + 8, pier.y - pier.h * 0.5 + 10, pier.w, pier.h);
      ctx.fillStyle = '#5e4332';
      ctx.fillRect(pier.x, pier.y - pier.h * 0.5, pier.w, pier.h);
      ctx.strokeStyle = '#ff9f68';
      ctx.lineWidth = 2;
      ctx.strokeRect(pier.x, pier.y - pier.h * 0.5, pier.w, pier.h);

      // Pier deck planks & warm bollards
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      for (let px = pier.x + 16; px < pier.x + pier.w; px += 18) {
        ctx.beginPath();
        ctx.moveTo(px, pier.y - pier.h * 0.5);
        ctx.lineTo(px, pier.y + pier.h * 0.5);
        ctx.stroke();
      }

      // Docked luxury speedboats bobbing in the turquoise harbor
      for (const boat of pier.boats) {
        const bx = pier.x + boat.offset;
        const by = pier.y + boat.side * (pier.h * 0.5 + 26) + Math.sin(t * 2.2 + boat.offset) * 2.5;
        ctx.save();
        ctx.translate(bx, by);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(4, 5, 34, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        // Hull
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(36, 0);
        ctx.quadraticCurveTo(18, -14, -30, -11);
        ctx.lineTo(-34, 0);
        ctx.lineTo(-30, 11);
        ctx.quadraticCurveTo(18, 14, 36, 0);
        ctx.closePath();
        ctx.fill();
        // Accent deck stripe & windshield
        ctx.fillStyle = boat.color;
        ctx.fillRect(-18, -7, 32, 14);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(6, -6, 9, 12);
        ctx.restore();
      }
    }
  }

  function drawRoadNetwork(world) {
    const { horizontalRoads, verticalRoads, garages, safehouses } = world.cityMap;

    // Sidewalk concrete aprons under boulevards
    ctx.fillStyle = PALETTE.sidewalkConcrete;
    for (const h of horizontalRoads) {
      ctx.fillRect(h.x1 - 24, h.y - h.width * 0.5 - 22, h.x2 - h.x1 + 48, h.width + 44);
    }
    for (const v of verticalRoads) {
      ctx.fillRect(v.x - v.width * 0.5 - 22, v.y1 - 24, v.width + 44, v.y2 - v.y1 + 48);
    }

    // Asphalt road surfaces
    ctx.fillStyle = PALETTE.asphaltMain;
    for (const h of horizontalRoads) {
      ctx.fillRect(h.x1, h.y - h.width * 0.5, h.x2 - h.x1, h.width);
    }
    for (const v of verticalRoads) {
      ctx.fillRect(v.x - v.width * 0.5, v.y1, v.width, v.y2 - v.y1);
    }

    // Causeway Bridge Neon Guardrails across Caiman Lagoon
    const lag = world.cityMap.lagoonChannel;
    for (const h of horizontalRoads) {
      ctx.fillStyle = '#2de2e6';
      ctx.fillRect(lag.x - 16, h.y - h.width * 0.5 - 5, lag.w + 32, 4);
      ctx.fillRect(lag.x - 16, h.y + h.width * 0.5 + 1, lag.w + 32, 4);
    }

    // Double amber centerlines & dashed white lane dividers
    ctx.save();
    for (const h of horizontalRoads) {
      ctx.strokeStyle = 'rgba(255, 179, 71, 0.72)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(h.x1, h.y - 3);
      ctx.lineTo(h.x2, h.y - 3);
      ctx.moveTo(h.x1, h.y + 3);
      ctx.lineTo(h.x2, h.y + 3);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
      ctx.setLineDash([22, 22]);
      ctx.beginPath();
      ctx.moveTo(h.x1, h.y - h.width * 0.27);
      ctx.lineTo(h.x2, h.y - h.width * 0.27);
      ctx.moveTo(h.x1, h.y + h.width * 0.27);
      ctx.lineTo(h.x2, h.y + h.width * 0.27);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const v of verticalRoads) {
      ctx.strokeStyle = 'rgba(255, 179, 71, 0.72)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(v.x - 3, v.y1);
      ctx.lineTo(v.x - 3, v.y2);
      ctx.moveTo(v.x + 3, v.y1);
      ctx.lineTo(v.x + 3, v.y2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
      ctx.setLineDash([22, 22]);
      ctx.beginPath();
      ctx.moveTo(v.x - v.width * 0.27, v.y1);
      ctx.lineTo(v.x - v.width * 0.27, v.y2);
      ctx.moveTo(v.x + v.width * 0.27, v.y1);
      ctx.lineTo(v.x + v.width * 0.27, v.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Intersection zebra crosswalks & warm sunset streetlamp pools
    for (const node of world.cityMap.intersections) {
      ctx.fillStyle = 'rgba(241, 245, 249, 0.42)';
      for (let k = -46; k <= 46; k += 16) {
        ctx.fillRect(node.x + k - 4, node.y - 82, 8, 18);
        ctx.fillRect(node.x + k - 4, node.y + 64, 8, 18);
        ctx.fillRect(node.x - 82, node.y + k - 4, 18, 8);
        ctx.fillRect(node.x + 64, node.y + k - 4, 18, 8);
      }

      // Warm golden streetlamp light glow on intersection corners
      const glow = ctx.createRadialGradient(node.x + 76, node.y - 76, 4, node.x + 76, node.y - 76, 95);
      glow.addColorStop(0, 'rgba(255, 179, 71, 0.28)');
      glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(node.x + 76, node.y - 76, 95, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tire drift skidmarks
    ctx.fillStyle = 'rgba(8, 10, 16, 0.52)';
    for (const skid of world.vehicleSystem.skidMarks) {
      ctx.save();
      ctx.translate(skid.x, skid.y);
      ctx.rotate(skid.angle);
      ctx.fillRect(-6, -2.5, 12, 5);
      ctx.restore();
    }

    // Neon Respray Garages (Cyan pulsing ring + wrench label)
    const pulse = 0.5 + 0.5 * Math.sin(world.elapsed * 4);
    for (const g of garages) {
      ctx.save();
      ctx.strokeStyle = `rgba(45, 226, 230, ${0.55 + pulse * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 44 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(45, 226, 230, 0.14)';
      ctx.fill();
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.fillStyle = '#7ef9fc';
      ctx.textAlign = 'center';
      ctx.fillText('NEON RESPRAY · $500', g.x, g.y - 52);
      ctx.restore();
    }

    // Safehouse Beacons
    for (const sh of safehouses) {
      ctx.save();
      ctx.strokeStyle = 'rgba(46, 229, 157, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, 32 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '800 10px system-ui, sans-serif';
      ctx.fillStyle = '#84f7c8';
      ctx.textAlign = 'center';
      ctx.fillText('SAFEHOUSE [F5]', sh.x, sh.y - 38);
      ctx.restore();
    }

    // Active Mission Objective Waypoint Ring
    const mission = world.missions.getActiveMission();
    if (mission) {
      ctx.save();
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(mission.targetX, mission.targetY, 48 + pulse * 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 179, 71, 0.18)';
      ctx.fill();
      ctx.font = '900 12px system-ui, sans-serif';
      ctx.fillStyle = '#ffd19b';
      ctx.textAlign = 'center';
      ctx.fillText(`★ ${mission.title.toUpperCase()}`, mission.targetX, mission.targetY - 62);
      ctx.restore();
    }
  }

  function drawVehicle(v, world) {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.angle);

    // Headlight cones (soft sunset/dusk beams)
    if (!v.wrecked && v.headlights) {
      const beam = ctx.createLinearGradient(v.width * 0.45, 0, v.width * 0.45 + 150, 0);
      beam.addColorStop(0, 'rgba(255, 244, 214, 0.34)');
      beam.addColorStop(1, 'rgba(255, 244, 214, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(v.width * 0.48, -v.height * 0.32);
      ctx.lineTo(v.width * 0.48 + 150, -v.height * 1.45);
      ctx.lineTo(v.width * 0.48 + 150, v.height * 1.45);
      ctx.lineTo(v.width * 0.48, v.height * 0.32);
      ctx.closePath();
      ctx.fill();
    }

    // Underbody neon glow for exotic sports cars & player vehicle
    if (!v.wrecked && (v.driver === 'player' || v.typeId === 'solaria-gtr' || v.typeId === 'veloce-apex')) {
      const neon = ctx.createRadialGradient(0, 0, 8, 0, 0, v.width * 0.78);
      neon.addColorStop(0, v.driver === 'player' ? 'rgba(45, 226, 230, 0.42)' : 'rgba(255, 94, 126, 0.25)');
      neon.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neon;
      ctx.beginPath();
      ctx.ellipse(0, 0, v.width * 0.78, v.height * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Police flashing red/blue lightbar reflections on asphalt
    if (v.sirenOn && !v.wrecked) {
      const redStrong = Math.sin(v.sirenPhase) > 0;
      const gRed = ctx.createRadialGradient(0, -14, 2, 0, -14, 72);
      gRed.addColorStop(0, redStrong ? 'rgba(255, 42, 85, 0.62)' : 'rgba(255, 42, 85, 0.1)');
      gRed.addColorStop(1, 'rgba(255, 42, 85, 0)');
      ctx.fillStyle = gRed;
      ctx.beginPath();
      ctx.arc(0, -14, 72, 0, Math.PI * 2);
      ctx.fill();

      const gBlue = ctx.createRadialGradient(0, 14, 2, 0, 14, 72);
      gBlue.addColorStop(0, !redStrong ? 'rgba(58, 134, 255, 0.68)' : 'rgba(58, 134, 255, 0.12)');
      gBlue.addColorStop(1, 'rgba(58, 134, 255, 0)');
      ctx.fillStyle = gBlue;
      ctx.beginPath();
      ctx.arc(0, 14, 72, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground drop shadow
    ctx.fillStyle = 'rgba(4, 6, 14, 0.56)';
    ctx.beginPath();
    ctx.roundRect(-v.width * 0.5 + 5, -v.height * 0.5 + 6, v.width, v.height, 8);
    ctx.fill();

    // Nitro exhaust flames when boosting or drifting hard
    if (!v.wrecked && (v.nitroBoost > 0.1 || (v.driver === 'player' && v.speed > 340))) {
      const flameLen = 14 + Math.sin(world.elapsed * 42) * 6;
      ctx.fillStyle = '#2de2e6';
      ctx.beginPath();
      ctx.moveTo(-v.width * 0.5, -6);
      ctx.lineTo(-v.width * 0.5 - flameLen, -3);
      ctx.lineTo(-v.width * 0.5, -1);
      ctx.moveTo(-v.width * 0.5, 6);
      ctx.lineTo(-v.width * 0.5 - flameLen, 3);
      ctx.lineTo(-v.width * 0.5, 1);
      ctx.fill();
    }

    // Wheels
    ctx.fillStyle = '#090b12';
    ctx.fillRect(-v.width * 0.36, -v.height * 0.5 - 2, 13, 4);
    ctx.fillRect(v.width * 0.18, -v.height * 0.5 - 2, 13, 4);
    ctx.fillRect(-v.width * 0.36, v.height * 0.5 - 2, 13, 4);
    ctx.fillRect(v.width * 0.18, v.height * 0.5 - 2, 13, 4);

    // Metallic Body Chassis
    ctx.fillStyle = v.wrecked ? '#242730' : v.bodyColor;
    ctx.beginPath();
    ctx.roundRect(-v.width * 0.5, -v.height * 0.5, v.width, v.height, 8);
    ctx.fill();

    // Racing stripe or police white doors
    if (!v.wrecked) {
      ctx.fillStyle = v.stripeColor;
      if (v.isPolice) {
        ctx.fillRect(-v.width * 0.16, -v.height * 0.48, v.width * 0.36, v.height * 0.96);
      } else {
        ctx.fillRect(-v.width * 0.46, -3, v.width * 0.92, 6);
      }
    }

    // Windshield & Cabin Roof
    ctx.fillStyle = v.glassColor;
    ctx.beginPath();
    ctx.roundRect(-v.width * 0.24, -v.height * 0.38, v.width * 0.48, v.height * 0.76, 5);
    ctx.fill();

    ctx.fillStyle = v.wrecked ? '#1b1d24' : v.bodyColor;
    ctx.beginPath();
    ctx.roundRect(-v.width * 0.16, -v.height * 0.32, v.width * 0.28, v.height * 0.64, 4);
    ctx.fill();

    // Specular highlight edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-v.width * 0.5 + 1, -v.height * 0.5 + 1, v.width - 2, v.height - 2, 7);
    ctx.stroke();

    // Headlights & Taillights
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(v.width * 0.46, -v.height * 0.36, 3, 6);
    ctx.fillRect(v.width * 0.46, v.height * 0.36 - 6, 3, 6);
    ctx.fillStyle = '#ff2a55';
    ctx.fillRect(-v.width * 0.5, -v.height * 0.38, 3, 7);
    ctx.fillRect(-v.width * 0.5, v.height * 0.38 - 7, 3, 7);

    // Police roof lightbar
    if (v.isPolice && !v.wrecked) {
      const redLit = Math.sin(v.sirenPhase) > 0;
      ctx.fillStyle = redLit ? '#ff2a55' : '#6b1224';
      ctx.fillRect(-3, -10, 6, 9);
      ctx.fillStyle = !redLit ? '#3a86ff' : '#122c5c';
      ctx.fillRect(-3, 1, 6, 9);
    }

    ctx.restore();
  }

  function drawActor(x, y, angle, walkPhase, outfit, hasWeapon = false, isPlayer = false) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(2, 4, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isPlayer) {
      // Crisp cyan tactical halo under Mateo Vance
      ctx.strokeStyle = 'rgba(45, 226, 230, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(angle);
    const stride = Math.sin(walkPhase) * 4.5;

    // Legs
    ctx.fillStyle = outfit.pants;
    ctx.fillRect(-3 + stride, -7, 7, 5);
    ctx.fillRect(-3 - stride, 2, 7, 5);

    // Torso / Shoulders
    ctx.fillStyle = outfit.shirt;
    ctx.beginPath();
    ctx.roundRect(-6, -10, 12, 20, 5);
    ctx.fill();

    // Weapon barrel & laser sight for armed actors
    if (hasWeapon) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 2, 16, 4);
      if (isPlayer) {
        ctx.strokeStyle = 'rgba(45, 226, 230, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 4);
        ctx.lineTo(145, 4);
        ctx.stroke();
      }
    }

    // Head
    ctx.fillStyle = outfit.skin;
    ctx.beginPath();
    ctx.arc(1, 0, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = outfit.hair;
    ctx.beginPath();
    ctx.arc(-1, 0, 5.4, Math.PI * 0.45, Math.PI * 1.55);
    ctx.fill();

    ctx.restore();
  }

  function drawBuildings3D(world) {
    const camX = world.camera.x;
    const camY = world.camera.y;

    for (const b of world.cityMap.buildings) {
      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.5;
      // Only render buildings near the camera viewport
      if (Math.abs(cx - camX) > 1350 || Math.abs(cy - camY) > 1050) continue;

      // Directional sunset ground shadow
      ctx.fillStyle = 'rgba(5, 8, 18, 0.52)';
      ctx.fillRect(b.x + 28, b.y + 24, b.w, b.h);

      // Perspective roof offset radiating outward from camera center for authentic 2.5D/3D skyline depth
      const parallax = b.height3D * 0.00145;
      const ox = Math.max(-72, Math.min(72, (cx - camX) * parallax));
      const oy = Math.max(-64, Math.min(64, (cy - camY) * parallax)) - b.height3D * 0.24;

      const rx = b.x + ox;
      const ry = b.y + oy;

      // Extruded 3D side walls connecting footprint corners to elevated roof corners
      ctx.fillStyle = b.wallColor;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      // Bottom / South facade
      if (ry < b.y || true) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.h);
        ctx.lineTo(b.x + b.w, b.y + b.h);
        ctx.lineTo(rx + b.w, ry + b.h);
        ctx.lineTo(rx, ry + b.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Left facade
      if (rx > b.x) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y + b.h);
        ctx.lineTo(rx, ry + b.h);
        ctx.lineTo(rx, ry);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Right facade
      if (rx < b.x) {
        ctx.beginPath();
        ctx.moveTo(b.x + b.w, b.y);
        ctx.lineTo(b.x + b.w, b.y + b.h);
        ctx.lineTo(rx + b.w, ry + b.h);
        ctx.lineTo(rx + b.w, ry);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Roof deck with architectural sunset gradient
      const roofGrad = ctx.createLinearGradient(rx, ry, rx + b.w, ry + b.h);
      roofGrad.addColorStop(0, b.roofColor);
      roofGrad.addColorStop(1, b.wallColor);
      ctx.fillStyle = roofGrad;
      ctx.fillRect(rx, ry, b.w, b.h);

      // Glowing neon parapet trim
      ctx.strokeStyle = b.neonColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx + 2, ry + 2, b.w - 4, b.h - 4);

      // Rooftop mechanical units, turquoise rooftop pools & lit skyline details
      ctx.fillStyle = 'rgba(10, 14, 28, 0.45)';
      ctx.fillRect(rx + 24, ry + 24, b.w - 48, b.h - 48);
      if (b.style === 'artdeco' || b.style === 'marina') {
        // Illuminated turquoise rooftop lounge pool
        ctx.fillStyle = 'rgba(45, 226, 230, 0.55)';
        ctx.fillRect(rx + 36, ry + 48, 84, 42);
        ctx.strokeStyle = '#9beeff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx + 36, ry + 48, 84, 42);
      }
      ctx.fillStyle = 'rgba(255, 220, 165, 0.18)';
      for (let gx = rx + 136; gx < rx + b.w - 60; gx += 44) {
        ctx.fillRect(gx, ry + 40, 24, 14);
      }

      // Optional Helipad H on skyscrapers & yacht club
      if (b.hasHelipad) {
        const hx = rx + b.w - 64;
        const hy = ry + b.h - 60;
        ctx.strokeStyle = '#ffb347';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(hx, hy, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffb347';
        ctx.font = '900 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', hx, hy + 1);
      }

      // Glowing Art-Deco Neon Building Sign
      if (b.sign) {
        ctx.save();
        ctx.font = '900 15px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.shadowColor = b.neonColor;
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(b.sign, rx + 18, ry + 16);
        ctx.restore();
      }
    }
  }

  function drawPalmTrees(world) {
    const t = world.elapsed;
    const camX = world.camera.x;
    const camY = world.camera.y;

    for (const palm of world.cityMap.palms) {
      if (Math.abs(palm.x - camX) > 950 || Math.abs(palm.y - camY) > 700) continue;
      const sway = Math.sin(t * 1.8 + palm.phase) * 0.09;
      ctx.save();
      ctx.translate(palm.x, palm.y);

      // Palm canopy shadow
      ctx.fillStyle = 'rgba(4, 10, 18, 0.38)';
      ctx.beginPath();
      ctx.arc(12, 12, 24 * palm.scale, 0, Math.PI * 2);
      ctx.fill();

      // 7 lush tropical palm fronds
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2 + sway;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = i % 2 === 0 ? '#1b7a58' : '#249c6e';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(15 * palm.scale, -7 * palm.scale, 28 * palm.scale, 0);
        ctx.quadraticCurveTo(15 * palm.scale, 7 * palm.scale, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#4e3524';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5 * palm.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCombatAndChopper(world) {
    // Cash pickups
    for (const drop of world.pedSystem.cashDrops) {
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.fillStyle = '#2ee59d';
      ctx.shadowColor = '#2ee59d';
      ctx.shadowBlur = 10;
      ctx.fillRect(-7, -4, 14, 8);
      ctx.fillStyle = '#062c1e';
      ctx.font = '900 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0.5);
      ctx.restore();
    }

    // Bullet tracers
    ctx.lineCap = 'round';
    for (const p of world.combat.projectiles) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.explosiveRadius ? 4.5 : 2.6;
      ctx.beginPath();
      ctx.moveTo(p.prevX - p.vx * 0.025, p.prevY - p.vy * 0.025);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    // Muzzle flashes
    for (const f of world.combat.muzzleFlashes) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.fillStyle = '#fff7d6';
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(22, 0);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Explosion shockwaves
    for (const s of world.combat.shockwaves) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.strokeStyle = `rgba(255, 179, 71, ${alpha * 0.85})`;
      ctx.lineWidth = 4 + alpha * 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sparks, fire & smoke particles
    for (const pt of world.combat.particles) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // SPPD Pursuit Helicopter Searchlight Cone & Rotor Silhouette (4–5 stars)
    if (world.wanted.chopper.active) {
      const ch = world.wanted.chopper;
      const spotGrad = ctx.createRadialGradient(ch.spotX, ch.spotY, 12, ch.spotX, ch.spotY, 138);
      spotGrad.addColorStop(0, 'rgba(230, 248, 255, 0.36)');
      spotGrad.addColorStop(0.7, 'rgba(130, 215, 255, 0.16)');
      spotGrad.addColorStop(1, 'rgba(45, 226, 230, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(ch.spotX, ch.spotY, 138, 0, Math.PI * 2);
      ctx.fill();

      // Searchlight beam from chopper hull to spotlight ring
      ctx.fillStyle = 'rgba(190, 236, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(ch.x, ch.y);
      ctx.lineTo(ch.spotX - 75, ch.spotY);
      ctx.lineTo(ch.spotX + 75, ch.spotY);
      ctx.closePath();
      ctx.fill();

      // Chopper fuselage + spinning rotor blades
      ctx.save();
      ctx.translate(ch.x, ch.y);
      ctx.rotate(ch.orbitAngle + Math.PI * 0.5);
      ctx.fillStyle = '#0d1528';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-34, -2.5, 22, 5);
      ctx.strokeStyle = 'rgba(220, 240, 255, 0.48)';
      ctx.lineWidth = 2.5;
      const rAngle = world.elapsed * 26;
      ctx.rotate(rAngle);
      ctx.beginPath();
      ctx.moveTo(-42, 0);
      ctx.lineTo(42, 0);
      ctx.moveTo(0, -42);
      ctx.lineTo(0, 42);
      ctx.stroke();
      ctx.restore();
    }

    // World-space floating [F] Carjack Callout over nearest car when player is on foot
    if (!world.player.vehicle) {
      const candidate = world.vehicleSystem.findCarjackCandidate(world.player.x, world.player.y, 135);
      if (candidate) {
        ctx.save();
        const bx = candidate.x;
        const by = candidate.y - 38;
        ctx.fillStyle = 'rgba(14, 18, 34, 0.82)';
        ctx.strokeStyle = 'rgba(45, 226, 230, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx - 88, by - 14, 176, 26, 13);
        ctx.fill();
        ctx.stroke();
        ctx.font = '800 11px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`[F] CARJACK ${candidate.name.toUpperCase()}`, bx, by - 1);
        ctx.restore();
      }
    }
  }

  function renderFrame(world) {
    ctx.save();
    ctx.fillStyle = '#071426';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    const shakeX = world.camera.shake > 0 ? (Math.sin(world.elapsed * 73) * world.camera.shake) : 0;
    const shakeY = world.camera.shake > 0 ? (Math.cos(world.elapsed * 89) * world.camera.shake) : 0;

    ctx.translate(viewWidth * 0.5 + shakeX, viewHeight * 0.5 + shakeY);
    ctx.scale(world.camera.zoom, world.camera.zoom);
    ctx.translate(-world.camera.x, -world.camera.y);

    drawOceanAndCoast(world);
    drawRoadNetwork(world);

    // Draw vehicles
    for (const v of world.vehicleSystem.vehicles) {
      drawVehicle(v, world);
    }

    // Draw pedestrians, syndicate guards & officers
    for (const p of world.pedSystem.pedestrians) {
      if (!p.alive) continue;
      drawActor(p.x, p.y, p.angle, p.walkPhase, p.outfit, p.role !== 'civilian', false);
    }

    // Draw player Mateo Vance if on foot
    if (!world.player.vehicle) {
      drawActor(
        world.player.x,
        world.player.y,
        world.player.aimAngle,
        world.player.walkPhase,
        { shirt: '#2de2e6', pants: '#0f172a', skin: '#e8b38a', hair: '#151822' },
        true,
        true
      );
    }

    drawBuildings3D(world);
    drawPalmTrees(world);
    drawCombatAndChopper(world);

    ctx.restore();

    // Subtle neon-sunset atmospheric vignette at screen borders (never obscures gameplay)
    const vignette = ctx.createRadialGradient(viewWidth * 0.5, viewHeight * 0.5, viewHeight * 0.36, viewWidth * 0.5, viewHeight * 0.5, viewWidth * 0.72);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(10, 6, 24, 0.36)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, viewWidth, viewHeight);
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    resize,
    renderFrame,
    getSize() { return { width: viewWidth, height: viewHeight }; },
  };
}
