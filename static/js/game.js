let player = null;
let currentEnemy = null;
let locations = [];
let shopItems = {};
let isTutorialActive = true;
let tutorialStep = 0;
const tutorialSteps = [
    {
        message: "Welcome to Ghost RPG! Let's get you started with a quick tutorial.",
        highlight: null
    },
    {
        message: "This is your character panel. It shows your HP, Mana, Experience, and other stats.",
        highlight: ".character-panel"
    },
    {
        message: "You start in the Town, which is a safe place to rest and shop.",
        highlight: "#location"
    },
    {
        message: "Click 'Explore' to find and battle ghosts. But be careful - don't explore when your HP is low!",
        highlight: "button[onclick='explore()']"
    },
    {
        message: "When your HP or Mana gets low, return to town and click 'Rest' to recover.",
        highlight: "button[onclick='rest()']"
    },
    {
        message: "Use gold to buy items from the Shop. You'll earn gold by defeating enemies.",
        highlight: "button[onclick='openShop()']"
    },
    {
        message: "As you progress, you can travel to more dangerous areas with stronger enemies and better rewards.",
        highlight: "button[onclick='openTravel()']"
    }
];

const enemySprites = {
    "Weak Ghost": {
        sprite: "url('/static/images/weak-ghost.png')",
        color: "#a8e6cf",
        scale: 1.0
    },
    "Angry Spirit": {
        sprite: "url('/static/images/angry_spirit.png')",
        color: "#ff8b94",
        scale: 1.1
    },
    "Phantom": {
        sprite: "url('/static/images/phantom.png')",
        color: "#b088f9",
        scale: 1.2
    },
    "Poltergeist": {
        sprite: "url('/static/images/poltergeist.png')",
        color: "#da4453",
        scale: 1.3
    }
};

async function initGame() {
    try {
        clearGameLog();
        
        const response = await fetch('/api/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        locations = data.locations;
        shopItems = data.shop_items;
        
        const savedData = localStorage.getItem('ghostRPG_saveData');
        if (savedData) {
            try {
                const saveState = JSON.parse(savedData);
                player = saveState.player;
                document.getElementById('location').textContent = player.location;
                log("🎮 Welcome back! Game loaded from save.");
            } catch (error) {
                console.error('Error loading save:', error);
                player = data.player; 
                log("🎮 Welcome to Ghost RPG!");
            }
        } else {
            player = data.player;
            log("🎮 Welcome to Ghost RPG!");
            showTutorialStep();
            document.addEventListener('click', tutorialClickHandler);
        }
        
        updateStats();
    } catch (error) {
        console.error('Error initializing game:', error);
        log("⚠️ Error starting game!");
    }
}

function updateStats() {
    if (!player) {
        console.error('Player data is undefined');
        return;
    }

    try {
        document.getElementById('level').textContent = player.level;
        document.getElementById('hp').textContent = player.hp;
        document.getElementById('maxHp').textContent = player.maxHp;
        document.getElementById('mana').textContent = player.mana;
        document.getElementById('maxMana').textContent = player.maxMana;
        document.getElementById('exp').textContent = player.exp;
        document.getElementById('expToLevel').textContent = player.expToLevel;
        document.getElementById('strength').textContent = player.strength;
        document.getElementById('defense').textContent = player.defense;
        document.getElementById('gold').textContent = player.gold;
        document.getElementById('location').textContent = player.location;

        const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
        const manaPercent = Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100));
        const expPercent = Math.max(0, Math.min(100, (player.exp / player.expToLevel) * 100));

        document.querySelector('.hp-fill').style.width = `${hpPercent}%`;
        document.querySelector('.mana-fill').style.width = `${manaPercent}%`;
        document.querySelector('.exp-fill').style.width = `${expPercent}%`;

        updateInventory();
        
        updateQuestList();
    } catch (error) {
        console.error('Error updating stats:', error);
        log("⚠️ An error occurred while updating stats!");
    }
}

function updateInventory() {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = '';
    
    for (const [item, quantity] of Object.entries(player.inventory)) {
        if (quantity > 0) {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.textContent = `${item}: ${quantity}`;
            inventoryList.appendChild(itemElement);
        }
    }
}

