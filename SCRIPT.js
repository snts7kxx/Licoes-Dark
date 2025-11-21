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

const salaDark = new EventEmitter();

// Observer otimizado
new MutationObserver(mutationsList => 
  mutationsList.some(m => m.type === 'childList') && salaDark.emit('domChanged')
).observe(document.body, { childList: true, subtree: true });

// Funções helpers
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function sendToast(text, duration = 5000, gravity = 'bottom') {
  const toast = document.createElement('div');
  toast.textContent = text;
  toast.style.cssText = `
    position: fixed;
    ${gravity === 'top' ? 'top: 20px;' : 'bottom: 20px;'}
    left: 50%;
    transform: translateX(-50%);
    background: #000000;
    color: #ffffff;
    padding: 16px 24px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: toastSlide 0.3s ease;
  `;
  
  if (!document.querySelector('#toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
      @keyframes toastSlide {
        from { opacity: 0; transform: translate(-50%, ${gravity === 'top' ? '-20px' : '20px'}); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlide 0.3s ease reverse';
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
    background-color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 1.5s ease;
    user-select: none;
    color: white;
    font-family: MuseoSans, sans-serif;
    font-size: 35px;
    text-align: center;
  `;

  splashScreen.innerHTML = `
    <span style="color:white;text-shadow: 0 0 0.5px rgba(255,255,255,1);">
      <strong>SALA</strong>
    </span>
    <span style="color:#667eea;text-shadow: 0 0 0.5px rgba(102,126,234,1);">
      <strong>DARK</strong>
    </span>
  `;
  
  document.body.appendChild(splashScreen);
  setTimeout(() => splashScreen.style.opacity = '1', 10);
}

async function hideSplashScreen() {
  splashScreen.style.opacity = '0';
  setTimeout(() => splashScreen.remove(), 2300);
}

function setupMain() {
  const originalFetch = window.fetch;

  // Intercepta requisições
  window.fetch = async function(input, init) {
    let body;
    if (input instanceof Request) {
      body = await input.clone().text();
    } else if (init?.body) {
      body = init.body;
    }

    // Intercepta submissão de tarefas
    if (body?.includes('task') || body?.includes('assignment') || body?.includes('activity')) {
      try {
        let bodyObj = JSON.parse(body);
        
        // Modifica status para concluído
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

          sendToast("🔄 | Tarefa concluída!", 2500);
        }
      } catch (e) {}
    }

    // Intercepta progresso de vídeos
    if (body?.includes('videoProgress') || body?.includes('video_progress')) {
      try {
        let bodyObj = JSON.parse(body);
        if (bodyObj.duration || bodyObj.durationSeconds) {
          const duration = bodyObj.duration || bodyObj.durationSeconds;
          bodyObj.currentTime = duration;
          bodyObj.watched = duration;
          bodyObj.progress = 100;
          body = JSON.stringify(bodyObj);

          if (input instanceof Request) {
            input = new Request(input, { body });
          } else {
            init.body = body;
          }

          sendToast("🎬 | Vídeo concluído!", 2500);
        }
      } catch (e) {}
    }

    const originalResponse = await originalFetch.apply(this, arguments);

    // Intercepta respostas de questões
    try {
      const clonedResponse = originalResponse.clone();
      const responseBody = await clonedResponse.text();
      let responseObj = JSON.parse(responseBody);

      // Modifica questões para auto-completar
      if (responseObj?.question || responseObj?.questions) {
        let question = responseObj.question || responseObj.questions[0];
        
        if (question && question.type) {
          // Marca alternativa correta automaticamente
          question.correctAnswer = "A";
          question.userAnswer = "A";
          question.isCorrect = true;
          
          responseObj.question = question;
          
          return new Response(JSON.stringify(responseObj), {
            status: originalResponse.status,
            statusText: originalResponse.statusText,
            headers: originalResponse.headers
          });
        }
      }
    } catch (e) {}

    return originalResponse;
  };

  // Auto-clicker principal
  (async () => {
    window.salaDarkActive = true;
    let tasksCompleted = 0;

    while (window.salaDarkActive) {
      let clicked = false;

      // Lista de textos de botões para procurar
      const buttonTexts = [
        'concluir',
        'entregar',
        'finalizar',
        'enviar',
        'marcar como concluída',
        'completar',
        'fazer tarefa',
        'iniciar',
        'começar',
        'responder',
        'próxima',
        'continuar',
        'avançar',
        'confirmar',
        'salvar',
        'verificar',
        'check',
        'next',
        'submit'
      ];

      // Procura por todos os elementos clicáveis
      const allElements = document.querySelectorAll('*');
      
      for (const el of allElements) {
        const text = (el.textContent || '').trim().toLowerCase();
        const isVisible = el.offsetParent !== null;
        
        // Verifica se o elemento contém algum texto de botão
        if (isVisible && buttonTexts.some(btnText => text === btnText || text.includes(btnText))) {
          // Verifica se é um elemento clicável
          const isClickable = 
            el.tagName === 'BUTTON' ||
            el.tagName === 'A' ||
            el.getAttribute('role') === 'button' ||
            el.onclick ||
            el.style.cursor === 'pointer';
          
          if (isClickable && !el.disabled) {
            el.click();
            tasksCompleted++;
            sendToast(`✨ | ${el.textContent.trim()}`, 2000);
            clicked = true;
            await delay(1500);
            break;
          }
        }
      }

      // Procura por checkboxes não marcados
      if (!clicked) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(:checked)');
        
        for (const checkbox of checkboxes) {
          if (checkbox.offsetParent !== null && !checkbox.disabled) {
            checkbox.click();
            clicked = true;
            sendToast("☑️ | Tarefa marcada!", 1500);
            await delay(1000);
            break;
          }
        }
      }

      // Procura por radio buttons
      if (!clicked) {
        const radioSelectors = [
          'input[type="radio"]:not(:checked)',
          'label[role="radio"]',
          '[data-test-id="radio-option"]',
          '[role="radio"]'
        ];

        for (const selector of radioSelectors) {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) {
            element.click();
            clicked = true;
            await delay(800);
            break;
          }
        }
      }

      // Procura por cards de tarefas com status "A Fazer"
      if (!clicked) {
        const taskCards = document.querySelectorAll('[class*="task"], [class*="card"], [data-status]');
        
        for (const card of taskCards) {
          const statusText = card.textContent.toLowerCase();
          
          if (statusText.includes('a fazer') || statusText.includes('pendente')) {
            const actionBtn = card.querySelector('button, a, [role="button"]');
            
            if (actionBtn && actionBtn.offsetParent !== null) {
              actionBtn.click();
              clicked = true;
              sendToast("📋 | Abrindo tarefa...", 1500);
              await delay(2000);
              break;
            }
          }
        }
      }

      // Procura botões específicos (NÃO pular)
      if (!clicked) {
        const buttons = document.querySelectorAll('button:not([disabled]), [role="button"]');

        for (const button of buttons) {
          const buttonText = (button.textContent || button.innerText || '').trim().toLowerCase();
          const isVisible = button.offsetParent !== null;

          // Ignora botão de pular
          if (buttonText.includes('pular') || buttonText.includes('skip')) {
            continue;
          }

          // Verifica se é um botão permitido
          const isAllowed = buttonTexts.some(text => buttonText.includes(text));

          if (isVisible && isAllowed) {
            button.click();
            clicked = true;

            if (buttonText.includes('conclu') || buttonText.includes('final')) {
              sendToast("🎉 | Ação concluída!", 2000);
            }

            await delay(1200);
            break;
          }
        }
      }

      // Auto-preenche inputs vazios (se necessário)
      if (!clicked) {
        const inputs = document.querySelectorAll('input[type="text"]:not([readonly]), textarea:not([readonly])');
        
        for (const input of inputs) {
          if (input.offsetParent !== null && !input.disabled && !input.value.trim()) {
            input.value = 'Resposta automática';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            clicked = true;
            sendToast("📝 | Input preenchido!", 1000);
            await delay(1000);
            break;
          }
        }
      }

      await delay(clicked ? 1000 : 2000);
    }
  })();

  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    // Ctrl + P = Pausar/Retomar
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      window.salaDarkActive = !window.salaDarkActive;
      sendToast(
        window.salaDarkActive ? 
        '▶️ | Sala Dark ativado' : 
        '⏸️ | Sala Dark pausado',
        2000
      );
    }
    
    // Ctrl + Shift + S = Mostrar status
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      sendToast(
        window.salaDarkActive ? 
        '✅ | Status: ATIVO' : 
        '⏸️ | Status: PAUSADO',
        3000
      );
    }
  });
}

// Verifica domínio correto
const validDomains = [
  'cmsp.ip.tv',
  'salafuturo',
  'educacao.sp.gov.br',
  'cmspweb.ip.tv'
];

const isValidDomain = validDomains.some(domain => 
  window.location.href.includes(domain)
);

if (!isValidDomain) {
  console.log('%c⚠️ Sala Dark só funciona no Sala do Futuro!', 'color: #ff4757; font-size: 16px; font-weight: bold;');
  sendToast('⚠️ | Este script funciona apenas no Sala do Futuro!', 5000);
} else {
  (async function init() {
    await showSplashScreen();
    await delay(3000);
    await hideSplashScreen();

    setupMain();
    sendToast("💜 | Sala Dark iniciado!");
    
    console.clear();
    console.log('%c💜 SALA DARK ATIVO!', 'color: #667eea; font-size: 24px; font-weight: bold;');
    console.log('%c✨ Automatizando tarefas...', 'color: #888; font-size: 14px;');
    console.log('%c⌨️ Atalhos:', 'color: #888; font-size: 14px; font-weight: bold;');
    console.log('%c   Ctrl+P: Pausar/Retomar', 'color: #888; font-size: 12px;');
    console.log('%c   Ctrl+Shift+S: Ver status', 'color: #888; font-size: 12px;');
  })();
}