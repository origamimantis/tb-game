"use strict";

import {AnimatedObject} from "./AnimatedObject.js";
import {BAFrame, BattleAnimation} from "./BattleAnimation.js";
import {waitTick} from "./Utils.js";
import {Coord} from "./Path.js";


// weapon will determine which animation set the battlesprite uses.
// weapon will be updated each BS update, letting it know where to draw itself/do other stuff
// weapon.update(unit, state), where state is "idle", "run" or "hit" (more to come)



export class UnitBattleSprite extends AnimatedObject
{
  constructor(unit, id, g, x, y)
  {
    super(g, x, y);
    this.id = id;
    this.addAnimation("idle", [new BAFrame(100000,20,35,0)]);
    this.addAnimation("run", [new BAFrame(10, 17,31,15),new BAFrame(10, 5,19,-70),new BAFrame(10, 17,31,15),new BAFrame(10, 38,19,95)]);
    this.addAnimation("hit", [new BAFrame(10, 37,26,90),new BAFrame(30, 42,7, 160),new BAFrame(5, 38,24,45),new BAFrame(35, 32,30,-30)], false);
    this.addAnimation("hit2", [new BAFrame(10, 0,0,0),new BAFrame(30, 0,0,0),new BAFrame(5, 0,0,0),new BAFrame(35, 0,0,0)], false);

    // TODO fix this
    this.ws = unit.weapons[0].sprite();

    this.walkFunction = unit.walkFunction;
    // TODO make this a property of Unit and pull from that
    this.anims = {
      melee :{run:"run",hit:"hit",idle:"idle"},
      ranged :{run:"run",hit:"hit2",idle:"idle"}
    }
    this.state = "idle";
  }

  draw(g)
  {
    //super.draw(g, 3, this.x, this.y, 1, false);
    //this.ws.draw(g);
    let c = g.ctx[3];
    let wimg = this.ws.image;
    if (this.id == "atk")
    {
      c.scale(-1,1);
      c.translate(-512,0);
    }

    this.curAnim().draw(g, 3, this.x, this.y, 1, false);
    
    let rad = -this.ws.a*Math.PI/180;
    c.translate(this.ws.x, this.ws.y);
    c.rotate(rad);
    c.drawImage(wimg, -this.ws.hx, -this.ws.hy );
    c.rotate(-rad);
    c.translate(-this.ws.x, -this.ws.y);

    if (this.id == "atk")
    {
      c.translate(512,0);
      c.scale(-1,1);
    }
  }

  update()
  {
    this.ws.update(this, this.state);
    super.tickAnim();
  }

  addAnimation( name, weights, loops = true)
  {
    let lookup = "BS_kn_" + name + ((this.id == "aatk") ? "_reverse" : "");
    this.addAnim( name, new BattleAnimation(lookup , weights, loops));
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
	// TODO make 40 a number determined by the weapon (and like 99999 for ranged weapons)
        // ie weapon max range
	await this.walkFunction(this, defr, this.ws.moveRange.max, this.ws.moveRange.min);
        resolve();
      }
    );
  }





}
