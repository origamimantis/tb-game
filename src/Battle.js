'use strict';

import {UnitBattleSprite} from "./UnitBattleSprite.js";
import {BattleQueue} from "./Queue.js";
import {waitTick} from "./Utils.js";

class BattleInfo
{
  constructor(a, d)
  {
    this.a = a;
    this.d = d;
  }
}

export class Battle
{
  constructor(g, initiator, defender, onDone)
  {
    this.g = g;
    this.units = {ini: initiator,
		  def: defender};

    this.sprIni = new UnitBattleSprite(initiator, "atk", g, g.windowx - 100, 100);

    this.sprDef = new UnitBattleSprite(defender, "def", g, 100,100);

    this.setAnimation(this.sprIni, "idle");
    this.setAnimation(this.sprDef, "idle");
    this.onDone = onDone;

    this.turns = new BattleQueue();
    this.initTurns();
    this.execTurns(onDone);
  }
  initTurns()
  {
    this.turns.enqueue(new BattleInfo(this.sprIni, this.sprDef));
    this.turns.enqueue(new BattleInfo(this.sprDef, this.sprIni));
    this.turns.enqueue(new BattleInfo(this.sprIni, this.sprDef));
    this.turns.enqueue(new BattleInfo(this.sprDef, this.sprIni));
    this.turns.enqueue(new BattleInfo(this.sprDef, this.sprIni));
    this.turns.enqueue(new BattleInfo(this.sprDef, this.sprIni));
    this.turns.enqueue(new BattleInfo(this.sprDef, this.sprIni));
  }
  async execTurns(onDone)
  {
    while(this.turns.nonempty())
    {
      await this.executeAction();
    }
    onDone();
  }
  executeAction()
  {
    let btl = this.turns.dequeue();
    let atkr = btl.a;
    let defr = btl.d;
    return new Promise( async (resolve) => 
      {
	let direction = defr.x - atkr.x;
	if (Math.abs(direction) > 40)
	{
	  this.setAnimation(atkr, "run");
	  await this.moveCloser(atkr, defr);
	}
	this.setAnimation(atkr, "prehit", async () =>
	  {
	    this.setAnimation(atkr, "hit");
	    for (let i = 0; i < 15; ++i)
	    {
	      defr.x += Math.sign(direction);
	      await waitTick();
	    }
	    resolve();
	  }
	
	);
      }
    );
  }
  moveCloser(atkr, defr)
  {
    return new Promise( async (resolve) =>
      {
	let direction = defr.x - atkr.x;
	while ( Math.abs(direction) > 20)
	{
	  atkr.x += 2*Math.sign(direction);
	  direction = defr.x - atkr.x;
	  await waitTick();
	}
	resolve();
      }
    );
  }

  setAnimation(unit, name, onDone = ()=>{})
  {
    let u = this.sprDef;
    if (unit.id == "atk")
    {
      name += "_reverse";
      u = this.sprIni;
    }
    u.setAnim("btl_" + name, onDone);
  }
  
  update(g)
  {
    this.sprIni.update(g);
    this.sprDef.update(g);

  }
  draw(g)
  {
    this.sprIni.draw(g);
    this.sprDef.draw(g);
  }

}

