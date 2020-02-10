'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Path} from "./Path.js";
import {recolor} from "./UsefulFunctions.js";
import {Weapons} from "./Weapon.js";
import {TILES} from "./Constants.js";
import {generatePath, coordEqual, nextFrameDo} from "./Utils.js";

// for movement speed in terms of animation
const ftm = 6;
const vel = 1/ftm;

class Unit extends AnimatedObject
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
    
    this.caps = caps;
    this.stats = stats;
    this.mapSpeed = 6;

    this.vis = {
		dx : 0,
		dy : 0,
		x : this.x,
		y : this.y
		};
  }
  
  async moveTo(g, x, y)
  {
    let p = await generatePath(g, this.x, this.y, x, y, this.movcost);
    if (p != null)
    {
      this.moveChain(g, this.mapSpeed, 0, p);
      g.Map.removeUnit(this);
    }
  }
  
  moveChain(g, framesLeft, index, path)
  {
    if (index >= path.length)
    {
      g.Map.getTile(this.x, this.y).unit = this;
      return;
    }
    if (framesLeft <= 0 || coordEqual(path[index], this))
    {
      this.x = path[index].x;
      this.y = path[index].y;
      this.vis.x = this.x;
      this.vis.y = this.y;
      if (index + 1 < path.length)
      {
	this.vis.dx = path[index + 1].x - this.x;
	this.vis.dy = path[index + 1].y - this.y;
	this.moveChain(g, this.mapSpeed, index+1, path);
      }
    }
    else
    {
      let dx = this.vis.dx/this.mapSpeed;
      let dy = this.vis.dy/this.mapSpeed;

      this.vis.x += dx;
      this.vis.y += dy;
      nextFrameDo(() => {this.moveChain(g, framesLeft - 1, index, path)});
    }
  }

  setColor(color)
  {
    this.color = color;
    for (let a in this.animations)
    {
      this.recolorAnim(a);
    }
  }
  
  draw( g )
  {
    let off = g.camera.offset;
    super.draw(g, 1, off, 1, this.vis.x, this.vis.y);
  }

  xy()
  {
    return [this.x, this.y];
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

export {Unit};
