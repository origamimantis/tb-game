'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Path} from "./Path.js";
import {Queue} from "./Queue.js";
import {recolor} from "./UsefulFunctions.js";
import {Weapons} from "./Weapon.js";
import {Range} from "./Range.js";
import {TILES} from "./Constants.js";
import {ImageModifier} from "./ImageModifier.js";
import {triggerEvent, generatePath, inRange, generateMovable, nextFrameDo, waitTick} from "./Utils.js";


export class Unit extends AnimatedObject
{
  constructor(id, x, y, caps, stats, name = ("Unit "+id), classname = "Unit", pArt = "gen", color = [255,0,0])
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
    this.movcost[TILES.WALL] = 5000;
    
    this.caps = {};
    this.stats = {};
    for (let s of [ "maxhp","atk","spd","skl","def","con","mov" ])
    {
      this.caps[s] = (caps[s] == undefined) ? 0 : caps[s];
      this.stats[s] = (stats[s] == undefined) ? 0 : stats[s];
    }
    this.mapSpeed = 3;

    this.vis = {
		dx : 0,
		dy : 0,
		x : this.x,
		y : this.y
		};

    this.old = {x: null, y: null}
    this.moving = false;
    this.moveFlag = false;
    this.path_iter;

    this.active = true;
    this.color = [1, 253, 40];
    
    this.weapons = [];
  }
  
  instantMove(g, x, y)
  {
    let u = g.Map.getTile(x, y).unit;
    if (u == null || u == this)
    {
      g.Map.removeUnit(this);
      g.Map.getTile(x, y).unit = this;
      this.x = this.vis.x = x;
      this.y = this.vis.y = y;
    }
    else
    {
      throw "Can't move there.";
    }
  }
  async tentativeMove(g, path, onDone)
  {
    if (path.size() > 0)
    {
      this.path_iter = path.iter();
      this.path_iter.onDone = onDone;
      this.path_iter.counter = this.mapSpeed;
      // Don't spend extra frames drawing unit at current location
      this.path_iter.next();

      // since move is tentative, save old location for potential revert
      this.old.x = this.x;
      this.old.y = this.y;

      // enable movement in update
      this.moving = true;
    }
    else
    {
      onDone();
    }
  }
  
  revertMove(g)
  {
    this.x = this.old.x;
    this.y = this.old.y;
    this.vis.x = this.old.x;
    this.vis.y = this.old.y;
  }

  confirmMove(g)
  {
    g.Map.getTile(this.old.x, this.old.y).unit = null;
    g.Map.getTile(this.x, this.y).unit = this;
  }
  endTurn(g)
  {
    this.animHist = this.animations["idle"].image;
    this.recolorAnim(g, "idle", [100,100,100], "kn0_wait")
    this.pauseAnimation();
    this.active = false;
  }
  turnInit()
  {
    this.animations["kn0"].image = this.animHist;
    this.resumeAnimation();
    this.active = true;

  }

  
  // more interesting stuff here later
  generateActions(g)
  {
    return ["attack", "wait"];
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
    this.path_iter.counter = this.mapSpeed;
    this.path_iter.next();
    this.moving = true;
    g.Map.removeUnit(this);
    g.Map.getTile(x, y).unit = this;

  }
  
  update(g)
  {
    if (this.moving == true)
    {
      if (this.path_iter.left() > 0)
      {
	let i = this.path_iter.val();
	this.vis.dx = i.x - this.x;
	this.vis.dy = i.y - this.y;

	-- this.path_iter.counter;
	let dx = this.vis.dx/this.mapSpeed;
	let dy = this.vis.dy/this.mapSpeed;
	this.vis.x += dx;
	this.vis.y += dy;
	if (this.path_iter.counter <= 0)
	{
	  this.path_iter.next();
	  this.path_iter.counter = this.mapSpeed;

	  this.x += this.vis.dx;
	  this.y += this.vis.dy;
	  this.vis.x = this.x;
	  this.vis.y = this.y;
	}
      }

      else if (this.path_iter.left() == 0)
      {
	this.moving = false;
	if (this.path_iter.onDone)
	{
	  this.path_iter.onDone();
	}
      }
    }
  }

  draw( g )
  {
    if (g.camera.visible(this))
    {
      let off = g.camera.offset;
      super.draw(g, 2, this.vis.x - off.x, this.vis.y - off.y)
    }
    super.tickAnim();
  }
  
  movable(g, includeAttackable, draw = true)
  {
    let p = generateMovable(g, this.x, this.y, this.getMov(), this.movcost);

    let a = new Queue();
    if (includeAttackable == true)
    {
      for (let c of p)
      {
	let n = inRange(c, this.getRange(), "tiles", g.Map);
	for (let cc of n)
	{
	  if (p.doesNotContain(cc) && a.doesNotContain(cc))
	  {
	    a.push(cc);
	  }
	}
      }
    }

    let r = [p, a];
    if (draw == true)
    {
      p.setArt("C_move");
      a.setArt("C_atk");
      r.draw = (g) =>
      {
	p.draw(g);
	a.draw(g);
      }
    }

    return r;
  }

  attackableTiles(map)
  {
    let p = inRange(this, this.getRange(), "tiles", map);
    p.setArt("C_atk");
    return p;
  }
  attackableUnits(map)
  {
    return inRange(this, this.getRange(), "units", map, null, [(unit)=>{return (unit != this);}]);
  }
  // will be used later if move is affected by anything.
  // if not, then this will just be a getter
  getMov()
  {
    return this.stats.mov;
  }
  
  getRange()
  {
    return new Range(1,2);
  }

  async recolorAnim(g, a, d, name)
  {
    if (g.Album.get(name) == undefined)
    {
      let map = {};
      map[this.color] = d;
      this.color = d;
      await ImageModifier.recolor(g.Album.get(this.animations[a].image), map, name);
    }
    this.animations[a].image = name;
  }
  
  async flipVertical(g, a, name)
  {
    if (g.Album.get(name) == undefined)
    {
      await ImageModifier.flipVertical(g.Album.get(this.animations[a].image), name);
    }
    this.animations[a].image = name;
  }

  async test(g, a, name)
  {
    if (g.Album.get(name) == undefined)
    {
      await ImageModifier.flipHorizontal(g.Album.get(this.animations[a].image), name, g);
    }
    this.animations[a].image = name;
  }
  
  async monochromeAnim(g, a, anew)
  {
    let name = this.animations[a].image + "_bw";
    if (g.Album.get(name) == undefined)
    {
      await ImageModifier.monochrome(g.Album.get(this.animations[a].baseimage), map, name);
    }
    this.animations[anew].image = name;
  }

}
