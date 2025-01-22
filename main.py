from flask import Flask, render_template, jsonify, request, session, url_for, send_from_directory
from flask_cors import CORS
import random
import json
import os

app = Flask(__name__, 
    static_folder='static',
    template_folder='templates'
)
CORS(app)
app.secret_key = 'ghost_rpg_secret_key'  

class GameState:
    def __init__(self):
        self.player = {
            "name": "Hero",
            "level": 1,
            "hp": 100,
            "maxHp": 100,
            "mana": 100,
            "maxMana": 100,
            "exp": 0,
            "expToLevel": 100,
            "strength": 10,
            "defense": 5,
            "gold": 50,
            "location": "Town",
            "inventory": {
                'Health Potion': 2,
                'Mana Potion': 1,
                'Ghost Essence': 0,
                'Spirit Shard': 0,
                'Ancient Relic': 0
            },
            "abilities": {
                'Spirit Blast': {'damage': 20, 'manaCost': 30},
                'Holy Shield': {'defenseBoost': 10, 'manaCost': 25},
                'Life Drain': {'damage': 15, 'heal': 10, 'manaCost': 40}
            },
            "quests": {},
            "completed_quests": []
        }
        
        self.enemies = {
            "Weak Ghost": {"level": 1, "hp": 50, "maxHp": 50, "strength": 8, "defense": 3, "exp": 30, "gold": 15},
            "Angry Spirit": {"level": 2, "hp": 75, "maxHp": 75, "strength": 12, "defense": 5, "exp": 45, "gold": 25},
            "Phantom": {"level": 3, "hp": 100, "maxHp": 100, "strength": 15, "defense": 8, "exp": 60, "gold": 35},
            "Poltergeist": {"level": 4, "hp": 150, "maxHp": 150, "strength": 20, "defense": 12, "exp": 100, "gold": 50}
        }
        
        self.locations = ["Town", "Haunted Forest", "Abandoned Manor", "Ancient Cemetery"]
        
        self.shop_items = {
            "Health Potion": 30,
            "Mana Potion": 25,
            "Strength Potion": 50,
            "Defense Amulet": 100,
            "Spirit Crystal": 200,
            "Ghost Hunter's Badge": 500
        }

        self.quests = {
            "Ghost Hunter": {
                "description": "Defeat 5 ghosts in the Haunted Forest",
                "target": 5,
                "progress": 0,
                "reward_gold": 100,
                "reward_exp": 50,
                "location": "Haunted Forest",
                "enemy_type": "Weak Ghost"
            },
            "Spirit Collector": {
                "description": "Collect 3 Spirit Shards from Phantoms",
                "target": 3,
                "progress": 0,
                "reward_gold": 200,
                "reward_exp": 100,
                "location": "Abandoned Manor",
                "item": "Spirit Shard"
            },
            "Ancient Secrets": {
                "description": "Find an Ancient Relic in the Cemetery",
                "target": 1,
                "progress": 0,
                "reward_gold": 500,
                "reward_exp": 200,
                "location": "Ancient Cemetery",
                "item": "Ancient Relic"
            }
        }

game_state = GameState()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/init', methods=['POST'])
def init_game():
    player = session.get('player', game_state.player.copy())

    session['player'] = player
    
    return jsonify({
        'player': player,
        'locations': game_state.locations,
        'shop_items': game_state.shop_items
    })

@app.route('/api/explore', methods=['POST'])
def explore():
    data = request.get_json()
    player = session.get('player')
    if not player:
        return jsonify({'error': 'No active session'}), 400
    
    location = data.get('location', player.get('location', 'Town'))
    player['location'] = location 
    session['player'] = player
        
    if location == "Town":
        return jsonify({'message': 'Nothing to explore in town!'})
        
    available_enemies = list(game_state.enemies.keys())
    if location == "Haunted Forest":
        available_enemies = available_enemies[:2]
    elif location == "Abandoned Manor":
        available_enemies = available_enemies[1:3]
    elif location == "Ancient Cemetery":
        available_enemies = available_enemies[2:]
        
    enemy_name = random.choice(available_enemies)
    enemy = game_state.enemies[enemy_name].copy()
    
    return jsonify({
        'enemy': enemy,
        'enemy_name': enemy_name
    })

