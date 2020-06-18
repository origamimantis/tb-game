'use strict';

import {Range} from "./Range.js";
import {Album} from "./Images.js";

export class Weapon
{
    //          str   int    int  int   [int]  int   [str]    {str:int} [str][str]  [str]  str        {str: int}
    constructor(name, might, hit, crit, range, uses, effects, statbon,  eff, strong, weak)
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
  constructor(img, animations, moveRange, handx, handy, numAnim, updateFunc)
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
    super(null, "melee", {min: 15, max:40}, 3, 3, 1, (unit, state) =>{});
  }
}


export class NoWeapon extends Weapon
{
  constructor()
  {
      super("No Weapon", 0, 100, 0, [1], 10000, [], {}, [],[],[])
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
      super("Spook", 0, 100, 0, [2], 10000, [], {}, [],[],[],
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
    super("Vampire Fang", 18, 85, 20, [1], 80, ["vampiric"], {}, [],[],[]);
  }
  sprite()
  {
    return new NoWeapon_Sprite();
  }
}
export class Bow extends Weapon
{
    constructor(name, might, hit, crit, range, uses, effects, statbon, eff, strong = null, weak=null)
    {
	if (strong == null) {strong = []} if (weak   == null) {weak   = []}
	super(name, might, hit, crit, range, uses, effects, statbon, eff, strong, weak)
    }
}

class Sword_Sprite extends WeaponSprite
{
  constructor()
  {
    super("W_sword", "melee", {min: 15, max:32}, 3, 15, 2,
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
  constructor(name, might, hit, crit, range, uses, effects, statbon, eff, strong = null, weak=null)
  {
    if (strong == null) {strong = [Axe  ]} if (weak   == null) {weak   = [Lance]}
    super(name, might, hit, crit, range, uses, effects, statbon, eff, strong, weak)
  }
  sprite()
  {
    return new Sword_Sprite();
  }
}

export class Lance extends Weapon
{
    constructor(name, might, hit, crit, range, uses, effects, statbon, eff, strong = null, weak=null)
    {
	if (strong == null) {strong = [Sword]} if (weak   == null) {weak   = [Axe  ]}
	super(name, might, hit, crit, range, uses, effects, statbon, eff, strong, weak)
    }
}

export class Axe extends Weapon
{
    constructor(name, might, hit, crit, range, uses, effects, statbon, eff, strong = null, weak=null)
    {
	if (strong == null) {strong = [Lance]} if (weak   == null) {weak   = [Sword]}
	super(name, might, hit, crit, range, uses, effects, statbon, eff, strong, weak)
    }
}
export class LongSword extends Sword
{
    constructor()
    {
	super("Brave Sword", 12, 100, 0, [5], 48, [], {});
    }
}
export class BraveSword extends Sword
{
    constructor()
    {
	super("Brave Sword", 12, 100, 0, [1], 48, ["brave"], {});
    }
}

export class WoodBow extends Bow
{
    constructor()
    {
	super("Wood Bow", 9, 70, 0, [2], 48, [], {});
    }
}
export class SilverBow extends Bow
{
    constructor()
    {
	super("Silver Bow", 15, 95, 0, [2], 24, [], {});
    }
}
export class BronzeSlicer extends Sword
{
    constructor(){ super("Bronze Slicer", 8, 80, 10, [1], 48, [], {}); }
}

export class Sweeper extends Sword
{
    constructor()
    {
	super("Sweeper", 8, 65, 0, [1], 48, ["sweep"], {"spd":10,"skl":5,"def": 5});
    }
}

export class MegaSweeper extends Sword
{
    constructor()
    {
	super("Mega Sweeper", 10, 65, 0, [1], 48, ["sweep", "brave"], {"spd":10,"skl":5,"def": 5});
    }
}

export class MightyAxe extends Axe
{
    constructor()
    {
	super("Mighty Axe", 18, 100, 20, [1], 24, [], {});
    }
}
export class BloodAxe extends Axe
{
    constructor()
    {
	super("Blood Axe", 18, 65, 20, [1], 24, ["vampiric"], {});
    }
}



export class EnragedAxe extends Axe
{
    constructor()
    {
	super("Enraged Axe", 18, 80, 0, [1], 24, ["fury"], {});
    }
}
export class Skofnung extends Sword
{
    constructor()
    {
	super("Skofnung", 12, 100, 10, [1], 48, [], {});
    }
    activate() { this.pow = 20; this.bonus = {"atk":5, "spd":5, "skl":10,"def":10}; this.effects.push("crescent");}
}
export class StarSword extends Sword
{
    constructor()
    {
	super("StarSword", 9, 100, -50, [1], 24, ["brave", "starnova","crescent"], {"skl":10});
    }
}
export class MusicExtender extends Sword
{
    constructor()
    {
	super("MusicExtender", -50, 200, -100, [1], 99999999, ["brave", "starnova"], {"skl":100});
    }
}



let Weapons =
{
    "VampireFang":VampireFang,
    "WoodBow":WoodBow,
    "SilverBow":SilverBow,
    "BraveSword":BraveSword,
    "BronzeSlicer":BronzeSlicer,
    "Sweeper":Sweeper,
    "MegaSweeper":MegaSweeper,
    "MightyAxe":MightyAxe,
    "BloodAxe":BloodAxe,
    "EnragedAxe":EnragedAxe,
    "Skofnung":Skofnung,
    "StarSword":StarSword,
    "MusicExtender":MusicExtender,








    "NoWeapon":NoWeapon
}

