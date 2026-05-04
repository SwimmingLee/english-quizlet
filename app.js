 // Initial Mock Data (Legacy structure support)
let patterns = [];
let decks = [];

// App State
let currentView = 'decks'; // 'decks', 'groupDetail', 'learn'
let currentDeckId = null;
let flashcards = [];
let currentCardIndex = 0;
let isFlipped = false;

// DOM Elements
const mainContent = document.getElementById('main-content');
const navGroups = document.getElementById('nav-groups');
const logoTitle = document.getElementById('logo-title');

// Modals
const addGroupModal = document.getElementById('add-group-modal');
const addGroupForm = document.getElementById('add-group-form');
const btnCancelAddGroup = document.getElementById('btn-cancel-add-group');

const addPatternModal = document.getElementById('add-pattern-modal');
const addPatternForm = document.getElementById('add-pattern-form');
const btnCancelAddPattern = document.getElementById('btn-cancel-add-pattern');

// Audio Voice Setup
let englishVoice = null;
function initVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;
    
    englishVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Natural')) ||
                   voices.find(v => v.lang.includes('en') && v.name.includes('Google')) ||
                   voices.find(v => v.lang === 'en-US' && v.name.includes('Female')) ||
                   voices.find(v => v.lang === 'en-US') ||
                   voices.find(v => v.lang.startsWith('en'));
}
window.speechSynthesis.onvoiceschanged = initVoices;

// Initialize
function init() {
    const savedPatterns = localStorage.getItem('englishPatterns');
    const savedDecks = localStorage.getItem('englishDecks');
    
    if (savedPatterns) {
        patterns = JSON.parse(savedPatterns);
    } else {
        // Fallback mock data if completely empty
        patterns = [
            {
                id: "1",
                deckId: "default",
                pattern: "crowd pleaser",
                meaningEn: "something that many people like",
                meaningKr: "대중적으로 인기가 많은 것, 누구나 좋아하는 것",
                examples: [
                    {
                        en: "This banana pudding is so delicious. It's such a crowd pleaser.",
                        kr: "이 바나나 푸딩 진짜 맛있다. 완전 사람들이 다 좋아할 맛이야."
                    }
                ]
            }
        ];
    }

    if (savedDecks) {
        decks = JSON.parse(savedDecks);
    } else {
        // Migration: If no decks exist but we have patterns, create a default deck
        decks = [
            { id: "default", name: "My First Group", createdAt: Date.now() }
        ];
        
        // Assign any legacy patterns without a deckId to the default deck
        patterns.forEach(p => {
            if (!p.deckId) p.deckId = "default";
        });
        saveData();
    }
    
    // One-time data injection based on user request
    const defaultDeck = decks.find(d => d.id === 'default');
    let dataModified = false;

    if (defaultDeck && defaultDeck.name === "My First Group") {
        defaultDeck.name = "입트영 26년 5월";
        dataModified = true;
    }

    const newPatternsData = [
        {
            pattern: "adjust to everyday life",
            meaningEn: "to get used to daily routines",
            meaningKr: "일상 생활에 적응하다",
            examples: [{ en: "It took me a while to adjust to everyday life after the long vacation.", kr: "긴 휴가 후 일상 생활에 적응하는 데 시간이 좀 걸렸다." }]
        },
        {
            pattern: "turn out great",
            meaningEn: "to have a very positive or successful result",
            meaningKr: "결과가 아주 좋게 나오다, 잘 되다",
            examples: [{ en: "Don't worry about the presentation. I'm sure it will turn out great.", kr: "발표 걱정하지 마. 분명 결과가 아주 좋을 거야." }]
        },
        {
            pattern: "hard to put into words",
            meaningEn: "difficult to express in speech",
            meaningKr: "말로 표현하기 어렵다",
            examples: [{ en: "My gratitude for your help is hard to put into words.", kr: "당신의 도움에 대한 제 감사함은 말로 표현하기 어렵습니다." }]
        },
        {
            pattern: "instantly wash away",
            meaningEn: "to immediately disappear or be removed",
            meaningKr: "즉시 씻겨 내려가다, 순식간에 사라지다",
            examples: [{ en: "When I saw her smile, my stress seemed to instantly wash away.", kr: "그녀의 미소를 보았을 때, 내 스트레스가 순식간에 사라지는 것 같았다." }]
        },
        {
            pattern: "sense of fulfillment",
            meaningEn: "a feeling of happiness and satisfaction",
            meaningKr: "성취감",
            examples: [{ en: "Volunteering at the shelter gives me a great sense of fulfillment.", kr: "보호소에서 자원봉사를 하는 것은 나에게 큰 성취감을 준다." }]
        }
    ];

    newPatternsData.forEach(newPat => {
        // Prevent duplicate insertion on subsequent reloads
        if (!patterns.find(p => p.pattern.includes(newPat.pattern.substring(0, 10)))) {
            patterns.push({
                id: Date.now().toString() + Math.random().toString(),
                deckId: "default",
                pattern: newPat.pattern,
                meaningEn: newPat.meaningEn,
                meaningKr: newPat.meaningKr,
                examples: newPat.examples
            });
            dataModified = true;
        }
    });

    if (dataModified) {
        saveData();
    }

    renderView();
    setupEventListeners();
}