@app.route('/api/combat/attack', methods=['POST'])
def combat_attack():
    data = request.get_json()
    player = session.get('player')
    enemy = data.get('enemy')
    enemy_name = data.get('enemy_name')
    
    if not player or not enemy or not enemy_name:
        return jsonify({'error': 'Invalid combat state'}), 400
        
    player_damage = max(1, (player['strength'] * 2) - enemy['defense'])  
    enemy['hp'] -= player_damage
    
    result = {
        'player_damage': player_damage,
        'enemy_hp': enemy['hp'],
        'message': f'⚔️ You deal {player_damage} damage!',
        'player': player
    }
    
    if enemy['hp'] <= 0:
        player['exp'] += enemy['exp']
        player['gold'] += enemy['gold']
        player['inventory']['Ghost Essence'] += 1
        
        if enemy_name == "Phantom":
            if random.random() < 0.4:  
                amount = random.randint(1, 2)
                player['inventory']['Spirit Shard'] = player['inventory'].get('Spirit Shard', 0) + amount
                result['message'] += f'\n✨ You found {amount} Spirit Shard{"s" if amount > 1 else ""}!'
        elif enemy_name == "Poltergeist":
            if random.random() < 0.3:  
                player['inventory']['Ancient Relic'] = player['inventory'].get('Ancient Relic', 0) + 1
                result['message'] += '\n🏺 You found an Ancient Relic!'
            if random.random() < 0.5:  
                amount = random.randint(1, 3)
                player['inventory']['Spirit Shard'] = player['inventory'].get('Spirit Shard', 0) + amount
                result['message'] += f'\n✨ You found {amount} Spirit Shard{"s" if amount > 1 else ""}!'
        
        for quest_name, quest in list(player['quests'].items()):
            if quest_name == "Ghost Hunter" and enemy_name == "Weak Ghost" and player['location'] == "Haunted Forest":
                quest['progress'] += 1
                result['message'] += f'\n📜 Quest progress: {quest["progress"]}/{quest["target"]}'
            
            elif quest_name == "Spirit Collector" and 'Spirit Shard' in player['inventory']:
                quest['progress'] = min(player['inventory']['Spirit Shard'], quest['target'])
                result['message'] += f'\n📜 Quest progress: {quest["progress"]}/{quest["target"]}'
            
            elif quest_name == "Ancient Secrets" and 'Ancient Relic' in player['inventory']:
                quest['progress'] = min(player['inventory']['Ancient Relic'], quest['target'])
                result['message'] += f'\n📜 Quest progress: {quest["progress"]}/{quest["target"]}'
            
            if quest['progress'] >= quest['target']:
                player['gold'] += quest['reward_gold']
                player['exp'] += quest['reward_exp']
                player['completed_quests'].append(quest_name)
                del player['quests'][quest_name]
                result['message'] += f'\n✨ Quest Complete: {quest_name}!'
                result['message'] += f'\n💰 Received {quest["reward_gold"]} gold and {quest["reward_exp"]} XP!'
        
        if check_level_up(player):
            result['message'] += f'\n🎉 Level Up! You are now level {player["level"]}!'
            result['message'] += f'\n💪 Your stats have increased!'
            
        result['victory'] = True
        
    else:
        enemy_damage = max(1, enemy['strength'] - player['defense'])
        player['hp'] -= enemy_damage
        result['message'] += f'\n💥 {enemy_name} deals {enemy_damage} damage!'
    
    session['player'] = player
    return jsonify(result)

@app.route('/api/shop')
def get_shop():
    shop_items = {
        'Health Potion': {
            'price': 25,
            'description': 'Restores 50 HP',
            'effect': {'hp': 50}
        },
        'Mana Potion': {
            'price': 25,
            'description': 'Restores 50 Mana',
            'effect': {'mana': 50}
        },
        'Greater Health Potion': {
            'price': 75,
            'description': 'Restores 150 HP',
            'effect': {'hp': 150}
        },
        'Greater Mana Potion': {
            'price': 75,
            'description': 'Restores 150 Mana',
            'effect': {'mana': 150}
        },
        'Spirit Charm': {
            'price': 100,
            'description': '+5 Defense against ghosts',
            'effect': {'defense': 5}
        },
        'Ghost Blade': {
            'price': 150,
            'description': '+8 Strength against ghosts',
            'effect': {'strength': 8}
        }
    }
    return jsonify({'items': shop_items})

