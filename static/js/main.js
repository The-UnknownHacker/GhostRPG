const ACHIEVEMENTS = {
    'Ghost Hunter': {
        id: 'ghost_hunter',
        name: 'Ghost Hunter',
        description: 'Defeat 10 enemies',
        requirement: 10,
        reward: {
            gold: 100,
            exp: 50
        },
        progress: 0,
        completed: false
    },
    'Treasure Hunter': {
        id: 'treasure_hunter',
        name: 'Treasure Hunter',
        description: 'Collect 5 Ancient Relics',
        requirement: 5,
        reward: {
            gold: 200,
            exp: 100
        },
        progress: 0,
        completed: false
    },
    'Spirit Master': {
        id: 'spirit_master',
        name: 'Spirit Master',
        description: 'Reach level 10',
        requirement: 10,
        reward: {
            gold: 500,
            exp: 250
        },
        progress: 0,
        completed: false
    }
};

const DAILY_QUESTS = {
    'Daily Ghost Hunt': {
        description: 'Defeat 5 ghosts today',
        requirement: 5,
        reward: {
            gold: 100,
            exp: 50
        },
        progress: 0,
        completed: false,
        reset: true
    },
    'Daily Explorer': {
        description: 'Visit 3 different locations today',
        requirement: 3,
        reward: {
            gold: 75,
            exp: 40
        },
        progress: 0,
        completed: false,
        reset: true
    }
};

class OnboardingSystem {
    constructor() {
        this.steps = [
            {
                title: 'Welcome to Ghost RPG!',
                message: 'Begin your journey as a ghost hunter in this mysterious world.',
                highlight: null,
                action: 'next'
            },
            {
                title: 'Character Stats',
                message: 'Here you can see your HP, Mana, and other stats that will grow as you level up.',
                highlight: '.character-panel',
                action: 'next'
            },
            {
                title: 'Basic Actions',
                message: 'Use these buttons to explore, shop, rest, and travel between locations.',
                highlight: '.action-buttons',
                action: 'next'
            },
            {
                title: 'Inventory & Quests',
                message: 'Click these sections to manage your items and track your quests.',
                highlight: '.inventory-panel',
                action: 'next'
            },
            {
                title: 'Getting Started',
                message: 'Start by traveling to the Haunted Forest and exploring to find ghosts!',
                highlight: null,
                action: 'complete'
            }
        ];
        this.currentStep = 0;
    }

    start() {
        const tutorialDone = localStorage.getItem('tutorialDone');
        
        if (tutorialDone === 'true') {
            return;
        }

        player.inventory = {
            'Health Potion': 2,
            'Mana Potion': 1,
            'Ghost Essence': 0,
            'Spirit Shard': 0,
            'Ancient Relic': 0
        };
        
        saveGame();
        this.showStep();
    }

