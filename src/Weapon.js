'use strict';

import {Range} from "./Range.js";
import {Album} from "./Images.js";
import {WSProjectile, WSEffect} from "./WeaponSpriteSpawns.js";
import {bezierp, beziert, addSpaces} from "./Utils.js"

const HIT = "h"
const CRIT = "c"
const MISS = "m"

export class Weapon
{
    //          int    int  int   [int]  int   [str]    {str:int} str [str][str]  [str]  str        {str: int}
    constructor(might, hit, crit, range, uses, effects, statbon, pref, eff, strong, weak)
    {
	this.classname = this.constructor.name;
	this.name = addSpaces(this.constructor.name);
	this.wsimg = "W_"+this.classname;
	this.icon = "WT_"+this.classname;
	this.pow = might;
	this.hit = hit;
	this.crt = crit;
	this.range = new Range(...range);
	this.maxUses = uses;
	this.uses = uses;
	this.effects = effects.slice(0);
	this.bonus = statbon;
	this.advantage = strong;
	this.disadvantage = weak
	this.effective = eff;
      if (pref === undefined)
	pref = null;
      this.pref = pref;
    }
    get wsimg() { return this._wsimg; }
    set wsimg(val) { this._wsimg = Album.loadIfExists(val); } //async action, immediate return
    get icon() { return this._icon; }
    set icon(val) { this._icon = Album.loadIfExists(val); } //async action, immediate return
  
    hasEffect( e )
    {
	for (let i of this.effects)
	{
	    if (i == e)
	    {
		return true;
	    }
	}
	return false;
    }
    matchup( weap )
    {
	for (let t of this.advantage)   {if (weap instanceof t){return  1;}}
	for (let t of this.disadvantage){if (weap instanceof t){return -1;}}
	return 0;
    }
    use()
    {
	this.uses -=1;
	if (this.uses <= 0) { console.log(this.name + " broke!"); }
    }
}

export class WeaponSprite
{
  constructor(weapon, animations, moveRange, handx, handy, numAnim, hitSFX, updateFunc)
  {
    this.weapon = weapon;
    if (weapon !== null)
    {
      let img = weapon.wsimg;

      this.image = Album.get(img);
      this.numAnim = numAnim;
      this.curAnim = 0;
      this.w = this.image.width/numAnim;
      this.h = this.image.height;
    }
    else
    {
      this.image = null;
      this.numAnim = 0;
      this.curAnim = null;
      this.w = 0;
      this.h = 0;
    }
    this.vflip = false;
    this.hflip = false;

    this.animType = animations;
    this.moveRange = moveRange;
    this.update = updateFunc;
    this.sfx = hitSFX
    this.hx = handx;
    this.hy = handy;
    this.x = 0;
    this.y = 0;
    this.a = 0;
      

  }
}

class NoWeapon_Sprite extends WeaponSprite
{
  constructor(w)
  {
    super(null, "melee", {min: 25, max:40}, 3, 3, 1, "FX_clink", (unit, state) =>{});
  }
}


export class NoWeapon extends Weapon
{
  constructor()
  {
      super(0, 100, 0, [0], 10000, [], {}, null, [],[],[])
  }
  sprite(range)
  {
    return new NoWeapon_Sprite(this);
  }
}
class Spook_Sprite extends WeaponSprite
{
  constructor(w)
  {
    super(w, "ranged", {min: 150, max:180},
      (unit, state) =>
      {
	let hand = unit.curAnim().weights[unit.curFrame()];
	this.x = unit.x + hand.x;
	this.y = unit.y + hand.y
	this.a = hand.a;
      }
    );
  }
}
export class Spook extends Weapon
{
  constructor()
  {
      super(0, 100, 0, [2], 10000, [], {}, null, [],[],[],
      )
  }
  sprite(range)
  {
    return new Spook_Sprite(this);
  }
}

export class VampireFang extends Weapon
{
  constructor()
  {
    super(18, 85, 20, [1], 80, ["vampiric"], {}, null, [],[],[]);
    this.tooltip = "Grants 50% lifesteal."
  }
  sprite(range)
  {
    let s = new NoWeapon_Sprite(this);
    s.sfx = "FX_slash"
    return s
  }
}


class Sprite_Melee extends WeaponSprite
{
  constructor(w, handx,handy, numFrame, sfx, rangeMin=15, rangeMax=32)
  {
    super(w, "melee", {min: rangeMin, max:rangeMax}, handx, handy, numFrame, sfx, 
      (unit, state) =>
      {
        this.x = unit.x + unit.hx;
        this.y = unit.y + unit.hy;
        this.a = unit.ha;
      }
    );
  }
}


export class Pitchfork extends Weapon
{
  constructor()
  {
    super(4, 80, 0, [1], 50, [], {}, "Alfred");
    this.tooltip = "Typical farmer weapon."
  }
  sprite(range)
  {
    return new Sprite_Melee(this, 13, 15,2, "FX_slash",   30);
  }
}

