(function initKunaiScene() {
  const canvas = document.getElementById('webglScene');
  if (!canvas || typeof THREE === 'undefined') return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, isMobile ? 10 : 8.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // ILUMINAÇÃO METÁLICA REALISTA
  scene.add(new THREE.AmbientLight(0xffffff, 1.3));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 6, 6);
  scene.add(keyLight);

  const redRim = new THREE.PointLight(0xef4444, 16, 20);
  redRim.position.set(-3, -1, 4);
  scene.add(redRim);

  // ==========================================
  // 1. KUNAI SHINOBI 3D REFINADA
  // ==========================================
  function createShinobiKunai() {
    const kunai = new THREE.Group();

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.92,
      roughness: 0.16
    });

    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.3
    });

    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.2,
      roughness: 0.85
    });

    // Ponta da lâmina (losango afiado)
    const tipGeo = new THREE.ConeGeometry(0.3, 1.45, 4);
    tipGeo.scale(1, 1, 0.22);
    const tipMesh = new THREE.Mesh(tipGeo, bladeMat);
    tipMesh.position.y = 1.2;
    kunai.add(tipMesh);

    // Base da lâmina
    const baseGeo = new THREE.ConeGeometry(0.3, 0.55, 4);
    baseGeo.scale(1, 1, 0.22);
    const baseMesh = new THREE.Mesh(baseGeo, darkSteelMat);
    baseMesh.rotation.z = Math.PI;
    baseMesh.position.y = 0.2;
    kunai.add(baseMesh);

    // Guarda metálica
    const guardGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.12, 16);
    const guardMesh = new THREE.Mesh(guardGeo, darkSteelMat);
    guardMesh.position.y = -0.1;
    kunai.add(guardMesh);

    // Cabo / Empunhadura
    const handleGeo = new THREE.CylinderGeometry(0.072, 0.082, 0.95, 16);
    const handleMesh = new THREE.Mesh(handleGeo, gripMat);
    handleMesh.position.y = -0.62;
    kunai.add(handleMesh);

    // Bandagens do cabo
    for (let i = 0; i < 4; i++) {
      const wrapGeo = new THREE.TorusGeometry(0.084, 0.013, 8, 20);
      const wrap = new THREE.Mesh(wrapGeo, bladeMat);
      wrap.rotation.x = Math.PI / 2 + 0.15;
      wrap.position.y = -0.32 - i * 0.2;
      kunai.add(wrap);
    }

    // Anel da ponta
    const pommelGeo = new THREE.TorusGeometry(0.17, 0.03, 12, 32);
    const pommelMesh = new THREE.Mesh(pommelGeo, bladeMat);
    pommelMesh.position.y = -1.24;
    kunai.add(pommelMesh);

    return kunai;
  }

  const kunaiGroup = createShinobiKunai();
  kunaiGroup.scale.setScalar(isMobile ? 0.95 : 1.2);
  // Posição inicial antes do arremesso de abertura
  kunaiGroup.position.set(-7, 3.5, 3.5);
  kunaiGroup.rotation.set(0.3, 0, -1.2);
  scene.add(kunaiGroup);

  // ==========================================
  // 2. PARTÍCULAS DE FUMAÇA & ESTILHAÇOS DE VIDRO
  // ==========================================
  const shardCount = 42;
  const shards = [];
  const shardGeo = new THREE.TetrahedronGeometry(0.09, 0);
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.4,
    roughness: 0.1,
    transparent: true,
    opacity: 0
  });

  const shardsGroup = new THREE.Group();
  scene.add(shardsGroup);

  for (let i = 0; i < shardCount; i++) {
    const mesh = new THREE.Mesh(shardGeo, shardMat.clone());
    mesh.userData = {
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.3) * 0.18,
      vz: Math.random() * 0.16 + 0.04,
      rx: (Math.random() - 0.5) * 0.2,
      ry: (Math.random() - 0.5) * 0.2
    };
    shardsGroup.add(mesh);
    shards.push(mesh);
  }

  let shardLife = 0;

  function triggerGlassExplosion(originX, originY) {
    shardLife = 1.0;
    shards.forEach((s) => {
      s.position.set(originX, originY, 2.2);
      s.material.opacity = 0.95;
      s.scale.setScalar(0.6 + Math.random() * 1.1);
    });
  }

  // CONTROLE DE FASES (INTRO -> HERO -> IMPACTO -> PROJETOS)
  let introDone = false;
  let scrollProgress = 0;
  let smoothScroll = 0;
  let hasImpactedPortrait = false;

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  window.SceneController = {
    finishIntro() {
      introDone = true;
    },
    setScrollProgress(p) {
      scrollProgress = Math.min(Math.max(p, 0), 1);
    },
    triggerPortraitImpact() {
      if (hasImpactedPortrait) return;
      hasImpactedPortrait = true;
      const targetX = isMobile ? 0 : 1.85;
      const targetY = isMobile ? 0.9 : 0.15;
      triggerGlassExplosion(targetX, targetY);
    },
    resetPortraitImpact() {
      hasImpactedPortrait = false;
    }
  };

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    smoothScroll += (scrollProgress - smoothScroll) * 0.09;
    pointer.x += (pointer.targetX - pointer.x) * 0.06;
    pointer.y += (pointer.targetY - pointer.y) * 0.06;

    // FASE 0: ANIMAÇÃO DA TELA INICIAL (Kunai atravessa e crava no centro)
    if (!introDone) {
      kunaiGroup.position.x += (0 - kunaiGroup.position.x) * 0.14;
      kunaiGroup.position.y += (0.85 - kunaiGroup.position.y) * 0.14;
      kunaiGroup.position.z += (2.8 - kunaiGroup.position.z) * 0.14;
      kunaiGroup.rotation.z += (-0.78 - kunaiGroup.rotation.z) * 0.14;
      kunaiGroup.rotation.y = elapsed * 6;
    } else {
      // FASE 1 -> 2: Trajetória da Kunai no Scroll
      // Entre 0% e 18% de scroll, ela mergulha em direção à foto para quebrar o vidro
      const impactFactor = Math.min(smoothScroll / 0.16, 1);
      const retreatFactor = Math.max((smoothScroll - 0.24) / 0.76, 0);

      // Posição de repouso no Hero -> Posição de impacto na foto -> Recolhimento lateral discreto
      const heroX = isMobile ? 1.15 : 0.25;
      const heroY = isMobile ? 1.85 : 1.1;
      const heroZ = 2.2;

      const hitX = isMobile ? 0 : 1.75;
      const hitY = isMobile ? 0.85 : 0.1;
      const hitZ = 3.2;

      const sideX = isMobile ? 1.45 : 3.45;
      const sideY = -0.6 - retreatFactor * 1.2;
      const sideZ = 1.4;

      let goalX = THREE.MathUtils.lerp(heroX, hitX, impactFactor);
      let goalY = THREE.MathUtils.lerp(heroY, hitY, impactFactor);
      let goalZ = THREE.MathUtils.lerp(heroZ, hitZ, impactFactor);

      if (retreatFactor > 0) {
        goalX = THREE.MathUtils.lerp(hitX, sideX, retreatFactor);
        goalY = THREE.MathUtils.lerp(hitY, sideY, retreatFactor);
        goalZ = THREE.MathUtils.lerp(hitZ, sideZ, retreatFactor);
      }

      kunaiGroup.position.x += (goalX + pointer.x * 0.35 - kunaiGroup.position.x) * 0.1;
      kunaiGroup.position.y += (goalY + Math.sin(elapsed * 2) * 0.08 + pointer.y * 0.25 - kunaiGroup.position.y) * 0.1;
      kunaiGroup.position.z += (goalZ - kunaiGroup.position.z) * 0.1;

      // Aponta a lâmina diretamente para a foto durante o ataque
      const targetRotZ = impactFactor > 0.1 && retreatFactor < 0.3 ? -1.15 : -0.65;
      const targetRotX = impactFactor > 0.1 && retreatFactor < 0.3 ? 0.55 : 0.15;

      kunaiGroup.rotation.z += (targetRotZ - kunaiGroup.rotation.z) * 0.1;
      kunaiGroup.rotation.x += (targetRotX - kunaiGroup.rotation.x) * 0.1;
      if (!prefersReducedMotion) {
        kunaiGroup.rotation.y = elapsed * 1.1 + smoothScroll * Math.PI * 4;
      }
    }

    // ATUALIZA ESTILHAÇOS DE VIDRO VOANDO
    if (shardLife > 0) {
      shardLife -= 0.022;
      shards.forEach((s) => {
        s.position.x += s.userData.vx;
        s.position.y += s.userData.vy;
        s.position.z += s.userData.vz;
        s.userData.vy -= 0.006; // Gravidade leve
        s.rotation.x += s.userData.rx;
        s.rotation.y += s.userData.ry;
        s.material.opacity = Math.max(shardLife, 0);
      });
    }

    renderer.render(scene, camera);
  }

  animate();
})();