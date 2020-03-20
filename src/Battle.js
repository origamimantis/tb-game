'use strict';

import {UnitBattleSprite} from "./UnitBattleSprite.js";
import {BattleQueue} from "./Queue.js";
import {waitTick, waitTime, requestFile} from "./Utils.js";
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

// battle sprites should have frames with dimension 64x64

export class Battle
{
  constructor(g, initiator, defender)
  {
    this.g = g;
    this.sfx = g.Music;
    this.units = {ini: initiator,
		  def: defender};

    this.sprIni = new UnitBattleSprite(initiator, "atk", g, 100, 100);

    this.sprDef = new UnitBattleSprite(defender, "def", g, 100,100);

    this.sprIni.setAnimation("idle");
    this.sprDef.setAnimation("idle");

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
  }
  initTurns()
  {
    this.addTurn(this.sprDef);
    this.addTurn(this.sprIni);
    this.addTurn(this.sprIni);
    this.addTurn(this.sprDef);
    this.addTurn(this.sprDef);
    this.addTurn(this.sprDef);
    this.addTurn(this.sprDef);
  }
  addTurn(who)
  {
    if (who.id == "atk")
    {
      this.turns.enqueue(new BattleInfo(this.sprIni, this.sprDef));
    }
    else
    {
      this.turns.enqueue(new BattleInfo(this.sprDef, this.sprIni));
    }
  }
  async begin(onDone)
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
	await atkr.moveCloser(defr, this);
	
	atkr.setAnimation("hit");
	await waitTime(500);
	
	this.sfx.play("whack");
	await waitTime(220);
	// damage here, and remove await on knockback
	await this.knockBack(atkr, defr, 4)
	await waitTime(720);
	resolve();

      }
    );
  }

  knockBack(atkr, defr, time = 4)
  {
    return new Promise( async (resolve)=>
      {
	for (let i = time; i > 0; --i)
	{
	  defr.x -= i/2;
	  await waitTick();
	}
	resolve();
      }
    );
  }
  
  
  update(g)
  {
    this.sprIni.update();
    this.sprDef.update();
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

