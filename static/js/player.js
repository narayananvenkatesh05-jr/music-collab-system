/* ============================================================
   MusicCollab — Spotify-Style Music Player
   ============================================================ */
'use strict';

const FREE_TRACKS = [
  { id:'f1', name:'Midnight City Vibes',  artist:'Free Library', type:'Electronic',
    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    img:'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=56&q=70' },
  { id:'f2', name:'Soul Groove',          artist:'Free Library', type:'R&B',
    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    img:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=56&q=70' },
  { id:'f3', name:'Lo-fi Study Session',  artist:'Free Library', type:'Lo-fi',
    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    img:'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=56&q=70' },
  { id:'f4', name:'Electric Dreams',      artist:'Free Library', type:'Electronic',
    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    img:'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=56&q=70' },
  { id:'f5', name:'Urban Rhythm',         artist:'Free Library', type:'Hip-Hop',
    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    img:'https://images.unsplash.com/photo-1547745329-d4b96e0d5ca0?w=56&q=70' },
  { id:'f6', name:'Chill Afternoon',      artist:'Free Library', type:'Lo-fi',
    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    img:'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=56&q=70' },
  { id:'f7', name:'Jazz Nights',          artist:'Free Library', type:'Jazz',
    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    img:'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=56&q=70' },
  { id:'f8', name:'Pop Sunshine',         artist:'Free Library', type:'Pop',
    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    img:'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=56&q=70' }
];

const Player = {
  audio:       new Audio(),
  queue:       [],
  currentIdx:  -1,
  isPlaying:   false,
  isShuffle:   false,
  isRepeat:    false,
  volume:      0.8,
  liked:       new Set(JSON.parse(localStorage.getItem('mc_liked')||'[]')),

  get current() { return this.queue[this.currentIdx] || null; },

  init() {
    this.buildHTML();
    this.bindAudio();
    this.bindButtons();
    this.setVolume(this.volume);
    this.scanPageTracks();
    this.renderFreeTracks();
  },

  buildHTML() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="music-player" id="music-player">
        <div class="player-left">
          <div class="player-album-art" id="pl-art">🎵</div>
          <div class="player-track-info">
            <div class="player-track-name"   id="pl-name">Select a track</div>
            <div class="player-track-artist" id="pl-artist">MusicCollab Player</div>
          </div>
          <button class="player-like-btn" id="pl-like">♡</button>
        </div>
        <div class="player-center">
          <div class="player-controls">
            <button class="ctrl-btn" id="pl-shuffle" title="Shuffle">⇌</button>
            <button class="ctrl-btn" id="pl-prev"    title="Previous">⏮</button>
            <button class="ctrl-btn-play" id="pl-play">▶</button>
            <button class="ctrl-btn" id="pl-next"    title="Next">⏭</button>
            <button class="ctrl-btn" id="pl-repeat"  title="Repeat">↻</button>
          </div>
          <div class="player-progress">
            <span class="progress-time" id="pl-elapsed">0:00</span>
            <div class="progress-track" id="pl-track">
              <div class="progress-fill" id="pl-fill" style="width:0%">
                <div class="progress-thumb"></div>
              </div>
            </div>
            <span class="progress-time" id="pl-duration">0:00</span>
          </div>
        </div>
        <div class="player-right">
          <div class="volume-container">
            <button class="volume-icon" id="pl-vol-icon">🔊</button>
            <input type="range" class="volume-slider" id="pl-vol" min="0" max="100" value="80"/>
          </div>
          <button class="ctrl-btn" id="pl-queue-btn" title="Queue">☰</button>
        </div>
      </div>
      <div class="queue-panel" id="queue-panel">
        <div class="queue-panel-header">
          <span>Up Next</span>
          <button onclick="Player.toggleQueue()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px">✕</button>
        </div>
        <div id="queue-list"></div>
      </div>`);
  },

  bindAudio() {
    const a = this.audio;
    a.addEventListener('timeupdate', () => {
      if (!a.duration) return;
      const pct = (a.currentTime / a.duration) * 100;
      document.getElementById('pl-fill').style.width = pct + '%';
      document.getElementById('pl-elapsed').textContent = this.fmt(a.currentTime);
    });
    a.addEventListener('loadedmetadata', () => {
      document.getElementById('pl-duration').textContent = this.fmt(a.duration);
    });
    a.addEventListener('ended', () => this.onEnded());
    a.addEventListener('play',  () => this.setPlayIcon(true));
    a.addEventListener('pause', () => this.setPlayIcon(false));
    a.volume = this.volume;
  },

  bindButtons() {
    document.getElementById('pl-play').addEventListener('click', () => this.togglePlay());
    document.getElementById('pl-prev').addEventListener('click', () => this.prev());
    document.getElementById('pl-next').addEventListener('click', () => this.next());

    document.getElementById('pl-shuffle').addEventListener('click', () => {
      this.isShuffle = !this.isShuffle;
      document.getElementById('pl-shuffle').classList.toggle('active', this.isShuffle);
    });

    document.getElementById('pl-repeat').addEventListener('click', () => {
      this.isRepeat = !this.isRepeat;
      document.getElementById('pl-repeat').classList.toggle('active', this.isRepeat);
    });

    document.getElementById('pl-track').addEventListener('click', e => {
      const r = document.getElementById('pl-track').getBoundingClientRect();
      const pct = (e.clientX - r.left) / r.width;
      if (this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
    });

    document.getElementById('pl-vol').addEventListener('input', e => {
      this.setVolume(e.target.value / 100);
    });

    document.getElementById('pl-vol-icon').addEventListener('click', () => {
      if (this.audio.volume > 0) {
        this._v = this.audio.volume;
        this.setVolume(0);
        document.getElementById('pl-vol').value = 0;
        document.getElementById('pl-vol-icon').textContent = '🔇';
      } else {
        this.setVolume(this._v || 0.8);
        document.getElementById('pl-vol').value = (this._v || 0.8) * 100;
        document.getElementById('pl-vol-icon').textContent = '🔊';
      }
    });

    document.getElementById('pl-like').addEventListener('click', () => {
      if (!this.current) return;
      const id = this.current.id;
      if (this.liked.has(id)) {
        this.liked.delete(id);
        document.getElementById('pl-like').textContent = '♡';
        document.getElementById('pl-like').classList.remove('liked');
      } else {
        this.liked.add(id);
        document.getElementById('pl-like').textContent = '♥';
        document.getElementById('pl-like').classList.add('liked');
      }
      localStorage.setItem('mc_liked', JSON.stringify([...this.liked]));
    });

    document.getElementById('pl-queue-btn').addEventListener('click', () => this.toggleQueue());

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space')      { e.preventDefault(); this.togglePlay(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); this.audio.currentTime = Math.min(this.audio.currentTime+10, this.audio.duration||0); }
      if (e.code === 'ArrowLeft')  { e.preventDefault(); this.audio.currentTime = Math.max(this.audio.currentTime-10, 0); }
    });
  },

  scanPageTracks() {
    document.querySelectorAll('.track-item[data-url]').forEach(row => {
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        const url    = row.dataset.url;
        const name   = row.querySelector('.track-name')?.textContent?.trim() || 'Track';
        const artist = row.querySelector('.track-meta')?.textContent?.trim() || '';
        if (!url || url === 'None') return;
        this.playTrack({ id: url, name, artist, type: 'UPLOAD', url, img: '' });
      });
    });
  },

  renderFreeTracks() {
    const el = document.getElementById('free-tracks-list');
    if (!el) return;
    FREE_TRACKS.forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'free-track-item';
      div.innerHTML = `
        <div style="width:28px;text-align:center;font-size:13px;color:var(--text-muted)">${i+1}</div>
        <div class="queue-thumb"><img src="${t.img}" onerror="this.parentElement.innerHTML='🎵'"/></div>
        <div style="flex:1;min-width:0">
          <div class="free-track-name" style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div>
          <div class="free-track-meta" style="font-size:12px;color:var(--text-muted)">${t.artist} · ${t.type}</div>
        </div>
        <span style="font-size:11px;color:var(--accent);font-weight:600">FREE</span>`;
      div.addEventListener('click', () => {
        this.queue = [...FREE_TRACKS];
        this.currentIdx = i;
        this.loadPlay();
        this.renderQueue();
      });
      el.appendChild(div);
    });
  },

  playTrack(track) {
    const idx = this.queue.findIndex(t => t.id === track.id);
    if (idx >= 0) {
      this.currentIdx = idx;
    } else {
      this.queue.splice(this.currentIdx + 1, 0, track);
      this.currentIdx++;
    }
    this.loadPlay();
    this.renderQueue();
  },

  loadPlay() {
    const t = this.current;
    if (!t) return;
    this.audio.src = t.url;
    this.audio.load();
    this.audio.play().catch(() => {});

    document.getElementById('pl-name').textContent   = t.name;
    document.getElementById('pl-artist').textContent = t.artist || t.type;

    const art = document.getElementById('pl-art');
    art.innerHTML = t.img
      ? `<img src="${t.img}" onerror="this.parentElement.innerHTML='🎵'"/>`
      : ({'VOCALS':'🎤','BEAT':'🥁','INSTRUMENTAL':'🎸','MIXED':'🎛️'}[t.type] || '🎵');

    const liked = this.liked.has(t.id);
    document.getElementById('pl-like').textContent = liked ? '♥' : '♡';
    document.getElementById('pl-like').classList.toggle('liked', liked);

    document.querySelectorAll('.track-item, .free-track-item').forEach(row => {
      row.classList.toggle('now-playing', row.dataset.url === t.url);
    });

    document.getElementById('music-player').classList.add('visible');
    document.body.classList.add('player-active');
    this.renderQueue();
  },

  togglePlay() {
    if (!this.current) {
      if (FREE_TRACKS.length) {
        this.queue = [...FREE_TRACKS];
        this.currentIdx = 0;
        this.loadPlay();
      }
      return;
    }
    this.audio.paused ? this.audio.play() : this.audio.pause();
  },

  setPlayIcon(playing) {
    document.getElementById('pl-play').textContent = playing ? '⏸' : '▶';
    const art = document.getElementById('pl-art');
    if (playing) art.classList.add('spinning');
    else         art.classList.remove('spinning');
  },

  next() {
    if (!this.queue.length) return;
    if (this.isShuffle) {
      this.currentIdx = Math.floor(Math.random() * this.queue.length);
    } else {
      this.currentIdx = (this.currentIdx + 1) % this.queue.length;
    }
    this.loadPlay();
  },

  prev() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    this.currentIdx = (this.currentIdx - 1 + this.queue.length) % this.queue.length;
    this.loadPlay();
  },

  onEnded() {
    if (this.isRepeat) {
      this.audio.currentTime = 0;
      this.audio.play();
    } else {
      this.next();
    }
  },

  setVolume(v) {
    this.volume = v;
    this.audio.volume = v;
    const icon = document.getElementById('pl-vol-icon');
    if (icon) icon.textContent = v === 0 ? '🔇' : v < 0.5 ? '🔉' : '🔊';
  },

  toggleQueue() {
    document.getElementById('queue-panel').classList.toggle('open');
  },

  renderQueue() {
    const el = document.getElementById('queue-list');
    if (!el) return;
    el.innerHTML = '';
    this.queue.forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'queue-item' + (i === this.currentIdx ? ' active' : '');
      div.innerHTML = `
        <div class="queue-thumb">${t.img ? `<img src="${t.img}" onerror="this.parentElement.innerHTML='🎵'"/>` : '🎵'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${t.artist||t.type}</div>
        </div>
        ${i === this.currentIdx ? '<div class="eq-anim"><div class="eq-anim-bar"></div><div class="eq-anim-bar"></div><div class="eq-anim-bar"></div></div>' : ''}`;
      div.addEventListener('click', () => { this.currentIdx = i; this.loadPlay(); });
      el.appendChild(div);
    });
  },

  fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s/60);
    const sec = Math.floor(s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  }
};

document.addEventListener('DOMContentLoaded', () => Player.init());