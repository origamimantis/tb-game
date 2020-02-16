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

console.exe= function(s)
{
  interpreter.execute(s);
}

console.game = function()
{
  console.log(game);
}


window.onload = () =>
{
  load
  (
    {
      MapPath : "assets/tilemaps/lvl3.txt",
      ImgLoad : [	"P_gen", "P_janitor",
		  "T_field_tree_B", "T_field_tree_M", "T_field_tree_T", "T_5",
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
      PathFinder.init(game);
      interpreter = new Interpreter(game);

      game.mainloop();
      
      interpreter.execute(loaded.script);
    }
  );
}
