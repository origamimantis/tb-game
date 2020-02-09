'use strict';

import {load} from "./Loader.js";
import {Game, FPS} from "./Game.js";
import {Unit} from "./Unit.js";
import {Units} from "./TypeUnits.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import {Interpreter} from "./Interpreter.js";
import {Weapon, Weapons} from "./Weapon.js";



load(
  {
    MapPath : "assets/tilemaps/lvl1.txt",
    ImgLoad : ["P_gen", "P_janitor", "T_0", "T_1", "S_kn0", "C_c0"]
  })
.then( (thing) => 
  {
    console.log(thing);
    let game = new Game(thing);
    game.mainloop();

    let interpreter = new Interpreter(game);
    interpreter.execute("assets/scripts/test.txt");
  });

