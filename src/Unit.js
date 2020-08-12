'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Path} from "./Path.js";
import {Queue} from "./Queue.js";
import {recolor} from "./UsefulFunctions.js";
import {Range} from "./Range.js";
import {TILES, UNIT_MAX_WEAP, UNIT_MAX_ITEM, STATS} from "./Constants.js";
import {ImageModifier} from "./ImageModifier.js";
import {triggerEvent, generatePath, inRange, generateMovable, nextFrameDo, waitTick} from "./Utils.js";


export class Unit extends AnimatedObject
{
  constructor(id, x, y, caps, stats, name = ("Unit "+id), classname = "Unit", pArt = "gen", walkFunction = null)
  {
    super( x, y );
    this.x = x;
    this.y = y;
    this.id = id;
    this.name = name;
    this.classname = classname;
    this.pArt = pArt;
    this.team;

    this.movcost = {};
    this.movcost[TILES.ROAD] = 1;
    this.movcost[TILES.TREE] = 2;
    this.movcost[TILES.WALL] = 5000;
    this.movcost[TILES.ENEMY] = 5000;
    
    this.caps = {};
    this.stats = {};
    // TODO
    this.growth = {};
    this.lvl = 10;
    this.exp = 99;

    for (let s of STATS)
    {
      this.caps[s] = (caps[s] == undefined) ? 0 : caps[s];
      this.stats[s] = (stats[s] == undefined) ? 0 : stats[s];
    }
    this.stats.hp = this.stats.maxhp;

    this.mapSpeed = 4;

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
    this.eqWeap = 0;
    this.items = [];
    this.walkFunction = walkFunction;
    
  }
  
  addWeapon(weap)
  {
    if (this.weapons.length < UNIT_MAX_WEAP)
      this.weapons.push(weap);
    else
      throw new Error("Unit.addWeapon: max weapon amount exceeded.");
  }
  addItem(item)
  {
    if (this.items.length < UNIT_MAX_ITEM)
      this.items.push(item);
    else
      throw new Error("Unit.addItem: max item amount exceeded.");
  }
  getWeapon()
  {
    if (this.weapons.length == 0)
      return new Weapons.NoWeapon();
    return this.weapons[this.eqWeap];
  }
  hasUsableItem()
  {
    for (let item of this.items)
    {
      if (item.usable(this))
      {
	return true;
      }
    }
    return false;
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
  
  async tentativeMove(g, path)
  {
    return new Promise( resolve => { this._tentativeMove(g, path, resolve) } );
  }
  _tentativeMove(g, path, onDone)
  {
    // since move is tentative, save old location for potential revert
    this.old.x = this.x;
    this.old.y = this.y;

    if (path.size() > 0)
    {
      this.path_iter = path.iter();
      this.path_iter.onDone = onDone;
      this.path_iter.counter = this.mapSpeed;
      // Don't spend extra frames drawing unit at current location
      this.path_iter.next();

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
    this.setAnim("wait");
    this.pauseAnimation();
    this.active = false;
  }
  turnInit()
  {
    this.setAnim("idle");
    this.curAnim().reset();
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

  drawSomewhereElse( g, ctx, x, y)
  {
    super.draw(g, ctx, x, y, false);
  }
  draw( g )
  {
    if (g.camera.visible(this))
    {
      let off = g.camera.offset;
      super.draw(g, 2, this.vis.x - off.x, this.vis.y - off.y);
    }
  }
  
  //          g.Map, ["teamname"]
  adjacentUnits(map, teams)
  {
    return inRange(this, [1], "units", map, null, 
      [(x)=>{return (x !== this && teams.includes(x.team));}]);
  }
  movable(g, includeAttackable, draw = true)
  {
    let p = generateMovable(g.Map, this.x, this.y, this.getMov(), this.movcost);

    let a = new Queue();
    let adraw = new Queue();
    if (includeAttackable == true)
    {
      for (let c of p)
      {
	let n = inRange(c, this.getRange(), "tiles", g.Map);
	for (let cc of n)
	{
	  if (a.doesNotContain(cc))
	  {
	    a.push(cc);
	    if (p.doesNotContain(cc))
	    {
	      adraw.push(cc);
	    }
	  }
	}
      }
    }

    let r = [p, a];
    if (draw == true)
    {
      p.setArt("C_move");
      a.setArt("C_atk");
      adraw.setArt("C_atk");
      r.draw = (g) =>
      {
	p.draw(g);
	adraw.draw(g);
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
    return inRange(this, this.getRange(), "units", map, null, [(unit)=>{return (unit.team != this.team);}]);
  }
  // will be used later if move is affected by anything.
  // if not, then this will just be a getter
  getMov()
  {
    return this.stats.mov;
  }
  
  getRange()
  {
    if (this.weapons.length == 0)
    {
      return new Range(0,0);
    }
    return this.weapons[0].range;
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
