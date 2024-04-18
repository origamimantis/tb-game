'use strict';

import {Settings} from "./Settings.js";
import {Characters} from "./Characters.js";
import {AnimatedObject} from "./AnimatedObject.js";
import {Coord} from "./Path.js";
import {Queue} from "./Queue.js";
import {MapCoordBlob} from "./CoordLookup.js";
import {recolor} from "./UsefulFunctions.js";
import {Range} from "./Range.js";
import {TILES, UNIT_MAX_WEAP, UNIT_MAX_ITEM, UNIT_MAX_EQUI, STATS} from "./Constants.js";
import {ImageModifier} from "./ImageModifier.js";
import {triggerEvent, generatePath, inRange, generateMovable, nextFrameDo, waitTick} from "./Utils.js";
import {NoWeapon} from "./Weapon.js";

let id = 0

export class Unit extends AnimatedObject
{
  static init()
  {
    id = 0
  }
  constructor(caps, stats, name = ("Unit "+id), classname = "Unit", pArt = "P_gen", skills = [], walkFunction = null)
  {
    super( null, null );
    this.x = null;
    this.y = null;
    this.id = id;
    id++;

    this.name = name;
    this.classname = classname;
    if (Characters[name] !== undefined && Characters[name].portrait !== undefined)
    {
      pArt = Characters[name].portrait;
    }
    else if (pArt === null)
    {
      pArt = "P_gen";
    }
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
    this.baseMapSpeed = 4;

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
    this.eqWeap = -1;
    this.items = [];
    this.equipment = [];
    this.walkFunction = walkFunction;
    
    this.skills = skills;
    this.ai = "targetWeakest";
    this.dead = false;
    this.isBoss = false;
  }

  // only use after constructing.
  setXY(x,y)
  {
    this.x = x;
    this.y = y;
    this.drawx = x;
    this.drawy = y;

    this.vis = {
		dx : 0,
		dy : 0,
		x : this.x,
		y : this.y
		};

  }
  