function saveData() {
    localStorage.setItem('englishPatterns', JSON.stringify(patterns));
    localStorage.setItem('englishDecks', JSON.stringify(decks));
}

// Event Listeners
function setupEventListeners() {
    navGroups.addEventListener('click', () => switchView('decks'));
    logoTitle.addEventListener('click', () => switchView('decks'));
    
    // Group Modal Listeners
    btnCancelAddGroup.addEventListener('click', () => {
        addGroupModal.classList.add('hidden');
        addGroupForm.reset();
    });

    addGroupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newDeck = {
            id: 'deck_' + Date.now().toString(),
            name: document.getElementById('input-group-name').value,
            createdAt: Date.now()
        };
        decks.push(newDeck);
        saveData();
        addGroupModal.classList.add('hidden');
        addGroupForm.reset();
        
        if (currentView === 'decks') renderView();
    });

    // Pattern Modal Listeners
    btnCancelAddPattern.addEventListener('click', () => {
        addPatternModal.classList.add('hidden');
        addPatternForm.reset();
    });

    addPatternForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newPattern = {
            id: Date.now().toString(),
            deckId: currentDeckId, // Attach to current active deck
            pattern: document.getElementById('input-pattern').value,
            meaningEn: document.getElementById('input-meaning-en').value,
            meaningKr: document.getElementById('input-meaning-kr').value,
            examples: [
                {
                    en: document.getElementById('input-example-en').value,
                    kr: document.getElementById('input-example-kr').value
                }
            ]
        };

        patterns.push(newPattern);
        saveData();
        
        addPatternModal.classList.add('hidden');
        addPatternForm.reset();
        
        if (currentView === 'groupDetail') renderView();
    });
}

function switchView(view, deckId = null) {
    currentView = view;
    if (deckId !== null) {
        currentDeckId = deckId;
    }
    navGroups.classList.toggle('active', view === 'decks');
    renderView();
}

// Rendering Views
function renderView() {
    mainContent.innerHTML = '';
    
    if (currentView === 'decks') {
        renderDecksView();
    } else if (currentView === 'groupDetail') {
        renderGroupDetailView();
    } else if (currentView === 'learn') {
        renderLearnView();
    }
}

