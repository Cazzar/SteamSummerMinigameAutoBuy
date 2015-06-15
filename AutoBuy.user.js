// ==UserScript==
// @name         Steam Summer Sale AutoBuy and Misc Tools
// @namespace    http://cazzar.net/
// @version      0.3.0
// @description  Auto Buy - Implementation of https://github.com/SteamDatabase/steamSummerMinigame/pull/124/
// @author       Cazzar
// @match        *://steamcommunity.com/minigame/towerattack*
// @match        *://steamcommunity.com//minigame/towerattack*
// @updateURL    https://raw.githubusercontent.com/cazzar/SteamSummerMinigameAutoBuy/master/AutoBuy.user.js
// @downloadURL  https://raw.githubusercontent.com/cazzar/SteamSummerMinigameAutoBuy/master/AutoBuy.user.js
// @grant        none
// ==/UserScript==

(function(w) {
var costEffectiveColour = '#E1B21E';
var currentClickRate = 20; //Make sure this is the same as the auto clicker.
	
//DO NOT MODIFY
var hilighted_upgrades = [];

var UPGRADE_TYPES = {
	"ARMOR": 0,
	"DPS": 1,
	"CLICK_DAMAGE": 2,
	"ELEMENTAL_FIRE": 3,
	"ELEMENTAL_WATER": 4,
	"ELEMENTAL_AIR": 5,
	"ELEMENTAL_EARTH": 6,
	"LUCKY_SHOT": 7,
	"ABILITY": 8,
	"LOOT": 9
};
function FirstRun() {} //do Nothing

function MainLoop() {
	purchaseUpgrades();
	updateUpgradeCostEffectiveIndicator();
}

function s() {
    return g_Minigame.m_CurrentScene;
}

//https://github.com/SteamDatabase/steamSummerMinigame/pull/124/
function purchaseUpgrades() {
	// This values elemental too much because best element lanes are not focused(0.578)
	var oddsOfElement = 1 - (0.75 * 0.75 * 0.75);

	var buyUpgrade = function(id) {
		// If upgrade is element damage
		if (id >= 3 && 6 >= id) {
			s().TryUpgrade(document.getElementById('upgr_' + id).childElements()[3]);
		} else {
			s().TryUpgrade(document.getElementById('upgr_' + id).childElements()[0].childElements()[1]);
		}
	};

	var myGold = s().m_rgPlayerData.gold;

	// Initial values for armor and click damage 
	var bestUpgradeForDamage, bestUpgradeForArmor;
	var highestUpgradeValueForDamage = 0;
	var highestUpgradeValueForArmor = 0;
	var highestElementLevel = 0;
	var purchasedShieldsWhileRespawning = false;

	var critMultiplier = s().m_rgPlayerTechTree.damage_multiplier_crit;
	var critChance = s().m_rgPlayerTechTree.crit_percentage;
	var dpc = s().m_rgPlayerTechTree.damage_per_click;

	var upgradeCost;

	var upgrades = s().m_rgTuningData.upgrades.slice(0);

	for (var i=0; i< upgrades.length; i++) {
		var upgrade = upgrades[i];

		if (upgrade.required_upgrade !== undefined)
		{
			var requiredUpgradeLevel = upgrade.required_upgrade_level !== undefined ? upgrade.required_upgrade_level : 1;
			var parentUpgradeLevel = s().GetUpgradeLevel(upgrade.required_upgrade);
			if (requiredUpgradeLevel > parentUpgradeLevel) {
				// If upgrade is not available, we skip it
				continue;
			}
		}

		var upgradeCurrentLevel = s().m_rgPlayerUpgrades[i].level;
		upgradeCost = s().m_rgPlayerUpgrades[i].cost_for_next_level;

		switch(upgrade.type) {
			case UPGRADE_TYPES.ARMOR:
				// HP increase per cost
				if (upgrade.multiplier / upgradeCost > highestUpgradeValueForArmor) {
					bestUpgradeForArmor = i;
					highestUpgradeValueForArmor = upgrade.multiplier / upgradeCost;
				}
				break;
			case UPGRADE_TYPES.CLICK_DAMAGE:
				// Damage increase per cost
				if ((critChance * critMultiplier + 1) * currentClickRate * upgrade.multiplier / upgradeCost > highestUpgradeValueForDamage) {
					bestUpgradeForDamage = i;
					highestUpgradeValueForDamage = (critChance * critMultiplier + 1) * currentClickRate * upgrade.multiplier / upgradeCost;
				}
				break;
			case UPGRADE_TYPES.DPS:
				// Damage increase per cost
				if (upgrade.multiplier / upgradeCost > highestUpgradeValueForDamage) {
					bestUpgradeForDamage = i;
					highestUpgradeValueForDamage = upgrade.multiplier / upgradeCost;
				}
				break;
			case UPGRADE_TYPES.ELEMENTAL_FIRE:
			case UPGRADE_TYPES.ELEMENTAL_WATER:
			case UPGRADE_TYPES.ELEMENTAL_AIR:
			case UPGRADE_TYPES.ELEMENTAL_EARTH:
				break;
			case UPGRADE_TYPES.LUCKY_SHOT:
				if (upgrade.multiplier * dpc * critChance * currentClickRate / upgradeCost > highestUpgradeValueForDamage) { // dmg increase per moneys
					bestUpgradeForDamage = i;
					highestUpgradeValueForDamage = upgrade.multiplier * dpc * critChance * currentClickRate / upgradeCost;
				}
				break;
			default:
				break;
		}
	}

	var currentHealth = s().m_rgPlayerData.hp;
	var myMaxHealth = s().m_rgPlayerTechTree.max_hp;
	// Check if health is below 30%
	var hpPercent = currentHealth / myMaxHealth;
	if (hpPercent < 0.3) {
		// Prioritize armor over damage
		// - Should we buy any armor we can afford or just wait for the best one possible?
		upgradeCost = s().m_rgPlayerUpgrades[bestUpgradeForArmor].cost_for_next_level;

		// Prevent purchasing multiple shields while waiting to respawn.
		if (purchasedShieldsWhileRespawning && currentHealth < 1) {
			return;
		}

		if (myGold > upgradeCost && bestUpgradeForArmor) {
			console.log("Buying " + upgrades[bestUpgradeForArmor].name);
			buyUpgrade(bestUpgradeForArmor);
			myGold = s().m_rgPlayerData.gold;
			
			purchasedShieldsWhileRespawning = currentHealth < 1;
		}
	}
	else if (purchasedShieldsWhileRespawning) {
		purchasedShieldsWhileRespawning = false;
	}

	// Try to buy some damage
	upgradeCost = s().m_rgPlayerUpgrades[bestUpgradeForDamage].cost_for_next_level;

	if (myGold > upgradeCost && bestUpgradeForDamage) {
		console.log("Buying " + upgrades[bestUpgradeForDamage].name);
		buyUpgrade(bestUpgradeForDamage);
	}
}

var UPGRADES = {
	"LIGHT_ARMOR":0,
	"AUTO_CANNON": 1,
	"CLICK_UPGRADE": 2,
};

//https://github.com/SteamDatabase/steamSummerMinigame/pull/143
function updateUpgradeCostEffectiveIndicator() {

    // upg_map will contain the most cost effctive upgrades for each type
	var upg_map = {};
	Object.keys(UPGRADES).forEach(function(key) {
		upg_map[UPGRADES[key]] = {
			idx: -1,
			gold_per_mult: 0
		};
	});

	var p_upg = s().m_rgPlayerUpgrades;

    // loop over all upgrades and find the most cost effective ones
	s().m_rgTuningData.upgrades.forEach(function(upg, idx) {
		if(upg.type in upg_map) {

			var cost = s().GetUpgradeCost(idx) / parseFloat(upg.multiplier);

			if(upg_map[upg.type].idx == -1 || upg_map[upg.type].cost_per_mult > cost) {
				if(upg.hasOwnProperty('required_upgrade') && s().GetUpgradeLevel(upg.required_upgrade) < upg.required_upgrade_level) { return; }

				upg_map[upg.type].idx = idx;
				upg_map[upg.type].cost_per_mult = cost;
			}
		}
	});

    var hilight = Object.keys(upg_map).map(function(k) { return upg_map[k].idx; });

    var match = true;
    for(var i = 0; i < hilight.length; i++ ) {
        if(hilight[i] !== hilighted_upgrades[i]) {
            match = false;
            break;
        }
    }

    if(!match) {
        hilighted_upgrades = hilight;

        // clear all currently hilighted
        [].forEach.call(document.querySelectorAll('[id^="upgr_"] .info'),
                function(elm) { elm.style = {} ;});

        [].forEach.call(document.querySelectorAll(hilight.map(function(i) {
                return "#upgr_" + i + " .info";
            })
            .join(",")),
        function(elm) { elm.style.setProperty('color', costEffectiveColour, 'important'); });
    }
}

if(w.AutoBuy_Timer) {
	w.clearInterval(w.AutoBuy_Timer);
}

w.AutoBuy_Timer = w.setInterval(function(){
	if (w.g_Minigame
	&& s().m_bRunning
	&& s().m_rgPlayerTechTree
	&& s().m_rgGameData) {
		w.clearInterval(w.AutoBuy_Timer);
		FirstRun();
		w.AutoBuy_Timer = w.setInterval(MainLoop, 1000);
	}
}, 1000);


})(window);