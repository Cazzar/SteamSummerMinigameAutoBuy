// ==UserScript==
// @name         Steam Summer Sale AutoBuy and Misc Tools
// @namespace    https://github.com/cazzar/SteamSummerMinigameAutoBuy/
// @version      0.3.0
// @description  Auto consume badge points
// @author       Cazzar
// @match        *://steamcommunity.com/minigame/towerattack*
// @match        *://steamcommunity.com//minigame/towerattack*
// @updateURL    https://raw.githubusercontent.com/cazzar/SteamSummerMinigameAutoBuy/master/AutoBuy.user.js
// @downloadURL  https://raw.githubusercontent.com/cazzar/SteamSummerMinigameAutoBuy/master/AutoBuy.user.js
// @grant        none
// ==/UserScript==

(function(w) {
var ABILITIES = {
	FIRE_WEAPON: 1,
	CHANGE_LANE: 2,
	RESPAWN: 3,
	CHANGE_TARGET: 4,
	MORALE_BOOSTER: 5,
	GOOD_LUCK_CHARMS: 6,
	MEDICS: 7,
	METAL_DETECTOR: 8,
	DECREASE_COOLDOWNS: 9,
	TACTICAL_NUKE: 10,
	CLUSTER_BOMB: 11,
	NAPALM: 12,
	RESURRECTION: 13,
	CRIPPLE_SPAWNER: 14,
	CRIPPLE_MONSTER: 15,
	MAX_ELEMENTAL_DAMAGE: 16,
	RAINING_GOLD: 17,
	CRIT: 18,
	PUMPED_UP: 19,
	THROW_MONEY_AT_SCREEN: 20,
	GOD_MODE: 21,
	TREASURE: 22,
	STEAL_HEALTH: 23,
	REFLECT_DAMAGE: 24,
	FEELING_LUCKY: 25,
	WORMHOLE: 26,
	LIKE_NEW: 27
};


function FirstRun() {} //do Nothing

function MainLoop() {
	if(s().m_rgPlayerTechTree) {
		if(s().m_rgPlayerTechTree.badge_points !== 0) {
			useAutoBadgePurchase();
		}
	}
}


function s() {
    return g_Minigame.m_CurrentScene;
}

function useAutoBadgePurchase() {
	// id = ability
	// ratio = how much of the remaining badges to spend
	var abilityPriorityList = [
		{ id: ABILITIES.WORMHOLE,   ratio: 0.9 },
		{ id: ABILITIES.LIKE_NEW,   ratio: 1 },
		{ id: ABILITIES.CRIT,       ratio: 1 },
		{ id: ABILITIES.TREASURE,   ratio: 1 },
		{ id: ABILITIES.PUMPED_UP,  ratio: 1 },
	];

	var badgePoints = s().m_rgPlayerTechTree.badge_points;
	var abilityData = s().m_rgTuningData.abilities;
	var abilityPurchaseQueue = [];

	for (var i = 0; i < abilityPriorityList.length; i++) {
		var id = abilityPriorityList[i].id;
		var ratio = abilityPriorityList[i].ratio;
		var cost = abilityData[id].badge_points_cost;
		var portion = parseInt(badgePoints * ratio);
		badgePoints -= portion;

		while(portion >= cost) {
			abilityPurchaseQueue.push(id);
			portion -= cost;
		}

		badgePoints += portion;
	}

	s().m_rgPurchaseItemsQueue = s().m_rgPurchaseItemsQueue.concat(abilityPurchaseQueue);
	s().m_UI.UpdateSpendBadgePointsDialog();
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