@app.route('/api/shop/buy', methods=['POST'])
def buy_item():
    data = request.get_json()
    player = session.get('player')
    
    item_name = data.get('item')
    quantity = data.get('quantity', 1)
    
    shop_items = {
        'Health Potion': {'price': 25},
        'Mana Potion': {'price': 25},
        'Greater Health Potion': {'price': 75},
        'Greater Mana Potion': {'price': 75},
        'Spirit Charm': {'price': 100},
        'Ghost Blade': {'price': 150}
    }
    
    if not item_name in shop_items:
        return jsonify({'error': 'Invalid item'}), 400
        
    total_cost = shop_items[item_name]['price'] * quantity
    
    if player['gold'] < total_cost:
        return jsonify({'error': 'Not enough gold!'}), 400
        
    player['gold'] -= total_cost
    player['inventory'][item_name] = player['inventory'].get(item_name, 0) + quantity
    
    session['player'] = player
    
    return jsonify({
        'message': f'💰 Bought {quantity}x {item_name} for {total_cost} gold!',
        'player': player
    })

@app.route('/api/travel', methods=['POST'])
def travel():
    data = request.get_json()
    location = data.get('location')
    player = session.get('player', {})
    
    if not location:
        return jsonify({'error': 'No location specified'})
    
    if location not in game_state.locations:
        return jsonify({'error': 'Invalid location'})
    
    current_hp = player.get('hp')
    current_mana = player.get('mana')
    
    player['location'] = location
    
    if current_hp is not None:
        player['hp'] = current_hp
    if current_mana is not None:
        player['mana'] = current_mana
    
    session['player'] = player
    
    return jsonify({
        'message': f'🏃‍♂️ Traveled to {location}',
        'player': player
    })

@app.route('/api/rest', methods=['POST'])
def rest():
    player = session.get('player')
    if not player:
        return jsonify({'error': 'No active session'}), 400
        
    if player['location'] != 'Town':
        return jsonify({'error': '❌ You can only rest in town!'})
    
    player['hp'] = player['maxHp']
    player['mana'] = player['maxMana']
    
    session['player'] = player
    
    return jsonify({
        'message': '💚 You rest and recover all HP and Mana!',
        'player': player
    })

@app.route('/api/ability/use', methods=['POST'])
def use_ability():
    data = request.get_json()
    ability_name = data.get('ability')
    enemy = data.get('enemy')
    player = session.get('player')
    
    if not player or not enemy or ability_name not in player['abilities']:
        return jsonify({'error': 'Invalid ability use'}), 400
        
    ability = player['abilities'][ability_name]
    if player['mana'] < ability['manaCost']:
        return jsonify({'error': 'Not enough mana'})
        
    result = {
        'message': '',
        'enemy_hp': enemy['hp'],
        'player': player  
    }
    
    player['mana'] -= ability['manaCost']
    
    if ability_name == 'Spirit Blast':
        damage = ability['damage'] + (player['level'] * 2)
        enemy['hp'] -= damage
        result['message'] = f'✨ You cast Spirit Blast for {damage} damage!'
    elif ability_name == 'Holy Shield':
        player['defense'] += ability['defenseBoost']
        result['message'] = f'🛡️ You cast Holy Shield! Defense increased by {ability["defenseBoost"]}!'
    elif ability_name == 'Life Drain':
        damage = ability['damage'] + player['level']
        heal = ability['heal'] + (player['level'] * 2)
        enemy['hp'] -= damage
        player['hp'] = min(player['maxHp'], player['hp'] + heal)
        result['message'] = f'💫 You cast Life Drain for {damage} damage and heal for {heal} HP!'
    
    result['enemy_hp'] = enemy['hp']
    session['player'] = player
    return jsonify(result)

@app.route('/api/quests', methods=['GET'])
def get_quests():
    player = session.get('player')
    if not player:
        return jsonify({'error': 'No active session'}), 400
        
    return jsonify({
        'active_quests': player['quests'],
        'completed_quests': player['completed_quests'],
        'available_quests': game_state.quests
    })

