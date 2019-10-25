'use strict';

import {Game, FPS} from "./Game.js";
import {Unit} from "./Unit.js";
import {Units} from "./TypeUnits.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import {Weapon, Weapons} from "./Weapon.js";


let g = new Game("assets/tilemaps/lvl1.txt");

let id = 0;

let unitFrames = [20,10,20,10]

function addUnit( clas, x, y, stats, name, art = "gen")
{
    let r = new Units[clas]( g,id, x,y, stats, name, art);
    r.setColor([Math.random()*256, Math.random()*256, Math.random()*256,]);
    id++;
    return r;
}
//does not use up the thread
g.mainloop();
setTimeout( () => {
    //                     [hp,atk,spd,def,con,mov]
    let leploss = addUnit("Leader",4,6,
	{"maxhp":40,"hp":40,"atk":18,"spd":17,"skl":-1111,"def":14,"con":15,"mov":9},"Leploss");
    leploss.weapons.push(new Weapons.Skofnung());
    //leploss.curWeap().activate();
    
    let pythagris = addUnit("AxeKnight", 5,6,
	{"maxhp":53,"hp":53,"atk":14,"spd":13,"skl":8,"def":18,"con":15,"mov":9}, "Pithagris");
    pythagris.weapons.push(new Weapons.MightyAxe());
    
    let oylir = addUnit("SwordKnight", 3,5,
	{"maxhp":50,"hp":50,"atk":13,"spd":15,"skl":10,"def":14,"con":14,"mov":9},"Oylir");
    oylir.weapons.push(new Weapons.StarSword());
    
    let kouchi = addUnit("HeavySwordKnight", 3,7,
	{"maxhp":63,"hp":63,"atk":12,"spd":9,"skl":3,"def":21,"con":35,"mov":7},"Kouchi");
    kouchi.weapons.push(new Weapons.BraveSword());
    
    let gowse = addUnit("Vampire", 4,8,
	{"maxhp":43,"hp":43,"atk":19,"spd":22,"skl":18,"def":8,"con":15,"mov":9}, "Gowse");
    gowse.weapons.push(new Weapons.VampireFang());
    
    let rimun = addUnit("Cavalier", 5,8,
	{"maxhp":36,"hp":36,"atk":14,"spd":18,"skl":21,"def":11,"con":15,"mov":15},"Rimun");
    rimun.weapons.push(new Weapons.Sweeper());
    
    let paskell = addUnit("BowKnight", 2,6,
	{"maxhp":46,"hp":46,"atk":15,"spd":16,"skl":13,"def":8,"con":11,"mov":9},"Paskell");
    paskell.weapons.push(new Weapons.SilverBow());
    
    let kantoor = addUnit("BowKnight", 7,7,
	{"maxhp":29,"hp":29,"atk":13,"spd":13,"skl":10,"def":8,"con":11,"mov":4},"Kantoor");
    kantoor.weapons.push(new Weapons.WoodBow());

    let forayor = addUnit("LanceKnight", 6,5,
	{"maxhp":29,"hp":29,"atk":13,"spd":13,"skl":10,"def":8,"con":11,"mov":4},"Forayor");
    forayor.weapons.push(new Weapons.MusicExtender());
    
    let birnoole = addUnit("Janitor", 5,4,
	{"maxhp":55,"hp":55,"atk":21,"spd":6,"skl":-24,"def":10,"con":31,"mov":9},"Birnoole");
    birnoole.pArt = "P_janitor";
    birnoole.weapons.push(new Weapons.Sweeper());

}, 50);
