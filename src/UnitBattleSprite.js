"use strict";

import {BattleSprite, BattleAnimation} from "./BattleAnimation.js";
import {waitTick} from "./Utils.js";
import {Coord} from "./Path.js";


// weapon will determine which animation set the battlesprite uses.
// weapon will be updated each BS update, letting it know where to draw itself/do other stuff
// weapon.update(unit, state), where state is "idle", "run" or "hit" (more to come)



export class UnitBattleSprite extends BattleSprite
{
  constructor(unit, id, g, x, y)
  {
    super(g, unit.weapons[0].sprite(), x, y);
    this.id = id;

    this.addAnimation("idle","anim0");
    this.addAnimation("run","anim1");
    this.addAnimation("hit","anim2");
    this.addAnimation("crt","anim3");
    //"hit2", [new BAFrame(10, 0,0,0),new BAFrame(30, 0,0,0),new BAFrame(5, 0,0,0),new BAFrame(35, 0,0,0)]

    this.walkFunction = unit.walkFunction;

    // TODO make this a property of Unit and pull from that
    this.anims = {
      melee :{run:"run",hit:"hit",crt:"crt",idle:"idle"},
      ranged :{run:"run",hit:"hit2",crt:"crt2",idle:"idle"}
    };
  }

  draw(g)
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
  {
    super.tickAnim();
  }
  onHit(f)
  {
    return this.curAnim().onHit(f);
  }

  addAnimation( name, lookup )
  {
    super.addAnim(name, lookup);
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
