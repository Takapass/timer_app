// 共通ユーティリティ（既存）
function csrfSafeMethod(){
  return (document.cookie.indexOf('csrftoken') !== -1) || (window.CSRF_TOKEN !== undefined);
}
function getCSRF(){
  if(window.CSRF_TOKEN) return window.CSRF_TOKEN;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

/* --- DOM ready --- */
document.addEventListener('DOMContentLoaded', function(){
// メニュー追加既存処理（そのまま）
const addBtn = document.getElementById('addMenuBtn');
if(addBtn){
  addBtn.addEventListener('click', async function(e){
    e.preventDefault();
    const name = document.querySelector('#id_name').value;
    if(!name) return alert('メニュー名を入力してください');
    const res = await fetch('/api/add_menu/', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-CSRFToken': getCSRF(),
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({name})
    });
    if(res.ok){
      const json = await res.json();
      const list = document.getElementById('menuList');
      if(list){
        const div = document.createElement('div');
        div.className = 'item'; div.dataset.id = json.id; div.textContent = json.name;
        div.onclick = ()=> location.href = '/timer/' + json.id + '/';
        list.prepend(div);
      }
      document.querySelector('#id_name').value = '';
    } else {
      alert('追加に失敗しました');
    }
  });
}

/* --- Timer page logic --- */
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');
const timeBox = document.getElementById('timeBox');

if(playBtn){
  // UI inputs
  const inputWork = document.getElementById('inputWork');
  const inputRest = document.getElementById('inputRest');
  const inputSets = document.getElementById('inputSets');
  const inputCountdown = document.getElementById('inputCountdown');
  const phaseLabel = document.getElementById('phaseLabel');
  const setLabel = document.getElementById('setLabel');
  const totalSets = document.getElementById('totalSets');
  const noteBox = document.getElementById('note');

  // initialize from MENU_DEFAULT if available
  if(window.MENU_DEFAULT){
    if(!inputWork) return;
    inputWork.value = window.MENU_DEFAULT.work_seconds || inputWork.value;
    inputRest.value = window.MENU_DEFAULT.rest_seconds || inputRest.value;
    inputSets.value = window.MENU_DEFAULT.sets || inputSets.value;
    inputCountdown.checked = !!window.MENU_DEFAULT.countdown_mode;
    totalSets.textContent = inputSets.value;
  }

  // state
  let interval = null;
  let phase = 'WORK'; // 'WORK' or 'REST'
  let currentSet = 0; // 0..n, will increment when work starts
  let remaining = 0; // seconds remaining for current phase (used when countdown), otherwise elapsed
  let elapsed_in_phase = 0; // used for count-up
  let total_elapsed = 0; // total seconds since session start (including rests)
  let running = false;

  function formatTimeBySeconds(s){
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if(h) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  function updateDisplay(){
    // timeBox shows remaining if countdown mode, else elapsed in phase or total?
    const countdown = inputCountdown.checked;
    if(countdown){
      timeBox.textContent = formatTimeBySeconds(remaining);
    } else {
      // show elapsed in phase
      if(phase === 'WORK') timeBox.textContent = formatTimeBySeconds(elapsed_in_phase);
      else timeBox.textContent = formatTimeBySeconds(elapsed_in_phase);
    }
    phaseLabel.textContent = phase;
    setLabel.textContent = currentSet;
    totalSets.textContent = inputSets.value;
  }

  function startPhase(newPhase){
    phase = newPhase;
    elapsed_in_phase = 0;
    if(phase === 'WORK'){
      currentSet = Math.min(parseInt(inputSets.value,10), currentSet + 1) || 1;
      // when entering a work phase, increase sets (but cap)
    }
    const target = (phase === 'WORK') ? parseInt(inputWork.value,10) : parseInt(inputRest.value,10);
    remaining = target;
    updateDisplay();
    // auto start timer loop
    if(interval) clearInterval(interval);
    interval = setInterval(tick, 1000);
    running = true;
  }

  function tick(){
    total_elapsed++;
    if(inputCountdown.checked){
      remaining--;
    } else {
      elapsed_in_phase++;
    }
    updateDisplay();
    // check end of phase
    const target = (phase === 'WORK') ? parseInt(inputWork.value,10) : parseInt(inputRest.value,10);
    const finished = inputCountdown.checked ? (remaining <= 0) : (elapsed_in_phase >= target);
    if(finished){
      // phase finished -> decide next
      if(phase === 'WORK'){
        // completed one work set
        // if completed all sets -> stop
        if(currentSet >= parseInt(inputSets.value,10)){
          // session finished
          clearInterval(interval);
          interval = null;
          running = false;
          alert('トレーニング完了！');
          // keep display at 00:00 or final
          if(inputCountdown.checked) remaining = 0;
          updateDisplay();
          return;
        } else {
          // switch to REST
          startPhase('REST');
          return;
        }
      } else if(phase === 'REST'){
        // after rest, go to next work
        startPhase('WORK');
        return;
      }
    }
  }

  playBtn.addEventListener('click', function(){
    if(running) return;
    // If not started yet, start with WORK
    if(!interval && currentSet === 0){
      startPhase('WORK');
    } else {
      // resume
      if(interval) clearInterval(interval);
      interval = setInterval(tick, 1000);
      running = true;
    }
  });

  pauseBtn.addEventListener('click', function(){
    if(interval) clearInterval(interval);
    interval = null;
    running = false;
  });

  resetBtn.addEventListener('click', function(){
    if(interval) clearInterval(interval);
    interval = null;
    running = false;
    phase = 'WORK';
    currentSet = 0;
    remaining = inputCountdown.checked ? parseInt(inputWork.value,10) : 0;
    elapsed_in_phase = 0;
    total_elapsed = 0;
    updateDisplay();
  });

  // save action: send total_elapsed and sets completed
  saveBtn && saveBtn.addEventListener('click', function(){
    // if still running, stop
    if(interval) { clearInterval(interval); interval = null; running = false; }
    // compute sets_completed: if currently in work phase and it's ongoing, use currentSet as completed if finished else currentSet-1?
    // We'll store 'currentSet' as sets completed if phase is REST or if a work phase completed; otherwise currentSet - 1
    let sets_completed = currentSet;
    if(phase === 'WORK'){
      const target = parseInt(inputWork.value,10);
      const finished = inputCountdown.checked ? (remaining <= 0) : (elapsed_in_phase >= target);
      if(!finished) sets_completed = Math.max(0, currentSet - 1);
    }
    const payload = {
      menu_id: window.MENU_ID || null,
      duration: total_elapsed,
      note: noteBox ? noteBox.value : '',
      sets_completed: sets_completed
    };
    (async ()=>{
      try{
        const res = await fetch('/api/save_session/', {
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'X-CSRFToken': getCSRF(),
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(payload)
        });
        if(res.ok){
          alert('トレーニングを保存しました');
        } else {
          alert('保存に失敗しました');
        }
      }catch(e){
        alert('通信エラー');
      }
    })();
  });

  // initialize display
  remaining = parseInt(inputWork.value,10);
  updateDisplay();
}
});

function goToTimer(id){ location.href = '/timer/' + id + '/'; }
  