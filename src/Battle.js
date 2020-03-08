'use strict';

import {UnitBattleSprite} from "./UnitBattleSprite.js";
import {BattleQueue} from "./Queue.js";
import {waitTick, waitTime} from "./Utils.js";
import {Panel} from "./Panel.js";
import {PanelComponent} from "./PanelComponent.js";


const AFTER_BATTLE_DELAY = 1000;
const PANELS =
  {
    HEALTH: {HEIGHT: 60},
    STATS: {HEIGHT: 100, WIDTH:130},
    fish:4
  };
const WINDOW = {X: 512, Y:384 - PANELS.HEALTH.HEIGHT - PANELS.STATS.HEIGHT};


class BattleInfo
{
  constructor(a, d)
  {
    this.a = a;
    this.d = d;
  }
  draw(g)
  {
    this.a.draw(g);
    this.d.draw(g);
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

    this.healthPanels = new BattleInfo(new Panel(
					  0, g.windowy - PANELS.HEALTH.HEIGHT,
					  g.windowx/2, PANELS.HEALTH.HEIGHT),
				       new Panel(
					  g.windowx/2, g.windowy - PANELS.HEALTH.HEIGHT,
					  g.windowx/2, PANELS.HEALTH.HEIGHT) );

    this.statPanels = new BattleInfo(new Panel(
					0, g.windowy - PANELS.HEALTH.HEIGHT-PANELS.STATS.HEIGHT,
					PANELS.STATS.WIDTH, PANELS.STATS.HEIGHT),
				     new Panel(
					g.windowx - PANELS.STATS.WIDTH, g.windowy - PANELS.HEALTH.HEIGHT - PANELS.STATS.HEIGHT,
					PANELS.STATS.WIDTH, PANELS.STATS.HEIGHT) );

    this.commentPanel = new Panel(
					PANELS.STATS.WIDTH, g.windowy - PANELS.HEALTH.HEIGHT-PANELS.STATS.HEIGHT,
					g.windowx - 2*PANELS.STATS.WIDTH, PANELS.STATS.HEIGHT),


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
    setTimeout( onDone, AFTER_BATTLE_DELAY);
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
	this.setAnimation(atkr, "hit", resolve);
	await waitTime(720);
	// damage here, and remove await on knockback
	await this.knockBack(defr, Math.sign(direction), 4)
      }
    );
  }

  knockBack(u, delta, time)
  {
    return new Promise( async (resolve)=>
      {
	for (let i = time; i > 0; --i)
	{
	  u.x += i*delta;
	  await waitTick();
	}
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
    g.Album.draw(g, 0, "B_backdrop", 0,0, WINDOW.X, WINDOW.Y);
    this.sprIni.draw(g);
    this.sprDef.draw(g);
    this.healthPanels.draw(g);
    this.statPanels.draw(g);
    this.commentPanel.draw(g);
  }

}

