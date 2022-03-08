'use strict';

import {Range} from "./Range.js";
import {Album} from "./Images.js";
import {WSProjectile, WSEffect} from "./WeaponSpriteSpawns.js";

export class Weapon
{
    //          str   int    int  int   [int]  int   [str]    {str:int} str [str][str]  [str]  str        {str: int}
    constructor(name, might, hit, crit, range, uses, effects, statbon, pref, eff, strong, weak)
    {
	this.name = name;
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
  constructor(img, animations, moveRange, handx, handy, numAnim, hitSFX, updateFunc)
  {
    if (img !== null)
    {
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
  constructor()
  {
    super(null, "melee", {min: 15, max:40}, 3, 3, 1, "FX_clink", (unit, state) =>{});
  }
}


export class NoWeapon extends Weapon
{
  constructor()
  {
      super("No Weapon", 0, 100, 0, [0], 10000, [], {}, null, [],[],[])
  }
  sprite()
  {
    return new NoWeapon_Sprite();
  }
}
class Spook_Sprite extends WeaponSprite
{
  constructor()
  {
    super("W_spook", "ranged", {min: 150, max:180},
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
      super("Spook", 0, 100, 0, [2], 10000, [], {}, null, [],[],[],
      )
  }
  sprite()
  {
    return new Spook_Sprite();
  }
}

export class VampireFang extends Weapon
{
  constructor()
  {
    super("Vampire Fang", 18, 85, 20, [1], 80, ["vampiric"], {}, null, [],[],[]);
  }
  sprite()
  {
    return new NoWeapon_Sprite();
  }
}


class Sprite_Melee extends WeaponSprite
{
  constructor(art = "W_sword", handx,handy, numFrame, sfx, rangeMin=15, rangeMax=32)
  {
    super(art, "melee", {min: rangeMin, max:rangeMax}, handx, handy, numFrame, sfx, 
      (unit, state) =>
      {
        this.x = unit.x + unit.hx;
        this.y = unit.y + unit.hy;
        this.a = unit.ha;
      }
    );
  }
}



export class Sword extends Weapon
{
  constructor(name, might, hit, crit, range, uses, effects, statbon, pref, eff, strong = null, weak=null)
  {
    //if (strong == null) {strong = [Axe  ]} if (weak   == null) {weak   = [Lance]}
    super(name, might, hit, crit, range, uses, effects, statbon, pref, eff, strong, weak)
  }
  sprite()
  {
    return new Sprite_Melee("W_sword", 3,15,2, "FX_slash", 30, 60);
  }
}
export class Pitchfork extends Weapon
{
  constructor()
  {
      super("Pitchfork", 4, 80, 0, [1], 50, [], {}, "Alfred");
  }
  sprite()
  {
    return new Sprite_Melee("W_Pitchfork", 13, 15,2, "FX_slash",   30);
  }
}
export class FryingPan extends Weapon
{
  constructor()
  {
    //TODO 1-2 range
      super("Frying Pan", 3, 90, 0, [1], 50, [], {}, "Chloe");
  }
  sprite()
  {
    return new Sprite_Melee("W_FryingPan",6,15,3, "FX_bonk", 45, 65);
  }
}
export class Shovel extends Weapon
{
  constructor()
  {
      super("Shovel", 5, 70, 25, [1], 50, [], {}, "Billy");
  }
  sprite()
  {
    return new Sprite_Melee("W_Shovel",9,15,2, "FX_bonk", 42, 60);
  }
}
export class LumberAxe extends Weapon
{
  constructor()
  {
      super("LumberAxe", 4, 65, -30, [1], 50, [], {}, null);
  }
  sprite()
  {
    return new Sprite_Melee("W_LumberAxe",7,15,2, "FX_slash", 42, 60);
  }
}
export class BraveSword extends Sword
{
    constructor()
    {
	super("Brave Sword", 12, 100, 0, [1], 48, ["brave"], {}, null);
    }
}

export class BronzeSlicer extends Sword
{
    constructor(){ super("Bronze Slicer", 7, 80, 10, [1], 48, [], {}, "Vargas"); }
}

const PROJ = 0;
const EFFX = 1;

class Sprite_Range extends WeaponSprite
{
  constructor(art = "W_sword", handx,handy, numFrame, sfx, type, rangeMin=200, rangeMax=300, details = {})
  {
    super(art, "range", {min: rangeMin, max:rangeMax}, handx, handy, numFrame, sfx, 
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
export class TestBow extends Weapon
{
  constructor()
  {
      //super(name, might, hit, crit, range, uses, effects, statbon, pref, eff, strong, weak)
    super("Test Bow", 5, 80, 5, [2], 50, [], {}); 

  }
  sprite()
  {
    let s = new Sprite_Range("W_stick",30,18,3, "FX_slash", PROJ, 200, 300, {img: "PR_arrow"});

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
    super("Test Magic", 3, 80, 0, [1, 2], 50, [], {}); 

  }
  sprite()
  {
    let s = new Sprite_Range("W_spook",9,15,2, "FX_mageboop", EFFX, 200, 300, {framesUntilHit: 150, fxname: "cool"});

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




