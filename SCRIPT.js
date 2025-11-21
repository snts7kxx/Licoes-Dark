
let loadedPlugins = [];

console.clear();
const noop = () => {};
console.warn = console.error = window.debug = noop;

const splashScreen = document.createElement('div');

class EventEmitter {
  constructor() { this.events = {}; }
  on(t, e) {
    (Array.isArray(t) ? t : [t]).forEach(t => {
      (this.events[t] = this.events[t] || []).push(e);
    });
  }
  off(t, e) {
    (Array.isArray(t) ? t : [t]).forEach(t => {
      this.events[t] && (this.events[t] = this.events[t].filter(h => h !== e));
    });
  }
  emit(t, ...e) {
    this.events[t]?.forEach(h => h(...e));
  }
  once(t, e) {
    const s = (...i) => {
      e(...i);
      this.off(t, s);
    };
    this.on(t, s);
  }
}

const salaFuturoEmitter = new EventEmitter();

// Observer para mudanças no DOM
new MutationObserver(mutationsList => 
  mutationsList.some(m => m.type === 'childList') && salaFuturoEmitter.emit('domChanged')
).observe(document.body, { childList: true, subtree: true });

// Funções helpers
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function sendToast(text, duration = 5000) {
  // Toast simples sem dependências externas
  const toast = document.createElement('div');
  toast.textContent = text;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #000;
    color: #fff;
    padding: 16px 24px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 99999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

async function showSplashScreen() {
  splashScreen.style.cssText = `
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
    user-select: none;
    color: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 48px;
    text-align: center;
    flex-direction: column;
  `;

  splashScreen.innerHTML = `
    <div style="margin-bottom: 20px;">
      <span style="color: white; text-shadow: 0 0 20px rgba(255,255,255,0.5);">
        <strong>TAREFAS</strong>
      </span>
      <span style="color: #00ff88; text-shadow: 0 0 20px rgba(0,255,136,0.5);">
        <strong>DARK</strong>
      </span>
    </div>
    <div style="font-size: 16px; opacity: 0.8;">Iniciando automação...</div>
  `;
  
  document.body.appendChild(splashScreen);
  setTimeout(() => splashScreen.style.opacity = '1', 10);
}

async function hideSplashScreen() {
  splashScreen.style.opacity = '0';
  setTimeout(() => splashScreen.remove(), 500);
}

function setupMain() {
  const originalFetch = window.fetch;
  
  // Intercepta requisições
  window.fetch = async function(input, init) {
    let url = input instanceof Request ? input.url : input;
    let body = init?.body || (input instanceof Request ? await input.clone().text() : null);
    
    // Detecta requisições de tarefas
    if (body) {
      try {
        let bodyObj = typeof body === 'string' ? JSON.parse(body) : body;
        
        // Intercepta submissão de tarefas
        if (url.includes('/api/') && (
          url.includes('task') || 
          url.includes('assignment') || 
          url.includes('activity')
        )) {
          // Modifica para marcar como concluído
          if (bodyObj.status === 'pending' || bodyObj.status === 'A Fazer') {
            bodyObj.status = 'completed';
            bodyObj.progress = 100;
            bodyObj.completed = true;
            bodyObj.completedAt = new Date().toISOString();
            
            body = JSON.stringify(bodyObj);
            
            if (input instanceof Request) {
              input = new Request(input, { body });
            } else {
              init.body = body;
            }
            
            sendToast("✅ Tarefa concluída automaticamente!", 2500);
          }
        }
        
        // Intercepta carregamento de tarefas para auto-completar
        if (url.includes('/api/') && url.includes('tasks')) {
          const response = await originalFetch.apply(this, arguments);
          const clonedResponse = response.clone();
          
          try {
            const data = await clonedResponse.json();
            
            // Modifica lista de tarefas
            if (Array.isArray(data.tasks)) {
              data.tasks = data.tasks.map(task => ({
                ...task,
                status: 'completed',
                progress: 100,
                completed: true
              }));
              
              return new Response(JSON.stringify(data), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            }
          } catch (e) {
            console.log('Erro ao processar resposta:', e);
          }
          
          return response;
        }
        
      } catch (e) {
        console.log('Erro ao processar body:', e);
      }
    }
    
    return originalFetch.apply(this, arguments);
  };
  
  // Auto-clicker para interface
  (async () => {
    window.salaFuturoActive = true;
    let tasksCompleted = 0;
    
    while (window.salaFuturoActive) {
      let clicked = false;
      
      // Procura por botões de "Concluir" ou "Entregar"
      const actionButtons = [
        'button:contains("Concluir")',
        'button:contains("Entregar")',
        'button:contains("Finalizar")',
        'button:contains("Enviar")',
        '[data-action="complete"]',
        '[data-action="submit"]',
        '.complete-button',
        '.submit-button'
      ];
      
      // Busca todos os botões
      const buttons = document.querySelectorAll('button, [role="button"], a.button');
      
      for (const button of buttons) {
        const text = (button.textContent || button.innerText || '').trim().toLowerCase();
        const isVisible = button.offsetParent !== null && !button.disabled;
        
        // Identifica botões de ação
        if (isVisible && (
          text.includes('concluir') ||
          text.includes('entregar') ||
          text.includes('finalizar') ||
          text.includes('enviar') ||
          text.includes('marcar como concluída')
        )) {
          button.click();
          clicked = true;
          tasksCompleted++;
          sendToast(`🎯 Tarefa ${tasksCompleted} concluída!`, 2000);
          await delay(1500);
          break;
        }
      }
      
      // Procura por checkboxes de tarefas
      if (!clicked) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(:checked)');
        
        for (const checkbox of checkboxes) {
          const isVisible = checkbox.offsetParent !== null && !checkbox.disabled;
          
          if (isVisible) {
            // Verifica se é checkbox de tarefa
            const parent = checkbox.closest('[data-task], [class*="task"], [class*="activity"]');
            
            if (parent) {
              checkbox.click();
              clicked = true;
              await delay(800);
              break;
            }
          }
        }
      }
      
      // Procura por cards de tarefas clicáveis
      if (!clicked) {
        const taskCards = document.querySelectorAll('[data-status="A Fazer"], [class*="task-card"]');
        
        for (const card of taskCards) {
          const completeBtn = card.querySelector('button, [role="button"]');
          
          if (completeBtn && completeBtn.offsetParent !== null) {
            completeBtn.click();
            clicked = true;
            await delay(1000);
            break;
          }
        }
      }
      
      // Procura botão "Próxima tarefa"
      if (!clicked) {
        const nextButtons = document.querySelectorAll('button, [role="button"]');
        
        for (const button of nextButtons) {
          const text = (button.textContent || '').trim().toLowerCase();
          const isVisible = button.offsetParent !== null && !button.disabled;
          
          if (isVisible && (
            text.includes('próxima') ||
            text.includes('continuar') ||
            text.includes('avançar')
          )) {
            button.click();
            clicked = true;
            await delay(1200);
            break;
          }
        }
      }
      
      await delay(clicked ? 1000 : 2000);
    }
  })();
  
  // Atalho de teclado para parar
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'p') {
      window.salaFuturoActive = !window.salaFuturoActive;
      sendToast(
        window.salaFuturoActive ? 
        '▶️ Automação ativada' : 
        '⏸️ Automação pausada',
        2000
      );
    }
  });
}

// Verifica se está no domínio correto
const validDomains = [
  'cmsp.ip.tv',
  'salafuturo',
  'educacao.sp.gov.br'
];

const isValidDomain = validDomains.some(domain => 
  window.location.href.includes(domain)
);

if (!isValidDomain) {
  sendToast('⚠️ Este script funciona apenas no Sala do Futuro!', 5000);
} else {
  (async function init() {
    await showSplashScreen();
    await delay(2000);
    await hideSplashScreen();
    
    setupMain();
    
    sendToast('🚀 Sala Auto iniciado! Use Ctrl+P para pausar/continuar', 4000);
    console.clear();
    console.log('%c🚀 Sala Auto ativo!', 'color: #00ff88; font-size: 20px; font-weight: bold;');
    console.log('%cCtrl+P para pausar/continuar', 'color: #888; font-size: 12px;');
  })();
}