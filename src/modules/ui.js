export class UI {
  constructor(){
    this.el = {
      hud: document.getElementById('hud'),
      scoreValue: document.getElementById('score-value'),
      combo: document.getElementById('combo-indicator'),
      mainMenu: document.getElementById('main-menu'),
      pauseBtn: document.getElementById('pause-btn'),
      pauseMenu: document.getElementById('pause-menu'),
      resumeBtn: document.getElementById('resume-btn'),
      restartBtn: document.getElementById('restart-btn'),
      toMenuBtn: document.getElementById('to-menu-btn'),
      gameOver: document.getElementById('game-over'),
      finalScore: document.getElementById('final-score-value'),
      retryBtn: document.getElementById('retry-btn'),
      shareBtn: document.getElementById('share-btn'),
      goMenuBtn: document.getElementById('go-menu-btn'),
      playBtn: document.getElementById('play-btn'),
      rulesBtn: document.getElementById('rules-btn'),
      statsBtn: document.getElementById('stats-btn'),
      settingsBtn: document.getElementById('settings-btn'),
      overlay: document.getElementById('overlay'),
      modal: document.getElementById('modal'),
      modalContent: document.getElementById('modal-content'),
      modalClose: document.getElementById('modal-close'),
    };

    this.el.modalClose.addEventListener('click', ()=> this.hideModal());
    this.el.overlay.addEventListener('click', ()=> this.hideModal());
  }

  bindMainMenu({ onPlay, onRules, onStats, onSettings }){
    this.el.playBtn.addEventListener('click', onPlay);
    this.el.rulesBtn.addEventListener('click', onRules);
    this.el.statsBtn.addEventListener('click', onStats);
    this.el.settingsBtn.addEventListener('click', onSettings);
  }

  bindInGame({ onPause }){
    this.el.pauseBtn.addEventListener('click', onPause);
  }

  bindPauseMenu({ onResume, onRestart, onMenu }){
    this.el.resumeBtn.addEventListener('click', onResume);
    this.el.restartBtn.addEventListener('click', onRestart);
    this.el.toMenuBtn.addEventListener('click', onMenu);
  }

  bindGameOver({ onRetry, onShare, onMenu }){
    this.el.retryBtn.addEventListener('click', onRetry);
    this.el.shareBtn.addEventListener('click', onShare);
    this.el.goMenuBtn.addEventListener('click', onMenu);
  }

  showHud(){ this.el.hud.classList.remove('hidden'); }
  hideHud(){ this.el.hud.classList.add('hidden'); }

  showMainMenu(){ this.el.mainMenu.classList.remove('hidden'); }
  hideMainMenu(){ this.el.mainMenu.classList.add('hidden'); }

  showPauseMenu(){ this.el.pauseMenu.classList.remove('hidden'); }
  hidePauseMenu(){ this.el.pauseMenu.classList.add('hidden'); }

  showGameOver(){ this.el.gameOver.classList.remove('hidden'); }
  hideGameOver(){ this.el.gameOver.classList.add('hidden'); }

  setScore(score){ this.el.scoreValue.textContent = String(score); }
  setFinalScore(score){ this.el.finalScore.textContent = String(score); }

  setCombo(mult){
    const el = this.el.combo;
    if (mult > 1){
      el.textContent = 'x' + mult;
      el.classList.remove('hidden');
      el.style.transform = `scale(${1 + Math.min(1, (mult-1)*0.1)})`;
    } else {
      el.classList.add('hidden');
      el.style.transform = 'scale(1)';
    }
  }

  showRules(){
    const html = `
      <h2>Правила</h2>
      <p>Сдвигайте фрукт по верхней части поля и отпускайте, чтобы он падал. Соприкосновение двух одинаковых фруктов объединяет их в более крупный фрукт и приносит очки.</p>
      <ul>
        <li>Комбо: несколько слияний подряд увеличивают множитель.</li>
        <li>Игра заканчивается, если фрукты поднимаются выше верхней линии.</li>
        <li>Подсказка: сбрасывайте на наклонные поверхности для мягкой остановки.</li>
      </ul>
    `;
    this.showModal(html);
  }

  showStats(stats){
    const s = stats.getAll();
    const html = `
      <h2>Статистика</h2>
      <div><strong>Рекорд:</strong> ${s.bestScore}</div>
      <div><strong>Лучший фрукт:</strong> ${s.bestFruitName}</div>
      <div><strong>Всего игр:</strong> ${s.totalGames}</div>
      <div><strong>Средний счёт:</strong> ${s.avgScore}</div>
      <div><strong>Время в игре:</strong> ${formatDuration(s.timePlayedSec)}</div>
      <div><strong>Лучшее комбо:</strong> x${s.bestCombo}</div>
      <div style="margin-top:12px;color:#7a8a93">Данные сохраняются локально на устройстве</div>
    `;
    this.showModal(html);
  }

  showSettings({ sfx }){
    const checked = sfx.enabled ? 'checked' : '';
    const vchecked = sfx.vibrateEnabled ? 'checked' : '';
    const html = `
      <h2>Настройки</h2>
      <label style="display:flex;align-items:center;gap:10px;margin:8px 0;">
        <input id="set-sound" type="checkbox" ${checked} /> Звук
      </label>
      <label style="display:flex;align-items:center;gap:10px;margin:8px 0;">
        <input id="set-vibrate" type="checkbox" ${vchecked} /> Вибрация
      </label>
    `;
    this.showModal(html);
    const sound = document.getElementById('set-sound');
    sound.addEventListener('change', ()=>{ sfx.enabled = sound.checked; if(sound.checked){ sfx.click(); }});
    const vibrate = document.getElementById('set-vibrate');
    vibrate.addEventListener('change', ()=>{ sfx.vibrateEnabled = vibrate.checked; if (vibrate.checked) navigator.vibrate?.(30); });
  }

  shareScore(score){
    if (navigator.share){
      navigator.share({ title: 'Мой счёт в Fruit Merge', text: `Я набрал ${score} очков!`, url: location.href }).catch(()=>{});
    } else {
      this.showModal(`<h2>Поделиться</h2><p>Скопируйте ссылку и отправьте друзьям:</p><pre>${location.href}</pre>`);
    }
  }

  showModal(innerHtml){
    this.el.modalContent.innerHTML = innerHtml;
    this.el.modal.classList.remove('hidden');
    this.el.overlay.classList.remove('hidden');
  }
  hideModal(){
    this.el.modal.classList.add('hidden');
    this.el.overlay.classList.add('hidden');
  }
}

function formatDuration(totalSeconds){
  const h = Math.floor(totalSeconds/3600);
  const m = Math.floor((totalSeconds%3600)/60);
  const s = Math.floor(totalSeconds%60);
  return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':');
}