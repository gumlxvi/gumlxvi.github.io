let timeshift = 1000;

const mn = document.querySelector('main');
window.onload = function() {
  if (window.innerHeight < 730) {
    mn.style.height = '600px';
  }
  if (window.innerHeight < 680) {
    mn.style.height = '550px';
  }
  if (window.innerHeight < 630) {
    mn.style.height = '500px';
  }
  if (window.innerWidth <= 1330) {
    mn.style.margin = '25px';
  }
};
window.onresize = function() {
  if (window.innerHeight >= 730) {
    mn.style.height = '';
  }
  if (window.innerWidth > 1330) {
    mn.style.margin = '';
  }
  if (window.innerHeight < 730) {
    mn.style.height = '600px';
  }
  if (window.innerHeight < 680) {
    mn.style.height = '550px';
  }
  if (window.innerHeight < 630) {
    mn.style.height = '500px';
  }
  if (window.innerWidth <= 1330) {
    mn.style.margin = '25px';
  }
};

const GRAY = '#9999AF'
    , LIGHT_GREEN = '#69D399'
    , DEEP_GREEN = '#5BB791'
    , DEEP_BLUE = '#4ABACE'
    , VIOLET = '#9B73CE';

let stats
  , remains
  , counter
  , timer
  , tabTimer
  , descriptionFor
  , volume;

const button = document.querySelector('#coucon > button')
    , global = document.querySelector('#global')
    , coucon = document.querySelector('#coucon')
    , stacon = document.querySelector('#stacon');

if (!localStorage.getItem('volume')) {
  volume = 0.5;
  localStorage.setItem('volume', 0.5);
} else {
  volume = +localStorage.getItem('volume');
}

if (!localStorage.getItem('stats')) {
  stats = [];
  remains = 1500;
  counter = 0;
} else {
  stats = JSON.parse(localStorage.getItem('stats'), (k, v) => {
    if (k == 'creationDate') return new Date(v);
    return v;
  });
  remains = +JSON.parse(localStorage.getItem('remains'));
  counter = +JSON.parse(localStorage.getItem('counter'));
}

