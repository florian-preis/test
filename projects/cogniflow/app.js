/* ══════════════════════════════════════════════════════
   preis.works — cogniflow.js
   SpeedReader application logic.
   Depends on: JSZip (cdnjs), PDF.js (cdnjs)
══════════════════════════════════════════════════════ */

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ── Navbar scroll ──────────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ── IndexedDB ──────────────────────────────────────────────────────────────
const DB = {
    _db: null,
    open() {
        return new Promise(resolve => {
            if (this._db) { resolve(this._db); return; }
            const req = indexedDB.open('cogniflowDB', 1);
            req.onupgradeneeded = e => {
                e.target.result.createObjectStore('books', { keyPath: 'id' });
            };
            req.onsuccess = e => { this._db = e.target.result; resolve(this._db); };
            req.onerror   = () => resolve(null);
        });
    },
    async put(record) {
        const db = await this.open();
        if (!db) return this._lsFallback('set', record.id, record);
        return new Promise(resolve => {
            const tx = db.transaction('books', 'readwrite');
            tx.objectStore('books').put(record).onsuccess = () => resolve(true);
            tx.onerror = () => { this._lsFallback('set', record.id, record); resolve(false); };
        });
    },
    async get(id) {
        const db = await this.open();
        if (!db) return this._lsFallback('get', id);
        return new Promise(resolve => {
            const tx = db.transaction('books', 'readonly');
            tx.objectStore('books').get(id).onsuccess = e => resolve(e.target.result || this._lsFallback('get', id));
            tx.onerror = () => resolve(this._lsFallback('get', id));
        });
    },
    async del(id) {
        const db = await this.open();
        if (db) {
            const tx = db.transaction('books', 'readwrite');
            tx.objectStore('books').delete(id);
        }
        this._lsFallback('del', id);
    },
    _lsFallback(op, id, data) {
        const key = 'cfbook:' + id;
        if (op === 'set') { try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {} }
        if (op === 'get') { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch(e) { return null; } }
        if (op === 'del') { try { localStorage.removeItem(key); } catch(e) {} }
    }
};

// ── SpeedReader ────────────────────────────────────────────────────────────
class SpeedReader {
    constructor() {
        this.words               = [];
        this.rawWords            = [];
        this.chapters            = [];
        this.currentIndex        = 0;
        this.currentChapterIndex = 0;
        this.isPlaying           = false;
        this.wpm                 = 300;
        this.bionicEnabled       = true;
        this.intervalId          = null;
        this.currentBook         = null;
        this.library             = this._loadLibraryMeta();

        this._initElements();
        this._attachListeners();

        // Open DB then restore UI state from URL hash
        DB.open().then(() => {
            const hash = window.location.hash.replace('#','');
            this._applySection(['reader','library','about'].includes(hash) ? hash : 'reader');
        });
    }

    // ── Elements ─────────────────────────────────────────────────────────
    _initElements() {
        const $ = id => document.getElementById(id);
        this.fileInput           = $('fileInput');
        this.pasteArea           = $('pasteArea');
        this.pasteLoadBtn        = $('pasteLoadBtn');
        this.pasteClearBtn       = $('pasteClearBtn');
        this.wordDisplay         = $('wordDisplay');
        this.speedSlider         = $('speedSlider');
        this.speedValue          = $('speedValue');
        this.bionicToggle        = $('bionicToggle');
        // fontSelector replaced by fontToggleBtn
        this.playPauseBtn        = $('playPauseBtn');
        this.resetBtn            = $('resetBtn');
        this.rewindBtn           = $('rewindBtn');
        this.forwardBtn          = $('forwardBtn');
        this.saveBtn             = $('saveBtn');
        this.fontToggleBtn       = $('fontToggleBtn');
        this.currentFont         = 'serif'; // track state
        this.progressFill        = $('progressFill');
        this.progressPct         = $('progressPct');
        this.bookProgressLabel   = $('bookProgressLabel');
        this.chapterProgressFill = $('chapterProgressFill');
        this.chapterProgressPct  = $('chapterProgressPct');
        this.chapterProgressRow  = $('chapterProgressRow');
        this.chapterNav          = $('chapterNav');
        this.chapterList         = $('chapterList');
        this.readerLayout        = $('readerLayout');
        this.readerSection       = $('readerSection');
        this.librarySection      = $('librarySection');
        this.aboutSection        = $('aboutSection');
        this.libraryContent      = $('libraryContent');
        this.hamburger           = $('hamburger');
        this.mobileMenu          = $('mobileMenu');
        this.deleteModal         = $('deleteModal');
        this.deleteModalMsg      = $('deleteModalMsg');
        this.deleteCancelBtn     = $('deleteCancelBtn');
        this.deleteConfirmBtn    = $('deleteConfirmBtn');
        this._pendingDeleteIndex = null;
        this.tabFile             = $('tabFile');
        this.tabPaste            = $('tabPaste');
        this.panelFile           = $('panelFile');
        this.panelPaste          = $('panelPaste');
        // Nav links
        this._navLinks = {
            reader:  { desk: $('readerLink'),  mob: $('mReaderLink')  },
            library: { desk: $('libraryLink'), mob: $('mLibraryLink') },
            about:   { desk: $('aboutLink'),   mob: $('mAboutLink')   },
        };
        $('logoLink').addEventListener('click', e => { e.preventDefault(); this.showSection('reader'); });
    }

