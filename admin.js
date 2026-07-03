// ==========================================================================
// LA SALINA RESERVE - ADMIN DASHBOARD LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --- BASE DE DATOS DE HACIENDA VIRTUAL ---
  let haciendaData = {
    hectares: [],
    alerts: []
  };
  let activeAlerts = [];

  const membershipTiers = {
    semilla: { name: 'MIEMBRO SEMILLA', count: 10, cost: 15000000 },
    bosque: { name: 'MIEMBRO BOSQUE', count: 25, cost: 37500000 },
    reserva: { name: 'MIEMBRO RESERVA', count: 50, cost: 75000000 },
    legado: { name: 'MIEMBRO LEGADO', count: 100, cost: 150000000 }
  };

  // Cargar datos de localStorage
  function loadDatabase() {
    const savedHacienda = localStorage.getItem('salina_hacienda_data');
    if (savedHacienda) {
      try {
        haciendaData = JSON.parse(savedHacienda);
      } catch (e) {
        console.error("Error parsing hacienda data", e);
      }
    }
    
    // Generación Procedural si no hay datos (primera vez o localStorage limpio)
    if (!savedHacienda || !haciendaData.hectares || haciendaData.hectares.length === 0) {
      haciendaData = { hectares: [], alerts: [] };
      for (let h = 1; h <= 20; h++) {
        const isAvocado = h <= 10;
        const type = isAvocado ? 'Aguacate' : 'Mango';
        
        const hectare = {
          id: h,
          type: type,
          name: `Hectárea ${h}`,
          healthScore: 95 + Math.random() * 5,
          averageMoisture: 60 + Math.round(Math.random() * 15),
          averageTemp: 22 + Math.random() * 5,
          stage: h % 4 === 0 ? 'Fructificación' : (h % 3 === 0 ? 'Floración' : 'Cosecha'),
          trees: []
        };

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

        for (let t = 1; t <= 500; t++) {
          const idStr = `LSA-${isAvocado ? 'AGU' : 'MAN'}-${h.toString().padStart(2, '0')}-${t.toString().padStart(3, '0')}`;
          const randomAge = minAge + Math.random() * (maxAge - minAge);
          
          let stage = 'Siembra';
          if (randomAge >= 3.0) stage = 'Cosecha';
          else if (randomAge >= 2.2) stage = 'Fructificación';
          else if (randomAge >= 1.5) stage = 'Floración';
          else if (randomAge >= 0.8) stage = 'Vegetativo';

          let size = (randomAge * 1.1).toFixed(1);
          if (parseFloat(size) < 0.4) size = '0.4';

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
    
    const savedAlerts = localStorage.getItem('salina_active_alerts');
    if (savedAlerts) {
      try {
        activeAlerts = JSON.parse(savedAlerts);
      } catch (e) {
        console.error("Error parsing alerts data", e);
      }
    }
  }

  function saveDatabase() {
    localStorage.setItem('salina_hacienda_data', JSON.stringify(haciendaData));
    localStorage.setItem('salina_active_alerts', JSON.stringify(activeAlerts));
  }

  // --- ESCANEO DE INVERSIONISTAS EN LOCALSTORAGE ---
  function getInvestorsList() {
    const investors = [];
    const defaults = [
      { name: 'Juan Pérez', email: 'juan.perez@lasalina.com', level: 'semilla' },
      { name: 'María Gómez', email: 'maria.gomez@lasalina.com', level: 'bosque' },
      { name: 'Carlos Restrepo', email: 'carlos.restrepo@lasalina.com', level: 'legado' }
    ];

    // Cargar predeterminados
    defaults.forEach(d => {
      const savedLevel = localStorage.getItem('salina_membership_level_' + d.name);
      investors.push({
        name: d.name,
        email: d.email,
        level: savedLevel || d.level
      });
      // Asegurar que estén en localStorage si no existen
      if (!savedLevel) {
        localStorage.setItem('salina_membership_level_' + d.name, d.level);
      }
    });

    // Escanear otras claves de localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('salina_membership_level_')) {
        const name = key.replace('salina_membership_level_', '');
        if (!investors.some(inv => inv.name === name)) {
          const level = localStorage.getItem(key);
          const email = localStorage.getItem('salina_email_' + name) || `${name.toLowerCase().replace(/\s+/g, '.')}@lasalina.com`;
          investors.push({ name, email, level });
        }
      }
    }
    return investors;
  }

  // --- CÁLCULO DE GANANCIAS SIMULADAS PARA LA TABLA ---
  function calculateUserAccumulatedProfit(level) {
    const counts = { semilla: 10, bosque: 25, reserva: 50, legado: 100 };
    const totalTreesCount = counts[level] || 10;
    const price = 7000; // Precio por defecto para simulador administrador
    let totalAccumProfit = 0;
    
    const h1 = haciendaData.hectares[0];
    const h11 = haciendaData.hectares[10];
    
    if (h1 && h1.trees) {
      for (let i = 0; i < Math.min(totalTreesCount, h1.trees.length); i++) {
        const age = parseFloat(h1.trees[i].age);
        let treeProfit = 0;
        if (age > 3.0) {
          const y4Fraction = Math.min(1.0, age - 3.0);
          treeProfit += y4Fraction * (150 * price * 0.65);
        }
        if (age > 4.0) {
          const y5Fraction = Math.min(1.0, age - 4.0);
          treeProfit += y5Fraction * (300 * price * 0.65);
        }
        if (age > 5.0) {
          const fullProdYears = age - 5.0;
          treeProfit += fullProdYears * (500 * price * 0.65);
        }
        totalAccumProfit += treeProfit;
      }
    }
    
    if (h11 && h11.trees) {
      for (let i = 0; i < Math.min(totalTreesCount, h11.trees.length); i++) {
        const age = parseFloat(h11.trees[i].age);
        let treeProfit = 0;
        if (age > 3.0) {
          const y4Fraction = Math.min(1.0, age - 3.0);
          treeProfit += y4Fraction * (150 * price * 0.65);
        }
        if (age > 4.0) {
          const y5Fraction = Math.min(1.0, age - 4.0);
          treeProfit += y5Fraction * (300 * price * 0.65);
        }
        if (age > 5.0) {
          const fullProdYears = age - 5.0;
          treeProfit += fullProdYears * (500 * price * 0.65);
        }
        totalAccumProfit += treeProfit;
      }
    }
    
    return totalAccumProfit;
  }

  // --- RENDERIZACIÓN DE LA UI ---
  const kpiInvestors = document.getElementById('kpi-investors');
  const kpiHealth = document.getElementById('kpi-health');
  const kpiInvestment = document.getElementById('kpi-investment');
  const investorsTableBody = document.getElementById('investors-table-body');
  const adminConsole = document.getElementById('admin-console');

  function logConsoleMessage(msg, type = 'system') {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    line.textContent = `[${now}] [${type.toUpperCase()}] ${msg}`;
    adminConsole.appendChild(line);
    adminConsole.scrollTop = adminConsole.scrollHeight;
  }

  function renderAdminPanel() {
    loadDatabase();
    const investors = getInvestorsList();
    
    // 1. Render KPIs
    kpiInvestors.textContent = investors.length;
    
    let totalHealth = 0;
    haciendaData.hectares.forEach(h => totalHealth += h.healthScore);
    const avgHealth = haciendaData.hectares.length > 0 ? (totalHealth / haciendaData.hectares.length) : 98.4;
    kpiHealth.textContent = `${avgHealth.toFixed(1)}%`;
    
    let totalInvestment = 0;
    investors.forEach(inv => {
      const tier = membershipTiers[inv.level];
      if (tier) totalInvestment += tier.cost;
    });
    kpiInvestment.textContent = `$${totalInvestment.toLocaleString('es-CO')} COP`;

    // 2. Render Tabla de Inversionistas
    investorsTableBody.innerHTML = '';
    investors.forEach(inv => {
      const tier = membershipTiers[inv.level] || { name: 'Semilla', count: 10 };
      const profit = calculateUserAccumulatedProfit(inv.level);
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${inv.name}</strong></td>
        <td><span style="color: rgba(255,255,255,0.5); font-size: 0.8rem;">${inv.email}</span></td>
        <td><span class="badge-level badge-${inv.level}">${tier.name}</span></td>
        <td>${tier.count * 2} árboles <small style="color: var(--text-secondary);">(H1 y H11)</small></td>
        <td class="text-gold" style="font-weight:600;">$${Math.round(profit).toLocaleString('es-CO')}</td>
        <td>
          <select class="select-admin-level" data-user="${inv.name}">
            <option value="semilla" ${inv.level === 'semilla' ? 'selected' : ''}>Semilla</option>
            <option value="bosque" ${inv.level === 'bosque' ? 'selected' : ''}>Bosque</option>
            <option value="reserva" ${inv.level === 'reserva' ? 'selected' : ''}>Reserva</option>
            <option value="legado" ${inv.level === 'legado' ? 'selected' : ''}>Legado</option>
          </select>
        </td>
      `;
      investorsTableBody.appendChild(tr);
    });

    // Asignar listeners a los selectores de la tabla
    const selectors = document.querySelectorAll('.select-admin-level');
    selectors.forEach(sel => {
      sel.addEventListener('change', (e) => {
        const userName = sel.getAttribute('data-user');
        const newLevel = sel.value;
        
        // Guardar en localStorage
        localStorage.setItem('salina_membership_level_' + userName, newLevel);
        
        logConsoleMessage(`Asignación cambiada: Inversionista '${userName}' ahora ostenta membresía '${newLevel.toUpperCase()}'.`, 'info');
        
        // Sincronizar los árboles del usuario activo de inmediato si es el que modificamos
        const savedName = localStorage.getItem('salina_client_name');
        if (savedName === userName) {
          localStorage.setItem('salina_session_active', 'true'); // Forzar recarga limpia
        }
        
        // Rerenderizar panel
        renderAdminPanel();
      });
    });
  }

  // --- ELEMENTOS DEL FORMULARIO DE ACTUALIZACIÓN DE HECTÁREAS ---
  const adminForm = document.getElementById('admin-update-form');
  const adminSector = document.getElementById('admin-sector');
  const adminStageSelect = document.getElementById('admin-stage-select');
  const adminHealth = document.getElementById('admin-health');
  const adminYieldOverride = document.getElementById('admin-yield-override');
  const adminMoistureVal = document.getElementById('admin-moisture-val');
  const adminTempVal = document.getElementById('admin-temp-val');
  const adminLogInput = document.getElementById('admin-log-input');

  const lblMoisture = document.getElementById('lbl-moisture');
  const lblTemp = document.getElementById('lbl-temp');

  if (adminMoistureVal) {
    adminMoistureVal.addEventListener('input', () => {
      lblMoisture.textContent = `${adminMoistureVal.value}%`;
    });
  }
  if (adminTempVal) {
    adminTempVal.addEventListener('input', () => {
      lblTemp.textContent = `${adminTempVal.value}°C`;
    });
  }

  // Enviar formulario de administración
  if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const sectorId = parseInt(adminSector.value);
      const stage = adminStageSelect.value;
      const phase = document.getElementById('admin-phase-select').value;
      const health = adminHealth.value;
      const moisture = parseInt(adminMoistureVal.value);
      const temp = parseInt(adminTempVal.value);
      const customLog = adminLogInput.value;

      loadDatabase();

      // Buscar hectárea afectada
      const hectare = haciendaData.hectares.find(h => h.id === sectorId);
      if (hectare) {
        hectare.stage = stage;
        hectare.averageMoisture = moisture;
        hectare.averageTemp = temp;
        
        // Modificar todos los árboles de la hectárea con las nuevas métricas
        hectare.trees.forEach(tree => {
          tree.stage = stage;
          tree.health = health;
          tree.phase = phase;
          tree.moisture = Math.round(moisture + (Math.random() * 6 - 3));
          
          if (phase === 'Fase 1 - Piloto') {
            tree.planted = 'Junio 2026';
            tree.age = '3.5';
            tree.size = '3.8 metros';
          } else if (phase === 'Fase 2 - Expansión') {
            tree.planted = 'Enero 2027';
            tree.age = '2.2';
            tree.size = '2.4 metros';
          } else {
            tree.planted = 'Marzo 2029';
            tree.age = '0.5';
            tree.size = '0.7 metros';
          }
          
          if (customLog) {
            const today = new Date().toLocaleDateString('es-CO');
            tree.logs.unshift({ date: today, text: customLog });
          }
        });

        // Recalcular score de salud
        if (health === 'Excelente') hectare.healthScore = 98 + Math.random() * 2;
        else if (health === 'Monitoreo') hectare.healthScore = 91 + Math.random() * 3;
        else hectare.healthScore = 80 + Math.random() * 5;

        saveDatabase();
        logConsoleMessage(`Hectárea ${sectorId} (${hectare.type}) actualizada a etapa '${stage}', salud '${health}' y humedad '${moisture}%'.`, 'info');
        
        // Resetear form log
        adminLogInput.value = '';
        renderAdminPanel();
        alert(`¡Sincronización Exitosa! 🎉\n\nLa Hectárea ${sectorId} ha sido actualizada en la base de datos central y los sensores de telemetría IoT reflejan la nueva humedad del ${moisture}% en el gemelo digital.`);
      }
    });
  }

  // --- BOTONES DE SIMULACIÓN DE EMERGENCIAS ---
  const btnSimDry = document.getElementById('btn-sim-dry');
  const btnSimPest = document.getElementById('btn-sim-pest');
  const btnSimRain = document.getElementById('btn-sim-rain');
  const btnSimReset = document.getElementById('btn-sim-reset');

  function addAlert(type, msg) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    activeAlerts.unshift({
      id: Date.now(),
      type: type,
      msg: msg,
      date: timeStr
    });
  }

  if (btnSimDry) {
    btnSimDry.addEventListener('click', () => {
      loadDatabase();
      const h5 = haciendaData.hectares.find(h => h.id === 5);
      if (h5) {
        h5.averageMoisture = 22;
        h5.trees.forEach(t => {
          t.moisture = 22;
          t.health = 'Monitoreo';
          t.logs.unshift({ date: new Date().toLocaleDateString('es-CO'), text: 'ALERTA: Sensor de humedad del suelo detectó humedad crítica por debajo del 25%.' });
        });
        h5.healthScore = 82;
        
        addAlert('danger', 'Hectárea 5: Humedad crítica del suelo (22%). Se requiere riego inmediato.');
        saveDatabase();
        
        logConsoleMessage('Simulación de sequía activada en Hectárea 5. Humedad cae al 22%.', 'warn');
        alert('Simulación de Sequía Activada ⚠️\n\nSe ha enviado una alerta de telemetría crítica de humedad baja (22%) para la Hectárea 5 al portal de miembros.');
      }
    });
  }

  if (btnSimPest) {
    btnSimPest.addEventListener('click', () => {
      loadDatabase();
      const h2 = haciendaData.hectares.find(h => h.id === 2);
      if (h2) {
        h2.healthScore = 74;
        h2.trees.slice(0, 15).forEach(t => {
          t.health = 'Tratamiento';
          t.logs.unshift({ date: new Date().toLocaleDateString('es-CO'), text: 'ALERTA: Presencia atípica de masticadores de hoja. Iniciando tratamiento orgánico de neem.' });
        });
        
        addAlert('danger', 'Hectárea 2: Reporte fitosanitario reporta presencia de plaga. Aplicando control biológico.');
        saveDatabase();
        
        logConsoleMessage('Simulación de plaga activada en Hectárea 2. 15 árboles infectados.', 'error');
        alert('Simulación de Plaga Activada 🐛\n\nSe reportó una plaga en la Hectárea 2. Drones fitosanitarios y biólogos del predio han sido notificados.');
      }
    });
  }

  if (btnSimRain) {
    btnSimRain.addEventListener('click', () => {
      loadDatabase();
      haciendaData.hectares.forEach(h => {
        h.averageMoisture = 72;
        h.trees.forEach(t => t.moisture = 72);
      });
      
      addAlert('success', 'Hacienda: Riego automático por goteo completado. Humedad estable en 72%.');
      saveDatabase();
      
      logConsoleMessage('Riego automático activado. Humedad promedio restablecida a 72%.', 'info');
      alert('Riego Automático Completado 💧\n\nSe activaron los aspersores e inyectores de riego por goteo teledirigidos. Humedad restablecida al 72% en todas las hectáreas.');
    });
  }

  if (btnSimReset) {
    btnSimReset.addEventListener('click', () => {
      loadDatabase();
      haciendaData.hectares.forEach(h => {
        h.healthScore = h.id % 2 === 0 ? 98.6 : 99.2;
        h.averageMoisture = 65;
        h.trees.forEach(t => {
          t.health = 'Excelente';
          t.moisture = 65;
        });
      });
      activeAlerts = [];
      saveDatabase();
      
      logConsoleMessage('Hacienda restablecida a condiciones óptimas estándar.', 'system');
      alert('Hacienda Restablecida ✨\n\nSe limpiaron todas las alertas activas y los niveles de telemetría y salud han sido normalizados.');
      renderAdminPanel();
    });
  }

  // Inicializar Panel
  renderAdminPanel();
});
