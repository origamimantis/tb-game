'use strict';

import {load} from "./Loader.js";
import {Game, FPS} from "./Game.js";
import {Unit} from "./Unit.js";
import {Units} from "./TypeUnits.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import {Interpreter} from "./Interpreter.js";
import {PathFinder} from "./PathFinder.js";
import {Weapon, Weapons} from "./Weapon.js";

let interpreter;
let game;

document.execute = function(s)
{
  interpreter.execute(s);
}

document.game = function()
{
  console.log(game);
}



load
(
  {
    MapPath : "assets/tilemaps/lvl3.txt",
    ImgLoad : [	"P_gen", "P_janitor",
		"T_0", "T_1", "T_2", "T_3", "T_4", "T_5",
		"T_6", "T_7", "T_8", "T_wall_B", "T_wall_BR",
		"T_wall_EL", "T_wall_ER", "T_wall_TL", "T_wall_TR",
		"S_kn0", "S_lead1",
		"C_c0", "C_move"
	      ],
    MapScript : "assets/scripts/test.txt"
  }
)
.then
(
  (loaded) => 
  {
    game = new Game(loaded.assets);

    console.log(game.Album);
    console.log("reeeeeeeeeeeee");
    game.mainloop();
    
    PathFinder.init(game);

    interpreter = new Interpreter(game);
    interpreter.execute(loaded.script);
  }
);

