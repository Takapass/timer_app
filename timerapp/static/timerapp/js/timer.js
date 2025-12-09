// 共通ユーティリティ
function csrfSafeMethod(){
    return (document.cookie.indexOf('csrftoken') !== -1) || (window.CSRF_TOKEN !== undefined);
  }
  function getCSRF(){
    if(window.CSRF_TOKEN) return window.CSRF_TOKEN;
    // フallback: cookie から取る（簡易）
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
  }
  
  /* メニュー画面用 */
  document.addEventListener('DOMContentLoaded', function(){
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
  
    // タイマーページ処理
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    const timeBox = document.getElementById('timeBox');
  
    if(playBtn){
      let timer = 0, interval = null;
      function update(){
        const m = Math.floor(timer/60).toString().padStart(2,'0');
        const s = (timer%60).toString().padStart(2,'0');
        timeBox.textContent = `${m}:${s}`;
      }
      playBtn.addEventListener('click', function(){
        if(interval) return;
        interval = setInterval(()=>{ timer++; update(); }, 1000);
      });
      pauseBtn.addEventListener('click', function(){
        if(interval) clearInterval(interval);
        interval = null;
      });
      resetBtn.addEventListener('click', function(){
        if(interval) clearInterval(interval);
        interval = null;
        // 保存
        saveSession(timer);
        timer = 0; update();
      });
      saveBtn && saveBtn.addEventListener('click', function(){
        saveSession(timer);
      });
  
      async function saveSession(seconds){
        const note = document.getElementById('note') ? document.getElementById('note').value : '';
        try {
          const res = await fetch('/api/save_session/', {
            method:'POST',
            headers:{
              'Content-Type':'application/json',
              'X-CSRFToken': getCSRF(),
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({menu_id: window.MENU_ID || null, duration: seconds, note})
          });
          if(res.ok){
            alert('トレーニングを保存しました');
          } else {
            alert('保存に失敗しました');
          }
        } catch(e){
          alert('通信エラー');
        }
      }
    }
  });
  
  // 画面遷移用
  function goToTimer(id){ location.href = '/timer/' + id + '/'; }
  