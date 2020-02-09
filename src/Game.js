'use strict';


import {KeyTracker} from "./KeyTracker.js";
import {Unit} from "./Unit.js";
//import {Path} from "./Path.js";
//import {PathFinder} from "./PathFinder.js";
import {AnimatedObject} from "./AnimatedObject.js";
//import {Camera} from "./Camera.js";
//import {Animation} from "./Animation.js";
//import {AnimFrame} from "./AnimFrame.js";
import {Cursor} from "./Cursor.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {Inputter} from "./Inputter.js";
//import {Battle} from "./Battle.js";
//import {SpriteFont} from "./SpriteFont.js";
//import {Tester} from "./Tester.js";
//import {LoopSelector} from "./LoopSelector.js";
//import {RNG} from "./RNG.js";
import {triggerEvent} from "./Utils.js";
import {getTile, recolor, tVC, inRange,count} from "./UsefulFunctions.js";

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
const CURSOR_SPEED = 4;

const FONTSIZE = "48";
const FONT = "Times New Roman";

const TICK_RATE = 1000/FPS;

const TEST_ENABLED = false;


class Game
{
  constructor( assets )
  {
    this.Album = assets.Album;
    this.Music = assets.Music;
    this.Map = assets.Map;
    
    this.ctx = [];
    this.generateCanvasLayers();
  
    this.Units =  {};
    this.state =  { Map: assets.Map,
		    Units: this.Units
		  };

    this.stateStack = [];
    this.grid = {x:gx, y:gy};
    
    this.cursor = new Cursor(this, 0, 0, CURSOR_SPEED);

    this.camera = {x:0, y:0};

    this.Inputter = new Inputter(this);
    this.loadKeyTracker();

    document.addEventListener("wtf", (e) => {console.log(this.Units);});
  }

  generateCanvasLayers()
  {
    let canv = document.getElementById("canvases");
    for (let i = 0; i < 2; i++)
    {
      let ncan = canv.appendChild(document.createElement("canvas"));
      ncan.id = "canvas-" + i.toString();
      ncan.width = C_WIDTH;
      ncan.height = C_HEIGHT;
      ncan.style.position = "absolute";
      ncan.style.background = "transparent";
      ncan.style.left = "0";
      ncan.style.top = "0";
      this.ctx.push(ncan.getContext('2d'));
      this.ctx[i].imageSmoothingEnabled = false;
    }
  }
  
  loadKeyTracker()
  {
      //this.keyTrack = new KeyTracker();
      document.addEventListener( "click", ( e ) => 
	  {
	    //console.log(getTile(this, e.clientX, e.clientY, GRIDSIZE_X, GRIDSIZE_Y).unit);
	  });
  }
  addUnit( unit )
  {
    let curTile = this.Map.getTile(unit.x, unit.y);
    if ( curTile.unit == null )
    {
      curTile.unit = unit;
      this.Units[unit.id] = unit;
    }
    else
    {
      console.log("ERROR - attempted to add unit in position (", unit.x, ", ",unit.y,")!");
    }
  }
  draw()
  {
    this.ctx[1].clearRect(0,0,C_WIDTH, C_HEIGHT);
    for (let thing of Object.values(this.state))
    {
      try
      {
	thing.draw(this);
      }
      catch( TypeError )
      {
	for (let t of Object.values(thing))
	{
	  t.draw(this);
	  t.tickAnim();
	}
      }
    }
    this.cursor.draw(this, 1, 1);
  }
  update()
  {
    this.Inputter.update();
    this.cursor.update();
  }
  mainloop()
  {
    requestAnimationFrame(() => {this.mainloop()});
    //setTimeout( () => {requestAnimationFrame(() => {this.mainloop()});}, TICK_RATE);
    this.update();
    this.draw();
  }

}

export {Game, FPS};