    showStep() {
        if (this.currentStep >= this.steps.length) return;

        const step = this.steps[this.currentStep];
        
        const modal = document.createElement('div');
        modal.className = 'tutorial-modal';
        modal.innerHTML = `
            <div class="tutorial-content">
                <h3>${step.title}</h3>
                <p>${step.message}</p>
                <button class="btn tutorial-btn" onclick="gameEnhancements.onboarding.nextStep()">
                    ${step.action === 'complete' ? 'Start Playing!' : 'Next Tip'}
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        if (step.highlight) {
            const element = document.querySelector(step.highlight);
            if (element) {
                element.classList.add('tutorial-highlight');
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    nextStep() {
        const currentModal = document.querySelector('.tutorial-modal');
        if (currentModal) {
            currentModal.remove();
        }

        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        this.currentStep++;

        if (this.currentStep < this.steps.length) {
            this.showStep();
        } else {
            localStorage.setItem('tutorialDone', 'true');
            showNotification('🎉 Tutorial complete! Good luck on your adventure!', 'achievement');
        }
    }
}

class AchievementSystem {
    constructor() {
        this.achievements = {
            'Ghost Hunter': {
                id: 'ghost_hunter',
                name: 'Ghost Hunter',
                description: 'Defeat 10 enemies',
                requirement: 10,
                reward: {
                    gold: 100,
                    exp: 50,
                    item: 'Spirit Charm'  
                },
                progress: 0,
                completed: false
            },
            'Treasure Hunter': {
                id: 'treasure_hunter',
                name: 'Treasure Hunter',
                description: 'Collect 5 Ancient Relics',
                requirement: 5,
                reward: {
                    gold: 200,
                    exp: 100,
                    item: 'Ghost Blade'
                },
                progress: 0,
                completed: false
            },
            'Spirit Master': {
                id: 'spirit_master',
                name: 'Spirit Master',
                description: 'Reach level 10',
                requirement: 10,
                reward: {
                    gold: 500,
                    exp: 250,
                    item: 'Master\'s Amulet'
                },
                progress: 0,
                completed: false
            }
        };
        this.loadProgress();
    }

    init() {
        this.updateUI();
    }

    loadProgress() {
        const saved = localStorage.getItem('achievements');
        if (saved) {
            const progress = JSON.parse(saved);
            Object.keys(this.achievements).forEach(key => {
                if (progress[key]) {
                    this.achievements[key].progress = progress[key].progress;
                    this.achievements[key].completed = progress[key].completed;
                }
            });
        }
    }

    saveProgress() {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    updateProgress(type, amount = 1) {
        let updated = false;
        Object.values(this.achievements).forEach(achievement => {
            if (!achievement.completed) {
                switch(type) {
                    case 'kill':
                        if (achievement.id === 'ghost_hunter') {
                            achievement.progress += amount;
                            updated = true;
                        }
                        break;
                    case 'relic':
                        if (achievement.id === 'treasure_hunter') {
                            achievement.progress = amount;
                            updated = true;
                        }
                        break;
                    case 'level':
                        if (achievement.id === 'spirit_master') {
                            achievement.progress = amount;
                            updated = true;
                        }
                        break;
                }

                if (updated && achievement.progress >= achievement.requirement) {
                    this.completeAchievement(achievement);
                }
            }
        });
        
        if (updated) {
            this.saveProgress();
            this.updateUI();
        }
    }

    completeAchievement(achievement) {
        if (achievement.completed) return; 
        
        achievement.completed = true;
        
        player.gold += achievement.reward.gold;
        player.exp += achievement.reward.exp;
        
        if (achievement.reward.item) {
            player.inventory[achievement.reward.item] = (player.inventory[achievement.reward.item] || 0) + 1;
        }
        
        this.saveProgress();
        
        showNotification(`🏆 Achievement Unlocked: ${achievement.name}!`, 'achievement');
        showNotification(`💰 Received ${achievement.reward.gold} gold and ${achievement.reward.exp} XP!`, 'reward');
        if (achievement.reward.item) {
            showNotification(`✨ Received special item: ${achievement.reward.item}!`, 'reward');
        }
        
        updateStats();
        updateInventory();
        this.updateUI();
        
        if (window.checkLevelUp) {
            window.checkLevelUp(player);
        }
    }

    updateUI() {
        const container = document.getElementById('achievementList');
        if (!container) return;

        container.innerHTML = '';
        Object.values(this.achievements).forEach(achievement => {
            const div = document.createElement('div');
            div.className = `achievement-item ${achievement.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(achievement.progress / achievement.requirement) * 100}%"></div>
                </div>
                <div class="achievement-details">
                    <span class="progress-text">${achievement.progress}/${achievement.requirement}</span>
                    <div class="reward-text">
                        Rewards: ${achievement.reward.gold} 💰, ${achievement.reward.exp} ✨
                        ${achievement.reward.item ? `<br>Special: ${achievement.reward.item} 🎁` : ''}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }
}

class DailyQuestSystem {
    constructor() {
        this.quests = {
            'Daily Ghost Hunt': {
                description: 'Defeat 5 ghosts today',
                requirement: 5,
                reward: {
                    gold: 100,
                    exp: 50
                },
                progress: 0,
                completed: false,
                reset: true
            },
            'Daily Explorer': {
                description: 'Visit 3 different locations today',
                requirement: 3,
                reward: {
                    gold: 75,
                    exp: 40
                },
                progress: 0,
                completed: false,
                reset: true
            }
        };
    }

    init() {
        this.lastReset = localStorage.getItem('daily_quest_reset');
        this.loadProgress();
        this.checkReset();
        this.updateUI();
    }

    loadProgress() {
        const saved = localStorage.getItem('daily_quests');
        if (saved) {
            const progress = JSON.parse(saved);
            Object.keys(this.quests).forEach(key => {
                if (progress[key]) {
                    this.quests[key].progress = progress[key].progress;
                    this.quests[key].completed = progress[key].completed;
                }
            });
        }
    }

