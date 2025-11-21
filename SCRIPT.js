// ===== SALA AUTO V3 - MOBILE OPTIMIZED =====
console.clear();

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function sendToast(text, duration = 5000) {
  const toast = document.createElement('div');
  toast.textContent = text;
  toast.style.cssText = `
    position: fixed;
    ${isMobile ? 'top: 20px;' : 'bottom: 20px;'}
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    padding: ${isMobile ? '20px 30px' : '16px 24px'};
    border-radius: 16px;
    font-family: Arial, sans-serif;
    font-size: ${isMobile ? '16px' : '14px'};
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: slideIn 0.3s ease;
    max-width: 90%;
    text-align: center;
  `;
  
  if (!document.querySelector('#toastAnimation')) {
    const style = document.createElement('style');
    style.id = 'toastAnimation';
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translate(-50%, ${isMobile ? '-20px' : '20px'}); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

async function showSplashScreen() {
  const splash = document.createElement('div');
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
    z-index: 9999999;
    opacity: 0;
    transition: opacity 0.5s ease;
    flex-direction: column;
    padding: 20px;
  `;

  splash.innerHTML = `
    <div style="color: white; font-size: ${isMobile ? '48px' : '64px'}; font-weight: bold; text-shadow: 0 0 30px rgba(255,255,255,0.5); margin-bottom: 20px; text-align: center;">
      SALA<span style="color: #00ff88;">AUTO</span>
    </div>
    <div style="color: rgba(255,255,255,0.9); font-size: ${isMobile ? '16px' : '18px'}; text-align: center; margin-bottom: 10px;">
      ${isMobile ? '📱 Versão Mobile' : '💻 Versão Desktop'}
    </div>
    <div style="color: rgba(255,255,255,0.7); font-size: ${isMobile ? '14px' : '16px'}; text-align: center;">
      Carregando...
    </div>
    <div style="width: ${isMobile ? '80%' : '300px'}; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin-top: 30px; overflow: hidden;">
      <div style="width: 0%; height: 100%; background: #00ff88; animation: progress 2s ease-in-out;"></div>
    </div>
  `;
  
  const progressStyle = document.createElement('style');
  progressStyle.textContent = `
    @keyframes progress {
      from { width: 0%; }
      to { width: 100%; }
    }
  `;
  document.head.appendChild(progressStyle);
  
  document.body.appendChild(splash);
  setTimeout(() => splash.style.opacity = '1', 10);
  
  await delay(2500);
  splash.style.opacity = '0';
  setTimeout(() => splash.remove(), 500);
}

function findElementByText(text, tag = '*') {
  const elements = Array.from(document.querySelectorAll(tag));
  return elements.find(el => {
    const elementText = (el.textContent || el.innerText || '').trim().toLowerCase();
    return elementText.includes(text.toLowerCase());
  });
}

function findAllElementsByText(text, tag = '*') {
  const elements = Array.from(document.querySelectorAll(tag));
  return elements.filter(el => {
    const elementText = (el.textContent || el.innerText || '').trim().toLowerCase();
    return elementText.includes(text.toLowerCase());
  });
}

function isVisible(element) {
  if (!element) return false;
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  ) && window.getComputedStyle(element).visibility !== 'hidden';
}

async function autoCompleteTasks() {
  window.salaAutoActive = true;
  let tasksCompleted = 0;
  let attempts = 0;
  const maxAttempts = 50;
  
  sendToast('🚀 Automação iniciada!', 2000);
  updateStatus('Ativo', '#00ff88');
  
  while (window.salaAutoActive && attempts < maxAttempts) {
    attempts++;
    let actionTaken = false;
    
    console.log(`🔍 Tentativa ${attempts}/${maxAttempts}`);
    
    const buttonTexts = [
      'concluir', 'entregar', 'finalizar', 'enviar', 
      'marcar como concluída', 'completar', 'fazer tarefa',
      'iniciar', 'começar', 'responder', 'próxima',
      'continuar', 'avançar', 'confirmar', 'salvar'
    ];
    
    // Estratégia 1: Botões
    for (const text of buttonTexts) {
      const buttons = findAllElementsByText(text, 'button');
      for (const btn of buttons) {
        if (isVisible(btn) && !btn.disabled) {
          console.log(`✅ Clicando: "${btn.textContent.trim()}"`);
          btn.click();
          sendToast(`✨ ${btn.textContent.trim()}`, 1500);
          actionTaken = true;
          tasksCompleted++;
          updateCounter(tasksCompleted);
          await delay(2000);
          break;
        }
      }
      if (actionTaken) break;
    }
    
    // Estratégia 2: Links
    if (!actionTaken) {
      for (const text of buttonTexts) {
        const links = findAllElementsByText(text, 'a');
        for (const link of links) {
          if (isVisible(link)) {
            console.log(`🔗 Link: "${link.textContent.trim()}"`);
            link.click();
            sendToast(`🔗 ${link.textContent.trim()}`, 1500);
            actionTaken = true;
            tasksCompleted++;
            updateCounter(tasksCompleted);
            await delay(2000);
            break;
          }
        }
        if (actionTaken) break;
      }
    }
    
    // Estratégia 3: Checkboxes
    if (!actionTaken) {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(:checked)');
      for (const checkbox of checkboxes) {
        if (isVisible(checkbox) && !checkbox.disabled) {
          console.log('☑️ Checkbox marcado');
          checkbox.click();
          sendToast('☑️ Tarefa marcada!', 1500);
          actionTaken = true;
          tasksCompleted++;
          updateCounter(tasksCompleted);
          await delay(1500);
          break;
        }
      }
    }
    
    // Estratégia 4: Elementos clicáveis
    if (!actionTaken) {
      const clickables = document.querySelectorAll('[role="button"], .button, .btn, [onclick]');
      for (const elem of clickables) {
        const text = (elem.textContent || '').trim().toLowerCase();
        if (isVisible(elem) && buttonTexts.some(btnText => text.includes(btnText))) {
          console.log(`🎯 Clicável: "${elem.textContent.trim()}"`);
          elem.click();
          sendToast(`🎯 Ação executada!`, 1500);
          actionTaken = true;
          tasksCompleted++;
          updateCounter(tasksCompleted);
          await delay(2000);
          break;
        }
      }
    }
    
    // Estratégia 5: Cards de tarefas
    if (!actionTaken) {
      const taskCards = document.querySelectorAll('[class*="task"], [class*="card"], [data-status]');
      for (const card of taskCards) {
        const statusText = card.textContent.toLowerCase();
        if (statusText.includes('a fazer') || statusText.includes('pendente')) {
          const actionBtn = card.querySelector('button, a, [role="button"]');
          if (actionBtn && isVisible(actionBtn)) {
            console.log('📋 Card encontrado');
            actionBtn.click();
            sendToast('📋 Abrindo tarefa...', 1500);
            actionTaken = true;
            await delay(2000);
            break;
          }
        }
      }
    }
    
    if (!actionTaken) {
      console.log('⏳ Aguardando...');
      await delay(3000);
    } else {
      await delay(1500);
    }
  }
  
  window.salaAutoActive = false;
  updateStatus('Finalizado', '#00ff88');
  
  if (tasksCompleted > 0) {
    sendToast(`🎉 Concluído! ${tasksCompleted} ações executadas`, 4000);
  } else {
    sendToast('⚠️ Nenhuma tarefa encontrada', 4000);
  }
  
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
}

function updateStatus(text, color) {
  const statusText = document.getElementById('statusText');
  if (statusText) {
    statusText.textContent = text;
    statusText.style.color = color;
  }
}

function updateCounter(count) {
  const counter = document.getElementById('taskCounter');
  if (counter) {
    counter.textContent = count;
  }
}

function createControlPanel() {
  const panel = document.createElement('div');
  panel.id = 'salaAutoPanel';
  
  if (isMobile) {
    // Painel Mobile - Otimizado para toque
    panel.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      box-shadow: 0 -8px 32px rgba(0,0,0,0.4);
      z-index: 999998;
      font-family: Arial, sans-serif;
      border-radius: 24px 24px 0 0;
    `;
    
    panel.innerHTML = `
      <div style="width: 40px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto 20px;"></div>
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px; text-align: center;">
        🚀 SALA AUTO
      </div>
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">
          Status: <span id="statusText" style="font-weight: bold;">Aguardando</span>
        </div>
        <div style="font-size: 32px; font-weight: bold; color: #00ff88;">
          <span id="taskCounter">0</span>
        </div>
        <div style="font-size: 12px; opacity: 0.8;">tarefas completadas</div>
      </div>
      <button id="startBtn" style="width: 100%; padding: 20px; border: none; border-radius: 16px; background: #00ff88; color: #000; font-weight: bold; font-size: 18px; cursor: pointer; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,255,136,0.3);">
        ▶️ INICIAR AUTOMAÇÃO
      </button>
      <button id="stopBtn" style="width: 100%; padding: 20px; border: none; border-radius: 16px; background: #ff4757; color: #fff; font-weight: bold; font-size: 18px; cursor: pointer; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(255,71,87,0.3);" disabled>
        ⏹️ PARAR
      </button>
      <button id="closePanel" style="width: 100%; padding: 16px; border: none; border-radius: 12px; background: rgba(255,255,255,0.2); color: #fff; font-size: 14px; cursor: pointer;">
        ✕ Fechar Painel
      </button>
    `;
  } else {
    // Painel Desktop
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 999998;
      font-family: Arial, sans-serif;
      min-width: 280px;
    `;
    
    panel.innerHTML = `
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">
        🚀 SALA AUTO
      </div>
      <div style="margin-bottom: 20px;">
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 10px;">
          Status: <span id="statusText" style="font-weight: bold;">Aguardando</span>
        </div>
        <div style="text-align: center; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 12px;">
          <div style="font-size: 36px; font-weight: bold; color: #00ff88;">
            <span id="taskCounter">0</span>
          </div>
          <div style="font-size: 11px; opacity: 0.8;">tarefas completadas</div>
        </div>
      </div>
      <button id="startBtn" style="width: 100%; padding: 14px; border: none; border-radius: 10px; background: #00ff88; color: #000; font-weight: bold; font-size: 14px; cursor: pointer; margin-bottom: 10px;">
        ▶️ INICIAR
      </button>
      <button id="stopBtn" style="width: 100%; padding: 14px; border: none; border-radius: 10px; background: #ff4757; color: #fff; font-weight: bold; font-size: 14px; cursor: pointer; margin-bottom: 10px;" disabled>
        ⏹️ PARAR
      </button>
      <button id="closePanel" style="width: 100%; padding: 10px; border: none; border-radius: 8px; background: rgba(255,255,255,0.2); color: #fff; font-size: 12px; cursor: pointer;">
        ✕ Fechar
      </button>
    `;
  }
  
  document.body.appendChild(panel);
  
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const closePanel = document.getElementById('closePanel');
  
  startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateStatus('Ativo', '#00ff88');
    autoCompleteTasks();
  });
  
  stopBtn.addEventListener('click', () => {
    window.salaAutoActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('Parado', '#ff4757');
    sendToast('⏸️ Automação pausada', 2000);
  });
  
  closePanel.addEventListener('click', () => {
    panel.remove();
    sendToast('👋 Painel fechado', 2000);
  });
}

// Inicialização
(async function init() {
  await showSplashScreen();
  createControlPanel();
  
  sendToast(
    isMobile 
      ? '📱 Painel mobile carregado! Role para baixo.' 
      : '🎮 Painel carregado! Veja no canto superior direito.',
    4000
  );
  
  console.clear();
  console.log(`%c🚀 SALA AUTO V3 - ${isMobile ? 'MOBILE' : 'DESKTOP'}`, 'color: #00ff88; font-size: 20px; font-weight: bold;');
  console.log('%c✅ Script carregado com sucesso!', 'color: #888; font-size: 14px;');
})();