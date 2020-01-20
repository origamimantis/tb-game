'use strict';


import {KeyTracker} from "./KeyTracker.js";
import {TileMap} from "./TileMap.js";
import {Unit} from "./Unit.js";
import {Path} from "./Path.js";
import {PathFinder} from "./PathFinder.js";
import {MapObject} from "./MapObject.js";
import {Camera} from "./Camera.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import {Cursor} from "./Cursor.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {Inputter} from "./Inputter.js";
import {Battle} from "./Battle.js";
import {SpriteFont} from "./SpriteFont.js";
import {Tester} from "./Tester.js";
import {LoopSelector} from "./LoopSelector.js";
import {RNG} from "./RNG.js";
import {getTile, recolor, tVC, inRange,count} from "./UsefulFunctions.js";

const LOAD_BUFFER = 50;

const C_WIDTH = 1024;
const C_HEIGHT = 768;

const SCALE = 2;

const WINDOWGRID_X = 16;
const WINDOWGRID_Y = 12;

const GRIDSIZE_X = C_WIDTH/WINDOWGRID_X;
const GRIDSIZE_Y = C_HEIGHT/WINDOWGRID_Y;
const gx = GRIDSIZE_X;
const gy = GRIDSIZE_Y;

const FPS = 60;

const FONTSIZE = "48";
const FONT = "Times New Roman";

const TICK_RATE = 1000/FPS;

const TEST_ENABLED = false;


class Game
{
    constructor( assets )
    {
      this.assets = assets;
    }
    
    loadKeyTracker()
    {
	this.keyTrack = new KeyTracker();
	document.addEventListener( "keydown", ( e ) => {this.keyTrack.onKeyDown( e )} );
	document.addEventListener( "keyup", ( e ) => {this.keyTrack.onKeyUp( e )} );
	document.addEventListener( "click", ( e ) => {console.log(getTile(this, e.clientX, e.clientY, GRIDSIZE_X, GRIDSIZE_Y).unit);});
    }
  addUnit( unit )
    {
	let curTile = this.map.getTile(unit.x, unit.y);
	if ( curTile.unit == null )
	{
	    curTile.unit = unit;
	    this.units[unit.id] = unit;
	}
	else
	{
	    console.log("ERROR - attempted to add unit in position (", unit.x, ", ",unit.y,")!");
	}
    }
    drawtile( ctx, tile, art)
    {
	this.ctx[ctx].drawImage(this.artbook.getImg(art), ...tVC(this, ...tile, SCALE));

    }
    drawtiles( ctx, tiles, art)
    {
	for (let i of tiles)
	{
	    this.drawtile(ctx,i,art);
	}
    }
    draw()
    {
    
    }
    update()
    {
    }
    mainloop()
    {
	//setTimeout( () => {requestAnimationFrame(() => {this.loop()});}, TICK_RATE);
	requestAnimationFrame(() => {this.mainloop()});
	this.update();
	this.draw();
    }

}

export {Game, FPS};
