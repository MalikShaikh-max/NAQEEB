import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameModeId, HyperCar, PlayerProfile } from '../types/game';
import { GAME_MODES } from '../data/gameData';
import { soundEngine } from '../audio/synthAudio';
import confetti from 'canvas-confetti';

interface NitroWaveGameProps {
  modeId: GameModeId;
  car: HyperCar;
  profile: PlayerProfile;
  onExitGame: () => void;
  onFinishRun: (stats: {
    score: number;
    diamondsEarned: number;
    stuntsCompleted: number;
    topSpeed: number;
    modeId: GameModeId;
  }) => void;
}

export interface LevelDefinition {
  levelNumber: number;
  title: string;
  stuntRequirement: string;
  stuntType:
    | 'jump'
    | 'speed_90'
    | 'weave'
    | 'nitro'
    | 'blast'
    | 'ramp_jump'
    | 'roll'
    | 'shield'
    | 'speed_150'
    | 'corkscrew'
    | 'speed_weave';
  targetCount: number;
  rewardDiamonds: number;
  hint: string;
}

// SHORT, PROGRESSIVE, INTUITIVE LEVELS - EASY FROM THE START AND LEVELING UP NATURALLY!
export const GAME_LEVELS: LevelDefinition[] = [
  {
    levelNumber: 1,
    title: 'Rookie First Flight',
    stuntRequirement: 'Clean Jump [SPACE] / [J]',
    stuntType: 'jump',
    targetCount: 1,
    rewardDiamonds: 50,
    hint: 'Tap [SPACE] or [J] to test your hydraulic jump suspension!',
  },
  {
    levelNumber: 2,
    title: 'Speed Ignition',
    stuntRequirement: 'Cruise at 90+ KM/H [W]',
    stuntType: 'speed_90',
    targetCount: 1,
    rewardDiamonds: 75,
    hint: 'Hold [W] or [↑] to smoothly accelerate into highway speed!',
  },
  {
    levelNumber: 3,
    title: 'Highway Lane Weave',
    stuntRequirement: 'Near-Miss Weave Past 1 Vehicle',
    stuntType: 'weave',
    targetCount: 1,
    rewardDiamonds: 100,
    hint: 'Steer close to a traffic vehicle without crashing!',
  },
  {
    levelNumber: 4,
    title: 'Nitro Overdrive',
    stuntRequirement: 'Engage Nitro Boost [SHIFT]',
    stuntType: 'nitro',
    targetCount: 1,
    rewardDiamonds: 125,
    hint: 'Press and hold [SHIFT] to ignite twin nitro exhaust jets!',
  },
  {
    levelNumber: 5,
    title: 'Laser Demolition',
    stuntRequirement: 'Vaporize 1 Obstacle [K]',
    stuntType: 'blast',
    targetCount: 1,
    rewardDiamonds: 150,
    hint: 'Press [K] or [X] when lined up behind an obstacle!',
  },
  {
    levelNumber: 6,
    title: 'Golden Ramp Launch',
    stuntRequirement: 'Launch off a Golden Mega Ramp',
    stuntType: 'ramp_jump',
    targetCount: 1,
    rewardDiamonds: 175,
    hint: 'Hit [SPACE] as you approach a yellow Mega Ramp!',
  },
  {
    levelNumber: 7,
    title: '360 Barrel Roll Ace',
    stuntRequirement: '360 Mid-Air Roll [Q]/[E]',
    stuntType: 'roll',
    targetCount: 1,
    rewardDiamonds: 200,
    hint: 'While airborne in the sky, hold [Q] or [E] to barrel roll!',
  },
  {
    levelNumber: 8,
    title: 'Kinetic Shield Ram',
    stuntRequirement: 'Ram Obstacle with Shield [L]',
    stuntType: 'shield',
    targetCount: 1,
    rewardDiamonds: 250,
    hint: 'Press [L] to activate deflector forcefield, then smash through an obstacle!',
  },
  {
    levelNumber: 9,
    title: 'Speed Limit Sovereign',
    stuntRequirement: 'Reach Hard 150 KM/H Limit',
    stuntType: 'speed_150',
    targetCount: 1,
    rewardDiamonds: 300,
    hint: 'Hold Gas [W] + Nitro [SHIFT] to reach the maximum 150 KM/H cap!',
  },
  {
    levelNumber: 10,
    title: 'Double 720 Corkscrew',
    stuntRequirement: 'Double 720 Spin Mid-Air',
    stuntType: 'corkscrew',
    targetCount: 1,
    rewardDiamonds: 400,
    hint: 'Launch high from a Mega Ramp and hold [Q] or [E] for 2 full rotations!',
  },
  {
    levelNumber: 11,
    title: 'Apex Speed Weave',
    stuntRequirement: 'High-Speed Weave at 130+ KM/H',
    stuntType: 'speed_weave',
    targetCount: 2,
    rewardDiamonds: 500,
    hint: 'Weave past traffic while maintaining top-tier speed!',
  },
];

