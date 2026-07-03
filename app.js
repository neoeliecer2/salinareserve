// ==========================================================================
// LA SALINA RESERVE - WEB APP LOGIC (HACIENDA DIGITAL & MEMBRESIAS)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --- INICIALIZACIÓN DE ICONOS ---
  lucide.createIcons();

  // --- BASE DE DATOS DE HACIENDA VIRTUAL (10,000 Árboles en 20 Hectáreas) ---
  let haciendaData = {
    hectares: [],
    alerts: []
  };

  // Generación Procedural de las Hectáreas y Muestra de Árboles
  const STAGES = ['Siembra', 'Vegetativo', 'Floración', 'Fructificación', 'Cosecha'];
  const HEALTH_STATUS = ['Excelente', 'Monitoreo', 'Tratamiento'];

  // Intentar cargar datos de la hacienda desde localStorage
  const savedHacienda = localStorage.getItem('salina_hacienda_data');
  if (savedHacienda) {
    try {
      haciendaData = JSON.parse(savedHacienda);
    } catch(e) {
      console.error("Error parsing hacienda data", e);
    }
  }

  if (!savedHacienda || !haciendaData.hectares || haciendaData.hectares.length === 0) {
    haciendaData = { hectares: [], alerts: [] };
    for (let h = 1; h <= 20; h++) {
      const isAvocado = h <= 10;
      const type = isAvocado ? 'Aguacate' : 'Mango';
      
      // Configuración inicial de la Hectárea
      const hectare = {
        id: h,
        type: type,
        name: `Hectárea ${h}`,
        healthScore: 95 + Math.random() * 5, // 95% - 100%
        averageMoisture: 60 + Math.round(Math.random() * 15), // 60% - 75%
        averageTemp: 22 + Math.random() * 5, // 22°C - 27°C
        stage: h % 4 === 0 ? 'Fructificación' : (h % 3 === 0 ? 'Floración' : 'Cosecha'),
        trees: []
      };

      // Determinar la fase de siembra según el número de hectárea
      let phase = 'Fase 1 - Piloto';
      let planted = 'Junio 2026';
      let minAge = 3.0, maxAge = 4.5;
      
      if (h >= 8 && h <= 14) {
        phase = 'Fase 2 - Expansión';
        planted = 'Enero 2027';
        minAge = 1.5;
        maxAge = 2.8;
      } else if (h >= 15) {
        phase = 'Fase 3 - Consolidación';
        planted = 'Marzo 2029';
        minAge = 0.2;
        maxAge = 0.9;
      }

      hectare.stage = maxAge > 3.0 ? 'Cosecha' : (maxAge > 2.0 ? 'Floración' : 'Siembra');

      // Generar 500 árboles por hectárea para el mapa interactivo (GIS Grid)
      for (let t = 1; t <= 500; t++) {
        const idStr = `LSA-${isAvocado ? 'AGU' : 'MAN'}-${h.toString().padStart(2, '0')}-${t.toString().padStart(3, '0')}`;
        const randomAge = minAge + Math.random() * (maxAge - minAge);
        
        // Asignar etapa según edad
        let stage = 'Siembra';
        if (randomAge >= 3.0) stage = 'Cosecha';
        else if (randomAge >= 2.2) stage = 'Fructificación';
        else if (randomAge >= 1.5) stage = 'Floración';
        else if (randomAge >= 0.8) stage = 'Vegetativo';

        // Tamaño aproximado según la edad (1.2m por año aprox)
        let size = (randomAge * 1.1).toFixed(1);
        if (parseFloat(size) < 0.4) size = '0.4';

        // Asignar salud
        let health = 'Excelente';
        const randHealth = Math.random();
        if (randHealth > 0.97) health = 'Tratamiento';
        else if (randHealth > 0.94) health = 'Monitoreo';

        hectare.trees.push({
          id: idStr,
          type: type,
          age: randomAge.toFixed(1),
          stage: stage,
          health: health,
          moisture: Math.round(hectare.averageMoisture + (Math.random() * 6 - 3)),
          planted: planted,
          phase: phase,
          size: `${size} metros`,
          owner: 'Disponible',
          memberTier: 'N/A',
          logs: [
            { date: '29/06/2026', text: 'Monitoreo remoto de vigor foliar por dron.' },
            { date: '10/05/2026', text: `Fertilización orgánica con té de compost Bokashi (${hectare.type === 'Aguacate' ? 'dosis aguacate' : 'dosis mango'}).` },
            { date: '14/03/2026', text: 'Liberación de avispas Trichogramma contra plagas.' },
            { date: '01/01/2026', text: 'Control biológico de malezas por siembra mixta de leguminosas.' }
          ]
        });
      }

      haciendaData.hectares.push(hectare);
    }
    localStorage.setItem('salina_hacienda_data', JSON.stringify(haciendaData));
  }

  // --- VARIABLES DE ESTADO ---
  let activeTab = 'hacienda';
  let selectedHectare = null;
  let selectedTree = null;

  let activeAlerts = [
    { id: 1, type: 'warning', msg: 'Hectárea 8: Humedad de suelo baja (51%). Riego programado.', date: '09:12' }
  ];

  const savedAlerts = localStorage.getItem('salina_active_alerts');
  if (savedAlerts) {
    try {
      activeAlerts = JSON.parse(savedAlerts);
    } catch(e) {
      console.error("Error parsing alerts data", e);
    }
  } else {
    localStorage.setItem('salina_active_alerts', JSON.stringify(activeAlerts));
  }

  let dronePatrolling = true;
  let droneHectare = 4;
  let clientMembershipLevel = 'semilla';
  let clientName = 'Inversionista Fundador';

  // --- PORTAL LOGIN & SESIÓN DE USUARIO ---
  const loginForm = document.getElementById('login-form');
  const loginWrapper = document.getElementById('login-wrapper');
  const appContainer = document.getElementById('app-container');
  const logoutBtn = document.getElementById('btn-logout');

  // Función para inicializar la sesión si ya está guardada
  function initUserSession(fullName) {
    clientName = fullName;
    const namePart = fullName.split(' ')[0] || '';
    
    // Actualizar perfil de usuario en el sidebar
    const sidebarName = document.querySelector('.user-name');
    const sidebarAvatar = document.querySelector('.avatar');
    if (sidebarName) sidebarName.textContent = clientName;
    if (sidebarAvatar && namePart.length > 0) sidebarAvatar.textContent = namePart[0].toUpperCase();
    
    // Cargar membresía guardada para este usuario
    const savedLevel = localStorage.getItem('salina_membership_level_' + clientName);
    if (savedLevel) {
      clientMembershipLevel = savedLevel;
    } else {
      if (clientName === 'Juan Pérez') clientMembershipLevel = 'semilla';
      else if (clientName === 'María Gómez') clientMembershipLevel = 'bosque';
      else if (clientName === 'Carlos Restrepo') clientMembershipLevel = 'legado';
      else clientMembershipLevel = 'semilla';
      
      localStorage.setItem('salina_membership_level_' + clientName, clientMembershipLevel);
    }
    
    // Sincronizar UI con la membresía cargada
    const tier = membershipTiers[clientMembershipLevel];
    if (tier) {
      simTrees.value = tier.count;
      simTreesVal.textContent = tier.count;
      userRoleDisplay.textContent = tier.name;
      
      memberCards.forEach(c => {
        c.classList.remove('active');
        if (c.getAttribute('data-level') === clientMembershipLevel) {
          c.classList.add('active');
        }
      });
    }
    
    assignTreeOwnership();
    if (selectedHectare) {
      renderTreesGrid(selectedHectare);
    }
    updateFinancialSimulator();
    updateCertificate();
    
    // Actualizar nombre predeterminado en el Certificado
    if (certNameInput) certNameInput.value = clientName;
    updateCertificate();
    
    // Mostrar la app y ocultar el login directamente
    loginWrapper.style.display = 'none';
    appContainer.style.display = 'flex';
    
    logConsoleMessage(`Sesión recuperada: ${clientName}. Acceso concedido al Portal.`, 'system');
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('login-name').value;
      const lastname = document.getElementById('login-lastname').value;
      const password = document.getElementById('login-password').value;
      
      // Contraseña demo requerida
      if (password !== 'Salina2026') {
        alert('Contraseña incorrecta. Por favor intenta de nuevo.');
        return;
      }
      
      clientName = `${name} ${lastname}`;
      
      // Guardar sesión en localStorage
      localStorage.setItem('salina_session_active', 'true');
      localStorage.setItem('salina_client_name', clientName);

      // Cargar membresía guardada para este usuario
      const savedLevel = localStorage.getItem('salina_membership_level_' + clientName);
      if (savedLevel) {
        clientMembershipLevel = savedLevel;
      } else {
        if (clientName === 'Juan Pérez') clientMembershipLevel = 'semilla';
        else if (clientName === 'María Gómez') clientMembershipLevel = 'bosque';
        else if (clientName === 'Carlos Restrepo') clientMembershipLevel = 'legado';
        else clientMembershipLevel = 'semilla';
        
        localStorage.setItem('salina_membership_level_' + clientName, clientMembershipLevel);
      }
      
      // Sincronizar UI con la membresía cargada
      const tier = membershipTiers[clientMembershipLevel];
      if (tier) {
        simTrees.value = tier.count;
        simTreesVal.textContent = tier.count;
        userRoleDisplay.textContent = tier.name;
        
        memberCards.forEach(c => {
          c.classList.remove('active');
          if (c.getAttribute('data-level') === clientMembershipLevel) {
            c.classList.add('active');
          }
        });
      }
      
      assignTreeOwnership();
      if (selectedHectare) {
        renderTreesGrid(selectedHectare);
      }
      updateFinancialSimulator();
      updateCertificate();
      
      // Actualizar perfil de usuario en el sidebar
      const sidebarName = document.querySelector('.user-name');
      const sidebarAvatar = document.querySelector('.avatar');
      if (sidebarName) sidebarName.textContent = clientName;
      if (sidebarAvatar && name.length > 0) sidebarAvatar.textContent = name[0].toUpperCase();
      
      // Actualizar nombre predeterminado en el Certificado
      if (certNameInput) certNameInput.value = clientName;
      updateCertificate();
      
      // Transición
      loginWrapper.classList.add('fade-out');
      setTimeout(() => {
        loginWrapper.style.display = 'none';
        appContainer.style.display = 'flex';
      }, 500);
      
      logConsoleMessage(`Inversionista registrado: ${clientName}. Acceso concedido al Portal.`, 'system');
    });
  }

  // --- INGRESO RÁPIDO CON USUARIOS DE PRUEBA ---
  const btnTestUsers = document.querySelectorAll('.btn-test-user');
  btnTestUsers.forEach(btn => {
    btn.addEventListener('click', () => {
      const user = btn.getAttribute('data-user');
      const lastname = btn.getAttribute('data-lastname');
      const email = btn.getAttribute('data-email');
      const level = btn.getAttribute('data-level');
      
      document.getElementById('login-name').value = user;
      document.getElementById('login-lastname').value = lastname;
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = 'Salina2026';
      // Enviar formulario automáticamente
      if (loginForm) {
        const fullName = `${user} ${lastname}`;
        const savedLevel = localStorage.getItem('salina_membership_level_' + fullName);
        if (!savedLevel) {
          localStorage.setItem('salina_membership_level_' + fullName, level);
        }
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.click();
        } else {
          loginForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('salina_session_active');
      localStorage.removeItem('salina_client_name');
      logConsoleMessage('Sesión cerrada por el usuario. Redirigiendo...', 'system');
      setTimeout(() => {
        window.location.reload();
      }, 300);
    });
  }

  // --- MANEJO DE PESTAÑAS (TABS) ---
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const tabTitle = document.getElementById('tab-title');
  const tabSubtitle = document.getElementById('tab-subtitle');

  const tabMeta = {
    hacienda: {
      title: 'Hacienda Digital',
      subtitle: 'Monitoreo y desarrollo de tus cultivos de aguacates de forma virtual.'
    },
    iot: {
      title: 'Monitoreo Remoto (IoT)',
      subtitle: 'Conexión en vivo con sensores de humedad de suelo, clima y cámaras de campo.'
    },
    membresia: {
      title: 'Portal de Membresías',
      subtitle: 'Control de tus participaciones y simulación financiera del patrimonio forestal.'
    },
    admin: {
      title: 'Panel del Administrador',
      subtitle: 'Actualización remota y simulación de eventos en las 20 hectáreas de La Salina.'
    }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      activeTab = tab;
      
      // Toggle CSS classes
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById(`${tab}-tab`).classList.add('active');

      // Update titles
      tabTitle.textContent = tabMeta[tab].title;
      tabSubtitle.textContent = tabMeta[tab].subtitle;

      // Acciones específicas por pestaña
      if (tab === 'iot') {
        initDroneSimulation();
      }
    });
  });

  // --- VISTA HACIENDA DIGITAL: MAPA INTERACTIVO ---
  const mapGrid = document.getElementById('interactive-grid-map');
  const hectareFilter = document.getElementById('hectare-filter');
  const hectareDetailSection = document.getElementById('hectare-detail-section');
  const closeHectareDetail = document.getElementById('close-hectare-detail');
  const treesGrid = document.getElementById('trees-grid');
  const hectareDetailTitle = document.getElementById('hectare-detail-title');

  function renderHectareGrid() {
    mapGrid.innerHTML = '';
    const filterVal = hectareFilter.value;

    haciendaData.hectares.forEach(h => {
      // Filtrar
      if (filterVal !== 'all' && filterVal != h.id) return;

      const block = document.createElement('div');
      block.className = `hectare-block ${h.type === 'Aguacate' ? 'avocado-type' : 'mango-type'}`;
      block.addEventListener('click', () => zoomToHectare(h));

      // Calcular porcentaje de salud
      const healthColor = h.healthScore > 98 ? 'var(--primary-light)' : (h.healthScore > 94 ? 'var(--warning)' : 'var(--danger)');

      block.innerHTML = `
        <span class="hectare-id">${h.name}</span>
        <span class="hectare-info">${h.type} • ${h.stage}</span>
        <span class="hectare-info" style="color:${healthColor}; font-weight:bold;">Salud: ${h.healthScore.toFixed(1)}%</span>
        <div class="hectare-progress">
          <div class="hectare-progress-bar ${h.type === 'Aguacate' ? 'avocado' : 'mango'}" style="width: ${h.averageMoisture}%"></div>
        </div>
      `;
      mapGrid.appendChild(block);
    });
  }

  hectareFilter.addEventListener('change', renderHectareGrid);
  renderHectareGrid();

  // Zoom into a Hectare
  function zoomToHectare(h) {
    selectedHectare = h;
    mapGrid.style.display = 'none';
    hectareDetailSection.style.display = 'block';
    hectareDetailTitle.textContent = `${h.name} (${h.type}) - Distribución de 500 Árboles`;

    renderTreesGrid(h);
  }

  closeHectareDetail.addEventListener('click', () => {
    selectedHectare = null;
    hectareDetailSection.style.display = 'none';
    mapGrid.style.display = 'grid';
    renderHectareGrid();
  });

  const chkMyTrees = document.getElementById('chk-my-trees');
  if (chkMyTrees) {
    chkMyTrees.addEventListener('change', () => {
      if (selectedHectare) {
        renderTreesGrid(selectedHectare);
      }
    });
  }

  function renderTreesGrid(hectare) {
    treesGrid.innerHTML = '';
    
    const showOnlyMine = chkMyTrees ? chkMyTrees.checked : false;

    // Sort trees by id
    hectare.trees.forEach((tree, idx) => {
      // Filter if checked
      if (showOnlyMine && tree.owner !== 'Tú') return;

      const treeNode = document.createElement('div');
      treeNode.className = `tree-node stage-${tree.stage.toLowerCase()}`;
      
      if (tree.health !== 'Excelente') {
        treeNode.classList.add('monitored-health');
      }

      if (tree.owner === 'Tú') {
        treeNode.classList.add('my-tree');
      }

      // El texto interno del nodo es su índice (1-100)
      treeNode.textContent = idx + 1;
      treeNode.addEventListener('click', () => inspectTree(tree));
      
      treesGrid.appendChild(treeNode);
    });
  }

  // --- INSPECTOR DE ÁRBOLES DIGITAL (VIRTUAL TWIN) ---
  const inspectorPlaceholder = document.getElementById('inspector-placeholder');
  const inspectorContent = document.getElementById('inspector-content');
  const inspectId = document.getElementById('inspect-id');
  const inspectType = document.getElementById('inspect-type');
  const inspectHealthBadge = document.getElementById('inspect-health-badge');
  const inspectStage = document.getElementById('inspect-stage');
  const inspectPlanted = document.getElementById('inspect-planted');
  const inspectAge = document.getElementById('inspect-age');
  const inspectYield = document.getElementById('inspect-yield');
  const inspectMoisture = document.getElementById('inspect-moisture');
  const inspectLogs = document.getElementById('inspect-logs');
  const treeStageVisualizer = document.getElementById('tree-stage-visualizer');

  // SVGs interactivos según la etapa de desarrollo
  const treeSVGs = {
    Siembra: `<svg viewBox="0 0 100 100">
      <!-- Ground -->
      <path d="M10 90 L90 90" stroke="#795548" stroke-width="6" stroke-linecap="round"/>
      <!-- Small seed shoot -->
      <path d="M50 90 C50 80, 52 75, 48 70" fill="none" stroke="#81c784" stroke-width="4" stroke-linecap="round"/>
      <path d="M48 70 C43 72, 40 68, 48 70 C49 66, 54 66, 48 70" fill="#4caf50" stroke="#2e7d32" stroke-width="1"/>
    </svg>`,
    Vegetativo: `<svg viewBox="0 0 100 100">
      <!-- Ground -->
      <path d="M10 90 L90 90" stroke="#795548" stroke-width="6" stroke-linecap="round"/>
      <!-- Small growing plant -->
      <path d="M50 90 L50 65" fill="none" stroke="#795548" stroke-width="5" stroke-linecap="round"/>
      <path d="M50 78 Q40 70, 36 74" fill="none" stroke="#795548" stroke-width="3" stroke-linecap="round"/>
      <path d="M50 72 Q60 65, 64 69" fill="none" stroke="#795548" stroke-width="3" stroke-linecap="round"/>
      <!-- Leaves -->
      <circle cx="50" cy="62" r="8" fill="#4caf50"/>
      <circle cx="34" cy="74" r="6" fill="#81c784"/>
      <circle cx="66" cy="69" r="6" fill="#81c784"/>
    </svg>`,
    Floración: `<svg viewBox="0 0 100 100">
      <!-- Ground -->
      <path d="M10 90 L90 90" stroke="#795548" stroke-width="5" stroke-linecap="round"/>
      <!-- Trunk & main branches -->
      <path d="M50 90 L50 50" fill="none" stroke="#5d4037" stroke-width="8" stroke-linecap="round"/>
      <path d="M50 65 C40 55, 30 55, 30 50" fill="none" stroke="#5d4037" stroke-width="5" stroke-linecap="round"/>
      <path d="M50 58 C60 48, 70 50, 70 42" fill="none" stroke="#5d4037" stroke-width="5" stroke-linecap="round"/>
      <!-- Foliage green blocks -->
      <circle cx="50" cy="42" r="16" fill="#2e7d32" opacity="0.9"/>
      <circle cx="30" cy="48" r="12" fill="#388e3c" opacity="0.9"/>
      <circle cx="68" cy="40" r="12" fill="#4caf50" opacity="0.9"/>
      <!-- Tiny flowers (Yellow/White dots) -->
      <circle cx="45" cy="38" r="2.5" fill="#fdd835"/>
      <circle cx="53" cy="45" r="2" fill="#fff"/>
      <circle cx="32" cy="46" r="2.5" fill="#fdd835"/>
      <circle cx="64" cy="38" r="2.5" fill="#fdd835"/>
      <circle cx="28" cy="52" r="2" fill="#fff"/>
    </svg>`,
    Fructificación: `<svg viewBox="0 0 100 100">
      <!-- Ground -->
      <path d="M10 90 L90 90" stroke="#795548" stroke-width="5" stroke-linecap="round"/>
      <!-- Trunk & main branches -->
      <path d="M50 90 L50 45" fill="none" stroke="#5d4037" stroke-width="10" stroke-linecap="round"/>
      <path d="M50 62 C35 50, 25 50, 25 45" fill="none" stroke="#5d4037" stroke-width="6" stroke-linecap="round"/>
      <path d="M50 54 C65 42, 75 45, 75 35" fill="none" stroke="#5d4037" stroke-width="6" stroke-linecap="round"/>
      <!-- Foliage -->
      <circle cx="50" cy="35" r="22" fill="#1b5e20"/>
      <circle cx="25" cy="42" r="16" fill="#2e7d32"/>
      <circle cx="72" cy="32" r="16" fill="#388e3c"/>
      <!-- Fruits (Avocados: pear-like shapes or green ovals) -->
      <ellipse cx="44" cy="38" rx="3" ry="5" fill="#d4af37"/> <!-- maturing -->
      <ellipse cx="54" cy="28" rx="3.5" ry="5.5" fill="#33691e"/> <!-- green -->
      <ellipse cx="26" cy="42" rx="3" ry="5" fill="#33691e"/>
      <ellipse cx="70" cy="35" rx="3" ry="5" fill="#33691e"/>
    </svg>`,
    Cosecha: `<svg viewBox="0 0 100 100">
      <!-- Ground -->
      <path d="M10 90 L90 90" stroke="#795548" stroke-width="5" stroke-linecap="round"/>
      <!-- Mature tree -->
      <path d="M50 90 L50 45" fill="none" stroke="#5d4037" stroke-width="12" stroke-linecap="round"/>
      <path d="M50 60 C30 50, 20 48, 20 42" fill="none" stroke="#5d4037" stroke-width="7" stroke-linecap="round"/>
      <path d="M50 50 C70 38, 80 40, 80 30" fill="none" stroke="#5d4037" stroke-width="7" stroke-linecap="round"/>
      <!-- Luxurious foliage -->
      <circle cx="50" cy="32" r="25" fill="#0f4513"/>
      <circle cx="20" cy="38" r="18" fill="#1b5e20"/>
      <circle cx="76" cy="28" r="18" fill="#2e7d32"/>
      <!-- Plentiful Ripe Fruits (dark green/black avocados or yellow mangoes) -->
      <g id="fruits">
        <!-- Avocado 1 -->
        <ellipse cx="42" cy="34" rx="4" ry="7" fill="#1a330e" stroke="#558b2f" stroke-width="1"/>
        <!-- Avocado 2 -->
        <ellipse cx="58" cy="24" rx="4" ry="7" fill="#1a330e" stroke="#558b2f" stroke-width="1"/>
        <!-- Avocado 3 -->
        <ellipse cx="22" cy="38" rx="4" ry="7" fill="#1a330e" stroke="#558b2f" stroke-width="1"/>
        <!-- Avocado 4 -->
        <ellipse cx="74" cy="30" rx="4" ry="7" fill="#1a330e" stroke="#558b2f" stroke-width="1"/>
        <!-- Avocado 5 -->
        <ellipse cx="50" cy="44" rx="4" ry="7" fill="#1a330e" stroke="#558b2f" stroke-width="1"/>
      </g>
    </svg>`
  };

  // Switch mango tree color to gold if the tree type is mango
  function getTreeSVG(stage, type) {
    let svg = treeSVGs[stage];
    if (type === 'Mango') {
      // Reemplazar aguacates oscuros por mangos dorados/amarillos/rojos
      svg = svg.replace(/id="fruits"[\s\S]*?<\/g>/, `id="fruits">
        <circle cx="42" cy="34" r="5" fill="#fdd835" stroke="#ef6c00" stroke-width="1"/>
        <circle cx="58" cy="24" r="4.5" fill="#ffb300" stroke="#e65100" stroke-width="1"/>
        <circle cx="22" cy="38" r="5" fill="#ffb300" stroke="#e65100" stroke-width="1"/>
        <circle cx="74" cy="30" r="5" fill="#fdd835" stroke="#ef6c00" stroke-width="1"/>
        <circle cx="50" cy="44" r="4.5" fill="#ffb300" stroke="#e65100" stroke-width="1"/>
      </g>`);
    }
    return svg;
  }

  function inspectTree(tree) {
    selectedTree = tree;
    
    // Hide placeholder, show content
    inspectorPlaceholder.style.display = 'none';
    inspectorContent.style.display = 'block';

    // Populate Inspector UI
    inspectId.textContent = tree.id;
    inspectType.textContent = `${tree.type} Orgánico`;
    
    // Health status badge
    inspectHealthBadge.className = 'health-indicator';
    if (tree.health === 'Excelente') {
      inspectHealthBadge.textContent = 'Excelente';
    } else if (tree.health === 'Monitoreo') {
      inspectHealthBadge.classList.add('warning');
      inspectHealthBadge.textContent = 'Monitoreo';
    } else {
      inspectHealthBadge.classList.add('danger');
      inspectHealthBadge.textContent = 'Tratamiento';
    }

    inspectStage.textContent = `Etapa: ${tree.stage}`;
    inspectPlanted.textContent = tree.planted;
    inspectAge.textContent = `${tree.age} Años`;
    
    // Size and Phase details
    document.getElementById('inspect-size').textContent = tree.size || '1.0 metros';
    document.getElementById('inspect-phase').textContent = tree.phase || 'Fase 1 - Piloto';

    // Calcular rendimiento proyectado según edad
    let yieldEstimate = 0;
    const ageNum = parseFloat(tree.age);
    if (ageNum < 1.0) yieldEstimate = 0;
    else if (ageNum < 2.0) yieldEstimate = 0;
    else if (ageNum < 3.0) yieldEstimate = 20 + Math.round(Math.random() * 30); // 20-50 kg
    else if (ageNum < 5.0) yieldEstimate = 120 + Math.round(Math.random() * 50); // 100-250 kg
    else if (ageNum < 8.0) yieldEstimate = 420 + Math.round(Math.random() * 60); // 400-500 kg
    else yieldEstimate = 560 + Math.round(Math.random() * 30); // 550-600 kg

    inspectYield.textContent = `${yieldEstimate} kg / año`;
    inspectMoisture.textContent = `${tree.moisture}%`;

    // Owner details
    document.getElementById('inspect-owner').textContent = tree.owner === 'Tú' ? 'Tú (Inversionista)' : tree.owner;
    document.getElementById('inspect-member-tier').textContent = tree.memberTier;

    // Render Stage SVG
    treeStageVisualizer.innerHTML = getTreeSVG(tree.stage, tree.type);

    // Render Logs
    inspectLogs.innerHTML = '';
    tree.logs.forEach(log => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${log.date}:</strong> ${log.text}`;
      inspectLogs.appendChild(li);
    });
  }

  // --- MONITOREO REMOTO IoT GAUGE ANIMATIONS ---
  const gaugeMoisture = document.getElementById('gauge-moisture');
  const barMoisture = document.getElementById('bar-moisture');
  const gaugeTemp = document.getElementById('gauge-temp');
  const barTemp = document.getElementById('bar-temp');
  const gaugePh = document.getElementById('gauge-ph');
  const barPh = document.getElementById('bar-ph');

  // Loop para simular variaciones naturales en los sensores de la hacienda
  setInterval(() => {
    if (activeTab === 'iot') {
      // Fluctuaciones de humedad
      const baseMoisture = selectedHectare ? selectedHectare.averageMoisture : 65;
      const moistureChange = (Math.random() * 2 - 1).toFixed(1);
      const newMoisture = Math.min(100, Math.max(10, Math.round(baseMoisture + parseFloat(moistureChange))));
      
      gaugeMoisture.textContent = `${newMoisture}%`;
      barMoisture.style.width = `${newMoisture}%`;

      // Fluctuaciones de temperatura
      const tempChange = (Math.random() * 0.4 - 0.2).toFixed(1);
      const newTemp = (24.8 + parseFloat(tempChange)).toFixed(1);
      gaugeTemp.textContent = `${newTemp}°C`;
      barTemp.style.width = `${Math.min(100, (newTemp / 40) * 100)}%`;

      // Ph se mantiene muy estable
      const phChange = (Math.random() * 0.04 - 0.02).toFixed(2);
      const newPh = (6.4 + parseFloat(phChange)).toFixed(1);
      gaugePh.textContent = newPh;
      barPh.style.width = `${(newPh / 14) * 100}%`;
    }
  }, 3000);

  // --- DRONE PATROL CROP SCANNING CANVAS ANIMATION ---
  const droneCanvas = document.getElementById('drone-canvas');
  const droneCtx = droneCanvas ? droneCanvas.getContext('2d') : null;
  const droneScanBtn = document.getElementById('btn-drone-scan');
  const droneStatusText = document.getElementById('drone-status-text');

  let animationFrameId = null;

  function initDroneSimulation() {
    if (!droneCtx) return;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    let frame = 0;
    // Puntos de elevación de terreno falsos
    const terrainPoints = [];
    for (let i = 0; i < 40; i++) {
      terrainPoints.push(50 + Math.sin(i * 0.3) * 15 + Math.cos(i * 0.1) * 10);
    }

    function draw() {
      if (activeTab !== 'iot') return;
      frame++;
      
      // Clear
      droneCtx.fillStyle = '#010501';
      droneCtx.fillRect(0, 0, droneCanvas.width, droneCanvas.height);

      // Draw Grid terrain
      droneCtx.strokeStyle = 'rgba(76, 175, 80, 0.15)';
      droneCtx.lineWidth = 1;
      
      // Vertical grid lines scrolling
      const offset = (frame * 1.5) % 40;
      for (let x = -offset; x < droneCanvas.width; x += 40) {
        droneCtx.beginPath();
        droneCtx.moveTo(x, 0);
        droneCtx.lineTo(x, droneCanvas.height);
        droneCtx.stroke();
      }

      // Horizontal grid lines scrolling
      for (let y = 0; y < droneCanvas.height; y += 30) {
        droneCtx.beginPath();
        droneCtx.moveTo(0, y);
        droneCtx.lineTo(droneCanvas.width, y);
        droneCtx.stroke();
      }

      // Draw virtual trees rows (Green circles passing by in simulated perspective)
      droneCtx.fillStyle = 'rgba(46, 125, 50, 0.3)';
      droneCtx.strokeStyle = 'rgba(129, 199, 132, 0.6)';
      droneCtx.lineWidth = 2;

      for (let row = 0; row < 5; row++) {
        const rowY = 60 + row * 60;
        const speed = 2 + row * 0.5;
        const spacing = 160;
        const xOffset = (frame * speed) % spacing;

        for (let x = -xOffset; x < droneCanvas.width + 100; x += spacing) {
          // Perspective scale
          const scale = 0.5 + (rowY / droneCanvas.height) * 0.8;
          const size = 15 * scale;
          
          droneCtx.beginPath();
          droneCtx.arc(x, rowY, size, 0, Math.PI * 2);
          droneCtx.fill();
          droneCtx.stroke();

          // Add fruit dots inside
          droneCtx.fillStyle = 'rgba(212, 175, 55, 0.8)';
          droneCtx.beginPath();
          droneCtx.arc(x - 3 * scale, rowY - 2 * scale, 2 * scale, 0, Math.PI * 2);
          droneCtx.arc(x + 5 * scale, rowY + 3 * scale, 1.8 * scale, 0, Math.PI * 2);
          droneCtx.fill();
          droneCtx.fillStyle = 'rgba(46, 125, 50, 0.3)';
        }
      }

      // Draw Drone Scan sweep beam
      const scanY = (droneCanvas.height / 2) + Math.sin(frame * 0.05) * (droneCanvas.height / 2.5);
      const gradient = droneCtx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
      gradient.addColorStop(0, 'rgba(76, 175, 80, 0)');
      gradient.addColorStop(0.5, 'rgba(76, 175, 80, 0.35)');
      gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
      
      droneCtx.fillStyle = gradient;
      droneCtx.fillRect(0, scanY - 15, droneCanvas.width, 30);

      // Radar sweep sweep-text
      droneCtx.fillStyle = '#81c784';
      droneCtx.font = '10px monospace';
      droneCtx.fillText(`[ECOLASER] ANALIZANDO CULTIVO - FASE PILOTO H-${droneHectare}`, 20, droneCanvas.height - 20);
      
      // HUD center elements
      droneCtx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
      droneCtx.lineWidth = 1.5;
      droneCtx.beginPath();
      // HUD brackets
      droneCtx.drawHUDBrackets = function() {
        const size = 20;
        const padding = 60;
        // Top left
        this.moveTo(padding, padding + size);
        this.lineTo(padding, padding);
        this.lineTo(padding + size, padding);
        // Top right
        this.moveTo(droneCanvas.width - padding, padding + size);
        this.lineTo(droneCanvas.width - padding, padding);
        this.lineTo(droneCanvas.width - padding - size, padding);
        // Bottom left
        this.moveTo(padding, droneCanvas.height - padding - size);
        this.lineTo(padding, droneCanvas.height - padding);
        this.lineTo(padding + size, droneCanvas.height - padding);
        // Bottom right
        this.moveTo(droneCanvas.width - padding, droneCanvas.height - padding - size);
        this.lineTo(droneCanvas.width - padding, droneCanvas.height - padding);
        this.lineTo(droneCanvas.width - padding - size, droneCanvas.height - padding);
      };
      droneCtx.drawHUDBrackets();
      droneCtx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    }
    
    draw();
  }

  if (droneScanBtn) {
    droneScanBtn.addEventListener('click', () => {
      droneHectare = Math.floor(Math.random() * 20) + 1;
      droneStatusText.textContent = `Escaneando Hectárea ${droneHectare}...`;
      droneScanBtn.disabled = true;
      
      setTimeout(() => {
        const randomAnomaly = Math.random() > 0.6;
        if (randomAnomaly) {
          const type = Math.random() > 0.5 ? 'Aguacate' : 'Mango';
          const alertMsg = `Dron detectó vigor atípico en Hectárea ${droneHectare} (${type}). Generando reporte.`;
          addAlert('warning', alertMsg);
          droneStatusText.textContent = `Escaneo completado. ¡Alerta emitida para H-${droneHectare}!`;
        } else {
          droneStatusText.textContent = `Hectárea ${droneHectare} saludable (Vigor 99.1%).`;
        }
        droneScanBtn.disabled = false;
      }, 2500);
    });
  }

  // --- PORTAL DE MEMBRESÍAS & SIMULADOR DE INVERSIONES ---
  const memberCards = document.querySelectorAll('.member-card-interactive');
  const simTrees = document.getElementById('sim-trees');
  const simTreesVal = document.getElementById('sim-trees-val');
  const simPrice = document.getElementById('sim-price');
  const simPriceVal = document.getElementById('sim-price-val');
  const outInvestment = document.getElementById('out-investment');
  const outAnnualProfit = document.getElementById('out-annual-profit');
  const outTotalProfit = document.getElementById('out-total-profit');
  const projectionChart = document.getElementById('projection-chart');

  const certHolder = document.getElementById('cert-holder');
  const certLevel = document.getElementById('cert-level');
  const certTreesCount = document.getElementById('cert-trees-count');
  const certNameInput = document.getElementById('cert-name-input');
  const userRoleDisplay = document.getElementById('user-role-display');

  const membershipTiers = {
    semilla: { name: 'MIEMBRO SEMILLA', count: 10, cost: 15000000 },
    bosque: { name: 'MIEMBRO BOSQUE', count: 25, cost: 37500000 },
    reserva: { name: 'MIEMBRO RESERVA', count: 50, cost: 75000000 },
    legado: { name: 'MIEMBRO LEGADO', count: 100, cost: 150000000 }
  };

  memberCards.forEach(card => {
    card.addEventListener('click', () => {
      memberCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const level = card.getAttribute('data-level');
      clientMembershipLevel = level;
      if (clientName) {
        localStorage.setItem('salina_membership_level_' + clientName, clientMembershipLevel);
      }
      const tier = membershipTiers[level];

      // Sincronizar simulador
      simTrees.value = tier.count;
      simTreesVal.textContent = tier.count;
      
      assignTreeOwnership();
      if (selectedHectare) {
        renderTreesGrid(selectedHectare);
      }
      
      updateFinancialSimulator();
      updateCertificate();
      
      // Actualizar etiqueta de usuario lateral
      userRoleDisplay.textContent = tier.name;
    });
  });

  // --- SIMULACRO DE COMPRA ONLINE (CHECKOUT) ---
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutForm = document.getElementById('checkout-form');
  const btnCancelCheckout = document.getElementById('btn-cancel-checkout');
  const chkTierName = document.getElementById('chk-tier-name');
  const chkTreesCount = document.getElementById('chk-trees-count');
  const chkTotalPrice = document.getElementById('chk-total-price');
  const cardNameInput = document.getElementById('card-name');
  let checkoutLevel = 'semilla';

  // Registrar listeners para los botones "Comprar Online"
  const buyButtons = document.querySelectorAll('.btn-buy-now');
  buyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evitar que el clic en el botón active otras acciones de la tarjeta
      
      const card = btn.closest('.member-card-interactive');
      const level = card.getAttribute('data-level');
      checkoutLevel = level;
      const tier = membershipTiers[level];

      // Seleccionar visualmente la tarjeta de membresía
      memberCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      clientMembershipLevel = level;
      
      // Sincronizar campos de resumen del checkout
      chkTierName.textContent = tier.name;
      chkTreesCount.textContent = `${tier.count} Árboles`;
      chkTotalPrice.textContent = `$${tier.cost.toLocaleString('es-CO')} COP`;
      
      // Pre-llenar nombre de la tarjeta
      if (cardNameInput) {
        cardNameInput.value = clientName;
      }

      // Abrir modal de pago seguro
      checkoutModal.style.display = 'flex';
    });
  });

  if (btnCancelCheckout) {
    btnCancelCheckout.addEventListener('click', () => {
      checkoutModal.style.display = 'none';
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const tier = membershipTiers[checkoutLevel];
      const confirmBtn = document.getElementById('btn-confirm-payment');
      const originalText = confirmBtn.textContent;
      
      // Simular procesamiento del banco
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Procesando pago seguro... 🔒';

      setTimeout(() => {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        checkoutModal.style.display = 'none';

        // Actualizar nivel de membresía global
        clientMembershipLevel = checkoutLevel;
        if (clientName) {
          localStorage.setItem('salina_membership_level_' + clientName, clientMembershipLevel);
        }
        simTrees.value = tier.count;
        simTreesVal.textContent = tier.count;
        userRoleDisplay.textContent = tier.name;
        
        assignTreeOwnership();
        if (selectedHectare) {
          renderTreesGrid(selectedHectare);
        }
        
        updateFinancialSimulator();
        updateCertificate();

        // Mostrar confirmación
        alert(`¡PAGO EXITOSO! 🎉\n\nFelicidades, ${clientName}.\n\nHas adquirido exitosamente la membresía "${tier.name}" con un lote de ${tier.count} árboles de aguacates y mangos.\n\nDirígete a la pestaña "Hacienda Digital" para observar el desarrollo virtual de tus árboles (están destacados con borde dorado pulsante).`);

        // Registrar en logs del sistema
        logConsoleMessage(`COMPRA ONLINE: Pago aprobado por $${tier.cost.toLocaleString('es-CO')} COP. Membresía ${tier.name} asignada a ${clientName}.`, 'info');
        
        // Agregar alerta al panel
        addAlert('success', `Membresía ${tier.name} comprada online con éxito por ${clientName} (${tier.count} árboles).`);
      }, 1500);
    });
  }

  function updateFinancialSimulator() {
    const trees = parseInt(simTrees.value);
    const price = parseInt(simPrice.value);
    
    // Proyección financiera basada en el documento:
    // Inversión: $1,500,000 COP por árbol.
    const initialInvestment = trees * 1500000;
    
    // Producción madura promedio: 500 kg por árbol al año.
    // Utilidad: 65% de la venta bruta para el inversionista. 35% administración.
    const kgPerTree = 500;
    const grossIncomePerTree = kgPerTree * price;
    const netProfitPerTree = grossIncomePerTree * 0.65; // 65% neto
    
    const annualNetProfit = trees * netProfitPerTree;

    // A 10 años: Años 1-3 de crecimiento (retorno cero).
    // Año 4: 150kg de producción promedio (primer año productivo)
    // Año 5: 300kg de producción promedio
    // Año 6 a 10 (5 años): 500kg de producción promedio completa
    const profitY4 = trees * (150 * price * 0.65);
    const profitY5 = trees * (300 * price * 0.65);
    const profitY6to10 = annualNetProfit * 5;
    
    const accumulatedNetProfit = profitY4 + profitY5 + profitY6to10;

    // Actualizar outputs formateados en pesos COP
    outInvestment.textContent = `$${initialInvestment.toLocaleString('es-CO')} COP`;
    outAnnualProfit.textContent = `$${annualNetProfit.toLocaleString('es-CO')} COP`;
    outTotalProfit.textContent = `$${accumulatedNetProfit.toLocaleString('es-CO')} COP`;

    // Renderizar gráfico de barras interactivo
    renderProjectionChart(initialInvestment, profitY4, profitY5, annualNetProfit);

    // Calcular ganancia acumulada real de los árboles actuales del usuario
    calculateUserAccumulatedProfit();
  }

  function calculateUserAccumulatedProfit() {
    let totalAccumProfit = 0;
    const price = parseInt(simPrice.value) || 7000;
    
    // Recorrer los árboles asignados al usuario en la hacienda
    haciendaData.hectares.forEach(h => {
      h.trees.forEach(t => {
        if (t.owner === 'Tú') {
          const age = parseFloat(t.age);
          
          // La ganancia acumulada depende de la edad del árbol según el modelo financiero:
          // Años 1-3 (edad 0.0 a 3.0): Cero retorno.
          // Año 4 (edad 3.0 a 4.0): Producción 150 kg/árbol, 65% de margen neto.
          // Año 5 (edad 4.0 a 5.0): Producción 300 kg/árbol, 65% de margen neto.
          // Año 6+ (edad >= 5.0): Producción 500 kg/árbol al año, 65% de margen neto.
          
          let treeProfit = 0;
          
          if (age > 3.0) {
            // Fracción del año 4 transcurrida
            const y4Fraction = Math.min(1.0, age - 3.0);
            treeProfit += y4Fraction * (150 * price * 0.65);
          }
          if (age > 4.0) {
            // Fracción del año 5 transcurrida
            const y5Fraction = Math.min(1.0, age - 4.0);
            treeProfit += y5Fraction * (300 * price * 0.65);
          }
          if (age > 5.0) {
            // Años a partir del año 6 en producción plena
            const fullProdYears = age - 5.0;
            treeProfit += fullProdYears * (500 * price * 0.65);
          }
          
          totalAccumProfit += treeProfit;
        }
      });
    });
    
    const profitEl = document.getElementById('user-accumulated-profit');
    if (profitEl) {
      profitEl.textContent = `$${Math.round(totalAccumProfit).toLocaleString('es-CO')} COP`;
    }
  }

  function renderProjectionChart(initialInv, y4, y5, fullProfit) {
    projectionChart.innerHTML = '';
    
    // Datos de flujo de caja acumulados año por año para graficar
    // Año 1: -Inversión, Año 2-3: igual (negativo), Año 4: suma Y4, Año 5: suma Y5, Año 6-10: suma fullProfit
    const labels = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
    const values = [];
    
    let currentBalance = -initialInv;
    values.push(currentBalance); // Año 1
    values.push(currentBalance); // Año 2
    values.push(currentBalance); // Año 3
    
    currentBalance += y4;
    values.push(currentBalance); // Año 4
    
    currentBalance += y5;
    values.push(currentBalance); // Año 5
    
    for (let i = 6; i <= 10; i++) {
      currentBalance += fullProfit;
      values.push(currentBalance);
    }

    // Escalar altura de barras
    const maxVal = Math.max(...values.map(Math.abs));

    values.forEach((val, idx) => {
      const col = document.createElement('div');
      col.className = 'graph-bar-col';

      const barFill = document.createElement('div');
      const isNegative = val < 0;
      barFill.className = `graph-bar-fill ${isNegative ? 'negative' : ''}`;
      
      // Altura proporcional
      const percentHeight = Math.max(5, (Math.abs(val) / maxVal) * 80);
      barFill.style.height = `${percentHeight}%`;

      // Tooltip con el balance del año
      const tooltip = document.createElement('span');
      tooltip.className = 'bar-tooltip';
      tooltip.textContent = `${val >= 0 ? '+' : ''}${(val / 1000000).toFixed(1)}M`;
      barFill.appendChild(tooltip);

      const label = document.createElement('span');
      label.className = 'graph-label';
      label.textContent = labels[idx];

      col.appendChild(barFill);
      col.appendChild(label);
      projectionChart.appendChild(col);
    });
  }

  simTrees.addEventListener('input', () => {
    simTreesVal.textContent = simTrees.value;
    updateFinancialSimulator();
    // Actualizar contador del certificado
    certTreesCount.textContent = simTrees.value;
    assignTreeOwnership();
    if (selectedHectare) {
      renderTreesGrid(selectedHectare);
    }
  });

  simPrice.addEventListener('input', () => {
    simPriceVal.textContent = parseInt(simPrice.value).toLocaleString('es-CO');
    updateFinancialSimulator();
  });

  function updateCertificate() {
    certHolder.textContent = clientName.toUpperCase();
    const tier = membershipTiers[clientMembershipLevel];
    certLevel.textContent = tier.name;
    certTreesCount.textContent = simTrees.value;
  }

  certNameInput.addEventListener('input', () => {
    clientName = certNameInput.value || 'Inversionista Fundador';
    updateCertificate();
  });

  // Descargar Certificado
  const btnDownloadCert = document.getElementById('btn-download-cert');
  if (btnDownloadCert) {
    btnDownloadCert.addEventListener('click', () => {
      alert(`Certificado digital emitido con éxito a nombre de:\n\n👉 ${clientName.toUpperCase()}\n🏆 Membresía: ${membershipTiers[clientMembershipLevel].name}\n🌲 Hectáreas Asociadas: Hectáreas 1 a 4 (Fase Piloto)\n\nEl documento PDF oficial ha sido generado y firmado digitalmente por La Salina Reserve.`);
    });
  }

  // Inicializar simulator
  updateFinancialSimulator();
  updateCertificate();

  // --- PORTAL DE ADMINISTRACIÓN (MIGRADO A ADMIN.HTML) ---
  const adminConsole = document.getElementById('admin-console');

  function logConsoleMessage(msg, type = 'system') {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    if (!adminConsole) return;
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    line.textContent = `[${now}] [${type.toUpperCase()}] ${msg}`;
    adminConsole.appendChild(line);
    adminConsole.scrollTop = adminConsole.scrollHeight;
  }

  // --- ALERTA DROPDOWN EN HEADER ---
  const alertTrigger = document.getElementById('notification-trigger');
  const alertCount = document.getElementById('alert-count');
  const alertsDropdown = document.getElementById('alerts-dropdown');
  const alertsList = document.getElementById('alerts-list');
  const clearAlertsBtn = document.getElementById('clear-alerts');

  alertTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    alertsDropdown.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    alertsDropdown.classList.remove('active');
  });

  alertsDropdown.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevenir cierre al hacer click adentro
  });

  function addAlert(type, msg) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    activeAlerts.unshift({
      id: Date.now(),
      type: type,
      msg: msg,
      date: timeStr
    });
    localStorage.setItem('salina_active_alerts', JSON.stringify(activeAlerts));
    updateAlertsDropdown();
  }

  function updateAlertsDropdown() {
    alertCount.textContent = activeAlerts.length;
    
    if (activeAlerts.length === 0) {
      alertsList.innerHTML = '<li class="empty-alerts">No hay alertas activas en el sistema.</li>';
      alertCount.style.display = 'none';
      return;
    } else {
      alertCount.style.display = 'block';
    }

    alertsList.innerHTML = '';
    activeAlerts.forEach(alert => {
      const li = document.createElement('li');
      li.className = `alert-item ${alert.type === 'danger' ? 'danger-alert' : 'warning-alert'}`;
      
      const icon = alert.type === 'danger' ? '🚨' : '⚠️';
      li.innerHTML = `
        <span class="alert-icon">${icon}</span>
        <div class="alert-info">
          <p class="alert-text">${alert.msg}</p>
          <span class="alert-date">${alert.date}</span>
        </div>
      `;
      alertsList.appendChild(li);
    });
  }

  if (clearAlertsBtn) {
    clearAlertsBtn.addEventListener('click', () => {
      activeAlerts = [];
      localStorage.setItem('salina_active_alerts', JSON.stringify(activeAlerts));
      updateAlertsDropdown();
      logConsoleMessage('Alertas del sistema despejadas por el usuario.', 'system');
    });
  }

  // Inicializar alertas
  updateAlertsDropdown();

  // --- CÁLCULO DE PROYECCIÓN DE COSECHA GLOBAL INICIAL ---
  function calculateTotalProjHarvest() {
    // 5000 árboles de aguacate, 5000 árboles de mango
    // Producción madura promedio: 500 kg por árbol
    // Total proyectado anual: 10,000 * 500 = 5,000,000 kg
    document.getElementById('total-proj-harvest').textContent = '5.0M kg / año';
  }
  calculateTotalProjHarvest();

  function assignTreeOwnership() {
    // Reset ownership
    haciendaData.hectares.forEach(h => {
      h.trees.forEach(t => {
        t.owner = 'Disponible';
        t.memberTier = 'N/A';
      });
    });

    const totalTreesCount = parseInt(simTrees.value);
    const tierName = membershipTiers[clientMembershipLevel] ? membershipTiers[clientMembershipLevel].name : 'MIEMBRO SEMILLA';
    
    // Asignar el número completo de árboles a la Hectárea 1 (Aguacates) para que se destaquen todos
    const h1 = haciendaData.hectares[0];
    for (let i = 0; i < Math.min(totalTreesCount, h1.trees.length); i++) {
      h1.trees[i].owner = 'Tú';
      h1.trees[i].memberTier = tierName;
    }

    // Asignar el número completo de árboles a la Hectárea 11 (Mangos) también
    const h11 = haciendaData.hectares[10];
    for (let i = 0; i < Math.min(totalTreesCount, h11.trees.length); i++) {
      h11.trees[i].owner = 'Tú';
      h11.trees[i].memberTier = tierName;
    }

    // Guardar cambios en localStorage
    localStorage.setItem('salina_hacienda_data', JSON.stringify(haciendaData));
  }

  // Initial assignment
  assignTreeOwnership();

  // Verificar si hay sesión previa guardada de forma segura
  const savedSession = localStorage.getItem('salina_session_active');
  const savedName = localStorage.getItem('salina_client_name');
  if (savedSession === 'true' && savedName) {
    initUserSession(savedName);
  }
});