function log(message) {
    const gameLog = document.getElementById('gameLog');
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    gameLog.appendChild(logEntry);
    gameLog.scrollTop = gameLog.scrollHeight;
}

function showTutorialStep() {
    if (tutorialStep >= tutorialSteps.length) {
        isTutorialActive = false;
        log("Tutorial complete! Good luck on your ghost hunting adventure!");
        log("💡 Tip: Start by traveling to the Haunted Forest to begin your ghost hunting!");
        
        document.removeEventListener('click', tutorialClickHandler);
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        return;
    }

    const step = tutorialSteps[tutorialStep];
    log(step.message);

    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
    });

    if (step.highlight) {
        const element = document.querySelector(step.highlight);
        if (element) {
            element.classList.add('tutorial-highlight');
        }
    }
}

function tutorialClickHandler() {
    if (isTutorialActive) {
        tutorialStep++;
        showTutorialStep();
    }
}

async function explore() {
    if (!player) return;
    
    clearGameLog();
    
    try {
        const response = await fetch('/api/explore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location: player.location })
        });
        const data = await response.json();
        
        if (data.message) {
            log(data.message);
            return;
        }
        
        currentEnemy = data.enemy;
        startCombat(data.enemy_name);
    } catch (error) {
        console.error('Error exploring:', error);
        log('⚠️ Exploration failed!');
    }
}

function startCombat(enemy) {
    currentEnemy = { ...enemy };
    const combatView = document.querySelector('.combat-view');
    if (combatView) {
        combatView.classList.add('active');
    }
    updateCombatUI();
}

function updateCombatUI() {
    if (!currentEnemy) return;
    
    document.getElementById('enemyHp').textContent = currentEnemy.hp;
    const hpPercent = Math.max(0, Math.min(100, (currentEnemy.hp / currentEnemy.maxHp) * 100));
    document.getElementById('enemyHpBar').style.width = `${hpPercent}%`;
}

function endCombat(victory) {
    const combatView = document.querySelector('.combat-view');
    if (combatView) {
        combatView.classList.remove('active');
    }
    currentEnemy = null;
}

function showDamageNumber(damage, isPlayer = false) {
    const container = document.querySelector('.combat-view');
    const number = document.createElement('div');
    number.className = 'damage-number';
    number.textContent = damage;
    
    if (isPlayer) {
        number.style.color = 'var(--success-color)';
    }
    
    const x = 50 + Math.random() * 100;
    const y = 50 + Math.random() * 100;
    number.style.left = `${x}%`;
    number.style.top = `${y}%`;
    
    container.appendChild(number);
    setTimeout(() => number.remove(), 1000);
}

async function attack() {
    try {
        const response = await fetch('/api/combat/attack', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                enemy: currentEnemy,
                enemy_name: document.getElementById('enemyName').textContent
            })
        });
        
        const data = await response.json();
        
        if (data.damage) {
            showDamageNumber(data.damage);
            const hpBar = document.getElementById('enemyHpBar');
            const hpPercent = (data.enemy_hp / currentEnemy.maxHp) * 100;
            hpBar.style.width = `${hpPercent}%`;
        }
        
        if (data.error) {
            log(`❌ ${data.error}`);
            return;
        }

        if (data.player) {
            player = data.player;
            updateStats();
            saveGame();
        }

        log(data.message);
        
        currentEnemy.hp = data.enemy_hp;
        updateCombatUI();
        
        if (data.victory) {
            log("🎉 Victory! You defeated the enemy!");
            endCombat(true);
        } else if (data.defeat) {
            log("💀 You have been defeated!");
            endCombat(false);
        }
    } catch (error) {
        console.error('Error in attack:', error);
        log('⚠️ Attack failed!');
    }
}

