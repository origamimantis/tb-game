'use strict';


import {Unit} from "./Unit.js";
import {Coord} from "./Path.js";
//import {PathFinder} from "./PathFinder.js";
import {AnimatedObject} from "./AnimatedObject.js";
import {Cursor} from "./Cursor.js";
import {FPS, TICK_RATE} from "./Constants.js";
import {Camera} from "./Camera.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {DrawContainer} from "./DrawContainer.js";
import {Inputter} from "./Inputter.js";
//import {Battle} from "./Battle.js";
//import {SpriteFont} from "./SpriteFont.js";
//import {Tester} from "./Tester.js";
//import {LoopSelector} from "./LoopSelector.js";
//import {RNG} from "./RNG.js";
import {triggerEvent, nextFrameDo} from "./Utils.js";

const C_WIDTH = 1024;
const C_HEIGHT = 768;

const SCALE = 2;

const WINDOWGRID_X = 16;
const WINDOWGRID_Y = 12;

const GRIDSIZE_X = C_WIDTH/WINDOWGRID_X;
const GRIDSIZE_Y = C_HEIGHT/WINDOWGRID_Y;
const gx = GRIDSIZE_X;
const gy = GRIDSIZE_Y;

const CURSOR_SPEED = 4;

const FONTSIZE = "48";
const FONT = "Times New Roman";


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
  
    this.Units = new DrawContainer(2);
    
    this.toDraw = {};
    this.grid = new Coord( gx, gy );
    
    this.cursor = new Cursor(this, 0, 0, CURSOR_SPEED);

    this.camera = new Camera(this, WINDOWGRID_X, WINDOWGRID_Y, this.Map.dimension.x, this.Map.dimension.y);

    this.Inputter = new Inputter(this);
    this.loadKeyTracker();

    this.Music.play("btl1");
    
    this.toDraw["Units"] = this.Units;
  }

  generateCanvasLayers()
  {
    // 0: bg, 1: walkable/other effects, 2: units, 3: cursor/effects, 4: hud
    let canv = document.getElementById("canvases");
    for (let i = 0; i < 5; i++)
    {
      let can = canv.appendChild(document.createElement("canvas"));
      can.id = "canvas-" + i.toString();
      can.width = C_WIDTH;
      can.height = C_HEIGHT;
      can.style.position = "absolute";
      can.style.background = "transparent";
      can.style.left = "0";
      can.style.top = "0";
      this.ctx.push(can.getContext('2d'));
      this.ctx[i].imageSmoothingEnabled = false;
    }
  }
  
  getUnitById(id)
  {
    return this.Units.get(id);
  }

  loadKeyTracker()
  {
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
      this.Units.set(unit.id, unit);
    }
    else
    {
      console.log("ERROR - attempted to add unit in position (", unit.x, ", ",unit.y,")!");
    }
  }
  draw()
  {
    //TODO TODO TODO TODO TODO TODO TODO TODO TODO
    // 
    // add an object for (do i have to redraw this canvas)
    // for each layer, then only draw layers that have it set ti true.
    //
    //TODO TODO TODO TODO TODO TODO TODO TODO TODO
    this.ctx[1].clearRect(0,0,C_WIDTH, C_HEIGHT);
    this.ctx[2].clearRect(0,0,C_WIDTH, C_HEIGHT);
    this.ctx[3].clearRect(0,0,C_WIDTH, C_HEIGHT);
    for (let thing of Object.values(this.toDraw))
    {
	thing.draw(this);
    }
    this.Map.draw(this);
    this.cursor.draw(this);
  }
  update()
  {
    this.Inputter.update();
    this.cursor.update();
  }
  mainloop()
  {
    nextFrameDo(() => {this.mainloop()});

    this.update();
    this.draw();
  }

}

export {Game, FPS};
