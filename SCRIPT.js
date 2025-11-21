// ============================================
// SALA DO FUTURO - AUTOMAÇÃO INTELIGENTE
// ============================================

let loadedPlugins = [];
let automationActive = true;

console.clear();
const noop = () => {};
console.warn = console.error = window.debug = noop;

// ============================================
// SISTEMA DE EVENTOS
// ============================================
class EventEmitter {
  constructor() { 
    this.events = {}; 
  }
  
  on(event, handler) {
    (Array.isArray(event) ? event : [event]).forEach(e => {
      (this.events[e] = this.events[e] || []).push(handler);
    });
  }
  
  off(event, handler) {
    (Array.isArray(event) ? event : [event]).forEach(e => {
      if (this.events[e]) {
        this.events[e] = this.events[e].filter(h => h !== handler);
      }
    });
  }
  
  emit(event, ...args) {
    this.events[event]?.forEach(handler => handler(...args));
  }
  
  once(event, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

const automationSystem = new EventEmitter();

// ============================================
// OBSERVER DE MUTAÇÕES
// ============================================
new MutationObserver(mutationsList => {
  if (mutationsList.some(m => m.type === 'childList')) {
    automationSystem.emit('domChanged');
  }
}).observe(document.body, { 
  childList: true, 
  subtree: true 
});

// ============================================
// UTILITÁRIOS
// ============================================
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function showNotification(text, duration = 4000, type = 'info') {
  const colors = {
    info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    warning: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
    error: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'
  };

  Toastify({
    text,
    duration,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true,
    style: { 
      background: colors[type] || colors.info,
      borderRadius: '8px',
      fontWeight: '500'
    }
  }).showToast();
}

// ============================================
// SPLASH SCREEN
// ============================================
async function showSplashScreen() {
  const splash = document.createElement('div');
  splash.id = 'automation-splash';
  splash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    opacity: 0;
    transition: opacity 0.5s ease;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    flex-direction: column;
    gap: 20px;
  `;

  splash.innerHTML = `
    <div style="font-size: 48px; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
      ⚡ SALA DO FUTURO
    </div>
    <div style="font-size: 20px; opacity: 0.9;">
      Sistema de Automação Inteligente
    </div>
    <div style="margin-top: 20px;">
      <div class="loader" style="
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255,255,255,0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(splash);
  setTimeout(() => splash.style.opacity = '1', 10);

  return splash;
}

async function hideSplashScreen(splash) {
  splash.style.opacity = '0';
  setTimeout(() => splash.remove(), 500);
}

// ============================================
// CARREGAMENTO DE RECURSOS
// ============================================
async function loadScript(url, label) {
  try {
    const response = await fetch(url);
    const script = await response.text();
    loadedPlugins.push(label);
    eval(script);
    return true;
  } catch (error) {
    console.error(`Erro ao carregar ${label}:`, error);
    return false;
  }
}

async function loadCss(url) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

// ============================================
// INTERCEPTOR DE REQUISIÇÕES
// ============================================
function setupRequestInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function(input, init) {
    let body;
    
    if (input instanceof Request) {
      body = await input.clone().text();
    } else if (init?.body) {
      body = init.body;
    }

    // Intercepta requisições específicas
    if (body) {
      try {
        let bodyObj = JSON.parse(body);
        
        // Exemplo: Auto-completar progresso
        if (bodyObj.operationName === 'updateProgress') {
          bodyObj.variables.progress = 100;
          body = JSON.stringify(bodyObj);
          
          if (input instanceof Request) {
            input = new Request(input, { body });
          } else {
            init.body = body;
          }
          
          showNotification("✅ Progresso atualizado automaticamente!", 2000, 'success');
        }
      } catch (e) {
        // Ignora erros de parse
      }
    }

    return originalFetch.apply(this, arguments);
  };
}

// ============================================
// SISTEMA DE AUTOMAÇÃO PRINCIPAL
// ============================================
async function setupAutomation() {
  let taskCount = 0;

  while (automationActive) {
    let actionTaken = false;

    // 1. BUSCA POR BOTÕES DE AÇÃO
    const actionButtons = document.querySelectorAll(`
      button:not([disabled]),
      [role="button"]:not([disabled]),
      input[type="submit"]:not([disabled])
    `);

    for (const button of actionButtons) {
      const text = (button.textContent || button.value || '').trim().toLowerCase();
      const isVisible = button.offsetParent !== null;

      if (!isVisible) continue;

      // Lista de ações automáticas
      const autoActions = [
        'próximo', 'next', 'continuar', 'continue',
        'enviar', 'submit', 'concluir', 'complete',
        'verificar', 'check', 'confirmar', 'confirm'
      ];

      // Lista de ações a ignorar
      const ignoreActions = [
        'cancelar', 'cancel', 'fechar', 'close',
        'sair', 'exit', 'voltar', 'back'
      ];

      const shouldClick = autoActions.some(action => text.includes(action));
      const shouldIgnore = ignoreActions.some(action => text.includes(action));

      if (shouldClick && !shouldIgnore) {
        button.click();
        taskCount++;
        actionTaken = true;
        showNotification(`🎯 Tarefa ${taskCount} executada!`, 2000, 'success');
        await delay(1000);
        break;
      }
    }

    // 2. BUSCA POR RESPOSTAS AUTOMÁTICAS
    if (!actionTaken) {
      const correctAnswers = document.querySelectorAll('[data-correct="true"], .correct-answer, [aria-label*="correta"]');
      
      for (const answer of correctAnswers) {
        if (answer.offsetParent !== null) {
          answer.click();
          actionTaken = true;
          await delay(800);
          break;
        }
      }
    }

    // 3. AUTO-PREENCHER CAMPOS
    if (!actionTaken) {
      const inputs = document.querySelectorAll('input[type="text"]:not([disabled]), textarea:not([disabled])');
      
      for (const input of inputs) {
        if (input.offsetParent !== null && !input.value) {
          const placeholder = input.placeholder?.toLowerCase() || '';
          
          if (placeholder.includes('nome')) {
            input.value = 'Usuário Automático';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            actionTaken = true;
            break;
          }
        }
      }
    }

    await delay(actionTaken ? 1000 : 2000);
  }
}

// ============================================
// PAINEL DE CONTROLE
// ============================================
function createControlPanel() {
  const panel = document.createElement('div');
  panel.id = 'automation-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 15px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-width: 200px;
  `;

  panel.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 10px; color: #667eea;">
      ⚡ Automação
    </div>
    <button id="toggle-automation" style="
      width: 100%;
      padding: 8px;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s;
    ">
      ${automationActive ? '⏸️ Pausar' : '▶️ Iniciar'}
    </button>
  `;

  document.body.appendChild(panel);

  const toggleBtn = document.getElementById('toggle-automation');
  toggleBtn.addEventListener('click', () => {
    automationActive = !automationActive;
    toggleBtn.textContent = automationActive ? '⏸️ Pausar' : '▶️ Iniciar';
    showNotification(
      automationActive ? '▶️ Automação iniciada!' : '⏸️ Automação pausada!',
      2000,
      automationActive ? 'success' : 'warning'
    );
    if (automationActive) setupAutomation();
  });

  toggleBtn.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.05)';
  });
  toggleBtn.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
  });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
(async function init() {
  const splash = await showSplashScreen();

  // Carrega dependências
  await Promise.all([
    loadCss('https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css'),
    loadScript('https://cdn.jsdelivr.net/npm/toastify-js', 'toastify')
  ]);

  await delay(2000);
  await hideSplashScreen(splash);

  // Inicializa sistemas
  setupRequestInterceptor();
  createControlPanel();
  setupAutomation();

  showNotification('🚀 Sistema de Automação ativado!', 3000, 'success');
  
  console.clear();
  console.log('%c⚡ SALA DO FUTURO', 'font-size: 24px; font-weight: bold; color: #667eea;');
  console.log('%cSistema de Automação Inteligente v1.0', 'color: #764ba2;');
})();