async function useAbility() {
    if (!currentEnemy) return;
    
    clearGameLog();
    const abilities = Object.keys(player.abilities);
    const abilityList = abilities.map((ability, index) => 
        `${index + 1}. ${ability} (Mana: ${player.abilities[ability].manaCost})`
    ).join('\n');
    
    const choice = prompt(`Choose an ability:\n${abilityList}`);
    if (!choice) return;
    
    const abilityName = abilities[parseInt(choice) - 1];
    if (!abilityName) return;
    
    try {
        const response = await fetch('/api/ability/use', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ability: abilityName,
                enemy: currentEnemy
            })
        });
        const data = await response.json();
        
        if (data.error) {
            log(`❌ ${data.error}`);
            return;
        }
        
        log(data.message);
        
        currentEnemy.hp = data.enemy_hp;
        updateCombatUI();
        
        if (data.player) {
            player = data.player;
            updateStats();
        }
        
        if (currentEnemy.hp <= 0) {
            log("🎉 Victory! You defeated the enemy!");
            endCombat(true);
        }
    } catch (error) {
        console.error('Error using ability:', error);
        log("⚠️ An error occurred while using ability!");
    }
}

async function openShop() {
    if (player.location !== "Town") {
        log("❌ You can only shop in town!");
        return;
    }
    
    try {
        const response = await fetch('/api/shop');
        const data = await response.json();
        
        const shopItems = document.getElementById('shopItems');
        shopItems.innerHTML = '';
        
        Object.entries(data.items).forEach(([item, details]) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <h3>${item}</h3>
                    <p>${details.description}</p>
                    <p class="shop-item-price">💰 ${details.price} gold</p>
                </div>
                <div class="shop-item-actions">
                    <input type="number" min="1" max="99" value="1" class="quantity-input">
                    <button class="btn buy-btn" onclick="buyItem('${item}', this.parentElement.querySelector('.quantity-input').value)">
                        Buy
                    </button>
                </div>
            `;
            shopItems.appendChild(itemDiv);
        });
        
        document.getElementById('shopModal').classList.add('show');
    } catch (error) {
        console.error('Error loading shop:', error);
        log('⚠️ Failed to load shop!');
    }
}

function closeShop() {
    document.getElementById('shopModal').classList.remove('show');
}

async function buyItem(itemName, quantity) {
    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity < 1) {
        log('❌ Invalid quantity!');
        return;
    }

    try {
        const response = await fetch('/api/shop/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                item: itemName,
                quantity: quantity
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            log(`❌ ${data.error}`);
            return;
        }
        
        player = data.player;
        updateStats();
        log(data.message);
        
        showPurchaseEffect(itemName, quantity);
        
    } catch (error) {
        console.error('Error buying item:', error);
        log('⚠️ Purchase failed!');
    }
}

function showPurchaseEffect(itemName, quantity) {
    const effect = document.createElement('div');
    effect.className = 'purchase-effect';
    effect.textContent = `+${quantity} ${itemName}`;
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 1000);
}

function openTravel() {
    const locationList = document.getElementById('locationList');
    locationList.innerHTML = '';
    
    locations.forEach(location => {
        const locationDiv = document.createElement('div');
        locationDiv.className = 'location-option';
        
        const button = document.createElement('button');
        button.className = 'btn';
        button.textContent = location;
        button.onclick = () => travel(location);
        
        const description = document.createElement('p');
        description.className = 'location-description';
        description.textContent = getLocationDescription(location);
        
        locationDiv.appendChild(button);
        locationDiv.appendChild(description);
        locationList.appendChild(locationDiv);
    });
    
    document.getElementById('travelModal').classList.add('show');
}

function closeTravel() {
    document.getElementById('travelModal').classList.remove('show');
}

function getLocationDescription(location) {
    switch (location) {
        case "Town":
            return "A safe haven where you can rest and shop. No enemies here.";
        case "Haunted Forest":
            return "A spooky forest inhabited by Weak Ghosts and Angry Spirits. Good for beginners.";
        case "Abandoned Manor":
            return "A decrepit mansion where Angry Spirits and Phantoms roam. Watch out for Spirit Shards!";
        case "Ancient Cemetery":
            return "The most dangerous area, home to Phantoms and Poltergeists. Ancient Relics can be found here.";
        default:
            return "";
    }
}

async function travel(location) {
    if (location === player.location) {
        log("📍 You're already here!");
        return;
    }

    try {
        const response = await fetch('/api/travel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location: location })
        });
        
        const data = await response.json();
        
        if (data.error) {
            log(`❌ ${data.error}`);
            return;
        }

        const currentHP = player.hp;
        const currentMana = player.mana;
        player = data.player;
        player.hp = currentHP;
        player.mana = currentMana;
        
        document.getElementById('location').textContent = location;
        
        saveGame();
        
        log(data.message);
        closeTravel();
        updateStats();
    } catch (error) {
        console.error('Error traveling:', error);
        log("⚠️ Travel failed!");
    }
}

async function rest() {
    if (!player) return;
    
    clearGameLog();
    try {
        const response = await fetch('/api/rest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        if (data.error) {
            log(data.error);
            return;
        }
        
        player = data.player;
        log(data.message);
        updateStats();
        saveGame();
    } catch (error) {
        console.error('Error resting:', error);
        log('⚠️ Failed to rest!');
    }
}

function openInventory() {
    document.getElementById('inventoryModal').style.display = 'block';
    updateInventoryModal();
}

function closeInventory() {
    document.getElementById('inventoryModal').style.display = 'none';
}

function updateInventoryModal() {
    const inventoryContainer = document.getElementById('inventoryModalContent');
    inventoryContainer.innerHTML = '';
    
    for (const [item, quantity] of Object.entries(player.inventory)) {
        if (quantity > 0) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <span>${item}: ${quantity}</span>
                <button class="btn" onclick="useInventoryItem('${item}')">Use</button>
            `;
            inventoryContainer.appendChild(itemDiv);
        }
    }
}

