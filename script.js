"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll(".screen")];

  const tasks = [
    {id:"study",name:"تحدي التركيز",emoji:"📚",minutes:90,energy:22,description:"تقدر تركز على حاجة مهمة؟ خدها خطوة خطوة.",tint:"#31264f"},
    {id:"errands",name:"تحدي المشوار",emoji:"🛍️",minutes:60,energy:14,description:"تقدر تخلص مشوارك من غير ما باقي اليوم يضيع؟",tint:"#453020"},
    {id:"exercise",name:"شحنة نشاط",emoji:"🏃",minutes:45,energy:18,description:"هل الحركة هترجعلك النشاط وتفتح محطة جديدة؟",tint:"#173c3b"},
    {id:"family",name:"وقت مع العيلة",emoji:"🏡",minutes:60,energy:8,description:"قعدة حلوة مع الناس القريبة.",tint:"#48283b"},
    {id:"tidy",name:"تحدي الترتيب",emoji:"🧹",minutes:40,energy:12,description:"مستعد تخلي المكان أهدى في ٤٠ دقيقة؟",tint:"#173644"},
    {id:"project",name:"تحدي الإبداع",emoji:"🎨",minutes:90,energy:20,description:"تقدر تضيف خطوة جديدة لحاجة بتحبها؟",tint:"#482b42"},
    {id:"meal",name:"استراحة إعادة الشحن",emoji:"🍲",minutes:45,energy:-18,description:"وقفة صغيرة ترجعلك جزء من طاقتك.",tint:"#493c1e"},
    {id:"friends",name:"فاصل مع صحابك",emoji:"📱",minutes:30,energy:-8,description:"رسالة أو مكالمة حلوة تفصل بيها شوية.",tint:"#202f50"},
    {id:"read",name:"وقت لنفسك",emoji:"🎧",minutes:45,energy:-10,description:"وقت لطيف لهواية بتحبها، من غير استعجال.",tint:"#34294f"},
    {id:"rest",name:"تحدي الراحة",emoji:"☕",minutes:30,energy:-20,description:"هل تقدر تسيب كل حاجة شوية وتدي نفسك راحة بجد؟",tint:"#193d33"}
  ];

  const events = [
    {emoji:"📩",title:"رسالة من صاحبك!",description:"صاحبك بيسأل عليك وعايز يرغي شوية. تختار إيه؟",options:[
      {icon:"💬",label:"أرد عليه دلوقتي",detail:"فاصل اجتماعي صغير",time:15,energy:-4,stars:1},
      {icon:"🕒",label:"أرد بعد التحدي",detail:"أحافظ على تركيزي",time:0,energy:0,stars:1}
    ]},
    {emoji:"🌧️",title:"الجو قلب فجأة",description:"كان عندك مشوار، بس الدنيا بتمطر. تعمل إيه؟",options:[
      {icon:"🏠",label:"أبدّل المشوار بحاجة في البيت",detail:"مرونة حلوة في الخطة",time:0,energy:0,stars:2},
      {icon:"☕",label:"أستغلها استراحة",detail:"أهدّي الإيقاع شوية",time:20,energy:8,stars:2}
    ]},
    {emoji:"🥱",title:"حاسس إن تركيزك قل",description:"لسه في تحديات، بس مخك محتاج نفس. تختار إيه؟",options:[
      {icon:"🧘",label:"أعمل استراحة قصيرة",detail:"الراحة هترجع شوية طاقة",time:15,energy:12,stars:2},
      {icon:"🎯",label:"أكمّل ربع ساعة وبعدين أقرر",detail:"خطوة صغيرة من غير ضغط",time:15,energy:-5,stars:1}
    ]},
    {emoji:"🍰",title:"فاصل لطيف ظهر!",description:"حد جاب حاجة حلوة في نص اليوم. إزاي تستغل اللحظة؟",options:[
      {icon:"😊",label:"أشاركهم شوية",detail:"لحظة اجتماعية خفيفة",time:10,energy:4,stars:1},
      {icon:"📌",label:"أخلص اللي في إيدي الأول",detail:"وألحقهم بعدين",time:0,energy:0,stars:1}
    ]}
  ];

  const state = {
    plan:[],status:{},completed:0,skipped:0,energy:100,minute:8*60,stars:0,
    eventsSeen:0,currentProgress:0,firstEventShown:false,mode:"ready",
    sound:false,soundChosen:false,musicStarted:false,eventQueue:[],
    lastLitId:"",finished:false
  };

  const audio = {};
  const audioFiles = {
    music:"music.mp3.mpeg",
    click:"click.mp3.mpeg",
    success:"correct.mp3.mpeg",
    victory:"victory.mp3.mpeg"
  };
  let toastTimer;

  function prepareAudio() {
    Object.entries(audioFiles).forEach(([name,file]) => {
      audio[name] = new Audio(file);
      audio[name].preload = name === "music" ? "auto" : "metadata";
      audio[name].volume = name === "music" ? 0.24 : name === "victory" ? 0.72 : 0.58;
    });
    audio.music.loop = true;
  }

  function updateSoundButton() {
    $("sound-icon").textContent = state.sound ? "🔊" : "🔇";
    $("sound-label").textContent = state.sound
      ? (state.musicStarted ? "الصوت شغال" : "الموسيقى جاهزة")
      : "تشغيل الموسيقى";
    $("sound-toggle").setAttribute("aria-pressed",String(state.sound));
  }

  function startMusic() {
    if (!state.sound || state.musicStarted || !audio.music) return;
    try {
      const playing = audio.music.play();
      if (playing && playing.then) {
        playing.then(() => {
          state.musicStarted = true;
          updateSoundButton();
        }).catch(() => {
          $("sound-label").textContent = "اضغط لتشغيل الصوت";
        });
      }
    } catch (_) {}
  }

  function stopMusic() {
    if (!audio.music) return;
    audio.music.pause();
    state.musicStarted = false;
    updateSoundButton();
  }

  function toggleSound() {
    state.soundChosen = true;
    state.sound = !state.sound;
    if (state.sound) {
      updateSoundButton();
      startMusic();
      playSound("click");
    } else {
      stopMusic();
      updateSoundButton();
    }
  }

  function playSound(name) {
    if (!state.sound || !audio[name]) return;
    try {
      audio[name].currentTime = 0;
      const playing = audio[name].play();
      if (playing && playing.catch) playing.catch(() => {});
    } catch (_) {}
  }

  function showScreen(id) {
    const target = $(id);
    if (!target) return;
    screens.forEach((screen) => screen.classList.toggle("active",screen === target));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function digits(value) {
    return new Intl.NumberFormat("ar-EG").format(value);
  }

  function durationText(value) {
    return digits(value) + " دقيقة";
  }

  function clockText(total) {
    const h24 = Math.floor(total/60)%24;
    const minute = total%60;
    const h12 = h24%12 || 12;
    return digits(h12) + ":" + digits(String(minute).padStart(2,"0")) + " " + (h24<12?"ص":"م");
  }

  function clamp(value,min,max) {
    return Math.max(min,Math.min(max,value));
  }

  function toast(message) {
    const box = $("toast");
    box.textContent = message;
    box.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove("show"),2300);
  }

  function taskById(id) {
    return tasks.find((task) => task.id === id);
  }

  function currentTask() {
    return state.plan.map(taskById).find((task) => task && state.status[task.id] === "pending") || null;
  }

  function renderTaskLibrary() {
    $("task-library").innerHTML = tasks.map((task) => {
      const selected = state.plan.includes(task.id);
      const energyText = task.energy < 0 ? "يرجّع طاقة" : "طاقة " + digits(task.energy) + "٪";
      return '<button type="button" class="task-option ' + (selected?"selected":"") + '" data-task="' + task.id + '" aria-pressed="' + selected + '" style="--task-tint:' + task.tint + '">' +
        '<span class="task-ico">' + task.emoji + '</span><span><strong>' + task.name + '</strong><small>' + durationText(task.minutes) + " · " + energyText + '</small></span><span class="add-mark">' + (selected?"✓":"+") + "</span></button>";
    }).join("");
  }

  function renderCity(containerId) {
    const host = $(containerId);
    if (!host) return;
    const heights = [92,132,106,159,120,176,111,147,101,137];
    const buildings = [];
    const active = currentTask();

    for (let i=0;i<10;i++) {
      const x = 18 + i*96;
      const width = 72;
      const height = heights[i];
      const y = 251-height;
      const task = state.plan[i] ? taskById(state.plan[i]) : null;
      const status = task ? (state.status[task.id] || "pending") : "empty";
      const isNext = task && active && active.id === task.id;
      const classes = ["city-building",status==="done"?"is-lit":"",status==="skipped"?"is-skipped":"",isNext?"is-next":"",task && task.id===state.lastLitId?"just-lit":""].filter(Boolean).join(" ");

      let roof = "";
      const roofType = i%4;
      if (roofType===0) roof = '<path class="building-roof" d="M'+(x-3)+" "+(y+15)+" L"+(x+width/2)+" "+(y-8)+" L"+(x+width+3)+" "+(y+15)+' Z"/>';
      else if (roofType===1) roof = '<rect class="building-roof" x="'+(x-3)+'" y="'+(y-7)+'" width="'+(width+6)+'" height="12" rx="3"/>';
      else if (roofType===2) roof = '<path class="building-roof" d="M'+(x-2)+" "+(y+7)+" Q"+(x+width/2)+" "+(y-23)+" "+(x+width+2)+" "+(y+7)+' Z"/>';
      else roof = '<path class="building-roof" d="M'+x+" "+(y+6)+" L"+(x+width)+" "+(y-7)+" L"+(x+width)+" "+(y+10)+" L"+x+" "+(y+20)+' Z"/>';

      let windows = "";
      const rows = Math.max(2,Math.floor((height-35)/22));
      for (let row=0;row<rows;row++) {
        for (let col=0;col<2;col++) {
          windows += '<rect class="building-window" x="'+(x+14+col*27)+'" y="'+(y+26+row*21)+'" width="12" height="11" rx="2"/>';
        }
      }

      const emoji = task ? '<text class="building-emoji" x="'+(x+width/2)+'" y="'+(y-19)+'">'+task.emoji+"</text>" : "";
      const title = task ? task.name+(status==="done"?" — مكان منوّر":status==="skipped"?" — اتعدّى":" — مستني الإنجاز") : "مكان في المدينة";
      buildings.push('<g class="'+classes+'" data-city-task="'+(task?task.id:"")+'"><title>'+title+'</title><rect class="building-body" x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" rx="4"/>'+roof+windows+
        '<rect class="building-badge" x="'+(x+width/2-12)+'" y="'+(y+height-20)+'" width="24" height="14" rx="5"/>'+emoji+"</g>");
    }

    let stars = "";
    [[90,35],[170,73],[260,29],[362,58],[425,25],[582,43],[670,29],[752,65],[840,34],[934,51]].forEach((point,index) => {
      stars += '<circle cx="'+point[0]+'" cy="'+point[1]+'" r="'+(index%3===0?2.3:1.5)+'" style="animation-delay:-'+(index%4)*.55+'s"/>';
    });

    const id = containerId.replace(/[^a-z0-9]/gi,"");
    host.innerHTML =
      '<svg viewBox="0 0 1000 286" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="مدينة بتنور مع إنجاز التحديات">' +
      '<defs><linearGradient id="sky'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151d49"/><stop offset="1" stop-color="#3c4b80"/></linearGradient>' +
      '<filter id="glow'+id+'" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<rect width="1000" height="286" fill="url(#sky'+id+')"/><g class="city-stars">'+stars+'</g>' +
      '<circle class="clock-orbit" cx="500" cy="101" r="86"/><circle class="clock-face-svg" cx="500" cy="101" r="69"/>' +
      '<path class="clock-tick-svg" d="M500 38v9 M563 101h-9 M500 164v-9 M437 101h9"/>' +
      '<path class="clock-hand-svg" d="M500 101V54"/><path class="clock-hand-short" d="M500 101l31 19"/><circle class="clock-pin-svg" cx="500" cy="101" r="4"/>' +
      '<path class="city-ground" d="M0 249 Q250 238 500 249 T1000 249 V286 H0Z"/><path class="city-road" d="M0 265 Q250 255 500 265 T1000 265 V286 H0Z"/>' +
      '<path class="city-road-light" d="M15 276 Q250 266 500 276 T985 276"/>'+buildings.join("")+"</svg>";

    host.querySelectorAll(".just-lit").forEach((node) => setTimeout(() => node.classList.remove("just-lit"),800));
  }

  function renderPlan() {
    const total = state.plan.reduce((sum,id) => sum+(taskById(id)?.minutes||0),0);
    $("plan-count").textContent = digits(state.plan.length)+(state.plan.length===1?" تحدي":" تحديات");
    $("plan-time").textContent = digits((total/60).toFixed(1))+" ساعة";
    $("plan-time-fill").style.width = Math.min(100,total/840*100)+"%";
    $("start-day-button").disabled = state.plan.length===0;
    $("empty-plan").classList.toggle("hidden",state.plan.length>0);
    const warning = $("plan-warning");
    warning.classList.toggle("warn",total>600);
    warning.textContent = state.plan.length===0
      ? "ضيف تحدي واحد على الأقل عشان نبدأ."
      : total>600
        ? "الخطة زحمة؛ سيب لنفسك مساحة للمفاجآت والراحة."
        : total>360
          ? "خطة مليانة شوية! تقدر تعدّي أو تغيّر أي تحدي."
          : "فيه مساحة للمفاجآت والاستراحة، تمام كده!";

    $("selected-tasks").innerHTML = state.plan.map((id,index) => {
      const task = taskById(id);
      return '<div class="planned-task"><span class="order">'+digits(index+1)+'</span><span>'+task.emoji+" "+task.name+'</span><small class="task-min">'+digits(task.minutes)+" د</small><span class=\"task-controls\">"+
        '<button type="button" data-move="up" data-index="'+index+'" aria-label="تقديم '+task.name+'"'+(index===0?" disabled":"")+'>↑</button>'+
        '<button type="button" data-move="down" data-index="'+index+'" aria-label="تأخير '+task.name+'"'+(index===state.plan.length-1?" disabled":"")+'>↓</button>'+
        '<button type="button" data-remove="'+id+'" aria-label="حذف '+task.name+'">×</button></span></div>';
    }).join("");
    renderCity("planner-city-map");
  }

  function toggleTask(id) {
    if (state.plan.includes(id)) state.plan=state.plan.filter((taskId) => taskId!==id);
    else state.plan.push(id);
    playSound("click");
    renderTaskLibrary();
    renderPlan();
  }

  function moveTask(index,direction) {
    const next=index+direction;
    if (next<0 || next>=state.plan.length) return;
    [state.plan[index],state.plan[next]]=[state.plan[next],state.plan[index]];
    playSound("click");
    renderPlan();
  }

  function startDay() {
    if (!state.plan.length) return;
    state.status={};
    state.plan.forEach((id) => {state.status[id]="pending";});
    state.completed=0;state.skipped=0;state.energy=100;state.minute=8*60;
    state.stars=0;state.eventsSeen=0;state.currentProgress=0;
    state.firstEventShown=false;state.finished=false;state.mode="ready";state.lastLitId="";
    state.eventQueue=[...events].sort(() => Math.random()-.5).slice(0,Math.min(2,Math.max(1,Math.ceil(state.plan.length/3))));
    renderGame();
    showScreen("play-screen");
    playSound("click");
  }

  function renderGame() {
    const task=currentTask();
    if (!task) {
      if (!state.finished) finishDay();
      return;
    }
    const done=state.completed+state.skipped;
    $("current-time").textContent=clockText(state.minute);
    $("city-time-label").textContent=clockText(state.minute);
    $("energy-label").textContent=digits(state.energy)+"٪";
    $("energy-bar").style.width=state.energy+"%";
    $("energy-bar").style.background=state.energy<25?"var(--pink)":state.energy<55?"var(--gold)":"var(--mint)";
    $("energy-tip").textContent=state.energy<25?"طاقتك قليلة؛ خد استراحة لو تحب.":state.energy<55?"استراحة صغيرة ممكن تساعد.":"طاقة حلوة، انطلق!";
    $("game-stars").textContent=digits(state.stars);
    $("day-task-counter").textContent=digits(done)+" / "+digits(state.plan.length);
    $("day-progress").style.width=(done/state.plan.length*100)+"%";
    $("city-progress-count").textContent=digits(state.completed)+" / "+digits(state.plan.length);
    $("city-message").textContent=state.completed===0
      ?"اختار أول تحدي وخلي أول نور يظهر!"
      :state.completed===state.plan.length
        ?"المدينة كلها بتنور بإنجازك! ✨"
        :"عاش! "+digits(state.completed)+" مكان نور... فاضل "+digits(state.plan.length-state.completed)+".";

    $("day-task-list").innerHTML=state.plan.map((id) => {
      const item=taskById(id),status=state.status[id]||"pending",isCurrent=item.id===task.id;
      const icon=status==="done"?"✅":status==="skipped"?"⏭️":isCurrent?"👈":"▫️";
      const label=status==="done"?"خلص":status==="skipped"?"عدّيته":isCurrent?"دلوقتي":"مستني";
      return '<div class="day-task '+(status==="done"?"done":status==="skipped"?"skipped":"")+(isCurrent?" current":"")+'">'+
        '<span class="task-ico" style="--task-tint:'+item.tint+'">'+item.emoji+'</span><span><strong>'+item.name+'</strong><small>'+digits(item.minutes)+" دقيقة · "+label+'</small></span><span class="task-state">'+icon+"</span></div>";
    }).join("");

    $("current-task-emoji").textContent=task.emoji;
    $("current-task-name").textContent=task.name;
    $("current-task-description").textContent=task.description;
    $("task-duration").textContent=durationText(task.minutes);
    $("task-progress-bar").style.width=Math.min(100,state.currentProgress/task.minutes*100)+"%";
    $("task-progress-text").textContent=state.mode==="paused"
      ?"خد وقتك… التحدي مستنيك"
      :state.mode==="working"
        ?"اتعمل "+digits(state.currentProgress)+" من "+digits(task.minutes)+" دقيقة"
        :"ابدأ لما تكون جاهز";
    $("task-action-button").classList.toggle("hidden",state.mode==="paused");
    $("task-action-button").innerHTML=state.mode==="working"?"كمّل ١٥ دقيقة <b>⏩</b>":"ابدأ التحدي <b>⚡</b>";
    $("pause-button").classList.toggle("hidden",state.mode!=="working");
    $("resume-button").classList.toggle("hidden",state.mode!=="paused");
    $("character-message").textContent=state.mode==="paused"
      ?"استراحة صغيرة؟ خد وقتك ☕"
      :state.energy<25
        ?"واضح إنك محتاج تهدى شوية 🌿"
        :state.completed>0
          ?"حلو! خطوة كمان والمدينة هتنور أكتر 🎉"
          :"يلا بينا! يوم جديد وفرصة جديدة 🌞";
    renderCity("city-map");
  }

  function beginTask() {
    if (state.mode==="ready") {
      state.mode="working";
      playSound("click");
      advanceTime(15);
      if (!state.firstEventShown && state.eventQueue.length && currentTask()) {
        state.firstEventShown=true;
        showEvent();
      }
    } else if (state.mode==="working") {
      playSound("click");
      advanceTime(15);
    }
  }

  function advanceTime(amount) {
    const task=currentTask();
    if (!task) return;
    const used=Math.min(amount,task.minutes-state.currentProgress);
    state.currentProgress+=used;
    state.minute+=used;
    if (state.currentProgress>=task.minutes) completeTask();
    else renderGame();
  }

  function completeTask() {
    const task=currentTask();
    if (!task) return;
    state.status[task.id]="done";
    state.lastLitId=task.id;
    state.completed++;
    state.currentProgress=0;
    state.energy=clamp(state.energy-task.energy,0,100);
    state.stars+=state.energy>=20?2:1;
    state.mode="ready";
    playSound("success");
    renderCity("city-map");
    renderCity("result-city-map");
    toast("عاش! محطة "+task.name+" نورت ✨");

    if (state.eventQueue.length && state.completed%2===0 && state.eventsSeen<state.eventQueue.length) showEvent();
    else if (!currentTask()) finishDay();
    else renderGame();
  }

  function pauseTask() {
    state.mode="paused";
    renderGame();
  }

  function resumeTask() {
    state.mode="working";
    playSound("click");
    advanceTime(15);
  }

  function skipTask() {
    const task=currentTask();
    if (!task) return;
    state.status[task.id]="skipped";
    state.skipped++;
    state.currentProgress=0;
    state.mode="ready";
    playSound("click");
    renderCity("city-map");
    if (!currentTask()) finishDay();
    else {
      toast("عدّينا "+task.name+". اختياراتك مرنة!");
      renderGame();
    }
  }

  function showEvent() {
    const event=state.eventQueue[state.eventsSeen];
    if (!event) {renderGame();return;}
    $("event-emoji").textContent=event.emoji;
    $("event-title").textContent=event.title;
    $("event-description").textContent=event.description;
    $("event-options").innerHTML=event.options.map((option,index) =>
      '<button type="button" class="event-choice" data-choice="'+index+'"><span>'+option.icon+'</span><span>'+option.label+'<small>'+option.detail+'</small></span><b>←</b></button>'
    ).join("");
    $("event-options").querySelectorAll("[data-choice]").forEach((button) => {
      button.addEventListener("click",() => chooseEvent(event.options[Number(button.dataset.choice)]));
    });
    showScreen("event-screen");
  }

  function chooseEvent(option) {
    state.minute+=option.time;
    state.energy=clamp(state.energy+option.energy,0,100);
    state.stars+=option.stars;
    state.eventsSeen++;
    playSound("click");
    if (!currentTask()) finishDay();
    else {
      showScreen("play-screen");
      renderGame();
      toast("اختيارك اتحسب في يومك ✨");
    }
  }

  function finishDay() {
    if (state.finished) return;
    state.finished=true;
    state.mode="finished";
    const ratio=state.completed/Math.max(1,state.plan.length);
    const balanced=state.energy>=25 && state.completed>=Math.ceil(state.plan.length/2);
    $("result-emoji").textContent=ratio>=.8&&state.energy>=25?"🏆":balanced?"🌟":"🌱";
    $("result-title").textContent=ratio>=.8&&state.energy>=25?"يوم جامد ومتوازن!":balanced?"عاش، عملت اللي عليك!":"كل يوم بنتعلم حاجة!";
    $("result-message").textContent=state.skipped
      ?"خلصت "+digits(state.completed)+" تحدي وعدّيتي "+digits(state.skipped)+". المدينة بتحتفل بكل خطوة عملتيها."
      :"خلصت "+digits(state.completed)+" تحدي ونوّرت "+digits(state.completed)+" مكان في المدينة!";
    $("result-stars").textContent="⭐ "+digits(state.stars);
    $("result-badge").textContent=state.energy>=45?"صاحب يوم متوازن":state.completed>=state.plan.length/2?"بطل الأولويات":"بداية لطيفة";
    $("stat-completed").textContent=digits(state.completed);
    $("stat-skipped").textContent=digits(state.skipped);
    $("stat-time").textContent=digits(state.minute-8*60);
    $("stat-energy").textContent=digits(state.energy)+"٪";
    $("result-insight").textContent=state.energy<20
      ?"الراحة مش مكافأة بعد الإنجاز؛ هي جزء من الخطة نفسها."
      :state.skipped>0
        ?"إنك تغيّر الخطة وقت اللزوم مهارة مهمة. المرونة كمان إنجاز."
        :"كل مكان نور بسبب خطوة عملتها. التخطيط بيساعدك تختار اللي يهمك وتسيب مساحة لنفسك.";
    renderCity("city-map");
    renderCity("result-city-map");
    showScreen("result-screen");
    playSound("victory");
  }

  function openPlanner() {
    state.plan=[];state.status={};state.completed=0;state.skipped=0;
    renderTaskLibrary();renderPlan();showScreen("planner-screen");playSound("click");
  }

  function resetPlan() {
    state.plan=[];state.status={};
    renderTaskLibrary();renderPlan();playSound("click");
  }

  function finishVideo() {
    $("intro-video").pause();
    showScreen("home-screen");
    if (!state.soundChosen) state.sound=true;
    updateSoundButton();
    startMusic();
    playSound("click");
  }

  function showVideoFallback() {
    $("video-fallback").classList.remove("hidden");
    $("intro-video").classList.add("hidden");
    $("video-play-hint").classList.add("hidden");
    $("video-end-panel").classList.remove("hidden");
    $("video-progress-bar").style.width="100%";
  }

  function playIntroVideo() {
    const video=$("intro-video");
    video.classList.remove("hidden");
    $("video-fallback").classList.add("hidden");
    $("video-play-hint").classList.add("hidden");
    video.play().catch(() => $("video-play-hint").classList.remove("hidden"));
  }

  function initVideo() {
    const video=$("intro-video");
    video.addEventListener("timeupdate",() => {
      if (video.duration) $("video-progress-bar").style.width=(video.currentTime/video.duration*100)+"%";
    });
    video.addEventListener("ended",() => {
      $("video-end-panel").classList.remove("hidden");
      document.querySelector(".video-skip").classList.add("hidden");
    });
    video.addEventListener("error",showVideoFallback);
    const started=video.play();
    if (started && started.catch) started.catch(() => {
      if (video.error) showVideoFallback();
      else $("video-play-hint").classList.remove("hidden");
    });
  }

  $("sound-toggle").addEventListener("click",toggleSound);

  document.addEventListener("click",(event) => {
    if (state.sound && !state.musicStarted) startMusic();

    const go=event.target.closest("[data-go]");
    if (go) {
      event.preventDefault();
      showScreen(go.dataset.go);
      playSound("click");
      return;
    }

    const action=event.target.closest("[data-action]");
    if (action) {
      switch(action.dataset.action) {
        case "finish-video": finishVideo(); break;
        case "play-video": playIntroVideo(); break;
        case "show-video":
          showScreen("video-screen");
          $("video-end-panel").classList.add("hidden");
          document.querySelector(".video-skip").classList.remove("hidden");
          $("video-progress-bar").style.width="0%";
          try {$("intro-video").currentTime=0;} catch (_) {}
          playIntroVideo();
          break;
        case "open-planner": openPlanner(); break;
        case "start-day": startDay(); break;
        case "reset-plan": resetPlan(); break;
        case "begin-task": beginTask(); break;
        case "pause-task": pauseTask(); break;
        case "resume-task": resumeTask(); break;
        case "skip-task": skipTask(); break;
        case "restart": openPlanner(); break;
      }
      return;
    }

    const add=event.target.closest("[data-task]");
    if (add) {toggleTask(add.dataset.task);return;}
    const remove=event.target.closest("[data-remove]");
    if (remove) {toggleTask(remove.dataset.remove);return;}
    const move=event.target.closest("[data-move]");
    if (move) moveTask(Number(move.dataset.index),move.dataset.move==="up"?-1:1);
  });

  prepareAudio();
  updateSoundButton();
  renderTaskLibrary();
  renderPlan();
  renderCity("result-city-map");
  initVideo();
})();
