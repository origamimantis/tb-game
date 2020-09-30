"use strict";

import {BattleSprite, BattleAnimation} from "./BattleAnimation.js";
import {waitTick} from "./Utils.js";
import {Coord} from "./Path.js";
import {Characters} from "./Characters.js";


// weapon will determine which animation set the battlesprite uses.
// weapon will be updated each BS update, letting it know where to draw itself/do other stuff
// weapon.update(unit, state), where state is "idle", "run" or "hit" (more to come)



export class UnitBattleSprite extends BattleSprite
{
  constructor(unit, id, g, x, y)
  {
    super(g, unit.getWeapon().sprite(), x, y);
    this.id = id;
    this.unit = unit;
    this.walkFunction = unit.walkFunction;
    this.loaded = false;
    this.deathQuote = null;
  }
  //  call this before doing anything with the battlesprite
  //  this function is async but constructors can't be async
  async load()
  {
    let c = Characters[this.unit.name];
    if (c === undefined)
      c = Characters.generic;
    else if (c.deathQuote !== undefined)
      this.deathQuote = c.deathQuote;

    // TODO use generic if character not generic but has no custom animation for their class
    c = c.battleAnimation;
    if (c === undefined)
      c = Characters.generic.battleAnimation;
    c = c[this.unit.classname].scripts;

    for (let [name, file] of Object.entries(c))
    {
      await this.addAnimation(name, file);
    }
    //"hit2", [new BAFrame(10, 0,0,0),new BAFrame(30, 0,0,0),new BAFrame(5, 0,0,0),new BAFrame(35, 0,0,0)]

    // TODO make this a property of Unit and pull from that
    this.anims = {
      melee :{run:"run",hit:"hit",crt:"crt",idle:"idle"},
    };
    this.update = this.updateLoaded;
    this.draw = this.drawLoaded;
  }

  draw(g)
  {}
  drawLoaded(g)
  {
    //super.draw(g, 3, this.x, this.y, 1, false);
    //this.ws.draw(g);
    let c = g.ctx[3];
    let wimg = this.ws.image;

    if (this.id == "def")
    {
      c.scale(-1,1);
      c.translate(-512,0);
    }

    this.curAnim().draw(g, 3, this.x, this.y, 1, false);
    
    if (wimg !== null)
    {
      let rad = -this.ws.a*Math.PI/180;
      c.translate(this.ws.x, this.ws.y);
      c.rotate(rad);
      c.drawImage(wimg, this.ws.curAnim*this.ws.w, 0, this.ws.w, this.ws.h,
			-this.ws.hx, -this.ws.hy, this.ws.w, this.ws.h );
      c.rotate(-rad);
      c.translate(-this.ws.x, -this.ws.y);
    }

    if (this.id == "def")
    {
      c.translate(512,0);
      c.scale(-1,1);
    }
  }

  update()
  {}
  updateLoaded()
  {
    super.tickAnim();
  }
  onHit(f)
  {
    return this.curAnim().onHit(f);
  }

  async addAnimation( name, lookup )
  {
    await super.addAnim(name, lookup);
  }


  setAnimation(name, onDone = ()=>{})
  {
    this.state = name;
    name = this.anims[this.ws.animType][name];
    this.setAnim(name, onDone);
  }


  moveCloser(defr)
  {
    return new Promise( async (resolve) =>
      {
	await this.walkFunction(this, defr, this.ws.moveRange.max, this.ws.moveRange.min);
        resolve();
      }
    );
  }





}
