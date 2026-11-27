(function initIglooScene() {
  const canvas = document.getElementById('webglScene');
  if (!canvas || typeof THREE === 'undefined') return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070c, 0.05);

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

  // CAMADA 1: NÚCLEO CENTRAL (Plano Médio)
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const geoOuter = new THREE.IcosahedronGeometry(2.35, isMobile ? 1 : 2);
  const matWire = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    wireframe: true,
    transparent: true,
    opacity: 0.24
  });
  const outerCrystal = new THREE.Mesh(geoOuter, matWire);
  coreGroup.add(outerCrystal);

  const geoInner = new THREE.OctahedronGeometry(1.35, 1);
  const matInner = new THREE.MeshBasicMaterial({
    color: 0x6366f1,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  });
  const innerCrystal = new THREE.Mesh(geoInner, matInner);
  coreGroup.add(innerCrystal);

  // CAMADA 2: ANÉIS ORBITAIS (Plano Próximo - Parallax mais rápido)
  const ringsGroup = new THREE.Group();
  scene.add(ringsGroup);

  const ringGeo = new THREE.TorusGeometry(3.4, 0.014, 8, isMobile ? 64 : 120);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.25
  });
  const orbitalRing1 = new THREE.Mesh(ringGeo, ringMat);
  orbitalRing1.rotation.x = Math.PI * 0.36;
  ringsGroup.add(orbitalRing1);

  const orbitalRing2 = new THREE.Mesh(ringGeo, ringMat);
  orbitalRing2.rotation.y = Math.PI * 0.28;
  orbitalRing2.scale.setScalar(1.25);
  ringsGroup.add(orbitalRing2);

  // CAMADA 3: GRADE CIBERNÉTICA DE PROFUNDIDADE (Chão Parallax)
  const gridHelper = new THREE.GridHelper(36, 36, 0xef4444, 0x1e293b);
  gridHelper.position.y = -4.2;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.16;
  scene.add(gridHelper);

  // CAMADA 4: CAMPO DE PARTÍCULAS PROFUNDAS (Plano Distante - Parallax lento)
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

  // ESTÁGIOS POR SEÇÃO
  const stagePresets = [
    { camX: 0, camY: 0, camZ: isMobile ? 11.5 : 9.2, scale: 1.0, color: 0xef4444 },
    { camX: isMobile ? 0 : -2.1, camY: 0.4, camZ: isMobile ? 10.2 : 7.8, scale: 1.15, color: 0xf97316 },
    { camX: isMobile ? 0 : 2.0, camY: -0.3, camZ: isMobile ? 10.5 : 8.2, scale: 0.95, color: 0x6366f1 },
    { camX: 0, camY: 0.2, camZ: isMobile ? 9.6 : 7.2, scale: 1.25, color: 0xef4444 }
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

    // Inércia suave do scroll
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

    // EFEITO PARALLAX MULTI-CAMADA NO SCROLL
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