    checkReset() {
        const now = new Date().toDateString();
        if (this.lastReset !== now) {
            this.resetDaily();
            localStorage.setItem('daily_quest_reset', now);
            showNotification('🌅 Daily quests have been reset!');
        }
    }

    resetDaily() {
        Object.values(this.quests).forEach(quest => {
            if (quest.reset) {
                quest.progress = 0;
                quest.completed = false;
            }
        });
        this.saveProgress();
    }

    saveProgress() {
        localStorage.setItem('daily_quests', JSON.stringify(this.quests));
    }

    updateProgress(type, amount = 1) {
        let updated = false;
        Object.values(this.quests).forEach(quest => {
            if (!quest.completed) {
                switch(type) {
                    case 'kill':
                        if (quest.description.includes('ghost')) {
                            quest.progress += amount;
                            updated = true;
                        }
                        break;
                    case 'location':
                        if (quest.description.includes('location')) {
                            quest.progress += amount;
                            updated = true;
                        }
                        break;
                }

                if (quest.progress >= quest.requirement && !quest.completed) {
                    this.completeQuest(quest);
                }
            }
        });
        if (updated) {
            this.saveProgress();
            this.updateUI();
        }
    }

    completeQuest(quest) {
        if (quest.completed) return; 
        
        quest.completed = true;
        
        player.gold += quest.reward.gold;
        player.exp += quest.reward.exp;
        
        this.saveProgress();
        
        showNotification(`✨ Daily Quest Complete: ${quest.description}!`, 'achievement');
        showNotification(`💰 Received ${quest.reward.gold} gold and ${quest.reward.exp} XP!`, 'reward');
        
        updateStats();
        this.updateUI();
        
        if (window.checkLevelUp) {
            window.checkLevelUp(player);
        }
    }

    updateUI() {
        const container = document.getElementById('dailyQuestList');
        if (!container) return;

        container.innerHTML = '';
        Object.entries(this.quests).forEach(([questName, quest]) => {
            const div = document.createElement('div');
            div.className = `daily-quest-item ${quest.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <h4>${questName}</h4>
                <p>${quest.description}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(quest.progress / quest.requirement) * 100}%"></div>
                </div>
                <div class="quest-details">
                    <span class="progress-text">${quest.progress}/${quest.requirement}</span>
                    <span class="reward-text">Rewards: ${quest.reward.gold} 💰, ${quest.reward.exp} ✨</span>
                </div>
            `;
            container.appendChild(div);
        });
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `game-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

let onboarding = new OnboardingSystem();
let achievements = new AchievementSystem();
let dailyQuests = new DailyQuestSystem();

window.gameEnhancements = {
    achievements,
    dailyQuests,
    showNotification,
    onboarding: null
};

const originalEndCombat = window.endCombat;
window.endCombat = function(victory) {
    if (victory) {
        gameEnhancements.achievements.updateProgress('kill', 1);
        gameEnhancements.dailyQuests.updateProgress('kill', 1);
    }
    originalEndCombat(victory);
};

const originalTravel = window.travel;
window.travel = async function(location) {
    const result = await originalTravel(location);
    dailyQuests.updateProgress('location', 1);
    return result;
};

function toggleSection(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const header = content.previousElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    content.classList.toggle('collapsed');
    header.classList.toggle('collapsed');
    
    const collapsedSections = JSON.parse(localStorage.getItem('collapsedSections') || '{}');
    collapsedSections[sectionId] = content.classList.contains('collapsed');
    localStorage.setItem('collapsedSections', JSON.stringify(collapsedSections));
}

function restoreCollapsedSections() {
    const collapsedSections = JSON.parse(localStorage.getItem('collapsedSections') || '{}');
    Object.entries(collapsedSections).forEach(([sectionId, isCollapsed]) => {
        if (isCollapsed) {
            const content = document.getElementById(`${sectionId}-content`);
            const header = content.previousElementSibling;
            content.classList.add('collapsed');
            header.classList.add('collapsed');
        }
    });
}

window.onload = async function() {
    await initGame();
    
    const onboarding = new OnboardingSystem();
    window.gameEnhancements.onboarding = onboarding;
    achievements.init();
    dailyQuests.init();
    
    onboarding.start();
}; 