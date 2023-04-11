"use strict";

export let setUnits = () => {}
export let script =
{
    chNumber: "*",
    chTitle: "Victory",
    tileMap: null,
    nextLvl: null,
    type: "Game",
    cameraInit: {x: 0, y: 0},
    teams:  [ {name: "Player", bannercolor: "#aaaaff", maptheme: "ch1 map",  btltheme: "player battle"}],
    alliances: {},
    dayLength: 0,
    
    onBegin: async (g) =>
    {
      g.onVictory();
    },
    conversations: {},
    interactions: {},
    events: {},

}