export class Shovel extends Weapon
{
  constructor()
  {
    super(5, 70, 25, [1], 50, [], {}, "Billy");
    this.tooltip = "High critical chance."
  }
  sprite(range)
  {
    return new Sprite_Melee(this,9,15,2, "FX_bonk", 42, 60);
  }
}
export class FryingPan extends Weapon
{
  constructor()
  {
    super(3, 90, 0, [1,2], 50, [], {}, "Chloe");
    this.tooltip = "Good for smacking and throwing."
  }
  sprite(range)
  {
    if (range == 1)
      return new Sprite_Melee(this,6,15,3, "FX_bonk", 45, 65);
    else
    {
      let s = new Sprite_Range(this,6,15,3, "FX_bonk", PROJ, 200, 300, {img: "PR_FryingPan"});

      s.projectile._init = function ()
      {
	// for bezier curves, v = number of frames to get to hit: bigger = slower
	let h;
	if (this.state == CRIT)
	{
	  h = 25
	  this.v = 2*Math.sqrt((this.d*this.d/4 + h*h))/7;
	  this.va = -40
	}
	else
	{
	  h = 50
	  this.v = 2*Math.sqrt((this.d*this.d/4 + h*h))/5;
	  this.va = -15
	}

	this.deleteOnHit = false
	this.x += 25; this.y -= 5; this.a = 90;

	this.d -= 25;
	this.target = this.x + this.d;
	this.bez = bezierp([0,0],[this.d/4,h],[2*this.d/3, h],[this.d, 0], this.x, this.y);
      }
      s.projectile._update = function ()
      {
	[this.x, this.y] = beziert(this.tt/this.v, this.bez)
	this.d = this.target - this.x
	this.a += this.va
      }
      s.projectile._onHit = function ()
      {
	this.framesLeft = 40
	if (this.state == HIT)
	{
	  this.v = 20; this.va = -5; this.tt = 0;
	  this.bez = bezierp([0,0],[20,30],[40,20],[60,-10],this.x, this.y)
	}
	else if  (this.state == CRIT)
	{
	  this.v = 25; this.va = -10; this.tt = 0;
	  this.bez = bezierp([0,0],[20,40],[40,60],[80,80],this.x, this.y)
	}

      }


      return s;
    }
  }
}

export class LumberAxe extends Weapon
{
  constructor()
  {
    super(4, 65, -30, [1], 50, [], {}, null);
    this.tooltip = "Fairly clumsy weapon."
  }
  sprite(range)
  {
    return new Sprite_Melee(this,7,15,2, "FX_slash", 42, 60);
  }
}
export class BraveSword extends Weapon
{
  constructor()
  {
    super(12, 100, 0, [1], 48, ["brave"], {}, null);
    this.tooltip = "Consecutive attacks."
    this.wsimg = "W_sword";
  }
  sprite(range)
  {
    return new Sprite_Melee(this, 3,15,2, "FX_slash", 30, 60);
  }
}

export class BronzeSlicer extends Weapon
{
  constructor()
  {
    super(7, 85, 10, [1], 48, [], {}, "Vargas");
    this.tooltip = "Vargas' prized sword."
    //this.wsimg = "W_sword";
  }
  sprite(range)
  {
    return new Sprite_Melee(this, 3,15,2, "FX_slash", 30, 60);
  }
}


const PROJ = 0;
const EFFX = 1;

class Sprite_Range extends WeaponSprite
{
  constructor(w, handx,handy, numFrame, sfx, type, rangeMin=200, rangeMax=300, details = {})
  {
    super(w, "range", {min: rangeMin, max:rangeMax}, handx, handy, numFrame, sfx, 
      (unit, state) =>
      {
        this.x = unit.x + unit.hx;
        this.y = unit.y + unit.hy;
        this.a = unit.ha;
      }
    );
    
    this.type = type;
    this.details = details;

    if (type == PROJ)
      this.projectile = new WSProjectile(0,0,0,null, this.details);
    else if (type == EFFX)
      this.projectile = new WSEffect(0,0,0,null, this.details);
    else
      console.log("bad weapon sprite spawn type");
  }
  getProjectile(sprite)
  {
    if (this.type == PROJ)
      this.projectile.set(sprite.x, sprite.y, sprite.dist, sprite, this.details);
    else if (this.type == EFFX)
      this.projectile.set(sprite.x, sprite.y, sprite.dist, sprite, this.details);

    return this.projectile;
  }

}
export class WoodenBow extends Weapon
{
  constructor()
  {
      //super(name, might, hit, crit, range, uses, effects, statbon, pref, eff, strong, weak)
    super(5, 80, 10, [2,5], 50, [], {}); 
    this.tooltip = "A regular bow made of flexible wood."
  }
  sprite(range)
  {
    let s = new Sprite_Range(this,30,18,3, "FX_slash", PROJ, 200, 300, {img: "PR_arrow"});

    s.projectile._init = function ()
    {
      this.y += 20;
    }
    s.projectile._update = function ()
    {
      this.x += this.v;
      this.d-= this.v;
    }
    return s;
  }
}

export class TestMagic extends Weapon
{
  constructor()
  {
      //super(name, might, hit, crit, range, uses, effects, statbon, pref, eff, strong, weak)
    super(3, 80, 0, [1, 2], 50, [], {}); 
    this.tooltip = "Zap"
    this.wsimg = "W_spook"

  }
  sprite(range)
  {
    let s = new Sprite_Range(this,9,15,2, "FX_mageboop", EFFX, 200, 300, {framesUntilHit: 150, fxname: "cool"});

    s.projectile._init = function ()
    {
      this.x += this.d;
      this.x += 30;
      this.y += 30;
    }
    s.projectile._update = function ()
    {
      this.x += this.v;
      this.d-= this.v;
    }
    return s;
  }
}