function useInventoryItem(itemName) {
    if (player.inventory[itemName] <= 0) {
        log("You don't have any " + itemName + " left!");
        return;
    }

    switch (itemName) {
        case 'Health Potion':
            const healAmount = 50;
            const oldHp = player.hp;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            const actualHeal = player.hp - oldHp;
            player.inventory[itemName]--;
            log(`💚 Used Health Potion and recovered ${actualHeal} HP!`);
            break;
            
        case 'Mana Potion':
            const manaAmount = 50;
            const oldMana = player.mana;
            player.mana = Math.min(player.maxMana, player.mana + manaAmount);
            const actualMana = player.mana - oldMana;
            player.inventory[itemName]--;
            log(`💙 Used Mana Potion and recovered ${actualMana} Mana!`);
            break;
    }
    
    updateStats();
    updateInventoryModal();
}

async function openQuests() {
    try {
        const response = await fetch('/api/quests');
        const data = await response.json();
        
        if (data.error) {
            log(`❌ ${data.error}`);
            return;
        }

        const questList = document.querySelector('.quest-log #questList');
        questList.innerHTML = '';

        if (Object.keys(data.active_quests).length > 0) {
            const activeSection = document.createElement('div');
            activeSection.innerHTML = '<h3>Active Quests</h3>';
            
            for (const [name, quest] of Object.entries(data.active_quests)) {
                const questDiv = document.createElement('div');
                questDiv.className = 'quest-item';
                questDiv.innerHTML = `
                    <h4>${name}</h4>
                    <p>${quest.description}</p>
                    <p>Progress: ${quest.progress}/${quest.target}</p>
                    <p>Rewards: ${quest.reward_gold} gold, ${quest.reward_exp} XP</p>
                `;
                activeSection.appendChild(questDiv);
            }
            questList.appendChild(activeSection);
        }

        const availableSection = document.createElement('div');
        availableSection.innerHTML = '<h3>Available Quests</h3>';
        
        for (const [name, quest] of Object.entries(data.available_quests)) {
            if (!data.active_quests[name] && !data.completed_quests.includes(name)) {
                const questDiv = document.createElement('div');
                questDiv.className = 'quest-item';
                questDiv.innerHTML = `
                    <h4>${name}</h4>
                    <p>${quest.description}</p>
                    <p>Rewards: ${quest.reward_gold} gold, ${quest.reward_exp} XP</p>
                    <button class="btn" onclick="acceptQuest('${name}')">Accept Quest</button>
                `;
                availableSection.appendChild(questDiv);
            }
        }
        questList.appendChild(availableSection);

    } catch (error) {
        console.error('Error loading quests:', error);
        log('⚠️ Failed to load quests!');
    }
}

