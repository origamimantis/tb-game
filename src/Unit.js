'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Path} from "./Path.js";
import {Queue} from "./Queue.js";
import {recolor} from "./UsefulFunctions.js";
import {Weapons} from "./Weapon.js";
import {TILES} from "./Constants.js";
import {ImageModifier} from "./ImageModifier.js";
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
    this.path_iter;

  }
  
  async tentativeMove(g, path, onDone)
  {
    if (path.size() > 0)
    {
      this.path_iter = path.iter();
      this.path_iter.onDone = onDone;
      this.moveFlag = true;
    }
    else
    {
      onDone();
    }

  }

  async moveTo(g, x, y, onDone)
  {
    let p = await generatePath(g, this.x, this.y, x, y, this.movcost);
    if (p == null)
    {
      throw "Could not find path to (x, y) = (" + this.x + ", " + this.y + ") to (" + x + ", " + y + ").";
    }
    this.path_iter = p.iter();
    this.path_iter.onDone = onDone;
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
      if (this.path_iter.left() > 0)
      {
	let i = this.path_iter.val();
	this.path_iter.next();
	this.vis.dx = i.x - this.x;
	this.vis.dy = i.y - this.y;

	this.moving = true;
	await this.moveChain(g, this.mapSpeed, true);
	this.moving = false;
	this.moveFlag = true;
	if (this.path_iter.left() == 0)
	{
	  if (this.path_iter.onDone)
	  {
	    this.path_iter.onDone();
	  }
	}
      }
    }
  }

  draw( g )
  {
    let off = g.camera.offset;
    super.draw(g, 2, this.vis.x - off.x, this.vis.y - off.y)
  }
  
  movable(g, draw = true)
  {
    let p = generateMovable(g, this.x, this.y, this.getMov(), this.movcost);

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

  // will be used later if move is affected by anything.
  // if not, then this will just be a getter
  getMov()
  {
    return this.stats.mov;
  }
  setColor(color)
  {
    this.color = color;
    for (let a in this.animations)
    {
      this.recolorAnim(a);
    }
  }
  
  async recolorAnim(g, a, d, name)
  {
    if (g.Album.get(name) == undefined)
    {
      let map = {};
      map[[1, 253, 40]] = d;
      ImageModifier.recolor(g.Album.get(this.animations[a].baseimage), map, name);
    }
    this.animations[a].image = name;
  }

}