    // ── Listeners ─────────────────────────────────────────────────────────
    _attachListeners() {
        this.fileInput.addEventListener('change',  e => this._handleFile(e));
        this.speedSlider.addEventListener('input', e => this.updateSpeed(e));
        this.bionicToggle.addEventListener('change', e => this.toggleBionic(e));
        this.playPauseBtn.addEventListener('click', () => { this.isPlaying ? this.pause() : this.play(); });
        this.resetBtn.addEventListener('click',   () => this.reset());
        this.rewindBtn.addEventListener('click',  () => this.skip(-10));
        this.forwardBtn.addEventListener('click', () => this.skip(10));
        this.saveBtn.addEventListener('click',    () => this.saveToLibrary());
        this.fontToggleBtn.addEventListener('click', () => this.toggleFont());
        this.pasteLoadBtn.addEventListener('click',  () => this._loadPaste());
        this.pasteClearBtn.addEventListener('click', () => { this.pasteArea.value = ''; });

        // Upload tabs
        this.tabFile.addEventListener('click', () => {
            this.tabFile.classList.add('active');  this.tabPaste.classList.remove('active');
            this.panelFile.classList.add('active'); this.panelPaste.classList.remove('active');
        });
        this.tabPaste.addEventListener('click', () => {
            this.tabPaste.classList.add('active'); this.tabFile.classList.remove('active');
            this.panelPaste.classList.add('active'); this.panelFile.classList.remove('active');
        });

        // Nav
        Object.entries(this._navLinks).forEach(([section, els]) => {
            [els.desk, els.mob].forEach(el => el.addEventListener('click', e => {
                e.preventDefault(); this._closeMobile(); this.showSection(section);
            }));
        });

        // Hamburger
        this.hamburger.addEventListener('click', e => {
            e.stopPropagation();
            this.hamburger.classList.toggle('open');
            this.mobileMenu.classList.toggle('open');
        });
        document.addEventListener('click', e => {
            if (!e.target.closest('.navbar') && !e.target.closest('.mobile-menu')) this._closeMobile();
            document.querySelectorAll('.book-menu-dropdown.open').forEach(d => d.classList.remove('open'));
        });

        // Modal
        this.deleteCancelBtn.addEventListener('click',  () => this._closeDeleteModal());
        this.deleteConfirmBtn.addEventListener('click', () => this._confirmDelete());
        this.deleteModal.addEventListener('click', e => { if (e.target === this.deleteModal) this._closeDeleteModal(); });

        // Sync chapter nav height on resize
        window.addEventListener('resize', () => this._syncChapterNavHeight(), { passive: true });

        // No hash routing - causes page reload on Jekyll sites

        // Keyboard
        document.addEventListener('keydown', e => {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
            if (e.key === ' ')           { e.preventDefault(); this.playPauseBtn.click(); }
            if (e.key === 'ArrowLeft')   { e.preventDefault(); this.skip(-10); }
            if (e.key === 'ArrowRight')  { e.preventDefault(); this.skip(10);  }
            if (e.key === 'ArrowUp')     { e.preventDefault(); this.adjustSpeed(25);  }
            if (e.key === 'ArrowDown')   { e.preventDefault(); this.adjustSpeed(-25); }
        });
    }

