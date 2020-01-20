'use strict';

import {load} from "./Loader.js";
import {Game, FPS} from "./Game.js";
import {Unit} from "./Unit.js";
import {Units} from "./TypeUnits.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import {Weapon, Weapons} from "./Weapon.js";


load(
  {
    MapPath : "assets/tilemaps/lvl1.txt",
    ImgLoad : ["P_gen", "P_janitor"]
  })
.then( (thing) => 
  {
    console.log(thing);

    let ncan = document.getElementById("canvases").appendChild(document.createElement("canvas"));
    let ctx = ncan.getContext("2d");
    ctx.drawImage(thing.Album.get("P_gen"), 0, 0);
    
    ncan = document.getElementById("canvases").appendChild(document.createElement("canvas"));
    ctx = ncan.getContext("2d");
    ctx.drawImage(thing.Album.get("P_janitor"), 50, 0);

    let game = new Game(thing);
    game.mainloop();
  });