  addWeapon(weap)
  {
    if (this.weapons.length < UNIT_MAX_WEAP)
    {
      this.weapons.push(weap);
      if (this.canUseWeapon(this.weapons[this.eqWeap]) == false && this.canUseWeapon(this.weapons[this.weapons.length-1]) == true) 
	this.eqWeap = this.weapons.length - 1
    }
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

  addEquipment(equipment)
  {
    if (this.equipment.length < UNIT_MAX_EQUI)
      this.equipment.push(equipment);
    else
      throw new Error("Unit.addEquipment: max equipment amount exceeded.");
  }
  hasItem(itemname)
  {
    //if has item with this name, return [true, index]
    // else return [false, -1]
    for (let i = 0; i < this.items.length; ++i)
    {
      if (this.items[i].name == itemname)
	return [true, i];
    }
    return [false, -1]

  }
  removeItem(item)
  {
    for (let i = 0; i < this.items.length; ++i)
    {
      if (this.items[i] === item)
      {
	this.items.splice(i, 1);
	return;
      }
    }
    throw new Error("Unit.removeItem: item not found:");
    throw new Error(item );
  }
  // TODO weapon ranks and stuff
  canUseWeapon(w)
  {
    // if eqWeap == -1 then this.weapons[eqWeap] -> undefined
    let r = true;
    if  (w === undefined)
      return false
    else if (this.hasSkill("noncombatant"))
      r = false;
    else if (w !== null && w.pref !== null && this.name != w.pref)
      r = false;
    return r;
  }
  cannotUseWeapon(w)
  { return !this.canUseWeapon(w);}

  // idx is [int]
  getUsableWeapons(idx)
  {
    let a = [];
    let i = 0;
    for (let w of this.weapons)
    {
      if (this.canUseWeapon(w))
      {
	a.push(w);
	if (i == this.eqWeap)
	  idx[0] = a.length - 1;
      }
      ++i;
    }
    return a;
  }
  getWeapon()
  {
    if (this.canUseWeapon(this.weapons[this.eqWeap]) == true)
      return this.weapons[this.eqWeap];
    else
      return new NoWeapon();
  }
  hasSkill(s)
  {
    for (let ss of this.skills)
    {
      if (ss == s)
	return true;
    }
    return false;
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
  
  async tentativeMove(g, path, speed = this.baseMapSpeed)
  {
    return new Promise( resolve => { this._tentativeMove(g, path, resolve, speed) } );
  }
  _tentativeMove(g, path, onDone, speed)
  {
    // since move is tentative, save old location for potential revert
    this.old.x = this.x;
    this.old.y = this.y;

    if (path.size() > 0)
    {
      this.path_iter = path.iter();
      this.path_iter.onDone = onDone;
      this.path_iter.counter = speed;
      this.mapSpeed = speed;
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
    //this.setAnim("wait");
    this.curAnim().reset();
    this.pauseAnimation();
    this.active = false;
  }
  turnInit()
  {
    //this.setAnim("idle");
    this.curAnim().reset();
    this.resumeAnimation();
    this.active = true;
  }

  
  // more interesting stuff here later
  generateActions(g)
  {
    return ["attack", "wait"];
  }

  teleport(g, x, y)
  {
    g.Map.removeUnit(this);
    g.Map.getTile(x, y).unit = this;
    this.x = x;
    this.y = y;
    this.vis.x = x;
    this.vis.y = y;
  }
  // usually used in cutscenes
  // speed: number of frames per tile
  moveTo(g, x, y, speed = this.baseMapSpeed*2)
  {
    if (this.x == x && this.y == y)
      return
    if (Settings.get("cut_skip") == true)
    {
      this.teleport(g, x, y);
      return;
    }

    return new Promise( async (resolve) => {
      let p = await generatePath(g, this.x, this.y, x, y, this.movcost);
      if (p == null)
      {
	throw "Could not find path to (x, y) = (" + this.x + ", " + this.y + ") to (" + x + ", " + y + ").";
      }
      this.path_iter = p.iter();
      this.path_iter.onDone = resolve;
      this.path_iter.counter = speed;
      this.mapSpeed = speed;
      this.path_iter.next();
      this.moving = true;
      g.Map.removeUnit(this);
      g.Map.getTile(x, y).unit = this;
    });
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
  // visually move unit slightly towards a coordinate
  async bump(c)
  {
    if (c.x == this.x && c.y == this.y)
      return;

    let dx = c.x - this.x;
    let dy = c.y - this.y;
    let d = Math.sqrt(dx*dx + dy*dy)
    dx /= d;
    dy /= d;

    let movepercent = 0.3125
    dx *= movepercent
    dy *= movepercent

    for (let i = 0; i < 4; ++i)
    {
      this.vis.x += dx/5
      this.vis.y += dy/5
      await waitTick()
    }
  }
  async unbump()
  {
    let dx = this.x - this.vis.x
    let dy = this.y - this.vis.y

    for (let i = 0; i < 4; ++i)
    {
      this.vis.x += dx/5
      this.vis.y += dy/5
      await waitTick()
    }
    this.vis.x = this.x
    this.vis.y = this.y
  }

  draw( g )
  {
    if (g.camera.visible(this))
    {
      let append = ""
      if (this.active == false)
	append = "_wait"
      else
	append = g.getAffiliation(this);

      let off = g.camera.getOffset();
      super.draw(g, 2, g.xg(this.vis.x - off.x + 0.5), g.yg(this.vis.y - off.y + 0.5), 1, append);
      if (this.isBoss)
      {
	let x = this.vis.x - off.x;
	let y = this.vis.y - off.y;
	x = (x+1)*g.gx - 20;
	y = (y+1)*g.gy - 16;

	g.drawImage(2, "boss_indic", x, y);
      }
    }
  }
  
  //          g.Map, ["teamname"]
  adjacentUnits(map, teams = null)
  {
    // all units
    if (teams === null)
      return inRange(this, [1], "units", map, null, 
	[(x)=>{return (x !== this);}]);
    // specific units
    else
      return inRange(this, [1], "units", map, null, 
	[(x)=>{return (x !== this && teams.includes(x.team));}]);
  }
  movable(g, includeAttackable, draw = true, wlist = this.weapons)
  {
    let p = generateMovable(g.Map, this.x, this.y, this.getMov(), this.movcost);

    let a = new Queue();
    let costs = new MapCoordBlob();
    let adraw = new Queue();
    if (includeAttackable == true)
    {
      for (let c of p)
      {
	costs.add(c, this.movcost[g.Map.pather[c.y][c.x]])
	let n = inRange(c, this.getRange(null), "tiles", g.Map);
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

    if (Settings.get("visible_movement_costs"))
      r.push(costs)

    if (draw == true)
    {
      p.setArt("C_move");
      a.setArt("C_atk");
      adraw.setArt("C_atk");
      r.draw = (g) =>
      {
	p.draw(g);
	adraw.draw(g);
        
	if (Settings.get("visible_movement_costs"))
	{
	  let off = g.camera.getOffset();

	  g.setTextJustify(2, "center");

	  for (let c of p)
	  {
	    let tc = costs.get(c);
	    if (tc > 1000)
	      tc = "";
	    g.drawOutlinedText(2, tc, (c.x - off.x + 0.5)*g.gx, (c.y - off.y + 0.5)*g.gy,
	      "16.5px ABCD Mono", "#fcbe03", "#333333");
	  }
	}
      }

    }

    return r;
  }

  // attackable from a certain coordinate ie does not factor in movement
  attackableTiles(map, wlist = this.weapons)
  {
    let wlist2 = []
    for (let w of wlist)
    {
      if (this.canUseWeapon(w))
      {
	wlist2.push(w)
      }
    }
    let p = inRange(this, this.getRange(wlist2), "tiles", map);
    p.setArt("C_atk");
    return p;
  }
  attackableUnitsFrom(g, loc = null, wlist = null)
  {
    if (loc === null)
      loc = this
    return inRange(loc, this.getRange(wlist), "units", g.Map, null, [(unit)=>{return g.Units.hostile(this,unit)}])

  }
  // attackable from a certain coordinate ie does not factor in movement
  attackableUnits(g, wlist = null)
  {
    return this.attackableUnitsFrom(g, null, wlist);
  }
  // will be used later if move is affected by anything.
  // if not, then this will just be a getter
  getMov()
  {
    let bn = 0
    for (let i of this.equipment)
    {
      for (let [stat, amt] of Object.entries(i.stats))
      {
        if (stat == "mov")
	  bn += amt
      }
    }

    let ret = this.stats.mov + bn;
    if (ret < 0)
      ret = 0
    return ret
  }
  isDead()
  {
    return this.dead;
  }
  isAlive()
  {
    return !this.dead;
  }
  
  getRange(wlist = null)
  {
    if (wlist === null)
    {
      return this.getWeapon().range;
    }
    if (wlist.length == 0)
    {
      return new Range(0,0);
    }
    return wlist[0].range;
  }
  async fadeOut(g, onDone)
  {
    for (let i = 30; i > 0; --i)
    {
      g.ctx[2].globalAlpha = (i-1)/30;
      this.draw(g);
      g.ctx[2].globalAlpha = 1;
      await waitTick();
    }
    onDone();
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