    _closeMobile() {
        this.hamburger.classList.remove('open');
        this.mobileMenu.classList.remove('open');
    }

    // ── Section routing ───────────────────────────────────────────────────
    showSection(section) {
        this._applySection(section);
    }

    _applySection(section) {
        if (!['reader','library','about'].includes(section)) section = 'reader';
        this.pause();
        ['readerSection','librarySection','aboutSection'].forEach(id =>
            document.getElementById(id).classList.remove('active')
        );
        Object.values(this._navLinks).forEach(els => {
            els.desk.classList.remove('nav-active');
            els.mob.classList.remove('nav-active');
        });
        const map = { reader: this.readerSection, library: this.librarySection, about: this.aboutSection };
        map[section].classList.add('active');
        this._navLinks[section].desk.classList.add('nav-active');
        this._navLinks[section].mob.classList.add('nav-active');
        if (section === 'library') this.renderLibrary();
        // Update URL without triggering reload or hashchange
        try { history.replaceState(null, '', '#' + section); } catch(e) {}
        window.scrollTo(0, 0);
    }

    // ── Persistence ───────────────────────────────────────────────────────
    _loadLibraryMeta() {
        try { return JSON.parse(localStorage.getItem('cogniflowLibrary') || '[]'); }
        catch(e) { return []; }
    }

    _saveLibraryMeta() {
        try {
            localStorage.setItem('cogniflowLibrary', JSON.stringify(
                this.library.map(b => ({
                    id: b.id, title: b.title, author: b.author,
                    progress: b.progress || 0,
                    currentIndex: b.currentIndex || 0,
                    currentChapterIndex: b.currentChapterIndex || 0,
                    lastRead: b.lastRead, uploadDate: b.uploadDate,
                    fileName: b.fileName,
                    wordCount: b.wordCount || 0,
                    chapterCount: b.chapterCount || 0
                }))
            ));
        } catch(e) { console.warn('saveLibraryMeta failed', e); }
    }

    async saveToLibrary() {
        if (!this.currentBook) return;

        const meta = {
            id:                   this.currentBook.id,
            title:                this.currentBook.title,
            author:               this.currentBook.author,
            fileName:             this.currentBook.fileName || '',
            uploadDate:           this.currentBook.uploadDate,
            lastRead:             new Date().toISOString(),
            progress:             this.words.length ? (this.currentIndex / this.words.length) * 100 : 0,
            currentIndex:         this.currentIndex,
            currentChapterIndex:  this.currentChapterIndex,
            wordCount:            this.words.length,
            chapterCount:         this.chapters.length
        };

        const existingIdx = this.library.findIndex(b => b.id === meta.id);
        if (existingIdx >= 0) this.library[existingIdx] = meta;
        else this.library.push(meta);

        // 1. Save tiny metadata index to localStorage
        this._saveLibraryMeta();

        // 2. Save chapter text to IndexedDB (survives refresh, no size issues)
        const chapterData = {
            id:       this.currentBook.id,
            chapters: this.chapters.map(ch => ({ title: ch.title, text: ch.text, startIndex: ch.startIndex }))
        };
        await DB.put(chapterData);


        this.saveBtn.classList.add('saved');
        setTimeout(() => { this.saveBtn.classList.remove('saved'); }, 1000);
    }

    async _autoSaveProgress() {
        if (!this.currentBook) return;
        const idx = this.library.findIndex(b => b.id === this.currentBook.id);
        if (idx < 0) return; // not in library yet — don't auto-save
        this.library[idx].progress            = this.words.length ? (this.currentIndex / this.words.length) * 100 : 0;
        this.library[idx].currentIndex        = this.currentIndex;
        this.library[idx].currentChapterIndex = this.currentChapterIndex;
        this.library[idx].lastRead            = new Date().toISOString();
        this._saveLibraryMeta();
    }

    // ── File loading ──────────────────────────────────────────────────────
    async _handleFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { this.wordDisplay.textContent = 'File too large (max 10 MB).'; return; }

        this.wordDisplay.textContent = 'Loading…';
        this.chapterNav.classList.remove('active');
        this.readerLayout.classList.remove('has-chapters');