// VIEW 1: Decks (Home)
function renderDecksView() {
    const section = document.createElement('div');
    section.className = 'view-section active';
    
    section.innerHTML = `
        <div class="list-header">
            <h2>My Groups (${decks.length})</h2>
            <button class="btn-primary" id="btn-add-group">+ New Group</button>
        </div>
    `;

    if (decks.length === 0) {
        section.innerHTML += `
            <div class="empty-state glass-panel">
                <h2>No Groups Yet</h2>
                <p>Create a group to start adding your English patterns.</p>
            </div>
        `;
    } else {
        const grid = document.createElement('div');
        grid.className = 'pattern-grid';
        
        decks.forEach(deck => {
            const deckPatterns = patterns.filter(p => p.deckId === deck.id);
            const card = document.createElement('div');
            card.className = 'pattern-card deck-card glass-panel';
            card.innerHTML = `
                <div>
                    <h3>📁 ${deck.name}</h3>
                    <div class="deck-meta">${deckPatterns.length} pattern(s)</div>
                </div>
            `;
            // Click to open group
            card.addEventListener('click', () => switchView('groupDetail', deck.id));
            grid.appendChild(card);
        });
        
[O        section.appendChild(grid);
    }
    
    mainContent.appendChild(section);
    
    document.getElementById('btn-add-group').addEventListener('click', () => {
        addGroupModal.classList.remove('hidden');
    });
}

// VIEW 2: Group Detail (Pattern List)
function renderGroupDetailView() {
    const section = document.createElement('div');
    section.className = 'view-section active';
    
    const deck = decks.find(d => d.id === currentDeckId);
    if (!deck) return switchView('decks');

    const deckPatterns = patterns.filter(p => p.deckId === currentDeckId);
    
    const header = document.createElement('div');
    header.className = 'list-header';
    header.innerHTML = `
        <div class="list-header-left">
            <button class="btn-back" id="btn-back-decks">← Back</button>
            <h2>${deck.name} (${deckPatterns.length})</h2>
        </div>
        <div>
            ${deckPatterns.length > 0 ? '<button class="btn-secondary" id="btn-learn-group" style="margin-right: 1rem; color: var(--accent-color); border-color: var(--accent-color);">▶ Start Learning</button>' : ''}
            <button class="btn-primary" id="btn-add-pattern">+ Add Pattern</button>
        </div>
    `;
    section.appendChild(header);

    if (deckPatterns.length === 0) {
        section.innerHTML += `
            <div class="empty-state glass-panel">
                <h2>This group is empty</h2>
                <p>Add some patterns to start studying!</p>
            </div>
        `;
    } else {
        const grid = document.createElement('div');
        grid.className = 'pattern-grid';
        
        deckPatterns.forEach(p => {
            const card = document.createElement('div');
            card.className = 'pattern-card glass-panel';
            card.innerHTML = `
                <h3>${p.pattern}</h3>
                <div class="meaning-kr">${p.meaningKr}</div>
                <div class="example-count">${p.examples.length} example(s)</div>
            `;
            grid.appendChild(card);
        });
        
        section.appendChild(grid);
    }
    
    mainContent.appendChild(section);
    
    // Listeners
    document.getElementById('btn-back-decks').addEventListener('click', () => switchView('decks'));
    document.getElementById('btn-add-pattern').addEventListener('click', () => {
        addPatternModal.classList.remove('hidden');
    });
    
    const btnLearn = document.getElementById('btn-learn-group');
    if (btnLearn) {
        btnLearn.addEventListener('click', () => {
            flashcards = []; // Force regenerate
            currentCardIndex = 0;
            switchView('learn');
        });
    }
}

// Flashcard Logic
function generateFlashcards() {
    flashcards = [];
    // Only get patterns for current deck
    const deckPatterns = patterns.filter(p => p.deckId === currentDeckId);
    
    deckPatterns.forEach(p => {
        if (p.examples.length > 0) {
            p.examples.forEach(ex => {
                const isType1 = Math.random() > 0.5;
                if (isType1) {
                    flashcards.push({
                        type: 'Composition Practice',
                        frontMain: p.pattern,
                        frontSub: p.meaningKr,
                        backMain: ex.en.replace(new RegExp(p.pattern, 'gi'), `<span class="highlight">$&</span>`),
                        backSub: ex.kr
                    });
                } else {
                    flashcards.push({
                        type: 'Translation Practice',
                        frontMain: ex.kr,
                        frontSub: `Hint Pattern: <span class="highlight">${p.pattern}</span>`,
                        backMain: ex.en.replace(new RegExp(p.pattern, 'gi'), `<span class="highlight">$&</span>`),
                        backSub: 'How did you do?'
                    });
                }
            });
        } else {
            flashcards.push({
                type: 'Vocabulary',
                frontMain: p.pattern,
                frontSub: p.meaningEn,
                backMain: p.meaningKr,
                backSub: 'Please add an example sentence.'
            });
        }
    });
    
    flashcards.sort(() => Math.random() - 0.5);
    currentCardIndex = 0;
    isFlipped = false;
}

// VIEW 3: Learn View
function renderLearnView() {
    const deckPatterns = patterns.filter(p => p.deckId === currentDeckId);
    if (deckPatterns.length === 0) {
        return switchView('groupDetail');
    }

    if (currentCardIndex === 0 && flashcards.length === 0) {
        generateFlashcards();
    }

    const learnSection = document.createElement('div');
    learnSection.className = 'view-section active';
    
    // Header for learn mode
    const header = document.createElement('div');
    header.className = 'list-header';
    header.innerHTML = `
        <button class="btn-back" id="btn-back-detail">← Back to Group</button>
    `;
    learnSection.appendChild(header);
    
    if (currentCardIndex >= flashcards.length) {
        learnSection.innerHTML += `
            <div class="empty-state glass-panel">
                <h2>Great Job! 🎉</h2>
                <p>You've completed all cards for this session.</p>
                <br>
                <button class="btn-primary" id="btn-restart">Restart Session</button>
            </div>
        `;
        mainContent.appendChild(learnSection);
        document.getElementById('btn-back-detail').addEventListener('click', () => switchView('groupDetail'));
        document.getElementById('btn-restart').addEventListener('click', () => {
            generateFlashcards();
            renderView();
        });
        return;
    }

    const card = flashcards[currentCardIndex];
    const cleanBackText = card.backMain.replace(/<[^>]*>?/gm, ''); 
    
    learnSection.innerHTML += `
        <div class="progress-text">Card ${currentCardIndex + 1} of ${flashcards.length}</div>
        
        <div class="flashcard-container">
            <div class="swipe-wrapper" id="swipe-wrapper" style="touch-action: none;">
                <div class="flashcard" id="flashcard">
                    <div class="flashcard-face flashcard-front glass-panel">
                        <div class="card-type-badge">${card.type}</div>
                        <button class="audio-btn" data-text="${card.frontMain.replace(/<[^>]*>?/gm, '').replace(/"/g, '&quot;')}">🔊</button>
                        <div class="card-content-main">${card.frontMain}</div>
                        <div class="card-content-sub">${card.frontSub}</div>
                        <div class="click-hint">Click to flip | Swipe to answer</div>
                    </div>
                    <div class="flashcard-face flashcard-back glass-panel">
                        <div class="card-type-badge">${card.type}</div>
                        <button class="audio-btn" data-text="${cleanBackText.replace(/"/g, '&quot;')}">🔊</button>
                        <div class="card-content-main">${card.backMain}</div>
                        <div class="card-content-sub">${card.backSub}</div>
                        <div class="click-hint">Click to flip | Swipe to answer</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="learn-controls" id="learn-controls" style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; width: 100%; max-width: 400px; margin: 0 auto;">
                <button class="btn-secondary" id="btn-swipe-left" style="color: #10b981;">👈 Memorized</button>
                <button class="btn-secondary" id="btn-swipe-right" style="color: #ef4444;">Need Study 👉</button>
            </div>
        </div>
    `;
    
    mainContent.appendChild(learnSection);
    
    document.getElementById('btn-back-detail').addEventListener('click', () => switchView('groupDetail'));
    
    const swipeWrapper = document.getElementById('swipe-wrapper');
    const flashcardEl = document.getElementById('flashcard');
    const btnSwipeLeft = document.getElementById('btn-swipe-left');
    const btnSwipeRight = document.getElementById('btn-swipe-right');
    
    // Audio button logic
    const audioBtns = learnSection.querySelectorAll('.audio-btn');
    audioBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = btn.getAttribute('data-text');
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            if (englishVoice) utterance.voice = englishVoice;
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        });
    });
    
    // Swipe Logic
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let isClick = true;

    function handleSwipeAction(direction) {
        swipeWrapper.style.transition = 'transform 0.3s ease';
        if (direction === 'right') {
            swipeWrapper.style.transform = `translateX(1000px) rotate(30deg)`;
            flashcards.push(flashcards[currentCardIndex]);
        } else {
            swipeWrapper.style.transform = `translateX(-1000px) rotate(-30deg)`;
        }
        
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
        
        setTimeout(() => {
            currentCardIndex++;
            isFlipped = false;
            renderView();
        }, 300);
    }

    btnSwipeLeft.addEventListener('click', () => handleSwipeAction('left'));
    btnSwipeRight.addEventListener('click', () => handleSwipeAction('right'));

    function onDragStart(e) {
        if (e.target.closest('.audio-btn')) return;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        isDragging = true;
        isClick = true;
        swipeWrapper.style.transition = 'none';
    }

    function onDragMove(e) {
        if (!isDragging) return;
        const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        currentX = x - startX;
        
        if (Math.abs(currentX) > 5) isClick = false;
        
        const rotation = currentX * 0.05;
        swipeWrapper.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;
        
        if (currentX > 50) {
            flashcardEl.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.4)';
        } else if (currentX < -50) {
            flashcardEl.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.4)';
        } else {
            flashcardEl.style.boxShadow = '';
        }
    }

    function onDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        
        if (isClick) {
            isFlipped = !isFlipped;
            flashcardEl.classList.toggle('flipped', isFlipped);
            swipeWrapper.style.transform = '';
            flashcardEl.style.boxShadow = '';
            return;
        }

        if (currentX > 100) {
            handleSwipeAction('right');
        } else if (currentX < -100) {
            handleSwipeAction('left');
        } else {
            swipeWrapper.style.transition = 'transform 0.3s ease';
            swipeWrapper.style.transform = 'translateX(0) rotate(0)';
            flashcardEl.style.boxShadow = '';
        }
    }

    swipeWrapper.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    swipeWrapper.addEventListener('touchstart', onDragStart);
    document.addEventListener('touchmove', onDragMove);
    document.addEventListener('touchend', onDragEnd);
}

// Run app
init();