async function acceptQuest(questName) {
    try {
        const response = await fetch('/api/quests/accept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quest: questName })
        });
        const data = await response.json();
        
        if (data.error) {
            log(`❌ ${data.error}`);
            return;
        }
        
        log(`📜 ${data.message}`);
        if (data.player) {
            const currentStats = {
                hp: player.hp,
                mana: player.mana,
                exp: player.exp,
                gold: player.gold,
                level: player.level,
                strength: player.strength,
                defense: player.defense,
                inventory: player.inventory
            };
            
            player.quests = data.player.quests;
            player.completed_quests = data.player.completed_quests;
            
            Object.assign(player, currentStats);
        }
        updateStats();
        openQuests();
        saveGame(); 
    } catch (error) {
        console.error('Error accepting quest:', error);
        log('⚠️ Failed to accept quest!');
    }
}

async function useItem() {
    if (!currentEnemy) return;
    
    clearGameLog();
    const usableItems = ['Health Potion', 'Mana Potion'];
    const availableItems = usableItems.filter(item => player.inventory[item] > 0);
    
    if (availableItems.length === 0) {
        log("❌ No usable items in inventory!");
        return;
    }
    
    const itemList = availableItems.map((item, index) => 
        `${index + 1}. ${item} (${player.inventory[item]} remaining)`
    ).join('\n');
    
    const choice = prompt(`Choose an item to use:\n${itemList}`);
    if (!choice) return;
    
    const itemName = availableItems[parseInt(choice) - 1];
    if (!itemName) return;
    
    try {
        const response = await fetch('/api/item/use', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ item: itemName })
        });
        
        const data = await response.json();
        
        if (data.error) {
            log(`❌ ${data.error}`);
            return;
        }
        
        log(data.message);
        player = data.player;
        updateStats();
        saveGame();
    } catch (error) {
        console.error('Error using item:', error);
        log('⚠️ Failed to use item!');
    }
}

async function run() {
    if (!currentEnemy) return;
    
    clearGameLog();
    if (Math.random() < 0.5) {
        log("🏃 You successfully ran away!");
        endCombat(false);
    } else {
        log("❌ Couldn't escape!");
        const damage = Math.max(1, currentEnemy.strength - player.defense);
        player.hp -= damage;
        const enemyName = document.getElementById('enemyName').textContent;
        log(`💥 ${enemyName} deals ${damage} damage!`);
        updateStats(); 
        
        if (player.hp <= 0) {
            player.hp = 0;
            log("💀 You have been defeated!");
            updateStats();
            endCombat(false);
        }
    }
}

function showTooltip(element, message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = message;
    element.appendChild(tooltip);
}

function hideTooltip(element) {
    const tooltip = element.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function getLocationEnemies(location) {
    switch (location) {
        case "Haunted Forest":
            return "Weak Ghosts and Angry Spirits";
        case "Abandoned Manor":
            return "Angry Spirits and Phantoms";
        case "Ancient Cemetery":
            return "Phantoms and Poltergeists";
        default:
            return "unknown enemies";
    }
}

function clearGameLog() {
    const gameLog = document.getElementById('gameLog');
    gameLog.innerHTML = '';
}

function setupAutosave() {
    setInterval(saveGame, 60 * 1000);
    
    window.addEventListener('beforeunload', saveGame);
    
}

function saveGame() {
    if (player) {
        localStorage.setItem('ghostRPG_saveData', JSON.stringify({
            player: player,
            lastSaved: new Date().toISOString()
        }));
    }
}

function updateQuestList() {
    const questList = document.getElementById('questList');
    if (!questList) return;
    
    questList.innerHTML = '';
    
    if (player.quests && Object.keys(player.quests).length > 0) {
        const activeSection = document.createElement('div');
        activeSection.innerHTML = '<h3>Active Quests</h3>';
        
        for (const [name, quest] of Object.entries(player.quests)) {
            const questDiv = document.createElement('div');
            questDiv.className = 'quest-item';
            questDiv.innerHTML = `
                <h4>${name}</h4>
                <p>${quest.description}</p>
                <p>Progress: ${quest.progress}/${quest.target}</p>
                <p>Rewards: ${quest.reward_gold} gold, ${quest.reward_exp} XP</p>
            `;
            activeSection.appendChild(questDiv);
        }
        questList.appendChild(activeSection);
    }
}

window.onload = function() {
    initGame();
    setupAutosave();
}; 