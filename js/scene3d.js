(function initIglooScene() {
  const canvas = document.getElementById('webglScene');
  if (!canvas || typeof THREE === 'undefined') return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070c, 0.048);

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, isMobile ? 11.5 : 9.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));

  // ILUMINAÇÃO PARA REALÇAR O METAL DA KUNAI
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
  scene.add(ambientLight);

  const redRimLight = new THREE.PointLight(0xef4444, 18, 25);
  redRimLight.position.set(3, 2, 4);
  scene.add(redRimLight);

  const coolRimLight = new THREE.PointLight(0x6366f1, 12, 25);
  coolRimLight.position.set(-4, -2, 3);
  scene.add(coolRimLight);

  // ==========================================
  // 1. KUNAI SHINOBI 3D (CONSTRUÇÃO GEOMÉTRICA)
  // ==========================================
  function createShinobiKunai() {
    const kunai = new THREE.Group();

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.88,
      roughness: 0.22,
      emissive: 0x1e293b,
      emissiveIntensity: 0.25
    });

    const edgeGlowMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });

    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.3,
      roughness: 0.8
    });

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.9,
      roughness: 0.2
    });

    // Ponta frontal da lâmina (losango afiado)
    const tipGeo = new THREE.ConeGeometry(0.32, 1.35, 4);
    tipGeo.scale(1, 1, 0.26);
    const tipMesh = new THREE.Mesh(tipGeo, bladeMat);
    tipMesh.position.y = 1.15;
    kunai.add(tipMesh);

    const tipWire = new THREE.Mesh(tipGeo, edgeGlowMat);
    tipWire.position.y = 1.15;
    tipWire.scale.setScalar(1.03);
    kunai.add(tipWire);

    // Base invertida da lâmina
    const baseGeo = new THREE.ConeGeometry(0.32, 0.55, 4);
    baseGeo.scale(1, 1, 0.26);
    const baseMesh = new THREE.Mesh(baseGeo, bladeMat);
    baseMesh.rotation.z = Math.PI;
    baseMesh.position.y = 0.2;
    kunai.add(baseMesh);

    // Guarda metálica
    const guardGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.12, 12);
    const guardMesh = new THREE.Mesh(guardGeo, ringMat);
    guardMesh.position.y = -0.1;
    kunai.add(guardMesh);

    // Cabo / Empunhadura
    const handleGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.95, 12);
    const handleMesh = new THREE.Mesh(handleGeo, gripMat);
    handleMesh.position.y = -0.62;
    kunai.add(handleMesh);

    // Detalhes de bandagem no cabo
    for (let i = 0; i < 4; i++) {
      const wrapGeo = new THREE.TorusGeometry(0.086, 0.014, 6, 16);
      const wrap = new THREE.Mesh(wrapGeo, ringMat);
      wrap.rotation.x = Math.PI / 2 + 0.18;
      wrap.position.y = -0.32 - i * 0.2;
      kunai.add(wrap);
    }

    // Anel clássico na extremidade do cabo
    const pommelGeo = new THREE.TorusGeometry(0.18, 0.032, 10, 28);
    const pommelMesh = new THREE.Mesh(pommelGeo, ringMat);
    pommelMesh.position.y = -1.24;
    kunai.add(pommelMesh);

    return kunai;
  }

  const kunaiGroup = createShinobiKunai();
  kunaiGroup.scale.setScalar(isMobile ? 0.85 : 1.08);
  scene.add(kunaiGroup);

  // ==========================================
  // 2. NÚCLEO CENTRAL & ANÉIS ORBITAIS (PARALLAX)
  // ==========================================
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const geoOuter = new THREE.IcosahedronGeometry(2.35, isMobile ? 1 : 2);
  const matWire = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });
  const outerCrystal = new THREE.Mesh(geoOuter, matWire);
  coreGroup.add(outerCrystal);

  const geoInner = new THREE.OctahedronGeometry(1.35, 1);
  const matInner = new THREE.MeshBasicMaterial({
    color: 0x6366f1,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  const innerCrystal = new THREE.Mesh(geoInner, matInner);
  coreGroup.add(innerCrystal);

  const ringsGroup = new THREE.Group();
  scene.add(ringsGroup);

  const ringGeo = new THREE.TorusGeometry(3.4, 0.014, 8, isMobile ? 64 : 120);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.24
  });
  const orbitalRing1 = new THREE.Mesh(ringGeo, ringMat);
  orbitalRing1.rotation.x = Math.PI * 0.36;
  ringsGroup.add(orbitalRing1);

  const orbitalRing2 = new THREE.Mesh(ringGeo, ringMat);
  orbitalRing2.rotation.y = Math.PI * 0.28;
  orbitalRing2.scale.setScalar(1.25);
  ringsGroup.add(orbitalRing2);

  // GRADE CIBERNÉTICA DE PROFUNDIDADE
  const gridHelper = new THREE.GridHelper(36, 36, 0xef4444, 0x1e293b);
  gridHelper.position.y = -4.2;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.15;
  scene.add(gridHelper);

  // CAMPO DE PARTÍCULAS PROFUNDAS
  const particleCount = isMobile ? 360 : 880;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 30;
    positions[i + 1] = (Math.random() - 0.5) * 34;
    positions[i + 2] = (Math.random() - 0.5) * 24;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xe2e8f0,
    size: isMobile ? 0.06 : 0.048,
    transparent: true,
    opacity: 0.6
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // PONTEIRO (Mouse / Touch)
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  function updatePointer(clientX, clientY) {
    pointer.targetX = (clientX / window.innerWidth) * 2 - 1;
    pointer.targetY = -(clientY / window.innerHeight) * 2 + 1;
  }

  window.addEventListener('pointermove', (e) => updatePointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  // ESTÁGIOS DA CÂMERA E DA KUNAI POR SEÇÃO
  const stagePresets = [
    // 01: Hero (Kunai em destaque flutuando próxima ao retrato)
    {
      camX: 0, camY: 0, camZ: isMobile ? 11.5 : 9.2, scale: 1.0, color: 0xef4444,
      kunaiX: isMobile ? 1.5 : 0.45, kunaiY: isMobile ? 2.1 : 1.45, kunaiZ: 2.4,
      kunaiRotZ: -0.68, kunaiRotX: 0.25
    },
    // 02: Projetos (Kunai cruza para a esquerda apontando para os projetos)
    {
      camX: isMobile ? 0 : -2.1, camY: 0.4, camZ: isMobile ? 10.2 : 7.8, scale: 1.15, color: 0xf97316,
      kunaiX: isMobile ? -1.6 : -3.4, kunaiY: 0.6, kunaiZ: 2.0,
      kunaiRotZ: -2.25, kunaiRotX: -0.3
    },
    // 03: Arquitetura (Kunai sobe em órbita na direita)
    {
      camX: isMobile ? 0 : 2.0, camY: -0.3, camZ: isMobile ? 10.5 : 8.2, scale: 0.95, color: 0x6366f1,
      kunaiX: isMobile ? 1.6 : 3.3, kunaiY: -0.4, kunaiZ: 2.2,
      kunaiRotZ: 0.72, kunaiRotX: 0.35
    },
    // 04: Contato (Kunai centraliza em guarda final)
    {
      camX: 0, camY: 0.2, camZ: isMobile ? 9.6 : 7.2, scale: 1.25, color: 0xef4444,
      kunaiX: 0, kunaiY: isMobile ? 2.2 : 1.85, kunaiZ: 2.6,
      kunaiRotZ: Math.PI, kunaiRotX: 0.15
    }
  ];

  let targetScroll = 0;
  let smoothScroll = 0;

  window.SceneController = {
    setScrollProgress(p) {
      targetScroll = Math.min(Math.max(p, 0), 1);
    }
  };

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  const targetColor = new THREE.Color(0xef4444);

  let isTabActive = true;
  document.addEventListener('visibilitychange', () => {
    isTabActive = !document.hidden;
  });

  function animate() {
    requestAnimationFrame(animate);
    if (!isTabActive) return;

    const elapsed = clock.getElapsedTime();

    smoothScroll += (targetScroll - smoothScroll) * 0.075;
    const scrollVelocity = targetScroll - smoothScroll;

    pointer.x += (pointer.targetX - pointer.x) * 0.05;
    pointer.y += (pointer.targetY - pointer.y) * 0.05;

    const scaled = smoothScroll * (stagePresets.length - 1);
    const idx = Math.floor(scaled);
    const nextIdx = Math.min(idx + 1, stagePresets.length - 1);
    const t = scaled - idx;

    const current = stagePresets[idx];
    const next = stagePresets[nextIdx];

    const goalX = THREE.MathUtils.lerp(current.camX, next.camX, t) + pointer.x * 0.7;
    const goalY = THREE.MathUtils.lerp(current.camY, next.camY, t) + pointer.y * 0.5;
    const goalZ = THREE.MathUtils.lerp(current.camZ, next.camZ, t);

    camera.position.x += (goalX - camera.position.x) * 0.06;
    camera.position.y += (goalY - camera.position.y) * 0.06;
    camera.position.z += (goalZ - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);

    // MOVIMENTO & GIRO DA KUNAI COM O SCROLL E MOUSE
    const goalKunaiX = THREE.MathUtils.lerp(current.kunaiX, next.kunaiX, t) + pointer.x * 0.45;
    const goalKunaiY = THREE.MathUtils.lerp(current.kunaiY, next.kunaiY, t) + Math.sin(elapsed * 2.2) * 0.14 + pointer.y * 0.35;
    const goalKunaiZ = THREE.MathUtils.lerp(current.kunaiZ, next.kunaiZ, t);

    kunaiGroup.position.x += (goalKunaiX - kunaiGroup.position.x) * 0.07;
    kunaiGroup.position.y += (goalKunaiY - kunaiGroup.position.y) * 0.07;
    kunaiGroup.position.z += (goalKunaiZ - kunaiGroup.position.z) * 0.07;

    if (!prefersReducedMotion) {
      const goalRotZ = THREE.MathUtils.lerp(current.kunaiRotZ, next.kunaiRotZ, t);
      const goalRotX = THREE.MathUtils.lerp(current.kunaiRotX, next.kunaiRotX, t) + pointer.y * 0.3;
      kunaiGroup.rotation.z += (goalRotZ - kunaiGroup.rotation.z) * 0.07;
      kunaiGroup.rotation.x += (goalRotX - kunaiGroup.rotation.x) * 0.07;
      // Gira no próprio eixo Y conforme a velocidade do scroll (efeito arremesso)
      kunaiGroup.rotation.y = elapsed * 1.4 + smoothScroll * Math.PI * 6;
    }

    // EFEITO PARALLAX MULTI-CAMADA
    if (!prefersReducedMotion) {
      particles.position.y = (smoothScroll - 0.5) * 4.5;
      coreGroup.position.y = (smoothScroll - 0.5) * 1.7;
      coreGroup.rotation.x = scrollVelocity * 2.2;
      ringsGroup.position.y = (smoothScroll - 0.5) * 2.9;
      ringsGroup.rotation.z = elapsed * 0.12 + smoothScroll * 1.8;
      gridHelper.position.z = (smoothScroll * 6) % 1;
      gridHelper.position.y = -4.2 + smoothScroll * 1.4;
    }

    const goalScale = THREE.MathUtils.lerp(current.scale, next.scale, t);
    coreGroup.scale.lerp(new THREE.Vector3(goalScale, goalScale, goalScale), 0.06);

    targetColor.setHex(t < 0.5 ? current.color : next.color);
    matWire.color.lerp(targetColor, 0.05);
    redRimLight.color.lerp(targetColor, 0.05);

    if (!prefersReducedMotion) {
      outerCrystal.rotation.y = elapsed * 0.14 + smoothScroll * 2.6;
      outerCrystal.rotation.x += elapsed * 0.0005;
      innerCrystal.rotation.y = -elapsed * 0.22 - smoothScroll * 1.5;
      orbitalRing2.rotation.x = -elapsed * 0.1;
      particles.rotation.y = elapsed * 0.025 + pointer.x * 0.08;
    }

    renderer.render(scene, camera);
  }

  animate();
})();