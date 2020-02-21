'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Path} from "./Path.js";
import {Queue} from "./Queue.js";
import {recolor} from "./UsefulFunctions.js";
import {Weapons} from "./Weapon.js";
import {TILES} from "./Constants.js";
import {triggerEvent, generatePath, generateMovable, nextFrameDo, waitTick} from "./Utils.js";


export class Unit extends AnimatedObject
{
  constructor(id, x, y, caps, stats, name = ("Unit "+id), classname = "Unit", pArt = "gen", color = [255,0,0],)
  {
    super( x, y );
    this.x = x;
    this.y = y;
    this.id = id;
    this.name = name;
    this.classname = classname;
    this.pArt = pArt;

    this.movcost = {};
    this.movcost[TILES.ROAD] = 1;
    this.movcost[TILES.TREE] = 2;
    
    this.caps = {};
    this.stats = {};
    for (let s of [ "maxhp","atk","spd","skl","def","con","mov" ])
    {
      this.caps[s] = (caps[s] == undefined) ? 0 : caps[s];
      this.stats[s] = (stats[s] == undefined) ? 0 : stats[s];
    }
    this.mapSpeed = 6;

    this.vis = {
		dx : 0,
		dy : 0,
		x : this.x,
		y : this.y
		};
    this.moving = false;
    this.moveFlag = false;
    this.path = new Queue();
  }
  
  // TODO change this to take a path as a parameter. The path will be built up using inputter 
  async tentativeMove(g, c)
  {
    let p = await generatePath(g, this.x, this.y, c.x, c.y, this.movcost);
    if (p == null)
    {
      throw "Could not find path to (x, y) = (" + this.x + ", " + this.y + ") to (" + x + ", " + y + ").";
    }
    this.path = p;
    this.moveFlag = true;

  }

  async moveTo(g, x, y)
  {
    let p = await generatePath(g, this.x, this.y, x, y, this.movcost);
    if (p == null)
    {
      throw "Could not find path to (x, y) = (" + this.x + ", " + this.y + ") to (" + x + ", " + y + ").";
    }
    this.path = p;
    this.moveFlag = true;
    g.Map.removeUnit(this);
    g.Map.getTile(x, y).unit = this;

  }
  
  moveChain(g, framesLeft, updatePos = false)
  {
    return new Promise( async (resolve) =>
      {
	while (framesLeft > 0)
	{
          let dx = this.vis.dx/this.mapSpeed;
          let dy = this.vis.dy/this.mapSpeed;
          this.vis.x += dx;
          this.vis.y += dy;

          await waitTick();
          -- framesLeft;
        }
        this.x += this.vis.dx;
        this.y += this.vis.dy;
        this.vis.x = this.x;
        this.vis.y = this.y;
        resolve();
      });
  }
  async update(g)
  {
    if (this.moving == true)
    {
      return;
    }
    if (this.moveFlag == true)
    {
      this.moveFlag = false;
      if (this.path.nonempty())
      {
	let i = this.path.dequeue();
	this.vis.dx = i.x - this.x;
	this.vis.dy = i.y - this.y;

	this.moving = true;
	await this.moveChain(g, this.mapSpeed, true);
	this.moving = false;
	this.moveFlag = true;
      }
    }
  }

  draw( g )
  {
    let off = g.camera.offset;
    super.draw(g, 2, off, 1, this.vis.x, this.vis.y);
  }
  
  movable(g, draw = true)
  {
    let p = generateMovable(g, this.x, this.y, this.stats.mov, this.movcost);

    if (draw == true)
    {
      p.draw = ( g ) =>
      {
	let off = g.camera.offset;
	for (let c of p)
	{
	  g.ctx[1].drawImage(
	    g.Album.get("C_move"),
	    (c.x - off.x)*g.grid.x, (c.y - off.y)*g.grid.y,
	    g.grid.x, g.grid.y
	  );
	}
      }
    }
    return p;
  }

  setColor(color)
  {
    this.color = color;
    for (let a in this.animations)
    {
      this.recolorAnim(a);
    }
  }
  
  recolorAnim(a)
  {
    let t = recolor(this, this.animations[a].image);
    if (t == null)
    {
      setTimeout( () => {this.recolorAnim( a )}, 50);
    }
    else
    {
      this.animations[a].image = t;
    }
  }

}