export const NitroWaveGame: React.FC<NitroWaveGameProps> = ({
  modeId,
  car,
  profile,
  onExitGame,
  onFinishRun,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Restart key to allow instant retry when player loses/crashes
  const [runKey, setRunKey] = useState(0);

  // Dynamic Telemetry State (Settled speed, max 150 KM/H limit)
  const [speed, setSpeed] = useState(0);
  const [rpm, setRpm] = useState(1000);
  const [gear, setGear] = useState<'N' | 'R' | '1' | '2' | '3' | '4' | '5'>('1');
  const [nitroFuel, setNitroFuel] = useState(100);
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [blasterEnergy, setBlasterEnergy] = useState(100);
  const [shieldActive, setShieldActive] = useState(false);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [timeLeft, setTimeLeft] = useState(80);
  const [stuntsLanded, setStuntsLanded] = useState(0);
  const [obstaclesOvercome, setObstaclesOvercome] = useState(0);
  const [stuntPopup, setStuntPopup] = useState<string | null>(null);
  const [isAirborne, setIsAirborne] = useState(false);
  const [isNearRamp, setIsNearRamp] = useState(false);
  const [turnSignal, setTurnSignal] = useState<'none' | 'left' | 'right'>('none');

  // Level Progression & Stunt Quest System
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0);
  const [levelUpPopup, setLevelUpPopup] = useState<string | null>(null);

  // Win / Lose State
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [crashCause, setCrashCause] = useState<string | null>(null);
  const [showControlsHelp, setShowControlsHelp] = useState(false);

  // Active key press visualizer state for HUD
  const [activeKeys, setActiveKeys] = useState<{
    w: boolean;
    s: boolean;
    a: boolean;
    d: boolean;
    space: boolean;
    j: boolean;
    k: boolean;
    l: boolean;
    shift: boolean;
    q: boolean;
    e: boolean;
  }>({
    w: false,
    s: false,
    a: false,
    d: false,
    space: false,
    j: false,
    k: false,
    l: false,
    shift: false,
    q: false,
    e: false,
  });

  const [gameOverStats, setGameOverStats] = useState<{
    score: number;
    diamonds: number;
    stunts: number;
    topSpeed: number;
    obstacles: number;
    finalLevel: number;
  } | null>(null);

  // Internal keys ref for high performance 60FPS loop
  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    throttle: boolean;
    brake: boolean;
    nitro: boolean;
    jump: boolean;
    blast: boolean;
    shield: boolean;
    stuntLeft: boolean;
    stuntRight: boolean;
  }>({
    left: false,
    right: false,
    throttle: false,
    brake: false,
    nitro: false,
    jump: false,
    blast: false,
    shield: false,
    stuntLeft: false,
    stuntRight: false,
  });

  const selectedMode = GAME_MODES.find((m) => m.id === modeId) || GAME_MODES[0];
  const activeLevelDef = GAME_LEVELS[currentLevelIdx] || GAME_LEVELS[GAME_LEVELS.length - 1];

  useEffect(() => {
    setTimeLeft(selectedMode.timeLimitSec);
    setIsGameOver(false);
    setIsLost(false);
    setCrashCause(null);
    setSpeed(0);
    setScore(0);
    setStuntsLanded(0);
    setObstaclesOvercome(0);
    setCurrentLevelIdx(0);
    setLevelProgress(0);
    setLevelUpPopup(null);
    if (!soundEngine.getIsMusicPlaying()) {
      soundEngine.startMusic();
    }
  }, [selectedMode, runKey]);

  // Three.js Game Loop
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120622);
    scene.fog = new THREE.FogExp2(0x180a2b, 0.011);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 3.1, 7.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Lighting: Ambient + Roadside illumination
    const ambientLight = new THREE.AmbientLight(0xffc2d4, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00eefc, 1.4);
    dirLight.position.set(6, 16, 8);
    scene.add(dirLight);

    // 3. Giant Synthwave Sun at Horizon
    const sunGeo = new THREE.CircleGeometry(26, 36);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      side: THREE.DoubleSide,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(0, 11, -150);
    scene.add(sunMesh);

    for (let i = 0; i < 8; i++) {
      const stripeGeo = new THREE.PlaneGeometry(54, 0.75 + i * 0.35);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0x120622 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 2 + i * 1.55, -149);
      scene.add(stripe);
    }

    // 4. REALISTIC ASPHALT HIGHWAY WITH 4 MARKED LANES
    const roadWidth = 24;
    const roadLength = 320;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 1, 1);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x171524,
      roughness: 0.85,
      metalness: 0.15,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -50);
    scene.add(road);

    // Highway Shoulder Guardrails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
    const railGeo = new THREE.BoxGeometry(0.3, 0.45, roadLength);

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-roadWidth / 2, 0.3, -50);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(roadWidth / 2, 0.3, -50);
    scene.add(rightRail);

    // Guardrail Reflective Hazard Strips
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0x00eefc });
    const leftNeonLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, roadLength), hazardMat);
    leftNeonLine.position.set(-roadWidth / 2 + 0.16, 0.3, -50);
    scene.add(leftNeonLine);

    const rightNeonLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, roadLength), hazardMat);
    rightNeonLine.position.set(roadWidth / 2 - 0.16, 0.3, -50);
    scene.add(rightNeonLine);

    // Realistic Dashed White Highway Lane Dividers
    const laneMarkerGeo = new THREE.PlaneGeometry(0.22, 3.5);
    const laneMarkerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const laneDividers: THREE.Mesh[] = [];
    const laneXPositions = [-6.0, -2.0, 2.0, 6.0];

    for (let z = 10; z > -180; z -= 8.5) {
      laneXPositions.forEach((lx) => {
        const marker = new THREE.Mesh(laneMarkerGeo, laneMarkerMat);
        marker.rotation.x = -Math.PI / 2;
        marker.position.set(lx, 0.02, z);
        scene.add(marker);
        laneDividers.push(marker);
      });
    }

    // Overhead Highway Gantry Signboards
    const highwayGantries: THREE.Group[] = [];
    const createHighwayGantry = (zPos: number, titleText: string, subtitleText: string) => {
      const gantry = new THREE.Group();
      // Side Support Pillars
      const pillarGeo = new THREE.CylinderGeometry(0.22, 0.22, 6.5, 8);
      const pL = new THREE.Mesh(pillarGeo, postMat);
      pL.position.set(-roadWidth / 2 - 0.6, 3.25, 0);
      const pR = new THREE.Mesh(pillarGeo, postMat);
      pR.position.set(roadWidth / 2 + 0.6, 3.25, 0);
      gantry.add(pL);
      gantry.add(pR);

      // Top Cross Truss
      const trussGeo = new THREE.BoxGeometry(roadWidth + 2.0, 0.5, 0.5);
      const truss = new THREE.Mesh(trussGeo, postMat);
      truss.position.set(0, 6.2, 0);
      gantry.add(truss);

      // Reflective Green Interstate Sign Plate
      const signGeo = new THREE.BoxGeometry(10, 2.0, 0.15);
      const signMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.3 });
      const signBoard = new THREE.Mesh(signGeo, signMat);
      signBoard.position.set(0, 5.2, 0);
      gantry.add(signBoard);

      // White Border
      const borderGeo = new THREE.BoxGeometry(10.2, 2.2, 0.08);
      const borderMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.set(0, 5.2, -0.05);
      gantry.add(border);

      // Sign Lights
      const signLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const l1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.3), signLightMat);
      l1.position.set(-3, 6.4, 0.2);
      const l2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.3), signLightMat);
      l2.position.set(3, 6.4, 0.2);
      gantry.add(l1);
      gantry.add(l2);

      gantry.position.set(0, 0, zPos);
      scene.add(gantry);
      highwayGantries.push(gantry);
    };

    createHighwayGantry(-70, 'INTERSTATE 80 EAST', 'NEXT EXIT: PACIFIC SUNSET WAY 1 MILE');
    createHighwayGantry(-190, 'NEON BOULEVARD EXPRESS', 'MEGA RAMP ZONE AHEAD - SPEED LIMIT 150');
    createHighwayGantry(-310, 'CYBER DOWNTOWN SYNDICATE', 'ALL HAZARDS ACTIVE - USE DEFLECTOR SHIELD');

    // Highway Shoulder Street Lamps
    const streetLamps: THREE.Group[] = [];
    for (let l = 0; l < 14; l++) {
      const lamp = new THREE.Group();
      const isLeft = l % 2 === 0;
      const lx = isLeft ? -roadWidth / 2 - 1.2 : roadWidth / 2 + 1.2;

      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
      const pole = new THREE.Mesh(poleGeo, postMat);
      pole.position.set(0, 3.75, 0);
      lamp.add(pole);

      const armGeo = new THREE.BoxGeometry(2.0, 0.12, 0.12);
      const arm = new THREE.Mesh(armGeo, postMat);
      arm.position.set(isLeft ? 0.9 : -0.9, 7.4, 0);
      lamp.add(arm);

      const bulbGeo = new THREE.BoxGeometry(0.8, 0.12, 0.35);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(isLeft ? 1.7 : -1.7, 7.3, 0);
      lamp.add(bulb);

      lamp.position.set(lx, 0, -l * 28 - 15);
      scene.add(lamp);
      streetLamps.push(lamp);
    }

    // 5. PLAYER'S REALISTIC HYPERCAR CHASSIS WITH WORKING SUSPENSION & LIGHTING
    const carGroup = new THREE.Group();
    // Inner body pivot for suspension roll, pitch, bounce, and vibration
    const carBodyChassis = new THREE.Group();
    carGroup.add(carBodyChassis);

    const primaryColor = new THREE.Color(car.primaryColor || '#c084fc');
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.22,
      metalness: 0.88,
    });

    const carbonTrimMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.45,
      metalness: 0.65,
    });

    // Main sculpted wedge body
    const bodyGeo = new THREE.BoxGeometry(1.96, 0.46, 4.1);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.52;
    carBodyChassis.add(bodyMesh);

    // Front low aero splitter with endplate winglets
    const splitterGeo = new THREE.BoxGeometry(2.08, 0.08, 0.65);
    const splitter = new THREE.Mesh(splitterGeo, carbonTrimMat);
    splitter.position.set(0, 0.25, -2.1);
    carBodyChassis.add(splitter);

    const wingletGeo = new THREE.BoxGeometry(0.08, 0.22, 0.45);
    const wingletL = new THREE.Mesh(wingletGeo, carbonTrimMat);
    wingletL.position.set(-1.05, 0.32, -2.15);
    const wingletR = new THREE.Mesh(wingletGeo, carbonTrimMat);
    wingletR.position.set(1.05, 0.32, -2.15);
    carBodyChassis.add(wingletL);
    carBodyChassis.add(wingletR);

    // Sculpted Hood with Air Ducts
    const hoodGeo = new THREE.BoxGeometry(1.65, 0.16, 1.35);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.72, -1.25);
    hood.rotation.x = 0.11;
    carBodyChassis.add(hood);

    // Aerodynamic Windshield & Tinted Glass Canopy
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x050512,
      roughness: 0.08,
      metalness: 0.95,
      transparent: true,
      opacity: 0.94,
    });
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.46, 1.95);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
    cabinMesh.position.set(0, 0.94, -0.15);
    carBodyChassis.add(cabinMesh);

    // Carbon Roof
    const roofGeo = new THREE.BoxGeometry(1.24, 0.07, 1.25);
    const roofMesh = new THREE.Mesh(roofGeo, carbonTrimMat);
    roofMesh.position.set(0, 1.18, -0.1);
    carBodyChassis.add(roofMesh);

    // Aerodynamic Side Rearview Mirrors with Reflective Glass Faces
    const mirrorStemGeo = new THREE.BoxGeometry(0.18, 0.05, 0.08);
    const mirrorHousingGeo = new THREE.BoxGeometry(0.26, 0.14, 0.12);
    const mirrorGlassMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.05 });

    const mirrorL = new THREE.Group();
    const stemL = new THREE.Mesh(mirrorStemGeo, carbonTrimMat);
    stemL.position.set(-0.1, 0, 0);
    const housingL = new THREE.Mesh(mirrorHousingGeo, bodyMat);
    housingL.position.set(-0.25, 0.04, 0);
    const glassFaceL = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), mirrorGlassMat);
    glassFaceL.position.set(-0.25, 0.04, 0.065);
    mirrorL.add(stemL);
    mirrorL.add(housingL);
    mirrorL.add(glassFaceL);
    mirrorL.position.set(-0.95, 0.88, -0.9);
    carBodyChassis.add(mirrorL);

    const mirrorR = new THREE.Group();
    const stemR = new THREE.Mesh(mirrorStemGeo, carbonTrimMat);
    stemR.position.set(0.1, 0, 0);
    const housingR = new THREE.Mesh(mirrorHousingGeo, bodyMat);
    housingR.position.set(0.25, 0.04, 0);
    const glassFaceR = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), mirrorGlassMat);
    glassFaceR.position.set(0.25, 0.04, 0.065);
    mirrorR.add(stemR);
    mirrorR.add(housingR);
    mirrorR.add(glassFaceR);
    mirrorR.position.set(0.95, 0.88, -0.9);
    carBodyChassis.add(mirrorR);

    // Dynamic Turn Indicators (Amber LEDs on Mirrors)
    const turnLedMatL = new THREE.MeshBasicMaterial({ color: 0x451a03 });
    const turnLedMatR = new THREE.MeshBasicMaterial({ color: 0x451a03 });
    const indicatorGeo = new THREE.BoxGeometry(0.24, 0.04, 0.05);
    const turnLedL = new THREE.Mesh(indicatorGeo, turnLedMatL);
    turnLedL.position.set(-0.25, -0.04, 0.04);
    mirrorL.add(turnLedL);
    const turnLedR = new THREE.Mesh(indicatorGeo, turnLedMatR);
    turnLedR.position.set(0.25, -0.04, 0.04);
    mirrorR.add(turnLedR);

    // Rear Engine Louvers
    const louverGeo = new THREE.BoxGeometry(1.32, 0.04, 0.18);
    for (let l = 0; l < 4; l++) {
      const louver = new THREE.Mesh(louverGeo, carbonTrimMat);
      louver.position.set(0, 0.9 - l * 0.06, 0.9 + l * 0.25);
      louver.rotation.x = -0.16;
      carBodyChassis.add(louver);
    }

    // CAR-SPECIFIC AUTHENTIC SPOILERS, STRAKES & BODY ARCHITECTURE
    const isPorsche = car.id === 'porsche-930';
    const isTestarossa = car.id === 'ferrari-testarossa';
    const isCountach = car.id === 'lamborghini-countach';
    const isSkyline = car.id === 'nissan-skyline-gtr';
    const isDeLorean = car.id === 'delorean-dmc12';
    const isVector = car.id === 'vector-gt86';

    if (isPorsche) {
      // PORSCHE 930 WHALE-TAIL SPOILER (Iconic wide rubber tea-tray with cooling grille)
      const whaleTailGeo = new THREE.BoxGeometry(2.1, 0.1, 0.9);
      const whaleTailMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.9 });
      const whaleTail = new THREE.Mesh(whaleTailGeo, whaleTailMat);
      whaleTail.position.set(0, 0.96, 1.85);
      whaleTail.rotation.x = 0.12;
      carBodyChassis.add(whaleTail);

      // Porsche flared rear wheel arches
      const flareGeo = new THREE.BoxGeometry(0.16, 0.42, 1.6);
      const fL = new THREE.Mesh(flareGeo, bodyMat);
      fL.position.set(-1.06, 0.45, 1.25);
      const fR = new THREE.Mesh(flareGeo, bodyMat);
      fR.position.set(1.06, 0.45, 1.25);
      carBodyChassis.add(fL);
      carBodyChassis.add(fR);
    } else if (isTestarossa) {
      // FERRARI TESTAROSSA HORIZONTAL SIDE STRAKES (Iconic Miami door slats)
      for (let s = 0; s < 5; s++) {
        const strakeGeo = new THREE.BoxGeometry(0.08, 0.035, 1.6);
        const stL = new THREE.Mesh(strakeGeo, bodyMat);
        stL.position.set(-1.02, 0.38 + s * 0.07, 0.1);
        const stR = new THREE.Mesh(strakeGeo, bodyMat);
        stR.position.set(1.02, 0.38 + s * 0.07, 0.1);
        carBodyChassis.add(stL);
        carBodyChassis.add(stR);
      }
      // Flat rear deck with black horizontal grille across taillights
      const grilleRear = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.04), carbonTrimMat);
      grilleRear.position.set(0, 0.65, 2.07);
      carBodyChassis.add(grilleRear);
    } else if (isCountach) {
      // LAMBORGHINI COUNTACH CHEVRON DELTA WING
      const deltaWingGeo = new THREE.BoxGeometry(2.35, 0.08, 0.52);
      const deltaWing = new THREE.Mesh(deltaWingGeo, bodyMat);
      deltaWing.position.set(0, 1.26, 1.85);
      deltaWing.rotation.x = -0.08;
      carBodyChassis.add(deltaWing);

      // Endplate fins
      const endGeo = new THREE.BoxGeometry(0.06, 0.32, 0.52);
      const epL = new THREE.Mesh(endGeo, carbonTrimMat);
      epL.position.set(-1.18, 1.26, 1.85);
      const epR = new THREE.Mesh(endGeo, carbonTrimMat);
      epR.position.set(1.18, 1.26, 1.85);
      carBodyChassis.add(epL);
      carBodyChassis.add(epR);

      // Side NACA triangular air ducts
      const nacaGeo = new THREE.BoxGeometry(0.12, 0.25, 0.5);
      const nacaL = new THREE.Mesh(nacaGeo, carbonTrimMat);
      nacaL.position.set(-1.02, 0.82, 0.75);
      const nacaR = new THREE.Mesh(nacaGeo, carbonTrimMat);
      nacaR.position.set(1.02, 0.82, 0.75);
      carBodyChassis.add(nacaL);
      carBodyChassis.add(nacaR);
    } else if (isSkyline) {
      // NISSAN SKYLINE GT-R R34 HIGH-MOUNT WING WITH TWIN UPRIGHTS
      const r34WingGeo = new THREE.BoxGeometry(2.1, 0.07, 0.42);
      const r34Wing = new THREE.Mesh(r34WingGeo, bodyMat);
      r34Wing.position.set(0, 1.34, 1.82);
      carBodyChassis.add(r34Wing);

      const r34PostGeo = new THREE.BoxGeometry(0.06, 0.45, 0.12);
      const postL = new THREE.Mesh(r34PostGeo, carbonTrimMat);
      postL.position.set(-0.65, 1.1, 1.82);
      const postR = new THREE.Mesh(r34PostGeo, carbonTrimMat);
      postR.position.set(0.65, 1.1, 1.82);
      carBodyChassis.add(postL);
      carBodyChassis.add(postR);
    } else if (isDeLorean) {
      // DELOREAN DMC-12 BLACK REAR SUN LOUVERS
      for (let dl = 0; dl < 6; dl++) {
        const dLouver = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.03, 0.16), carbonTrimMat);
        dLouver.position.set(0, 0.88 - dl * 0.06, 0.6 + dl * 0.22);
        dLouver.rotation.x = -0.15;
        carBodyChassis.add(dLouver);
      }
    } else {
      // STANDARD HIGH-DOWNFORCE GT REAR WING
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8, roughness: 0.3 });
      const wingGeo = new THREE.BoxGeometry(2.1, 0.08, 0.48);
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(0, 1.2, 1.82);
      carBodyChassis.add(wing);

      const wingPillarGeo = new THREE.BoxGeometry(0.06, 0.35, 0.15);
      const wpL = new THREE.Mesh(wingPillarGeo, carbonTrimMat);
      wpL.position.set(-0.6, 1.02, 1.8);
      const wpR = new THREE.Mesh(wingPillarGeo, carbonTrimMat);
      wpR.position.set(0.6, 1.02, 1.8);
      carBodyChassis.add(wpL);
      carBodyChassis.add(wpR);
    }

    // Rear Carbon Diffuser with Vertical Aero Fins
    const diffuserGeo = new THREE.BoxGeometry(1.88, 0.2, 0.5);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonTrimMat);
    diffuser.position.set(0, 0.3, 2.05);
    carBodyChassis.add(diffuser);

    for (let f = -3; f <= 3; f += 2) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.55), carbonTrimMat);
      fin.position.set(f * 0.24, 0.28, 2.05);
      carBodyChassis.add(fin);
    }

    // Realistic Twin Round Chrome Exhaust Pipes with Glowing Heat Rim
    const pipeOuterGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16);
    const pipeOuterMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const pipeInnerGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.31, 16);
    const pipeInnerMat = new THREE.MeshBasicMaterial({ color: 0x18040a });

    const exhaustL = new THREE.Group();
    const pOutL = new THREE.Mesh(pipeOuterGeo, pipeOuterMat);
    pOutL.rotation.x = Math.PI / 2;
    const pInL = new THREE.Mesh(pipeInnerGeo, pipeInnerMat);
    pInL.rotation.x = Math.PI / 2;
    exhaustL.add(pOutL);
    exhaustL.add(pInL);
    exhaustL.position.set(-0.48, 0.36, 2.15);
    carBodyChassis.add(exhaustL);

    const exhaustR = new THREE.Group();
    const pOutR = new THREE.Mesh(pipeOuterGeo, pipeOuterMat);
    pOutR.rotation.x = Math.PI / 2;
    const pInR = new THREE.Mesh(pipeInnerGeo, pipeInnerMat);
    pInR.rotation.x = Math.PI / 2;
    exhaustR.add(pOutR);
    exhaustR.add(pInR);
    exhaustR.position.set(0.48, 0.36, 2.15);
    carBodyChassis.add(exhaustR);

    // Projector Headlights / Pop-Up Pods
    const headMat = new THREE.MeshBasicMaterial({ color: 0x00eefc });
    const headGeo = new THREE.BoxGeometry(0.48, 0.08, 0.06);
    const headL = new THREE.Mesh(headGeo, headMat);
    headL.position.set(-0.55, 0.46, -2.06);
    const headR = new THREE.Mesh(headGeo, headMat);
    headR.position.set(0.55, 0.46, -2.06);
    carBodyChassis.add(headL);
    carBodyChassis.add(headR);

    // If Vector or AE86, add pop-up pod housings on hood
    if (isVector) {
      const popPodGeo = new THREE.BoxGeometry(0.48, 0.12, 0.38);
      const podL = new THREE.Mesh(popPodGeo, bodyMat);
      podL.position.set(-0.55, 0.82, -1.55);
      const podR = new THREE.Mesh(popPodGeo, bodyMat);
      podR.position.set(0.55, 0.82, -1.55);
      carBodyChassis.add(podL);
      carBodyChassis.add(podR);
    }

    // Forward Headlight Light Cones hitting the asphalt highway
    const beamGeo = new THREE.ConeGeometry(3.5, 24, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00eefc,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const headlightBeam = new THREE.Mesh(beamGeo, beamMat);
    headlightBeam.rotation.x = -Math.PI / 2;
    headlightBeam.position.set(0, 0.4, -13);
    headlightBeam.scale.set(1.4, 1, 0.35);
    carGroup.add(headlightBeam);

    // Amber Front Corner Parking Lamps
    const amberParkMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const parkLampGeo = new THREE.BoxGeometry(0.24, 0.07, 0.06);
    const frontParkL = new THREE.Mesh(parkLampGeo, amberParkMat);
    frontParkL.position.set(-0.92, 0.44, -2.05);
    const frontParkR = new THREE.Mesh(parkLampGeo, amberParkMat);
    frontParkR.position.set(0.92, 0.44, -2.05);
    carBodyChassis.add(frontParkL);
    carBodyChassis.add(frontParkR);

    // Dynamic Taillights: Quad Circular for Skyline GT-R or Full Bar for others
    const tailBrakeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    if (isSkyline) {
      // NISSAN SKYLINE R34 QUAD CIRCULAR TAILLIGHTS (2 on left, 2 on right)
      const ringGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16);
      const ringPositions = [
        [-0.72, 0.64, 2.06],
        [-0.42, 0.64, 2.06],
        [0.42, 0.64, 2.06],
        [0.72, 0.64, 2.06],
      ];
      ringPositions.forEach((pos) => {
        const ring = new THREE.Mesh(ringGeo, tailBrakeMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(pos[0], pos[1], pos[2]);
        carBodyChassis.add(ring);
      });
    } else {
      const tailBarGeo = new THREE.BoxGeometry(1.85, 0.12, 0.06);
      const taillight = new THREE.Mesh(tailBarGeo, tailBrakeMat);
      taillight.position.set(0, 0.64, 2.06);
      carBodyChassis.add(taillight);
    }

    const chmslGeo = new THREE.BoxGeometry(0.65, 0.06, 0.05);
    const chmsl = new THREE.Mesh(chmslGeo, tailBrakeMat);
    chmsl.position.set(0, 1.14, 1.76);
    carBodyChassis.add(chmsl);

    // Neon Underglow
    const underglowGeo = new THREE.PlaneGeometry(2.0, 3.8);
    const underglowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(car.underglowColor || '#00eefc'),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const underglowMesh = new THREE.Mesh(underglowGeo, underglowMat);
    underglowMesh.rotation.x = -Math.PI / 2;
    underglowMesh.position.y = 0.08;
    carGroup.add(underglowMesh);

    // Deflector Forcefield Shield
    const shieldGeo = new THREE.SphereGeometry(2.6, 20, 20);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00eefc,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.set(0, 0.8, 0);
    shieldMesh.visible = false;
    carGroup.add(shieldMesh);

    // Realistic Multi-Piece Wheels with Rubber Tires, Alloy Rims, Rotors & Red Calipers
    const frontHubL = new THREE.Group();
    frontHubL.position.set(-1.02, 0.36, -1.25);
    carGroup.add(frontHubL);

    const frontHubR = new THREE.Group();
    frontHubR.position.set(1.02, 0.36, -1.25);
    carGroup.add(frontHubR);

    const rearHubL = new THREE.Group();
    rearHubL.position.set(-1.02, 0.36, 1.25);
    carGroup.add(rearHubL);

    const rearHubR = new THREE.Group();
    rearHubR.position.set(1.02, 0.36, 1.25);
    carGroup.add(rearHubR);

    const spinWheels: THREE.Group[] = [];

    const createRealisticWheelAssembly = (isLeft: boolean): THREE.Group => {
      const wheelAssembly = new THREE.Group();

      // Outer Tread Rubber Tire
      const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.32, 22);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      wheelAssembly.add(tire);

      // Chrome / Alloy Rim Lip
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.95,
        roughness: 0.12,
      });
      const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.33, 20);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelAssembly.add(rim);

      // 5-Spoke Alloy Star Geometry
      const spokeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.92, roughness: 0.18 });
      for (let s = 0; s < 5; s++) {
        const spokeGeo = new THREE.BoxGeometry(0.04, 0.23, 0.04);
        const spoke = new THREE.Mesh(spokeGeo, spokeMat);
        const angle = (s * Math.PI * 2) / 5;
        spoke.position.set(isLeft ? -0.16 : 0.16, Math.cos(angle) * 0.11, Math.sin(angle) * 0.11);
        spoke.rotation.x = angle;
        wheelAssembly.add(spoke);
      }

      // Drilled Steel Brake Rotor
      const rotorGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 18);
      const rotorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
      const rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.rotation.z = Math.PI / 2;
      rotor.position.x = isLeft ? 0.06 : -0.06;
      wheelAssembly.add(rotor);

      // Bright Racing Red Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.14);
      const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 });
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(isLeft ? 0.06 : -0.06, 0.11, 0.06);
      wheelAssembly.add(caliper);

      return wheelAssembly;
    };

    const wheelFL = createRealisticWheelAssembly(true);
    frontHubL.add(wheelFL);
    spinWheels.push(wheelFL);

    const wheelFR = createRealisticWheelAssembly(false);
    frontHubR.add(wheelFR);
    spinWheels.push(wheelFR);

    const wheelRL = createRealisticWheelAssembly(true);
    rearHubL.add(wheelRL);
    spinWheels.push(wheelRL);

    const wheelRR = createRealisticWheelAssembly(false);
    rearHubR.add(wheelRR);
    spinWheels.push(wheelRR);

    // Realistic Twin Nitro Flames
    const flameGeo = new THREE.ConeGeometry(0.18, 1.5, 12);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00eefc });
    const flameLeft = new THREE.Mesh(flameGeo, flameMat);
    flameLeft.rotation.x = -Math.PI / 2;
    flameLeft.position.set(-0.48, 0.36, 2.7);
    flameLeft.visible = false;
    carBodyChassis.add(flameLeft);

    const flameRight = new THREE.Mesh(flameGeo, flameMat);
    flameRight.rotation.x = -Math.PI / 2;
    flameRight.position.set(0.48, 0.36, 2.7);
    flameRight.visible = false;
    carBodyChassis.add(flameRight);

    scene.add(carGroup);

    // 6. Laser Projectiles
    interface LaserBolt {
      mesh: THREE.Mesh;
      z: number;
      x: number;
    }
    const laserBolts: LaserBolt[] = [];
    const laserGeo = new THREE.BoxGeometry(0.14, 0.14, 2.4);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    const shootLaser = () => {
      soundEngine.playLaserShot();
      [-0.6, 0.6].forEach((offset) => {
        const bolt = new THREE.Mesh(laserGeo, laserMat);
        bolt.position.set(carX + offset, 0.6, -2);
        scene.add(bolt);
        laserBolts.push({ mesh: bolt, z: -2, x: carX + offset });
      });
    };

    // 7. REALISTIC TRACK OBSTACLES: CIVILIAN VEHICLES, COMMERCIAL TRUCKS, & CONCRETE JERSEY HAZARDS
    interface TrackObstacle {
      mesh: THREE.Group | THREE.Mesh;
      type: 'ramp' | 'boost' | 'traffic' | 'truck' | 'barrier' | 'diamond';
      z: number;
      x: number;
      speed?: number;
      destroyed?: boolean;
    }

    const trackObjects: TrackObstacle[] = [];

    // Helper: Golden Mega Stunt Ramp with Warning Chevrons
    const createMegaRamp = (x: number, z: number) => {
      const rampGroup = new THREE.Group();
      const geom = new THREE.BoxGeometry(4.6, 1.6, 6.2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.35,
        metalness: 0.4,
      });
      const rampMesh = new THREE.Mesh(geom, mat);
      rampMesh.rotation.x = -0.22;
      rampMesh.position.y = 0.52;
      rampGroup.add(rampMesh);

      // Warning Chevron Arrow
      const chevGeo = new THREE.PlaneGeometry(3.2, 1.2);
      const chevMat = new THREE.MeshBasicMaterial({ color: 0xff007f, side: THREE.DoubleSide });
      const chev = new THREE.Mesh(chevGeo, chevMat);
      chev.rotation.x = -Math.PI / 2 + 0.22;
      chev.position.set(0, 0.85, 0);
      rampGroup.add(chev);

      // Flashing Edge Strobes
      const strobeMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
      const sL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 5.8), strobeMat);
      sL.position.set(-2.2, 0.6, 0);
      sL.rotation.x = -0.22;
      const sR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 5.8), strobeMat);
      sR.position.set(2.2, 0.6, 0);
      sR.rotation.x = -0.22;
      rampGroup.add(sL);
      rampGroup.add(sR);

      rampGroup.position.set(x, 0, z);
      scene.add(rampGroup);
      trackObjects.push({ mesh: rampGroup, type: 'ramp', z, x });
    };

    // Helper: Boost Pad
    const createBoostPad = (x: number, z: number) => {
      const boostGeo = new THREE.PlaneGeometry(3.6, 4.2);
      const boostMat = new THREE.MeshBasicMaterial({ color: 0x00eefc, side: THREE.DoubleSide });
      const pad = new THREE.Mesh(boostGeo, boostMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(x, 0.06, z);
      scene.add(pad);
      trackObjects.push({ mesh: pad, type: 'boost', z, x });
    };

    // 1. Realistic Civilian Traffic Vehicle (Coupe / Sedan)
    const createCivilianVehicle = (x: number, z: number) => {
      const carObs = new THREE.Group();
      const carPaintColors = [0xdc2626, 0x0284c7, 0xeab308, 0x16a34a, 0x9333ea, 0x475569];
      const paint = carPaintColors[Math.floor(Math.random() * carPaintColors.length)];

      const cBodyMat = new THREE.MeshStandardMaterial({ color: paint, roughness: 0.35, metalness: 0.65 });
      const cDarkMat = new THREE.MeshStandardMaterial({ color: 0x181822, roughness: 0.5 });
      const cGlassMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.1, metalness: 0.95 });

      // Lower body
      const cBodyGeo = new THREE.BoxGeometry(1.9, 0.52, 3.9);
      const cBody = new THREE.Mesh(cBodyGeo, cBodyMat);
      cBody.position.y = 0.5;
      carObs.add(cBody);

      // Cabin greenhouse
      const cCabinGeo = new THREE.BoxGeometry(1.36, 0.44, 2.0);
      const cCabin = new THREE.Mesh(cCabinGeo, cGlassMat);
      cCabin.position.set(0, 0.92, -0.1);
      carObs.add(cCabin);

      // Front bumper & grille
      const cGrilleGeo = new THREE.BoxGeometry(1.65, 0.22, 0.1);
      const cGrille = new THREE.Mesh(cGrilleGeo, cDarkMat);
      cGrille.position.set(0, 0.45, -1.96);
      carObs.add(cGrille);

      // Headlights
      const cHeadGeo = new THREE.BoxGeometry(0.35, 0.1, 0.05);
      const cHeadMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const chL = new THREE.Mesh(cHeadGeo, cHeadMat);
      chL.position.set(-0.6, 0.5, -1.96);
      const chR = new THREE.Mesh(cHeadGeo, cHeadMat);
      chR.position.set(0.6, 0.5, -1.96);
      carObs.add(chL);
      carObs.add(chR);

      // Rear illuminated brake lights
      const cTailGeo = new THREE.BoxGeometry(1.65, 0.14, 0.08);
      const cTailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const cTail = new THREE.Mesh(cTailGeo, cTailMat);
      cTail.position.set(0, 0.6, 1.96);
      carObs.add(cTail);

      // 4 Realistic Rubber Wheels
      const wheelPos = [
        [-0.98, 0.32, -1.2],
        [0.98, 0.32, -1.2],
        [-0.98, 0.32, 1.2],
        [0.98, 0.32, 1.2],
      ];
      const obsTireGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.26, 14);
      const obsTireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      wheelPos.forEach((pos) => {
        const w = new THREE.Mesh(obsTireGeo, obsTireMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(pos[0], pos[1], pos[2]);
        carObs.add(w);
      });

      carObs.position.set(x, 0, z);
      scene.add(carObs);
      trackObjects.push({ mesh: carObs, type: 'traffic', z, x, speed: 0.12 + Math.random() * 0.12 });
    };

    // 2. Realistic Armored Commercial Freight Truck (Heavy Obstacle)
    const createArmoredTruck = (x: number, z: number) => {
      const truck = new THREE.Group();
      const truckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.5 });
      const hazardYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

      // Cab chassis
      const cabGeo = new THREE.BoxGeometry(2.15, 1.45, 2.3);
      const cab = new THREE.Mesh(cabGeo, truckMat);
      cab.position.set(0, 1.15, -1.5);
      truck.add(cab);

      // Windshield
      const cabWindshieldGeo = new THREE.BoxGeometry(1.9, 0.6, 0.1);
      const cabWindshieldMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
      const cw = new THREE.Mesh(cabWindshieldGeo, cabWindshieldMat);
      cw.position.set(0, 1.35, -2.66);
      truck.add(cw);

      // Cargo Container Trailer with Ribbed Geometry
      const cargoGeo = new THREE.BoxGeometry(2.35, 1.9, 3.8);
      const cargo = new THREE.Mesh(cargoGeo, truckMat);
      cargo.position.set(0, 1.38, 1.3);
      truck.add(cargo);

      // Yellow/Black Hazard stripe plate on rear
      const rearPlateGeo = new THREE.BoxGeometry(2.1, 0.55, 0.08);
      const rearPlate = new THREE.Mesh(rearPlateGeo, hazardYellow);
      rearPlate.position.set(0, 0.85, 3.22);
      truck.add(rearPlate);

      // Rear DOT Brake Lights
      const truckTailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const ttL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), truckTailMat);
      ttL.position.set(-0.85, 0.85, 3.24);
      const ttR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), truckTailMat);
      ttR.position.set(0.85, 0.85, 3.24);
      truck.add(ttL);
      truck.add(ttR);

      // Dual Flashing Amber Beacons on Truck Roof
      const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const bL = new THREE.Mesh(beaconGeo, beaconMat);
      bL.position.set(-0.7, 1.98, -1.4);
      const bR = new THREE.Mesh(beaconGeo, beaconMat);
      bR.position.set(0.7, 1.98, -1.4);
      truck.add(bL);
      truck.add(bR);

      // Heavy 6 Wheels
      const truckTireGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.32, 14);
      const truckTireMat = new THREE.MeshStandardMaterial({ color: 0x111115 });
      const truckWheelPos = [
        [-1.12, 0.44, -1.5],
        [1.12, 0.44, -1.5],
        [-1.18, 0.44, 0.7],
        [1.18, 0.44, 0.7],
        [-1.18, 0.44, 2.1],
        [1.18, 0.44, 2.1],
      ];
      truckWheelPos.forEach((pos) => {
        const tw = new THREE.Mesh(truckTireGeo, truckTireMat);
        tw.rotation.z = Math.PI / 2;
        tw.position.set(pos[0], pos[1], pos[2]);
        truck.add(tw);
      });

      truck.position.set(x, 0, z);
      scene.add(truck);
      trackObjects.push({ mesh: truck, type: 'traffic', z, x, speed: 0.08 });
    };

    // 3. Realistic Concrete Jersey Roadblock with Hazard Chevrons & Strobe
    const createRealisticBarrier = (x: number, z: number) => {
      const bg = new THREE.Group();

      // Sloped Concrete Jersey Base
      const concGeo = new THREE.BoxGeometry(3.6, 0.75, 0.65);
      const concMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95 });
      const conc = new THREE.Mesh(concGeo, concMat);
      conc.position.y = 0.4;
      bg.add(conc);

      // Hazard Warning Stripe Plate
      const plateGeo = new THREE.BoxGeometry(3.4, 0.35, 0.67);
      const plateMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.y = 0.45;
      bg.add(plate);

      // Heavy Steel End Posts
      const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);
      const postMatObj = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const p1 = new THREE.Mesh(postGeo, postMatObj);
      p1.position.set(-1.6, 0.6, 0);
      const p2 = new THREE.Mesh(postGeo, postMatObj);
      p2.position.set(1.6, 0.6, 0);
      bg.add(p1);
      bg.add(p2);

      // Center High-Intensity Amber Warning Hazard Beacon
      const beaconGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, 0.95, 0);
      bg.add(beacon);

      bg.position.set(x, 0, z);
      scene.add(bg);
      trackObjects.push({ mesh: bg, type: 'barrier', z, x });
    };

    // Collectible Diamond Gem
    const createDiamond = (x: number, z: number) => {
      const dGeo = new THREE.OctahedronGeometry(0.55, 0);
      const dMat = new THREE.MeshStandardMaterial({
        color: 0x00eefc,
        emissive: 0x0088aa,
        roughness: 0.1,
      });
      const dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(x, 1.2, z);
      scene.add(dMesh);
      trackObjects.push({ mesh: dMesh, type: 'diamond', z, x });
    };

    // Track Distribution: Fair, balanced 4-lane spacing
    const initialLanes = [-6.0, -2.0, 2.0, 6.0];
    for (let i = 1; i <= 24; i++) {
      const zPos = -i * 32 - 25;
      const lane = initialLanes[Math.floor(Math.random() * initialLanes.length)];

      if (i % 6 === 0) {
        createMegaRamp(lane, zPos);
      } else if (i % 5 === 0) {
        createBoostPad(lane, zPos);
      } else if (i % 4 === 0) {
        createArmoredTruck(lane, zPos);
      } else if (i % 3 === 0) {
        createCivilianVehicle(lane, zPos);
      } else if (i % 7 === 0) {
        createRealisticBarrier(lane, zPos);
      } else {
        createDiamond(lane, zPos);
      }
    }

    // Roadside Palm Trees
    const palmTrees: THREE.Mesh[] = [];
    const palmMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    for (let i = 0; i < 20; i++) {
      const pGeo = new THREE.CylinderGeometry(0.15, 0.4, 7, 6);
      const palm = new THREE.Mesh(pGeo, palmMat);
      const side = i % 2 === 0 ? -14.5 : 14.5;
      palm.position.set(side, 3.5, -i * 20);
      scene.add(palm);
      palmTrees.push(palm);
    }

    // 8. Vehicle Physics & Simulation Variables
    let carX = 0;
    let carY = 0;
    let carVelocityY = 0;
    let carRotationZ = 0;
    let carRotationX = 0;
    let carSuspensionY = 0;
    let carSuspensionVelY = 0;
    let currentSpeed = 0; // Starts at 0, smoothly settles up to 150 KM/H max!
    let topRecordedSpeed = 0;
    let localNitro = 100;
    let localBlasterEnergy = 100;
    let localShieldActive = false;
    let shieldTimer = 0;
    let localScore = 0;
    let localMultiplier = 1.0;
    let localStunts = 0;
    let localObstaclesCount = 0;
    let localDiamonds = 0;
    let inAir = false;
    let spinAngle = 0;
    let gameClockSeconds = selectedMode.timeLimitSec;
    let isTerminated = false;
    let lastBrakeScreech = 0;
    let onRampZone = false;
    let turnSignalBlinkTimer = 0;

    // Stunt leveling tracking within simulation
    let currentLocalLevelIdx = 0;
    let currentLocalLevelProgress = 0;

    const clockInterval = setInterval(() => {
      if (isTerminated) return;
      gameClockSeconds--;
      setTimeLeft(gameClockSeconds);

      if (gameClockSeconds <= 0) {
        triggerVictoryRun();
      }
    }, 1000);

    // LEVEL UP EVALUATION FUNCTION - SHORT, PROGRESSIVE, SATISFYING
    const registerStuntAchievement = (stuntType: LevelDefinition['stuntType']) => {
      const currentGoal = GAME_LEVELS[currentLocalLevelIdx];
      if (!currentGoal) return;

      if (currentGoal.stuntType === stuntType) {
        currentLocalLevelProgress++;
        setLevelProgress(currentLocalLevelProgress);

        if (currentLocalLevelProgress >= currentGoal.targetCount) {
          // LEVEL UP!
          const nextLevelIdx = currentLocalLevelIdx + 1;
          currentLocalLevelIdx = nextLevelIdx;
          currentLocalLevelProgress = 0;

          setCurrentLevelIdx(nextLevelIdx);
          setLevelProgress(0);

          localScore += 2500;
          localDiamonds += currentGoal.rewardDiamonds;

          soundEngine.playLevelUpFanfare();
          confetti({
            particleCount: 110,
            spread: 85,
            origin: { y: 0.4 },
            colors: ['#00eefc', '#fde047', '#ff4a8d'],
          });

          const nextLevelDef = GAME_LEVELS[nextLevelIdx];
          const announcement = nextLevelDef
            ? `🎉 LEVEL ${nextLevelIdx + 1} UNLOCKED! (+${currentGoal.rewardDiamonds} 💎) NEXT: ${nextLevelDef.stuntRequirement}`
            : '🏆 MAX LEVEL REACHED! OUTRUN SYNDICATE LEGEND!';

          setLevelUpPopup(announcement);
          setTimeout(() => setLevelUpPopup(null), 3500);
        }
      }
    };

    // VICTORY: Survived the run
    const triggerVictoryRun = () => {
      if (isTerminated) return;
      isTerminated = true;
      setIsLost(false);
      setIsGameOver(true);
      soundEngine.playStuntSuccess();

      const finalStats = {
        score: Math.floor(localScore),
        diamonds: localDiamonds,
        stunts: localStunts,
        topSpeed: Math.floor(topRecordedSpeed),
        obstacles: localObstaclesCount,
        finalLevel: currentLocalLevelIdx + 1,
      };
      setGameOverStats(finalStats);

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#00eefc', '#ff4a8d', '#fde047'],
      });
    };

    // DEFEAT: Direct Collision with obstacle -> Immediate Loss!
    const triggerCrashLose = (cause: string) => {
      if (isTerminated) return;
      isTerminated = true;
      setIsLost(true);
      setIsGameOver(true);
      setCrashCause(cause);
      soundEngine.playExplosion();

      const finalStats = {
        score: Math.floor(localScore),
        diamonds: localDiamonds,
        stunts: localStunts,
        topSpeed: Math.floor(topRecordedSpeed),
        obstacles: localObstaclesCount,
        finalLevel: currentLocalLevelIdx + 1,
      };
      setGameOverStats(finalStats);
    };

    // Keyboard-Controlled Jump ONLY (Zero automatic jumping)
    const executeJump = () => {
      if (inAir) return;

      inAir = true;
      setIsAirborne(true);

      // Register achievement for jump!
      registerStuntAchievement('jump');

      if (onRampZone) {
        carVelocityY = 16.5 + (currentSpeed > 100 ? 3.5 : 0);
        soundEngine.playRampJump();
        registerStuntAchievement('ramp_jump');
        setStuntPopup('🚀 MEGA RAMP LAUNCH! HIT [Q]/[E] FOR 360 ROLLS!');
      } else {
        carVelocityY = 12.5 + (currentSpeed > 80 ? 2.5 : 0);
        soundEngine.playRampJump();
        setStuntPopup('HYDRAULIC JUMP! LEAPING HAZARD!');
      }
      setTimeout(() => setStuntPopup(null), 1500);
    };

    const updateActiveKeyUI = (key: string, isDown: boolean) => {
      setActiveKeys((prev) => {
        const next = { ...prev };
        if (key === 'w' || key === 'arrowup') next.w = isDown;
        if (key === 's' || key === 'arrowdown') next.s = isDown;
        if (key === 'a' || key === 'arrowleft') next.a = isDown;
        if (key === 'd' || key === 'arrowright') next.d = isDown;
        if (key === ' ') next.space = isDown;
        if (key === 'shift' || key === 'n') next.shift = isDown;
        if (key === 'j') next.j = isDown;
        if (key === 'k' || key === 'x') next.k = isDown;
        if (key === 'l' || key === 'c') next.l = isDown;
        if (key === 'q') next.q = isDown;
        if (key === 'e') next.e = isDown;
        return next;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      updateActiveKeyUI(k, true);

      if (k === 'w' || k === 'arrowup') keysRef.current.throttle = true;
      if (k === 's' || k === 'arrowdown') keysRef.current.brake = true;
      if (k === 'a' || k === 'arrowleft') keysRef.current.left = true;
      if (k === 'd' || k === 'arrowright') keysRef.current.right = true;
      if (k === 'shift' || k === 'n') {
        keysRef.current.nitro = true;
        registerStuntAchievement('nitro');
      }

      // Jump: [SPACE] or [J]
      if (!e.repeat && (k === ' ' || k === 'j')) {
        executeJump();
      }

      // Blaster: [K] or [X]
      if (!e.repeat && (k === 'k' || k === 'x')) {
        if (localBlasterEnergy >= 20) {
          localBlasterEnergy -= 20;
          setBlasterEnergy(Math.round(localBlasterEnergy));
          shootLaser();
        }
      }

      // Deflector Shield: [L] or [C]
      if (!e.repeat && (k === 'l' || k === 'c')) {
        if (!localShieldActive) {
          localShieldActive = true;
          setShieldActive(true);
          shieldMesh.visible = true;
          shieldTimer = 3.8;
          soundEngine.playShieldActivate();
          setStuntPopup('DEFLECTOR SHIELD READY TO RAM OBSTACLES!');
          setTimeout(() => setStuntPopup(null), 1200);
        }
      }

      if (k === 'q') keysRef.current.stuntLeft = true;
      if (k === 'e') keysRef.current.stuntRight = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      updateActiveKeyUI(k, false);

      if (k === 'w' || k === 'arrowup') keysRef.current.throttle = false;
      if (k === 's' || k === 'arrowdown') keysRef.current.brake = false;
      if (k === 'a' || k === 'arrowleft') keysRef.current.left = false;
      if (k === 'd' || k === 'arrowright') keysRef.current.right = false;
      if (k === 'shift' || k === 'n') keysRef.current.nitro = false;
      if (k === 'q') keysRef.current.stuntLeft = false;
      if (k === 'e') keysRef.current.stuntRight = false;
    };

    const handleBlur = () => {
      keysRef.current = {
        left: false,
        right: false,
        throttle: false,
        brake: false,
        nitro: false,
        jump: false,
        blast: false,
        shield: false,
        stuntLeft: false,
        stuntRight: false,
      };
      setActiveKeys({
        w: false,
        s: false,
        a: false,
        d: false,
        space: false,
        j: false,
        k: false,
        l: false,
        shift: false,
        q: false,
        e: false,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let reqId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      reqId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (isTerminated) {
        renderer.render(scene, camera);
        return;
      }

      // 1. REALISTIC SETTLED SPEED CONTROL WITH EXACT 150 KM/H SPEED LIMIT
      const wantsNitro = keysRef.current.nitro && localNitro > 0;
      setIsNitroActive(wantsNitro);

      if (wantsNitro) {
        localNitro = Math.max(0, localNitro - 22 * delta);
        flameLeft.visible = true;
        flameRight.visible = true;
        camera.fov = THREE.MathUtils.lerp(camera.fov, 74, delta * 3.5);
      } else {
        localNitro = Math.min(100, localNitro + 7 * delta);
        flameLeft.visible = false;
        flameRight.visible = false;
        camera.fov = THREE.MathUtils.lerp(camera.fov, 65, delta * 3.5);
      }

      // Determine Settled Target Speed
      let targetSettledSpeed = 0;
      if (keysRef.current.throttle) {
        // Settles right at 115-120 KM/H cruising, and 150 KM/H max with nitro!
        targetSettledSpeed = wantsNitro ? 150 : 120;
      } else if (keysRef.current.brake) {
        targetSettledSpeed = 0;
      } else {
        // Natural highway coasting deceleration
        targetSettledSpeed = currentSpeed > 30 ? 55 : 0;
      }

      // Smooth, natural, settled rate of speed change
      const transitionRate = keysRef.current.brake ? 3.8 : 1.7;
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSettledSpeed, delta * transitionRate);

      // EXACT HARD SPEED LIMIT CAPPED AT 150 KM/H
      currentSpeed = Math.min(150, Math.max(0, currentSpeed));

      // Level check: Speed 90 KM/H & Speed 150 KM/H
      if (currentSpeed >= 90) {
        registerStuntAchievement('speed_90');
      }
      if (currentSpeed >= 149) {
        registerStuntAchievement('speed_150');
      }

      if (keysRef.current.brake && currentSpeed > 30 && time - lastBrakeScreech > 600) {
        soundEngine.playBrakeScreech();
        lastBrakeScreech = time;
      }

      camera.updateProjectionMatrix();

      // Dynamic High-Intensity Brake Lights & Center Stop Lamp
      if (keysRef.current.brake && currentSpeed > 0) {
        tailBrakeMat.color.setHex(0xff0000);
        chmsl.visible = true;
      } else {
        tailBrakeMat.color.setHex(0xff0055);
        chmsl.visible = false;
      }

      // Recharging Blaster Energy
      localBlasterEnergy = Math.min(100, localBlasterEnergy + 14 * delta);
      setBlasterEnergy(Math.round(localBlasterEnergy));

      // Shield Timer
      if (localShieldActive) {
        shieldTimer -= delta;
        shieldMesh.rotation.y += delta * 4;
        if (shieldTimer <= 0) {
          localShieldActive = false;
          setShieldActive(false);
          shieldMesh.visible = false;
        }
      }

      // Settled Gear & RPM calculations
      let computedGear: 'N' | 'R' | '1' | '2' | '3' | '4' | '5' = '1';
      let computedRpm = 1000;

      if (currentSpeed <= 2) {
        computedGear = 'N';
        computedRpm = 1000;
      } else if (currentSpeed < 35) {
        computedGear = '1';
        computedRpm = 1500 + (currentSpeed / 35) * 4500;
      } else if (currentSpeed < 70) {
        computedGear = '2';
        computedRpm = 2000 + ((currentSpeed - 35) / 35) * 4500;
      } else if (currentSpeed < 110) {
        computedGear = '3';
        computedRpm = 2500 + ((currentSpeed - 70) / 40) * 4500;
      } else if (currentSpeed < 140) {
        computedGear = '4';
        computedRpm = 3000 + ((currentSpeed - 110) / 30) * 4000;
      } else {
        computedGear = '5';
        computedRpm = 4000 + ((currentSpeed - 140) / 10) * 3500;
      }

      setSpeed(Math.round(currentSpeed));
      setRpm(Math.round(computedRpm));
      setGear(computedGear);
      setNitroFuel(Math.round(localNitro));

      if (currentSpeed > topRecordedSpeed) {
        topRecordedSpeed = currentSpeed;
      }

      // Score progression
      if (currentSpeed > 5) {
        const scoreGain = (currentSpeed / 10) * localMultiplier * delta * 20;
        localScore += scoreGain;
        setScore(Math.floor(localScore));
      }

      // 2. REALISTIC VEHICLE DYNAMICS: STEERING, FRONT WHEEL PIVOT & DYNAMIC SIGNALS
      let steerInput = 0;
      if (keysRef.current.left) steerInput -= 1;
      if (keysRef.current.right) steerInput += 1;

      // Dynamic Turn Signal Blinker
      turnSignalBlinkTimer += delta * 6;
      const isBlinkOn = Math.floor(turnSignalBlinkTimer) % 2 === 0;

      if (steerInput < 0) {
        setTurnSignal('left');
        turnLedMatL.color.setHex(isBlinkOn ? 0xf59e0b : 0x451a03);
        turnLedMatR.color.setHex(0x451a03);
      } else if (steerInput > 0) {
        setTurnSignal('right');
        turnLedMatR.color.setHex(isBlinkOn ? 0xf59e0b : 0x451a03);
        turnLedMatL.color.setHex(0x451a03);
      } else {
        setTurnSignal('none');
        turnLedMatL.color.setHex(0x451a03);
        turnLedMatR.color.setHex(0x451a03);
      }

      const steerSpeed = (inAir ? 15 : 13) * delta;
      carX += steerInput * steerSpeed;
      carX = THREE.MathUtils.clamp(carX, -roadWidth / 2 + 1.4, roadWidth / 2 - 1.4);
      carGroup.position.x = carX;

      // Realistic Steering Knuckle Angle on Front Wheels
      const targetSteerAngle = -steerInput * 0.42;
      frontHubL.rotation.y = THREE.MathUtils.lerp(frontHubL.rotation.y, targetSteerAngle, delta * 12);
      frontHubR.rotation.y = THREE.MathUtils.lerp(frontHubR.rotation.y, targetSteerAngle, delta * 12);

      // Realistic Vehicle Chassis Suspension Roll & Pitch
      // Body Roll: centrifugal roll outward when steering
      const targetBodyRoll = -steerInput * 0.08;
      // Body Pitch: Squat on throttle, nose-dive on hard braking
      let targetBodyPitch = 0;
      if (keysRef.current.throttle) targetBodyPitch = 0.025;
      if (keysRef.current.brake) targetBodyPitch = -0.04;

      carBodyChassis.rotation.z = THREE.MathUtils.lerp(carBodyChassis.rotation.z, targetBodyRoll, delta * 10);
      carBodyChassis.rotation.x = THREE.MathUtils.lerp(carBodyChassis.rotation.x, targetBodyPitch, delta * 10);

      // Car Group overall heading rotation
      carGroup.rotation.z = THREE.MathUtils.lerp(
        carGroup.rotation.z,
        -steerInput * 0.12 + (inAir ? carRotationZ : 0),
        delta * 8
      );
      carGroup.rotation.y = THREE.MathUtils.lerp(carGroup.rotation.y, -steerInput * 0.1, delta * 8);

      // 3. AIR STUNT PHYSICS & SUSPENSION SPRING DAMPER ON TOUCHDOWN
      if (inAir) {
        carVelocityY -= 32 * delta;
        carY += carVelocityY * delta;

        // Controlled Roll / Corkscrew in Air
        if (keysRef.current.left || keysRef.current.stuntLeft) {
          spinAngle += 360 * delta * 2.4;
          carRotationZ = THREE.MathUtils.degToRad(spinAngle);
        } else if (keysRef.current.right || keysRef.current.stuntRight) {
          spinAngle -= 360 * delta * 2.4;
          carRotationZ = THREE.MathUtils.degToRad(spinAngle);
        }

        carRotationX = THREE.MathUtils.degToRad(-12);

        // Ground Touchdown
        if (carY <= 0) {
          carY = 0;
          inAir = false;
          setIsAirborne(false);

          // Realistic Suspension Damper Compression on Landing!
          carSuspensionVelY = -carVelocityY * 0.015;
          soundEngine.playLandingThud();

          // Evaluate Stunts
          const fullSpins = Math.floor(Math.abs(spinAngle) / 300);
          if (fullSpins >= 1) {
            localStunts += fullSpins;
            setStuntsLanded(localStunts);

            // Register Stunt Quest Achievements!
            if (fullSpins >= 2) {
              registerStuntAchievement('corkscrew');
            } else {
              registerStuntAchievement('roll');
            }

            const stuntPoints = 1500 * fullSpins * selectedMode.stuntBonusMultiplier;
            localScore += stuntPoints;
            localMultiplier = Math.min(5.0, localMultiplier + 0.5 * fullSpins);
            setMultiplier(localMultiplier);
            soundEngine.playStuntSuccess();
            setStuntPopup(`CLEAN LANDING! ACROBATIC ROLL x${fullSpins}! +${stuntPoints} PTS!`);
            setTimeout(() => setStuntPopup(null), 2000);
          } else {
            setStuntPopup('CLEAN AIRBORNE TOUCHDOWN! +250 PTS');
            localScore += 250;
            setTimeout(() => setStuntPopup(null), 1200);
          }
          spinAngle = 0;
          carRotationZ = 0;
          carRotationX = 0;
        }
      } else {
        carY = 0;
      }

      // Realistic Spring Damper Suspension Simulation
      // F = -k * x - c * v
      const springStiffness = 22;
      const springDamping = 0.82;
      const springForce = -springStiffness * carSuspensionY;
      carSuspensionVelY += springForce * delta;
      carSuspensionVelY *= Math.pow(springDamping, delta * 60);
      carSuspensionY += carSuspensionVelY * delta;

      carGroup.position.y = carY + carSuspensionY;
      carGroup.rotation.x = carRotationX;

      // Realistic Wheel Spinning Rate
      const wheelSpin = (currentSpeed / 8) * delta;
      spinWheels.forEach((w) => {
        w.rotation.x += wheelSpin;
      });

      // Smooth camera trailing
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, carX * 0.55, delta * 5);

      // Settled forward travel rate
      const forwardTravel = (currentSpeed / 14) * delta * 8.2;

      // Scroll Highway Dashed Lane Markers
      laneDividers.forEach((m) => {
        m.position.z += forwardTravel;
        if (m.position.z > 20) {
          m.position.z -= 200;
        }
      });

      // Scroll Highway Gantries
      highwayGantries.forEach((g) => {
        g.position.z += forwardTravel;
        if (g.position.z > 25) {
          g.position.z -= 360;
        }
      });

      // Scroll Street Lamps
      streetLamps.forEach((lamp) => {
        lamp.position.z += forwardTravel;
        if (lamp.position.z > 25) {
          lamp.position.z -= 392;
        }
      });

      // Scroll Palm Trees
      palmTrees.forEach((palm) => {
        palm.position.z += forwardTravel;
        if (palm.position.z > 20) {
          palm.position.z -= 400;
        }
      });

      // 4. Update Laser Bolts
      for (let lIdx = laserBolts.length - 1; lIdx >= 0; lIdx--) {
        const bolt = laserBolts[lIdx];
        bolt.z -= 180 * delta;
        bolt.mesh.position.z = bolt.z;

        let hitObstacle = false;
        trackObjects.forEach((obj) => {
          if ((obj.type === 'traffic' || obj.type === 'barrier') && !obj.destroyed) {
            const ldx = Math.abs(bolt.x - obj.mesh.position.x);
            const ldz = Math.abs(bolt.z - obj.mesh.position.z);
            if (ldx < 1.6 && ldz < 2.5) {
              obj.destroyed = true;
              obj.mesh.position.z = 999;
              hitObstacle = true;
              localObstaclesCount++;
              setObstaclesOvercome(localObstaclesCount);
              localScore += 600;

              // Check Level Progression Stunt: blast
              registerStuntAchievement('blast');

              soundEngine.playExplosion();
              setStuntPopup('💥 OBSTACLE VAPORIZED! +600 PTS');
              setTimeout(() => setStuntPopup(null), 1200);
            }
          }
        });

        if (hitObstacle || bolt.z < -140) {
          scene.remove(bolt.mesh);
          laserBolts.splice(lIdx, 1);
        }
      }

      // 5. Track Objects Check & FATAL CRASH / LOSE COLLISION LOGIC
      let detectedRampZone = false;

      for (let i = 0; i < trackObjects.length; i++) {
        const obj = trackObjects[i];
        let objTravel = forwardTravel;
        if (obj.type === 'traffic' && obj.speed) {
          objTravel -= obj.speed * 5 * delta;
        }
        obj.mesh.position.z += objTravel;

        if (obj.type === 'diamond') {
          obj.mesh.rotation.y += delta * 3;
        }

        const dx = Math.abs(carX - obj.mesh.position.x);
        const dz = Math.abs(0 - obj.mesh.position.z);

        if (obj.type === 'ramp' && dz < 4.5 && dx < 2.6) {
          detectedRampZone = true;
        }

        if (dz < 2.2 && dx < 2.0 && !obj.destroyed) {
          if (obj.type === 'boost') {
            currentSpeed = Math.min(150, currentSpeed + 35); // capped strictly at 150 km/h!
            localNitro = Math.min(100, localNitro + 25);
            localScore += 500;
            soundEngine.playNitroBoost();
            setStuntPopup('CYAN BOOST PAD! +500 PTS');
            setTimeout(() => setStuntPopup(null), 1200);
          } else if (obj.type === 'diamond') {
            localDiamonds += 10;
            localScore += 250;
            soundEngine.playCoinPickup();
            obj.mesh.position.z = 999;
          } else if (obj.type === 'traffic' || obj.type === 'barrier') {
            if (inAir && carY > 0.95) {
              localObstaclesCount++;
              setObstaclesOvercome(localObstaclesCount);
              localScore += 750;
              soundEngine.playStuntSuccess();
              registerStuntAchievement('jump');
              setStuntPopup('🚀 JUMPED OVER OBSTACLE! +750 PTS');
              setTimeout(() => setStuntPopup(null), 1200);
              obj.destroyed = true;
            } else if (localShieldActive) {
              localObstaclesCount++;
              setObstaclesOvercome(localObstaclesCount);
              localScore += 500;
              soundEngine.playExplosion();
              registerStuntAchievement('shield');
              setStuntPopup('⚡ SHIELD RAM CRUSH! +500 PTS');
              setTimeout(() => setStuntPopup(null), 1200);
              obj.destroyed = true;
              obj.mesh.position.z = 999;
            } else {
              // DIRECT COLLISION -> PLAYER LOSES!
              if (dx < 1.35) {
                const causeName =
                  obj.type === 'traffic'
                    ? 'Civilian Highway Traffic Vehicle'
                    : 'Concrete Jersey Hazard Barrier';
                triggerCrashLose(causeName);
                return;
              } else {
                // Near Miss Weave
                localScore += 350;
                soundEngine.playNearMiss();
                registerStuntAchievement('weave');
                if (currentSpeed >= 130) {
                  registerStuntAchievement('speed_weave');
                }
                setStuntPopup('⚡ NEAR MISS WEAVE! +350 PTS');
                setTimeout(() => setStuntPopup(null), 1000);
              }
            }
          }
        }

        if (obj.mesh.position.z > 25) {
          obj.destroyed = false;
          obj.mesh.position.z = -250 - Math.random() * 80;
          obj.mesh.position.x = initialLanes[Math.floor(Math.random() * initialLanes.length)];
        }
      }

      onRampZone = detectedRampZone;
      setIsNearRamp(detectedRampZone);

      renderer.render(scene, camera);
    };

    reqId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(reqId);
      clearInterval(clockInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modeId, car, selectedMode, runKey]);

  // Touch Handlers
  const handleTouchThrottle = (down: boolean) => {
    keysRef.current.throttle = down;
    setActiveKeys((prev) => ({ ...prev, w: down }));
  };

  const handleTouchBrake = (down: boolean) => {
    keysRef.current.brake = down;
    setActiveKeys((prev) => ({ ...prev, s: down }));
  };

  const handleTouchSteer = (dir: 'left' | 'right', down: boolean) => {
    if (dir === 'left') {
      keysRef.current.left = down;
      setActiveKeys((prev) => ({ ...prev, a: down }));
    } else {
      keysRef.current.right = down;
      setActiveKeys((prev) => ({ ...prev, d: down }));
    }
  };

  const handleTouchNitro = (down: boolean) => {
    keysRef.current.nitro = down;
    setActiveKeys((prev) => ({ ...prev, shift: down }));
  };

  const handleTouchJump = () => {
    const event = new KeyboardEvent('keydown', { key: 'j' });
    window.dispatchEvent(event);
  };

  const handleTouchBlast = () => {
    const event = new KeyboardEvent('keydown', { key: 'k' });
    window.dispatchEvent(event);
  };

  const handleTouchShield = () => {
    const event = new KeyboardEvent('keydown', { key: 'l' });
    window.dispatchEvent(event);
  };

  const handleTryAgain = () => {
    setRunKey((k) => k + 1);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#120622] overflow-hidden select-none font-body">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Retro Scanline effect */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-40"></div>

      {/* Red screen flash vignette on crash loss */}
      {isLost && (
        <div className="absolute inset-0 pointer-events-none bg-red-950/40 border-8 border-red-600 animate-pulse z-40"></div>
      )}

      {/* Top HUD Telemetry Overlay */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-4 z-20 flex items-start justify-between pointer-events-none">
        {/* Left: Speedometer, Settled Gear & 150 KM/H Limit Readout */}
        <div className="bg-[#120622]/85 backdrop-blur-md border border-[#00eefc]/40 rounded-xl p-2.5 sm:p-3 pointer-events-auto shadow-[0_0_20px_rgba(0,238,252,0.3)]">
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl sm:text-4xl text-white font-extrabold tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(0,238,252,0.8)]">
              {speed}
            </span>
            <span className="font-mono-data text-xs text-[#00eefc] font-bold">KM/H</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono-data text-[10px] font-bold border border-emerald-400/40">
              MAX 150
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#2e1d44] text-amber-300 font-mono-data text-xs font-bold border border-amber-300/40">
              GEAR {gear}
            </span>
            {turnSignal !== 'none' && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono-data text-[10px] font-bold border border-amber-400 animate-pulse">
                {turnSignal === 'left' ? '◄ TURN' : 'TURN ►'}
              </span>
            )}
          </div>

          {/* RPM Tachometer Bar */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[9px] font-mono-data text-[#e5bcc5]">RPM</span>
            <div className="flex-1 h-1.5 bg-[#2e1d44] rounded overflow-hidden flex w-28 sm:w-36">
              <div
                className={`h-full transition-all duration-75 ${
                  speed >= 145 ? 'bg-[#ff4a8d]' : 'bg-[#00eefc]'
                }`}
                style={{ width: `${Math.min(100, (speed / 150) * 100)}%` }}
              ></div>
            </div>
            <span className="text-[9px] font-mono-data text-white tabular-nums">
              {rpm}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono-data text-[#e5bcc5] mt-1">
            <span>OBSTACLES: <b className="text-emerald-400">{obstaclesOvercome}</b></span>
            <button
              onClick={() => setShowControlsHelp(!showControlsHelp)}
              className="text-[#00eefc] underline cursor-pointer ml-2"
            >
              Controls
            </button>
          </div>
        </div>

        {/* Center: SHORT, EASY LEVEL PROGRESSION & STUNT QUEST HUD */}
        <div className="flex flex-col items-center max-w-sm">
          {/* Level Progress Banner */}
          <div className="bg-[#1e0f33]/95 border-2 border-[#fde047] px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(253,224,71,0.5)] flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-[#fde047] text-black font-mono-data text-[11px] font-extrabold uppercase">
              LEVEL {activeLevelDef.levelNumber}
            </span>
            <div className="text-left">
              <div className="font-mono-data text-xs text-[#fde047] font-extrabold">
                {activeLevelDef.title}: {activeLevelDef.stuntRequirement}
              </div>
              <div className="text-[9px] font-mono-data text-[#e5bcc5]">
                Progress: <b className="text-white">{levelProgress}/{activeLevelDef.targetCount}</b> · Reward: <b className="text-[#00eefc]">+{activeLevelDef.rewardDiamonds} 💎</b>
              </div>
            </div>
          </div>

          {/* Quick Tip for current level */}
          <div className="text-[10px] font-mono-data text-[#00eefc] mt-1 bg-[#120622]/80 px-2.5 py-0.5 rounded border border-[#00eefc]/30">
            💡 {activeLevelDef.hint}
          </div>

          {/* Level Up Announcement Popup */}
          {levelUpPopup && (
            <div className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fde047] via-[#00eefc] to-[#ff4a8d] text-black font-headline text-sm font-extrabold uppercase tracking-wide animate-bounce shadow-[0_0_35px_#fde047] -skew-x-3 text-center">
              {levelUpPopup}
            </div>
          )}

          {/* Mega Ramp Notice - gamer decides whether to jump! */}
          {isNearRamp && !isAirborne && (
            <div className="mt-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#ff4a8d] text-black font-headline text-xs font-extrabold uppercase tracking-wide animate-pulse shadow-[0_0_20px_#d97706]">
              ⚡ MEGA RAMP! PRESS [SPACE] OR [J] TO LAUNCH!
            </div>
          )}

          {/* Stunt Popups */}
          {stuntPopup && (
            <div className="mt-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#ff4a8d] to-[#fde047] text-black font-headline text-xs font-extrabold uppercase tracking-wider animate-bounce shadow-[0_0_25px_rgba(255,74,141,0.8)] -skew-x-6">
              {stuntPopup}
            </div>
          )}

          {isAirborne && (
            <div className="mt-2 px-3 py-1 rounded bg-[#00eefc] text-black font-mono-data text-xs font-bold animate-pulse">
              AIRBORNE! PRESS [Q] / [E] FOR 360 ROLL!
            </div>
          )}

          {shieldActive && (
            <div className="mt-2 px-3 py-1 rounded bg-[#ff4a8d] text-white font-mono-data text-xs font-bold animate-pulse shadow-[0_0_15px_#ff4a8d]">
              DEFLECTOR SHIELD ACTIVE: RAM OBSTACLES!
            </div>
          )}
        </div>

        {/* Right: Score, Level Indicator & Exit */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="bg-[#120622]/85 backdrop-blur-md border border-[#ff4a8d]/40 rounded-xl p-2.5 sm:p-3 text-right shadow-[0_0_20px_rgba(255,74,141,0.3)]">
            <span className="font-mono-data text-[9px] text-[#e5bcc5] uppercase block font-bold">
              Arcade Score
            </span>
            <span className="font-headline text-xl sm:text-2xl text-[#ffb1c4] font-extrabold tabular-nums tracking-wide">
              {score.toLocaleString()}
            </span>
            <div className="flex items-center justify-end gap-2 text-[10px] font-mono-data text-[#d3fbff] mt-0.5">
              <span>TRICKS: {stuntsLanded}</span>
              <span>·</span>
              <span className="text-[#fde047]">TIME: {timeLeft}s</span>
            </div>
          </div>

          <button
            onClick={onExitGame}
            className="px-3 py-1.5 rounded-lg bg-[#2e1d44]/90 hover:bg-[#ff4a8d] text-white border border-[#ff4a8d]/40 font-mono-data text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            ✕ Exit Run
          </button>
        </div>
      </div>

      {/* Interactive Gamer's Control Deck (Keyboard HUD Indicator) */}
      <div className="absolute top-20 left-3 z-20 pointer-events-auto">
        <div className="bg-[#120622]/85 backdrop-blur-md border border-[#3c2e50] rounded-xl p-2.5 shadow-lg max-w-[280px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono-data text-[9px] text-[#00eefc] uppercase tracking-wider font-bold">
              Keyboard Controls
            </span>
            <span className="text-[8px] font-mono-data text-emerald-400 font-bold">
              SPEED CAP: 150 KM/H
            </span>
          </div>

          {/* Speed Controls: W (Throttle) & S (Brake) */}
          <div className="grid grid-cols-2 gap-1.5 mb-2 font-mono-data text-[10px]">
            <div
              className={`p-1 rounded border text-center transition-all ${
                activeKeys.w
                  ? 'bg-emerald-500 text-black border-white shadow-[0_0_10px_#10b981] scale-105'
                  : 'bg-[#211234] text-[#d3fbff] border-[#00eefc]/30'
              }`}
            >
              <b className="block">[W] / [↑]</b>
              <span className="text-[8px] uppercase">Gas (120 KM/H)</span>
            </div>
            <div
              className={`p-1 rounded border text-center transition-all ${
                activeKeys.s
                  ? 'bg-rose-500 text-white border-white shadow-[0_0_10px_#f43f5e] scale-105'
                  : 'bg-[#211234] text-[#ffb1c4] border-[#ff4a8d]/30'
              }`}
            >
              <b className="block">[S] / [↓]</b>
              <span className="text-[8px] uppercase">Brake / Stop</span>
            </div>
          </div>

          {/* Steer & Nitro */}
          <div className="grid grid-cols-3 gap-1 mb-2 font-mono-data text-[9px]">
            <div
              className={`p-1 rounded border text-center ${
                activeKeys.a
                  ? 'bg-[#00eefc] text-black border-white'
                  : 'bg-[#1b0d2d] text-[#e5bcc5] border-[#3c2e50]'
              }`}
            >
              <b>[A] / [←]</b>
              <span className="block text-[7px]">Steer L</span>
            </div>
            <div
              className={`p-1 rounded border text-center ${
                activeKeys.shift
                  ? 'bg-[#ff4a8d] text-white border-white shadow-[0_0_10px_#ff4a8d]'
                  : 'bg-[#1b0d2d] text-[#ffb1c4] border-[#ff4a8d]/30'
              }`}
            >
              <b>[SHIFT]</b>
              <span className="block text-[7px]">Nitro (150)</span>
            </div>
            <div
              className={`p-1 rounded border text-center ${
                activeKeys.d
                  ? 'bg-[#00eefc] text-black border-white'
                  : 'bg-[#1b0d2d] text-[#e5bcc5] border-[#3c2e50]'
              }`}
            >
              <b>[D] / [→]</b>
              <span className="block text-[7px]">Steer R</span>
            </div>
          </div>

          {/* Jump & Combat Keys: J / SPACE (Jump), K (Laser Blast), L (Ram Shield) */}
          <span className="font-mono-data text-[8px] text-[#fde047] uppercase tracking-wider block font-bold mb-1">
            Jump &amp; Combat Keys:
          </span>
          <div className="grid grid-cols-3 gap-1 font-mono-data text-[9px]">
            <button
              onClick={handleTouchJump}
              className={`p-1 rounded border text-center transition-all cursor-pointer ${
                activeKeys.space || activeKeys.j
                  ? 'bg-[#fde047] text-black border-white shadow-[0_0_10px_#fde047] scale-105'
                  : 'bg-[#1b0d2d] text-[#fde047] border-[#fde047]/40 hover:bg-[#2e1d44]'
              }`}
            >
              <b>[SPACE]/[J]</b>
              <span className="block text-[7px]">Jump Leap</span>
            </button>
            <button
              onClick={handleTouchBlast}
              className={`p-1 rounded border text-center transition-all cursor-pointer ${
                activeKeys.k
                  ? 'bg-fuchsia-500 text-white border-white shadow-[0_0_10px_#d946ef]'
                  : 'bg-[#1b0d2d] text-fuchsia-300 border-fuchsia-500/40 hover:bg-[#2e1d44]'
              }`}
            >
              <b>[K] / [X]</b>
              <span className="block text-[7px]">Blaster</span>
            </button>
            <button
              onClick={handleTouchShield}
              className={`p-1 rounded border text-center transition-all cursor-pointer ${
                activeKeys.l || shieldActive
                  ? 'bg-[#00eefc] text-black border-white shadow-[0_0_10px_#00eefc]'
                  : 'bg-[#1b0d2d] text-[#00eefc] border-[#00eefc]/40 hover:bg-[#2e1d44]'
              }`}
            >
              <b>[L] / [C]</b>
              <span className="block text-[7px]">Ram Shield</span>
            </button>
          </div>
        </div>
      </div>

      {/* Energy & Nitro Meters */}
      <div className="absolute bottom-28 inset-x-4 max-w-md mx-auto z-20 pointer-events-none space-y-1.5">
        {/* Nitro Meter */}
        <div className="flex items-center justify-between text-[11px] font-mono-data font-bold">
          <span className="text-[#ff4a8d] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm material-symbols-filled">
              local_fire_department
            </span>
            NITRO BOOST [SHIFT] (MAX 150 KM/H)
          </span>
          <span className="text-[#ffb1c4]">{nitroFuel}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#120622]/80 border border-[#ff4a8d]/50 p-0.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              isNitroActive
                ? 'bg-gradient-to-r from-[#ff4a8d] via-white to-[#00eefc] shadow-[0_0_12px_#ff4a8d]'
                : 'bg-gradient-to-r from-[#ff4a8d] to-[#fde047]'
            }`}
            style={{ width: `${nitroFuel}%` }}
          ></div>
        </div>

        {/* Blaster Weapon Energy */}
        <div className="flex items-center justify-between text-[11px] font-mono-data font-bold pt-0.5">
          <span className="text-fuchsia-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">bolt</span>
            OBSTACLE BLASTER [K]
          </span>
          <span className="text-fuchsia-300">{blasterEnergy}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#120622]/80 border border-fuchsia-500/50 p-0.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-500 to-[#00eefc] rounded-full transition-all duration-100"
            style={{ width: `${blasterEnergy}%` }}
          ></div>
        </div>
      </div>

      {/* On-Screen Touch Controls (Mobile Friendly) */}
      <div className="absolute bottom-3 inset-x-3 z-30 flex items-end justify-between pointer-events-none">
        {/* Left Side: Steering */}
        <div className="flex gap-2 pointer-events-auto">
          <button
            onPointerDown={() => handleTouchSteer('left', true)}
            onPointerUp={() => handleTouchSteer('left', false)}
            onPointerLeave={() => handleTouchSteer('left', false)}
            className="w-16 h-16 rounded-2xl bg-[#211234]/80 backdrop-blur-md border border-[#00eefc]/50 active:bg-[#00eefc] active:text-black text-[#00eefc] flex items-center justify-center shadow-[0_0_15px_rgba(0,238,252,0.3)] transition-transform active:scale-95 touch-none"
          >
            <span className="material-symbols-outlined text-3xl">arrow_back</span>
          </button>
          <button
            onPointerDown={() => handleTouchSteer('right', true)}
            onPointerUp={() => handleTouchSteer('right', false)}
            onPointerLeave={() => handleTouchSteer('right', false)}
            className="w-16 h-16 rounded-2xl bg-[#211234]/80 backdrop-blur-md border border-[#00eefc]/50 active:bg-[#00eefc] active:text-black text-[#00eefc] flex items-center justify-center shadow-[0_0_15px_rgba(0,238,252,0.3)] transition-transform active:scale-95 touch-none"
          >
            <span className="material-symbols-outlined text-3xl">arrow_forward</span>
          </button>
        </div>

        {/* Center: Obstacle Defense Actions (Jump, Blaster, Shield) */}
        <div className="flex gap-1.5 pointer-events-auto">
          <button
            onClick={handleTouchJump}
            className={`w-14 h-14 rounded-2xl font-headline text-[10px] font-extrabold flex flex-col items-center justify-center shadow-[0_0_15px_#fde047] active:scale-95 transition-all ${
              isNearRamp
                ? 'bg-gradient-to-r from-[#fde047] to-[#ff4a8d] text-black animate-bounce ring-2 ring-white'
                : 'bg-[#fde047]/90 text-black'
            }`}
            title="Jump Leap Over Obstacle [SPACE] / [J]"
          >
            <span className="material-symbols-outlined text-xl">flight_takeoff</span>
            JUMP
          </button>
          <button
            onClick={handleTouchBlast}
            className="w-14 h-14 rounded-2xl bg-fuchsia-600/90 text-white font-headline text-[10px] font-extrabold flex flex-col items-center justify-center shadow-[0_0_15px_#d946ef] active:scale-95"
            title="Vaporize Obstacle Laser [K]"
          >
            <span className="material-symbols-outlined text-xl">flash_on</span>
            BLAST
          </button>
          <button
            onClick={handleTouchShield}
            className="w-14 h-14 rounded-2xl bg-[#00eefc]/90 text-black font-headline text-[10px] font-extrabold flex flex-col items-center justify-center shadow-[0_0_15px_#00eefc] active:scale-95"
            title="Ram Shield Deflector [L]"
          >
            <span className="material-symbols-outlined text-xl">shield</span>
            RAM
          </button>
        </div>

        {/* Right Side: Throttle & Brake Pedals (Gamer's Speed Control) */}
        <div className="flex gap-2 pointer-events-auto">
          {/* Brake Pedal [S] */}
          <button
            onPointerDown={() => handleTouchBrake(true)}
            onPointerUp={() => handleTouchBrake(false)}
            onPointerLeave={() => handleTouchBrake(false)}
            className="w-16 h-16 rounded-2xl bg-rose-600/80 active:bg-rose-500 text-white border border-rose-400 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-transform active:scale-95 touch-none"
          >
            <span className="material-symbols-outlined text-2xl">pan_tool</span>
            <span className="font-mono-data text-[9px] font-bold">BRAKE</span>
          </button>

          {/* Gas Throttle Pedal [W] */}
          <button
            onPointerDown={() => handleTouchThrottle(true)}
            onPointerUp={() => handleTouchThrottle(false)}
            onPointerLeave={() => handleTouchThrottle(false)}
            className="w-16 h-16 rounded-2xl bg-emerald-600/80 active:bg-emerald-500 text-white border border-emerald-400 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-transform active:scale-95 touch-none"
          >
            <span className="material-symbols-outlined text-2xl">speed</span>
            <span className="font-mono-data text-[9px] font-bold">GAS [W]</span>
          </button>

          {/* Nitro Overdrive Blast [SHIFT] */}
          <button
            onPointerDown={() => handleTouchNitro(true)}
            onPointerUp={() => handleTouchNitro(false)}
            onPointerLeave={() => handleTouchNitro(false)}
            className="w-14 h-16 rounded-2xl bg-[#ff4a8d] active:bg-white active:text-black text-white border border-white/40 flex flex-col items-center justify-center shadow-[0_0_15px_#ff4a8d] transition-transform active:scale-95 touch-none"
          >
            <span className="material-symbols-outlined text-xl material-symbols-filled">
              local_fire_department
            </span>
            <span className="font-mono-data text-[8px] font-bold">NITRO</span>
          </button>
        </div>
      </div>

      {/* GAME OVER MODAL: Supports BOTH "YOU LOSE" (Crash) AND "VICTORY LAP" (Survived) */}
      {isGameOver && gameOverStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          {isLost ? (
            /* DEFEAT / CRASH: PLAYER HAS LOST */
            <div className="bg-[#210814] border-2 border-rose-500 rounded-3xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(244,63,94,0.7)] text-center">
              <span className="px-3 py-1 rounded bg-rose-600 text-white font-mono-data text-[10px] font-bold uppercase tracking-widest shadow-[0_0_12px_#f43f5e]">
                CRITICAL COLLISION
              </span>

              <h3 className="font-headline text-3xl font-extrabold text-rose-400 uppercase tracking-wider mt-3 mb-1 drop-shadow-[0_0_15px_rgba(244,63,94,0.9)] -skew-x-3">
                YOU LOSE!
              </h3>
              <p className="font-body text-xs text-[#ffb4ab] mb-4">
                Wrecked by: <b className="text-white">{crashCause}</b>
              </p>

              <div className="bg-[#14040a] rounded-2xl p-4 border border-rose-900/60 space-y-2.5 font-mono-data text-xs mb-5 text-left">
                <div className="flex justify-between">
                  <span className="text-[#e5bcc5]">Score Before Crash:</span>
                  <span className="text-rose-400 font-bold">
                    {gameOverStats.score.toLocaleString()} PTS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e5bcc5]">Level Reached:</span>
                  <span className="text-[#fde047] font-bold">
                    LEVEL {gameOverStats.finalLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e5bcc5]">Obstacles Cleared:</span>
                  <span className="text-emerald-400 font-bold">
                    {gameOverStats.obstacles} Passed
                  </span>
                </div>
                <div className="text-[11px] text-[#e5bcc5] pt-2 border-t border-rose-900/60 italic">
                  💡 Tip: Press <b className="text-[#fde047]">[SPACE] / [J]</b> to leap over obstacles, or <b className="text-fuchsia-400">[K]</b> to blast them!
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onExitGame}
                  className="flex-1 py-3 rounded-xl bg-[#2e1d44] hover:bg-[#3c2e50] text-[#e5bcc5] font-headline text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Lobby
                </button>
                <button
                  onClick={handleTryAgain}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-[#ff4a8d] text-white font-headline text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.6)] cursor-pointer active:scale-95 transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            /* VICTORY LAP: SURVIVED THE CLOCK */
            <div className="bg-[#1e0f33] border-2 border-[#00eefc] rounded-3xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(0,238,252,0.6)] text-center">
              <span className="px-3 py-1 rounded bg-[#ff4a8d] text-white font-mono-data text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_#ff4a8d]">
                RUN COMPLETE
              </span>

              <h3 className="font-headline text-3xl font-extrabold text-white uppercase tracking-wider mt-3 mb-1 drop-shadow-[0_0_12px_rgba(0,238,252,0.8)] -skew-x-3">
                VICTORY LAP
              </h3>
              <p className="font-body text-xs text-[#e5bcc5] mb-4">
                Telemetry recorded without crashing!
              </p>

              <div className="bg-[#120622] rounded-2xl p-4 border border-[#3c2e50] space-y-2.5 font-mono-data text-xs mb-5">
                <div className="flex justify-between">
                  <span className="text-[#e5bcc5]">Final Score:</span>
                  <span className="text-[#00eefc] font-bold text-sm">
                    {gameOverStats.score.toLocaleString()} PTS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e5bcc5]">Career Level Reached:</span>
                  <span className="text-[#fde047] font-bold">
                    LEVEL {gameOverStats.finalLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e5bcc5]">Obstacles Overcome:</span>
                  <span className="text-emerald-400 font-bold">
                    {gameOverStats.obstacles} Blasted / Jumped
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e5bcc5]">Stunts Landed:</span>
                  <span className="text-[#fde047] font-bold">
                    {gameOverStats.stunts} Air Tricks
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#3c2e50]">
                  <span className="text-[#e5bcc5]">Reward Loot:</span>
                  <span className="text-emerald-400 font-bold">
                    +{gameOverStats.diamonds} 💎 &amp; +15 🔥
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onExitGame}
                  className="flex-1 py-3 rounded-xl bg-[#2e1d44] hover:bg-[#3c2e50] text-[#e5bcc5] font-headline text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Return to Lobby
                </button>
                <button
                  onClick={() => {
                    onFinishRun({
                      score: gameOverStats.score,
                      diamondsEarned: gameOverStats.diamonds,
                      stuntsCompleted: gameOverStats.stunts,
                      topSpeed: gameOverStats.topSpeed,
                      modeId,
                    });
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00eefc] to-[#ff4a8d] text-white font-headline text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,238,252,0.6)] cursor-pointer active:scale-95"
                >
                  Bank Rewards
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