@app.route('/api/quests/accept', methods=['POST'])
def accept_quest():
    data = request.get_json()
    quest_name = data.get('quest')
    player = session.get('player')
    
    if not player or quest_name not in game_state.quests:
        return jsonify({'error': 'Invalid quest'}), 400
        
    if quest_name in player['quests']:
        return jsonify({'error': 'Quest already accepted'})
        
    if quest_name in player['completed_quests']:
        return jsonify({'error': 'Quest already completed'})
        
    new_quest = game_state.quests[quest_name].copy()
    
    current_stats = {
        'hp': player['hp'],
        'mana': player['mana'],
        'exp': player['exp'],
        'gold': player['gold'],
        'level': player['level'],
        'strength': player['strength'],
        'defense': player['defense'],
        'inventory': player['inventory'].copy()
    }
    
    player['quests'][quest_name] = new_quest
    
    player.update(current_stats)
    
    session['player'] = player
    
    message = f'Accepted quest: {quest_name}'
    
    if new_quest.get('item') in player['inventory']:
        required_item = new_quest['item']
        new_quest['progress'] = min(player['inventory'][required_item], new_quest['target'])
        
        if new_quest['progress'] >= new_quest['target']:
            player['exp'] += new_quest['reward_exp']
            if check_level_up(player):
                message += f'\n🎉 Level Up! You are now level {player["level"]}!'
                message += '\n💪 Your stats have increased!'
            player['completed_quests'].append(quest_name)
            del player['quests'][quest_name]
            player['gold'] += new_quest['reward_gold']
            message += f'\n✨ Quest Complete: {quest_name}!'
            message += f'\n💰 Received {new_quest["reward_gold"]} gold and {new_quest["reward_exp"]} XP!'
    
    return jsonify({
        'message': message,
        'player': player
    })

def check_level_up(player):
    while player['exp'] >= player['expToLevel']:
        player['level'] += 1
        player['exp'] -= player['expToLevel']  
        player['expToLevel'] = int(player['expToLevel'] * 1.5)  
        
        player['maxHp'] += 20
        player['hp'] = player['maxHp'] 
        player['maxMana'] += 10
        player['mana'] = player['maxMana'] 
        player['strength'] += 3
        player['defense'] += 2
        
        return True
    return False

def preserve_player_stats(player, update_func):
    """Helper function to preserve player stats during any update"""
    current_stats = {
        'hp': player['hp'],
        'mana': player['mana'],
        'exp': player['exp'],
        'gold': player['gold'],
        'level': player['level'],
        'strength': player['strength'],
        'defense': player['defense'],
        'maxHp': player['maxHp'],
        'maxMana': player['maxMana'],
        'expToLevel': player['expToLevel'],
        'inventory': player['inventory'].copy(),
        'quests': player['quests'].copy(),
        'completed_quests': player['completed_quests'].copy()
    }
    
    update_func(player)
    
    player.update(current_stats)
    
    session['player'] = player

@app.route('/static/images/<path:filename>')
def serve_image(filename):
    try:
        return send_from_directory(os.path.join(app.root_path, 'static', 'images'), filename)
    except Exception as e:
        print(f"Error serving image {filename}: {e}")
        return "Image not found", 404

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)

@app.route('/api/item/use', methods=['POST'])
def use_item():
    data = request.get_json()
    player = session.get('player')
    item_name = data.get('item')
    
    if not player or not item_name:
        return jsonify({'error': 'Invalid request'}), 400
        
    if player['inventory'].get(item_name, 0) <= 0:
        return jsonify({'error': 'Item not available'})
    
    result = {
        'message': '',
        'player': player
    }
    
    if item_name == 'Health Potion':
        heal_amount = 50
        old_hp = player['hp']
        player['hp'] = min(player['maxHp'], player['hp'] + heal_amount)
        actual_heal = player['hp'] - old_hp
        player['inventory'][item_name] -= 1
        result['message'] = f'💚 Used Health Potion and recovered {actual_heal} HP!'
    
    elif item_name == 'Mana Potion':
        mana_amount = 50
        old_mana = player['mana']
        player['mana'] = min(player['maxMana'], player['mana'] + mana_amount)
        actual_mana = player['mana'] - old_mana
        player['inventory'][item_name] -= 1
        result['message'] = f'💙 Used Mana Potion and recovered {actual_mana} Mana!'
    
    session['player'] = player
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True,port=5001)