        this.currentBook = {
            id:          Date.now() + '-' + Math.random().toString(36).substr(2,9),
            title:       file.name.replace(/\.(epub|txt|pdf)$/i, ''),
            author:      'Unknown Author',
            fileName:    file.name,
            uploadDate:  new Date().toISOString(),
            progress:    0
        };

        try {
            const ext = file.name.toLowerCase().split('.').pop();
            if (ext === 'epub') {
                await this._parseEPUB(file);
            } else if (ext === 'txt' || ext === 'rtf') {
                const text = await file.text();
                const clean = ext === 'rtf' ? this._stripRTF(text) : text;
                this.chapters = [{ title: 'Full Text', text: clean, startIndex: 0 }];
                this._processChapters();
            } else if (ext === 'pdf') {
                await this._parsePDF(file);
            } else if (ext === 'docx') {
                await this._parseDOCX(file);
            } else if (ext === 'html' || ext === 'htm') {
                const text = await file.text();
                this.chapters = [{ title: 'Full Text', text: this._stripHTML(text), startIndex: 0 }];
                this._processChapters();
            }
            this._finishLoading();
        } catch(err) {
            console.error(err);
            this.wordDisplay.textContent = 'Error loading file. Please try again.';
        }
    }

    _loadPaste() {
        const text = this.pasteArea.value.trim();
        if (!text) return;
        this.wordDisplay.textContent = 'Loading…';
        this.chapterNav.classList.remove('active');
        this.readerLayout.classList.remove('has-chapters');
        this.currentBook = {
            id:         Date.now() + '-' + Math.random().toString(36).substr(2,9),
            title:      'Pasted Text',
            author:     '',
            fileName:   '',
            uploadDate: new Date().toISOString(),
            progress:   0
        };
        this.chapters = [{ title: 'Full Text', text, startIndex: 0 }];
        this._processChapters();
        this._finishLoading();
    }

    _finishLoading() {
        this.fontToggleBtn.classList.add('serif-active');
        const hasChapters = this.chapters.length > 1;
        this.setProgressMode(hasChapters);
        this.enableControls();
        this.saveBtn.disabled = false;
        this.wordDisplay.textContent = 'Ready! Press Play to start';
        if (hasChapters) this._displayChapterNav();
    }

    async loadBookFromLibrary(index) {
        const meta = this.library[index];
        if (!meta) return;

        this.wordDisplay.textContent = 'Loading…';
        this.chapterNav.classList.remove('active');
        this.readerLayout.classList.remove('has-chapters');

        const stored = await DB.get(meta.id);
        if (!stored || !stored.chapters || stored.chapters.length === 0) {
            this.wordDisplay.textContent = 'Book data not found — please re-upload the file.';
            return;
        }

        this.currentBook = { ...meta };
        this.chapters    = stored.chapters;
        this._processChapters();

        // Restore reading position AFTER processChapters resets it to 0
        this.currentIndex        = meta.currentIndex || 0;
        this.currentChapterIndex = meta.currentChapterIndex || 0;

        const hasChapters = this.chapters.length > 1;
        this.setProgressMode(hasChapters);
        if (hasChapters) this._displayChapterNav();
        this.enableControls();
        this.saveBtn.disabled = false;
        this.updateProgress();
        this.wordDisplay.textContent = 'Ready! Press Play to continue';
        this.showSection('reader');
    }

    // ── EPUB / PDF parsing ─────────────────────────────────────────────────
    async _parseEPUB(file) {
        const zip    = await JSZip.loadAsync(await file.arrayBuffer());
        let opfPath  = null;
        for (const fn in zip.files) { if (fn.endsWith('.opf')) { opfPath = fn; break; } }

        let orderedFiles = [];
        if (opfPath) {
            const opfText = await zip.files[opfPath].async('string');
            orderedFiles  = this._spineOrder(opfText, opfPath, zip);
        }
        if (!orderedFiles.length) {
            orderedFiles = Object.keys(zip.files)
                .filter(fn => /\.(html|xhtml|htm)$/i.test(fn) && !fn.startsWith('__MACOSX')
                    && !/(toc|nav|copyright|title)/i.test(fn))
                .sort();
        }

        this.chapters = [];
        for (let i = 0; i < orderedFiles.length; i++) {
            const html              = await zip.files[orderedFiles[i]].async('string');
            const { title, text }   = this._extractChapter(html, i + 1);
            if (text.trim().split(/\s+/).length > 50) this.chapters.push({ title, text, startIndex: 0 });
        }
        this._processChapters();
    }

    _spineOrder(opfText, opfPath, zip) {
        const base  = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
        const doc   = new DOMParser().parseFromString(opfText, 'text/xml');
        const items = {};
        doc.querySelectorAll('manifest item').forEach(el => {
            items[el.getAttribute('id')] = base + el.getAttribute('href');
        });
        const ordered = [];
        doc.querySelectorAll('spine itemref').forEach(el => {
            const id = el.getAttribute('idref');
            if (items[id] && zip.files[items[id]]) ordered.push(items[id]);
        });
        return ordered;
    }

    _extractChapter(html, n) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('script,style').forEach(el => el.remove());
        let title = `Chapter ${n}`;
        for (const sel of ['h1','h2','header h1','header h2','title']) {
            const el = doc.querySelector(sel);
            if (el && el.textContent.trim().length < 100) { title = el.textContent.trim(); break; }
        }
        title = title.replace(/^\d+\.\s*/, '').replace(/^Chapter\s+\d+:\s*/i, '') || `Chapter ${n}`;
        const text = (doc.body || doc.documentElement).textContent.replace(/\s+/g,' ').trim();
        return { title, text };
    }

    async _parsePDF(file) {
        if (typeof pdfjsLib === 'undefined') throw new Error('PDF.js not loaded');
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        let full  = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page    = await pdf.getPage(i);
            const content = await page.getTextContent();
            full         += content.items.map(it => it.str).join(' ') + ' ';
        }
        this.chapters = [{ title: 'Full Text', text: full.replace(/\s+/g,' ').trim(), startIndex: 0 }];
        this._processChapters();
    }

    // ── Word processing ───────────────────────────────────────────────────
    _processChapters() {
        this.rawWords = [];
        let idx = 0;
        for (const ch of this.chapters) {
            ch.startIndex = idx;
            const tokens  = ch.text.split(' ').filter(w => w.length > 0);
            for (const t of tokens) {
                let pause = 1.0;
                if (/[.!?]$/.test(t))  pause = 2.0;
                else if (/[,;:]$/.test(t)) pause = 1.25;
                this.rawWords.push({ text: t, pause });
            }
            idx += tokens.length;
        }
        this.words               = this.rawWords.map(w => w.text);
        this.currentIndex        = 0;
        this.currentChapterIndex = 0;
        this.updateProgress();
    }

    // ── Playback ──────────────────────────────────────────────────────────
    play() {
        if (!this.words.length) return;
        this.isPlaying = true;
        this.playPauseBtn.textContent = 'Pause';
        this.playPauseBtn.classList.add('is-playing');
        this._tick();
    }

    pause() {
        this.isPlaying = false;
        this.playPauseBtn.textContent = 'Play';
        this.playPauseBtn.classList.remove('is-playing');
        if (this.intervalId) { clearTimeout(this.intervalId); this.intervalId = null; }
    }

    reset() {
        this.pause();
        this.currentIndex        = this.chapters.length ? this.chapters[this.currentChapterIndex].startIndex : 0;
        this.wordDisplay.textContent = this.chapters.length ? this.chapters[this.currentChapterIndex].title : 'Ready!';
        this.updateProgress();
    }

    skip(delta) {
        if (!this.words.length) return;
        const was = this.isPlaying;
        if (was) this.pause();
        this.currentIndex = Math.max(0, Math.min(this.words.length - 1, this.currentIndex + delta));
        this._syncChapterIndex();
        if (this.words[this.currentIndex]) this.wordDisplay.innerHTML = this._bionic(this.words[this.currentIndex]);
        this.updateProgress();
        if (was) this.play();
    }

    adjustSpeed(delta) {
        this.wpm               = Math.max(25, Math.min(1000, this.wpm + delta));
        this.speedSlider.value = this.wpm;
        this.speedValue.textContent = `${this.wpm} WPM`;
        if (this.isPlaying) { this.pause(); this.play(); }
    }

    updateSpeed(e) {
        this.wpm = parseInt(e.target.value);
        this.speedValue.textContent = `${this.wpm} WPM`;
        if (this.isPlaying) { this.pause(); this.play(); }
    }

    _tick() {
        if (this.currentIndex >= this.words.length) {
            this.pause();
            this.wordDisplay.innerHTML = '✓ Finished!';
            return;
        }
        this._syncChapterIndex();
        const word = this.rawWords[this.currentIndex];
        this.wordDisplay.innerHTML = this._bionic(word.text);
        this.currentIndex++;
        this.updateProgress();
        if (this.currentIndex % 50 === 0) this._autoSaveProgress();
        if (this.isPlaying) {
            this.intervalId = setTimeout(() => { if (this.isPlaying) this._tick(); }, Math.round((60000 / this.wpm) * word.pause));
        }
    }

    _syncChapterIndex() {
        for (let i = this.chapters.length - 1; i >= 0; i--) {
            if (this.currentIndex >= this.chapters[i].startIndex) {
                if (i !== this.currentChapterIndex) { this.currentChapterIndex = i; this._highlightChapter(); }
                break;
            }
        }
    }

    // ── Bionic / font ─────────────────────────────────────────────────────
    _bionic(word) {
        if (!this.bionicEnabled) return word;
        const n = word.length <= 3 ? 1 : word.length <= 7 ? 2 : Math.max(3, Math.ceil(word.length / 2));
        return `<strong>${word.slice(0,n)}</strong>${word.slice(n)}`;
    }

    toggleBionic(e) {
        this.bionicEnabled = e.target.checked;
        if (!this.isPlaying && this.currentIndex > 0)
            this.wordDisplay.innerHTML = this._bionic(this.words[this.currentIndex - 1] || '');
    }

    // ── New format parsers ────────────────────────────────────────────────────
    async _parseDOCX(file) {
        // Use JSZip to unzip DOCX and extract document.xml
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const xmlFile = zip.files['word/document.xml'];
        if (!xmlFile) throw new Error('Invalid DOCX file');
        const xml = await xmlFile.async('string');
        // Strip XML tags and decode entities
        let text = xml
            .replace(/<w:p[ >][^>]*>/g, ' ')   // paragraph = space
            .replace(/<w:br[^>]*>/g, ' ')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'").replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ').trim();
        this.chapters = [{ title: 'Full Text', text, startIndex: 0 }];
        this._processChapters();
    }

    _stripHTML(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('script,style,nav,header,footer').forEach(el => el.remove());
        return (doc.body || doc.documentElement).textContent.replace(/\s+/g,' ').trim();
    }

    _stripRTF(rtf) {
        // Remove RTF control words and groups, leaving plain text
        return rtf
            .replace(/\{[^{}]*\}/g, '')
            .replace(/\\[a-z]+[-]?[0-9]*/g, ' ')
            .replace(/[{}]/g, '')
            .replace(/\s+/g, ' ').trim();
    }

    toggleFont() {
        this.currentFont = this.currentFont === 'serif' ? 'sans' : 'serif';
        if (this.currentFont === 'sans') {
            this.wordDisplay.style.fontFamily = "'Helvetica Neue',Helvetica,Arial,sans-serif";
            this.fontToggleBtn.classList.remove('serif-active');
            this.fontToggleBtn.classList.add('sans-active');
        } else {
            this.wordDisplay.style.fontFamily = "Georgia,'Times New Roman',Times,serif";
            this.fontToggleBtn.classList.remove('sans-active');
            this.fontToggleBtn.classList.add('serif-active');
        }
    }

    // ── Progress ──────────────────────────────────────────────────────────
    updateProgress() {
        if (!this.words.length) {
            this.progressFill.style.width = '0%';
            this.progressPct.textContent  = '0%';
            this.chapterProgressFill.style.width = '0%';
            this.chapterProgressPct.textContent  = '0%';
            return;
        }
        const pct = Math.round((this.currentIndex / this.words.length) * 100);
        this.progressFill.style.width = `${pct}%`;
        this.progressPct.textContent  = `${pct}%`;
        if (this.chapters.length > 1 && this.currentChapterIndex < this.chapters.length) {
            const ch    = this.chapters[this.currentChapterIndex];
            const chEnd = this.currentChapterIndex < this.chapters.length - 1
                ? this.chapters[this.currentChapterIndex + 1].startIndex : this.words.length;
            const cpct  = chEnd > ch.startIndex
                ? Math.round(((this.currentIndex - ch.startIndex) / (chEnd - ch.startIndex)) * 100) : 0;
            this.chapterProgressFill.style.width = `${Math.max(0, cpct)}%`;
            this.chapterProgressPct.textContent  = `${Math.max(0, cpct)}%`;
        }
    }

    setProgressMode(hasChapters) {
        this.bookProgressLabel.textContent       = hasChapters ? 'Book' : 'Text';
        this.chapterProgressRow.style.display    = hasChapters ? 'flex' : 'none';
    }

    enableControls() {
        [this.playPauseBtn, this.resetBtn, this.rewindBtn, this.forwardBtn].forEach(b => b.disabled = false);
        this.playPauseBtn.textContent = 'Play';
        this.playPauseBtn.classList.remove('is-playing');
    }

    // ── Chapter nav ───────────────────────────────────────────────────────
    _syncChapterNavHeight() {
        if (!this.chapterNav || !this.chapterNav.classList.contains('active')) return;
        const controlsRow = this.readerLayout && this.readerLayout.querySelector('.controls-row');
        if (!controlsRow) return;
        // Height = from top of chapter nav to bottom of controls-row
        const navTop  = this.chapterNav.getBoundingClientRect().top;
        const ctrlBot = controlsRow.getBoundingClientRect().bottom;
        if (navTop > 0 && ctrlBot > navTop) {
            this.chapterNav.style.maxHeight = (ctrlBot - navTop) + 'px';
        }
    }

    _displayChapterNav() {
        this.chapterList.innerHTML = '';
        this.chapters.forEach((ch, i) => {
            const li    = document.createElement('li');
            li.className = 'chapter-item' + (i === this.currentChapterIndex ? ' active' : '');
            li.innerHTML = `<span class="chapter-number">${i+1}.</span><span class="chapter-title-text">${ch.title}</span>`;
            li.addEventListener('click', () => this.jumpToChapter(i));
            this.chapterList.appendChild(li);
        });
        this.chapterNav.classList.add('active');
        this.readerLayout.classList.add('has-chapters');
        this.chapterProgressRow.style.display = 'flex';
        // Sync height after layout settles
        requestAnimationFrame(() => this._syncChapterNavHeight());
    }

    jumpToChapter(idx) {
        this.pause();
        this.currentChapterIndex = idx;
        this.currentIndex        = this.chapters[idx].startIndex;
        this.wordDisplay.textContent = this.chapters[idx].title;
        this._highlightChapter();
        this.updateProgress();
    }

    _highlightChapter() {
        this.chapterList.querySelectorAll('.chapter-item')
            .forEach((el, i) => el.classList.toggle('active', i === this.currentChapterIndex));
    }

    // ── Library rendering ─────────────────────────────────────────────────
    async renderLibrary() {
        this.library = this._loadLibraryMeta();
        if (!this.library.length) {
            this.libraryContent.innerHTML = '<div class="empty-library"><h2>Your library is empty</h2><p>Save books from the reader to build your collection</p></div>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'library-grid';

        // Append grid FIRST so getElementById works when attaching listeners
        this.libraryContent.innerHTML = '';
        this.libraryContent.appendChild(grid);

        for (let i = 0; i < this.library.length; i++) {
            const book = this.library[i];
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = [
                '<div class="book-cover" id="cover-' + i + '">',
                '  <div class="book-cover-placeholder"><div class="book-icon"></div></div>',
                '</div>',
                '<button class="book-menu-btn" data-index="' + i + '" title="Options">⋯</button>',
                '<div class="book-menu-dropdown" id="menu-' + i + '">',
                '  <button class="book-menu-item" data-action="edit" data-index="' + i + '">Edit</button>',
                '  <button class="book-menu-item danger" data-action="delete" data-index="' + i + '">Delete</button>',
                '</div>',
                '<div class="book-meta">',
                '  <div class="book-title" id="title-' + i + '">' + book.title + '</div>',
                '  <div class="book-author" id="author-' + i + '">' + (book.author || '') + '</div>',
                '  <div class="book-progress"><div class="book-progress-fill" style="width:' + (book.progress||0) + '%"></div></div>',
                '  <div class="book-progress-text">' + Math.round(book.progress||0) + '% · ' + (book.wordCount||0).toLocaleString() + ' words</div>',
                '</div>'
            ].join('');

            // Add to DOM BEFORE attaching listeners
            grid.appendChild(card);

            // Card click handler
            card.addEventListener('click', (e => {
                const idx = i;
                return function(e) {
                    const action  = e.target.dataset.action;
                    const menuBtn = e.target.closest('.book-menu-btn');
                    if (action === 'edit')   { e.stopPropagation(); reader._enableEditMode(idx); return; }
                    if (action === 'delete') { e.stopPropagation(); reader._openDeleteModal(idx); return; }
                    if (menuBtn) {
                        e.stopPropagation();
                        const dd = document.getElementById('menu-' + menuBtn.dataset.index);
                        document.querySelectorAll('.book-menu-dropdown.open').forEach(d => { if (d !== dd) d.classList.remove('open'); });
                        dd.classList.toggle('open');
                        return;
                    }
                    if (!e.target.closest('.book-menu-dropdown') && !e.target.isContentEditable)
                        reader.loadBookFromLibrary(idx);
                };
            })(i));

            // Edit listeners — elements are in DOM now
            ['title', 'author'].forEach(field => {
                const el = document.getElementById(field + '-' + i);
                if (!el) return;
                const idx = i;
                el.addEventListener('blur', function() {
                    if (el.isContentEditable) {
                        reader.library[idx][field] = el.textContent.trim();
                        reader._saveLibraryMeta();
                        el.removeAttribute('contenteditable');
                        el.style.cursor = 'default';
                        // Re-fetch cover if title or author changed
                        const b = reader.library[idx];
                        const coverEl2 = document.getElementById('cover-' + idx);
                        if (coverEl2) {
                            reader._fetchCover(b.title, b.author).then(function(url) {
                                if (url && coverEl2) coverEl2.innerHTML = '<img src="' + url + '" alt="" loading="lazy"/>';
                                else if (coverEl2 && !coverEl2.querySelector('img'))
                                    coverEl2.innerHTML = '<div class="book-cover-placeholder"><div class="book-icon"></div></div>';
                            });
                        }
                    }
                });
                el.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
                el.addEventListener('click',   function(e) { if (el.isContentEditable) e.stopPropagation(); });
            });

            // Cover fetch — capture element reference now while it exists
            const coverEl = document.getElementById('cover-' + i);
            const bookTitle = book.title;
            const bookAuthor = book.author;
            this._fetchCover(bookTitle, bookAuthor).then(function(url) {
                if (url && coverEl) coverEl.innerHTML = '<img src="' + url + '" alt="" loading="lazy"/>';
            });
        }
    }

    async _fetchCover(title, author) {
        try {
            const q    = encodeURIComponent(`${title} ${author}`);
            const res  = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=1`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.docs?.[0]?.cover_i
                ? `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-M.jpg`
                : null;
        } catch { return null; }
    }

    _enableEditMode(idx) {
        document.querySelectorAll('.book-menu-dropdown.open').forEach(d => d.classList.remove('open'));
        // Make both title and author editable
        ['title','author'].forEach(field => {
            const el = document.getElementById(field + '-' + idx);
            if (!el) return;
            el.setAttribute('contenteditable','true');
            el.style.cursor = 'text';
        });
        // Focus title first and select all text
        const titleEl = document.getElementById('title-' + idx);
        if (titleEl) {
            titleEl.focus();
            const r = document.createRange(), s = window.getSelection();
            r.selectNodeContents(titleEl);
            s.removeAllRanges(); s.addRange(r);
        }
    }

    _openDeleteModal(idx) {
        document.querySelectorAll('.book-menu-dropdown.open').forEach(d => d.classList.remove('open'));
        this._pendingDeleteIndex = idx;
        this.deleteModalMsg.textContent = `"${this.library[idx]?.title || 'this book'}" will be permanently removed from your library.`;
        this.deleteModal.classList.add('open');
    }

    _closeDeleteModal() {
        this.deleteModal.classList.remove('open');
        this._pendingDeleteIndex = null;
    }

    _confirmDelete() {
        if (this._pendingDeleteIndex === null) return;
        const id = this.library[this._pendingDeleteIndex]?.id;
        this.library.splice(this._pendingDeleteIndex, 1);
        this._saveLibraryMeta();
        if (id) DB.del(id);
        this._closeDeleteModal();
        this.renderLibrary();
    }
}

const reader = new SpeedReader();