let Sync = {
  save() {
    localStorage.setItem('stats', JSON.stringify(stats));
    localStorage.setItem('remains', JSON.stringify(remains));
    localStorage.setItem('counter', JSON.stringify(counter));
  },
  fastSave() {
    localStorage.setItem('remains', JSON.stringify(remains));
  },
  month() {
    if (!stats[0] || stats[0].creationDate.getMonth() != new Date().getMonth()) {
      stats.unshift({
        creationDate: new Date(),
        days: getRemainingDays()
      });
  
      if (stats.length == 4) stats.pop();
  
      function getRemainingDays() {
        let currentDate = new Date();
        let nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
        let result = [];
  
        while (currentDate.getMonth() != nextMonthDate.getMonth()) {
          result.push({
            date: `${getMonthAsString(currentDate.getMonth())} ${getDateAsString(currentDate.getDate())}`,
            sessions: []
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return result;
      }
    }
  },
};

let Render = {
  sessionNumber() {
    const counterSpan = document.querySelector('#coucon > span');
    counterSpan.textContent = `N${counter + 1}`;
  },
  currentStats() {
    let today = stats[0].days.find((v) => {
      if (~v.date.indexOf(getDateAsString(new Date().getDate()))) return true;
    });
  
    let statsDiv = document.createElement('div');
    statsDiv.classList.add('stats');
    
    statsDiv.insertAdjacentHTML('beforeend', `<h3>${today.date}</h3>`);
    statsDiv.insertAdjacentHTML('beforeend', `<p>${today.sessions.length} / 8 completed</p>`);
    statsDiv.insertAdjacentHTML(
      'beforeend', `<p>${Math.trunc(today.sessions.length * 25 / 60 * 100)/100} hours concentrated</p>`
    );
    statsDiv.insertAdjacentHTML(
      'beforeend', `<p>${Math.trunc(today.sessions.length / (8 * stats[0].days.length) * 10000)/100}% global goal</p>`
    );
    
    if (document.querySelector('#current > .stats')) {
      document.querySelector('#current > .stats').remove();
    }
    coucon.after(statsDiv);
  },
  globalStats() {
    document.querySelectorAll('#stacon > .stats').forEach((item) => {
      item.remove();
    });
    
    stats.forEach((v, i) => {
      let globalStatsDiv = document.createElement('div');
      globalStatsDiv.classList.add('stats');

      globalStatsDiv.insertAdjacentHTML(
        'beforeend', `<h3>
          ${getMonthAsString(v.creationDate.getMonth())}
          ${v.creationDate.getFullYear()}
        </h3>`
      );
      const sessionsTotal = v.days.length * 8
          , sessionsDone = v.days.reduce((acc, cur) => {
              return acc + cur.sessions.length;
            }, 0);
      globalStatsDiv.insertAdjacentHTML(
        'beforeend', `<p>
          ${sessionsDone} / ${sessionsTotal} →
          ${Math.trunc(sessionsDone * 25 / 60 * 100)/100} hours concentrated
        </p>`
      );

      let grid = document.createElement('div');
      grid.classList.add('grid');
      v.days.forEach((day, dayIndex) => {
        let cell = document.createElement('span');

        switch (day.sessions.length) {
          case 0:
            cell.style.backgroundColor = GRAY;
            break;
          case 1:
          case 2:
          case 3:
            cell.style.backgroundColor = LIGHT_GREEN;
            break;
          case 4:
          case 5:
          case 6:
          case 7:
            cell.style.backgroundColor = DEEP_GREEN;
            break;
          case 8:
            cell.style.backgroundColor = DEEP_BLUE;
            break;
          default:
            cell.style.backgroundColor = VIOLET;
        }

        cell.dataset.monthIndex = i;
        cell.dataset.dayIndex = dayIndex;

        grid.append(cell);
      });

      globalStatsDiv.append(grid);
      stacon.append(globalStatsDiv);
    });
  },
  timer() {
    let mR = Math.floor(remains / 60);
    if (String(mR).length == 1) mR = `0${mR}`;
    let sR = remains % 60;
    if (String(sR).length == 1) sR = `0${sR}`;

    return button.innerHTML = `${mR}:${sR}`;
  },
  progress(color) {
    let percent = (1500 - remains) / 1500 * 100;
    button.style.background = `linear-gradient(to right, ${color} ${percent}%, #DAD7F1 ${percent}%)`;
  },
  tab(text, blink) {
    if (blink) {
      document.title = text;
      tabTimer = setInterval(() => {
        if (document.title == '* * *') {
          document.title = text;
          return;
        }
        document.title = '* * *';
      }, 500);
      setTimeout(() => {
        clearInterval(tabTimer);
        document.title = 'Lily\'s Tomato App';
      }, 3500);
      return;
    }

    document.title = text;
  }
}

function getMonthAsString(month) {
  switch (month) {
    case 0:
      return 'January';
    case 1:
      return 'February';
    case 2:
      return 'March';
    case 3:
      return 'April';
    case 4:
      return 'May';
    case 5:
      return 'June';
    case 6:
      return 'July';
    case 7:
      return 'August';
    case 8:
      return 'September';
    case 9:
      return 'October';
    case 10:
      return 'November';
    case 11:
      return 'December';
  }
}

function getDateAsString(date) {
  let ending = String(date).slice(-1);
  switch (ending) {
    case 1:
      return `${date}st`;
    case 2:
      return `${date}nd`;
    case 3:
      return `${date}rd`;
    default:
      return `${date}th`;
  }
}

Sync.month();
Sync.save();

Render.sessionNumber();
Render.currentStats();
Render.globalStats();
Render.timer();
Render.progress(GRAY);

let alarm = new Audio('alarm.ogg');

button.addEventListener('click', () => {
  button.style.boxShadow = '';
  button.classList.remove('shine');

  const possibleDescription = document.querySelector('.description textarea');
  if (possibleDescription && possibleDescription.value) {
    descriptionFor.description = possibleDescription.value;
    Sync.save();

    document.querySelector('.description').style.height = '0px';
    setTimeout(() => document.querySelector('.description').remove(), 1000);

    if (chosen && chocon && stats[chosen.dataset.monthIndex].days[chosen.dataset.dayIndex] == descriptionFor) {
    chocon.innerHTML = '';
    chocon.insertAdjacentHTML('beforeend', `<h3>${descriptionFor.date}</h3>`);
      let list = document.createElement('ol');
      descriptionFor.sessions.forEach((v) => {
        let listItem = document.createElement('li');

        listItem.insertAdjacentHTML('beforeend', `<b>Session</b>: ${v.session}<br>`);
        listItem.insertAdjacentHTML('beforeend', `<b>Finished</b>: ${v.finished}<br>`);
        listItem.insertAdjacentHTML('beforeend', `<b>Description</b>: ${v.description}<br>`);

        list.append(listItem);
      });
      chocon.append(list);
      chocon.scrollTop = chocon.scrollHeight;
    }
  } else if (possibleDescription) {
    document.querySelector('.description').style.height = '0px';
    setTimeout(() => document.querySelector('.description').remove(), 1000);
  }

  if (!timer) {
    clearInterval(tabTimer);
    Render.tab(Render.timer());
    Render.progress(LIGHT_GREEN);

    timer = setInterval(() => {
      remains--;

      if (!remains) {
        Render.tab('Session Completed!', true);
        alarm.play();

        Sync.month();

        let today = stats[0].days.find((v) => {
          if (~v.date.indexOf(getDateAsString(new Date().getDate()))) return true;
        });
        let [h, m] = [new Date().getHours(), new Date().getMinutes()].map((v) => {
          if (String(v).length < 2) return `0${v}`;
          return String(v);
        });

        today.sessions.push({
          session: `N${++counter}`,
          finished: `${h}:${m}`,
          description: 'There is nothing here...'
        });

        if (today.sessions.length < 8) {
          Render.progress(DEEP_GREEN);
          button.style.boxShadow = `0 0 15px ${DEEP_GREEN}`;
          button.innerHTML = 'Done! Now take a rest...';
        } else if (today.sessions.length == 8) {
          Render.progress(DEEP_BLUE);
          button.style.boxShadow = `0 0 15px ${DEEP_BLUE}`;
          button.innerHTML = 'Daily objective completed!';
        } else {
          Render.progress(VIOLET);
          button.style.boxShadow = `0 0 15px ${VIOLET}`;
          button.innerHTML = 'Additional session completed!';
        }
        button.classList.add('shine');

        descriptionFor = today.sessions[today.sessions.length - 1];
        let descriptionDiv = document.createElement('div');
        descriptionDiv.insertAdjacentHTML('beforeend', '<p>Description:</p>');
        descriptionDiv.insertAdjacentHTML('beforeend', '<textarea></textarea>');
        descriptionDiv.classList.add('description');
        descriptionDiv.querySelector('textarea').addEventListener('keydown', (e) => {
          if  (!e.shiftKey && e.code == 'Enter') {
            descriptionFor.description = e.target.value;
            Sync.save();
            
            document.querySelector('.description').style.height = '0px';
            setTimeout(() => document.querySelector('.description').remove(), 1000);
            e.preventDefault();
          }
        });
        document.querySelector('#current').append(descriptionDiv);
        window.requestAnimationFrame(() => {
          descriptionDiv.style.height = '150px';
        });

        clearInterval(timer);
        timer = null;
        remains = 1500;

        if (chosen && chocon && stats[chosen.dataset.monthIndex].days[chosen.dataset.dayIndex] == today) {
          chocon.innerHTML = '';
          chocon.insertAdjacentHTML('beforeend', `<h3>${today.date}</h3>`);
          let list = document.createElement('ol');
          today.sessions.forEach((v) => {
            let listItem = document.createElement('li');

            listItem.insertAdjacentHTML('beforeend', `<b>Session</b>: ${v.session}<br>`);
            listItem.insertAdjacentHTML('beforeend', `<b>Finished</b>: ${v.finished}<br>`);
            listItem.insertAdjacentHTML('beforeend', `<b>Description</b>: ${v.description}<br>`);

            list.append(listItem);
          });
          chocon.append(list);
          chocon.scrollTop = chocon.scrollHeight;
        }

        Render.sessionNumber();
        Render.currentStats();
        Render.globalStats();
        Sync.save();
        return;
      }

      Render.tab(Render.timer());
      Render.progress(LIGHT_GREEN);
      Sync.fastSave();
    }, timeshift);
  } else {
    clearInterval(timer);
    timer = null;
    Render.progress(GRAY);
  }
});

let chosen,
    chocon;
global.addEventListener('click', e => {
  if (e.target.closest('#chocon')) {
    return;
  }

  if (chosen) {
    chosen.style.border = '';
    chocon.style.width = '0px';
  }

  if (e.target.tagName == 'SPAN') {
    chosen = e.target;
    chosen.style.border = '1px solid red';

    if (!chocon) {
      chocon = document.createElement('div');
      chocon.id = 'chocon';
    }

    chocon.innerHTML = '';
    let targetDay = stats[chosen.dataset.monthIndex].days[chosen.dataset.dayIndex];
    chocon.insertAdjacentHTML('beforeend', `<h3>${targetDay.date}</h3>`);
    if (!targetDay.sessions.length) {
      chocon.insertAdjacentHTML('beforeend', `<p>Not Exist</p>`);
    } else {
      let list = document.createElement('ol');
      targetDay.sessions.forEach((v) => {
        let listItem = document.createElement('li');

        listItem.insertAdjacentHTML('beforeend', `<b>Session</b>: ${v.session}<br>`);
        listItem.insertAdjacentHTML('beforeend', `<b>Finished</b>: ${v.finished}<br>`);
        listItem.insertAdjacentHTML('beforeend', `<b>Description</b>: ${v.description}<br>`);

        list.append(listItem);
      });
      chocon.append(list);
    }

    if (!document.querySelector('#chocon')) {
      document.querySelector('#global > div').append(chocon);
    }
    window.requestAnimationFrame(() => {
      chocon.style.width = '350px';
    });
  }
});

let exportButton = document.querySelector('#export')
  , importInput = document.querySelector('#file')
  , alarmChangeButton = document.querySelector('#alarm-sound');

exportButton.addEventListener('click', () => {
  let data = JSON.stringify({
    stats,
    remains,
    counter
  }, null, 1);

  let file = new File([data], 'save.json');
  let link = document.createElement('a');

  link.href = URL.createObjectURL(file);
  link.download = 'save.json';
  link.click();
});

importInput.addEventListener('change', () => {
  let save = importInput.files[0];
  let reader = new FileReader();
  reader.readAsText(save);

  reader.onload = () => {
    let parsed = JSON.parse(reader.result, (k, v) => {
      if (k == 'creationDate') return new Date(v);
      return v;
    });

    stats = parsed.stats;
    remains = parsed.remains;
    counter = parsed.counter;

    if (!stats || !remains || !counter) throw new Error('Wrong File!');

    clearInterval(timer);
    clearInterval(tabTimer);
    timer = null;
    tabTimer = null;

    Sync.month();
    Sync.save();
    Render.sessionNumber();
    Render.currentStats();
    Render.globalStats();
    Render.timer();
    Render.progress(GRAY);
  };

  reader.onerror = () => {
    throw reader.error;
  };
});

alarmChangeButton.addEventListener('click', () => {
  let modal = document.createElement('div');
  modal.classList.add('audio-modal');

  let heading = document.createElement('h2');
  heading.innerText = 'Volume Control';
  modal.append(heading);

  let range = document.createElement('input');
  range.type = 'range';
  range.min = 0;
  range.max = 1;
  range.step = 0.1;
  range.value = volume;
  modal.append(range);

  let volumeSpan = document.createElement('span');
  volumeSpan.innerText = volume * 100 + '%';
  modal.append(volumeSpan);
  
  range.onchange = () => {
    volume = range.value;
    volumeSpan.innerText = volume * 100 + '%';
    localStorage.setItem('volume', volume);
  }

  function outerClickClose(e) {
    if (!e.target.closest('.audio-modal')) {
      document.querySelector('.audio-modal').remove();
      document.body.removeEventListener('click', outerClickClose);
    }
  }

  document.body.addEventListener('mousedown', outerClickClose);
  document.body.append(modal);
});

let hintDelay;
stacon.addEventListener('mouseover', (e) => {
  if (e.target.tagName == 'SPAN') {
    const targetDay = stats[e.target.dataset.monthIndex].days[e.target.dataset.dayIndex];
    hintDelay = setTimeout(() => {
      let hint = document.createElement('div');

      hint.classList.add('hint');
      hint.innerHTML = `${targetDay.date} (${targetDay.sessions.length} / 8)`; 

      document.body.append(hint);

      const box = e.target.getBoundingClientRect();
      hint.style.left = box.left + 'px';
      hint.style.top = box.top + 25 + 'px';
    }, 500);
  } 
});

stacon.addEventListener('mouseout', (e) => {
  if (e.target.tagName == 'SPAN') {
    clearTimeout(hintDelay);
    document.querySelectorAll('.hint').forEach((item) => item.remove());
  } 
});

//Debug Cheatcodes
let keylog = '', resetTimeout;
document.body.addEventListener('keydown', (e) => {
  if (!resetTimeout) resetTimeout = setTimeout(() => {
    keylog = '';
    resetTimeout = null;
  }, 4000);
  
  keylog += e.key;
  switch (keylog.toUpperCase()) {
    case 'TIMESHIFT':
      timeshift = 1;
      showSequenceActivated('x212 Faster');
      break;
    case 'OBLIVION':
      clearInterval(timer);
      clearInterval(tabTimer);
      timer = null;
      tabTimer = null;

      descriptionFor = null;
      if (document.querySelector('.description')) {
        document.querySelector('.description').style.height = '0px';
        setTimeout(() => document.querySelector('.description').remove(), 1000);
      }

      if (chosen) {
        chosen.style.border = '';
        chocon.style.width = '0px';
      }

      stats = [];
      remains = 1500;
      counter = 0;

      localStorage.clear();

      Sync.month();
      Sync.save();

      Render.sessionNumber();
      Render.currentStats();
      Render.globalStats();
      Render.timer();
      Render.progress(GRAY);

      showSequenceActivated('*neuralyzer sound*');
      break;
    case 'SHROOMS':
      document.body.style.animation = 'shrooms 3s infinite';
      showSequenceActivated('They weren\'t champignons...');
      break;
  }

  function showSequenceActivated(seq) {
    let message = document.createElement('div');
    message.classList.add('sequenceActivated');
    message.innerHTML = `
      <b>Cheatcode Activated!</b><br>
      ${seq}
    `;
    document.body.append(message);
    window.requestAnimationFrame(() => {
      message.style.left = '50px';
      setTimeout(() => message.style.opacity = 0, 2000);
      setTimeout(() => message.remove(), 4000);
    });
  }
});