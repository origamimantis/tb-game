'use strict';

import {UnitBattleSprite} from "./UnitBattleSprite.js";
import {BattleQueue} from "./Queue.js";
import {waitTick, waitTime, requestFile} from "./Utils.js";
import {Panel} from "./Panel.js";
import {PanelComponent, PanelType} from "./PanelComponent.js";
import {TILES} from "./Constants.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {Conversation} from "./Conversation.js";

// TODO make Battle, attack return something to tell its caller
//	what happened (ie unit died, amount of hp lost, etc)
// TODO bug: when unit moves to attack someone and dies, there is an error
//	on removal since unit updated coord but not tilemap


const FIGHT = 0;
const SPEECH = 1;

function rand()
{
  return Math.random()*100;
}

function attack(a, d, turnqueue)
{
  let a_stats = a.stats;
  let d_stats = d.stats;

  let a_hp = a_stats.hp;
  let d_hp = d_stats.hp;

  let a_dmg = 0;
  let d_dmg = 0;
  let crit = false;
  let miss = false;

  let effHit = a.effHit(d);
  let effCrt = a.effCrt(d);

  ++ a.atks;

  let hit_rn = rand();
  if (hit_rn < effHit)
  {
    ++ a.hits;
    let pow = a_stats.atk;
    let def = d_stats.def;
    let crt_rn = rand();
    let dmg_scale = 1;

    if (crt_rn < effCrt)
    {
      ++ a.crts;
      pow *= 1.5;
      dmg_scale = 1.5;
      crit = true;
    }

    let dmg = dmg_scale*(pow - def);
    [ d_hp, dmg ] = dealDamage(dmg, d_hp, d.stats.maxhp);
    d_dmg = (dmg > 0);

    if (a.hasSkill("vampiric"))
    {
      let heal = - Math.floor(dmg/2);
      [ a_hp, heal ] = dealDamage(heal, a_hp, a.stats.maxhp);
      a_dmg = ( heal > 0 );
    }
    // TODO: non-lethal recoil
  }
  else
    miss = true;

  if (d_hp <= 0) d_hp = 0;
  if (a_hp <= 0) a_hp = 0;

  return {a_hp: a_hp,
	  d_hp: d_hp,
	  a_dmg: a_dmg,
	  d_dmg: d_dmg,
	  crit: crit,
	  miss: miss
	 };
}

function dealDamage(dmg, hp, maxhp)
{
  dmg = Math.floor(dmg);
  let new_hp = Math.max(0, Math.min( maxhp, hp - dmg ) );
  dmg = hp - new_hp;
  return [new_hp, dmg];
}


const AFTER_BATTLE_DELAY = 1000;
const PANELS =
  {
    HEALTH: {HEIGHT: 60},
    STATS: {HEIGHT: 100, WIDTH:100},
    fish:4
  };
const WINDOW = {X: 512, Y:384 - PANELS.HEALTH.HEIGHT - PANELS.STATS.HEIGHT + 10};

export class BattleInfo
{
  constructor(u, sprite, g)
  {
    this.canAttack = false;
    this.sprite = sprite;
    this.name = u.name;
    this.atks = 0;
    this.hits = 0;
    this.crts = 0;
    this.stats = {};

    for (let s of [ "maxhp","hp","atk","spd","skl","def","con","mov" ])
    {
      this.stats[s] = u.stats[s]; // + bonuses[s] TODO
    }

    this.stats["hit"] = this.stats.skl*2;
    this.stats["avd"] = this.stats.spd*0.5;
    this.stats["crt"] = this.stats.skl;
    this.stats["ddg"] = (this.stats.spd + this.stats.skl)*0.5;

    this.skills = new Set();
    // for (let eff of u.(class or personal skills) )

    // WEAPON
    let weap = u.getWeapon();
    this.weapon = weap;
    this.stats.atk += weap.pow;
    this.stats.hit += weap.hit;
    this.stats.crt += weap.crt;
    for (let eff of weap.effects)
      this.skills.add(eff);

    // TERRAIN
    let tile = g.Map.getTile(u).tile;
    switch (tile)
    {
    case TILES.TREE:
	this.stats.avd += 20;
	break;
    }
  }
  effHit(d)
  {
    return this.stats.hit - d.stats.avd;
  }
  effCrt(d)
  {
    return this.stats.crt - d.stats.ddg;
  }
 
  dispHit(d)
  {
    let e = this.effHit(d);
    e =  Math.min( Math.max(0, e), 100);
    if (e > 50)
      e = Math.floor(e);
    else
      e = Math.ceil(e);
    return e;
  }

  dispCrt(d)
  {
    let e = this.effCrt(d);
    e =  Math.min( Math.max(0, e), 100);
    if (e > 50)
      e = Math.floor(e);
    else
      e = Math.ceil(e);
    return e;
  }

  hasSkill(skill)
  {
    return this.skills.has(skill);
  }


}

class BattlePair
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
  explicitDraw(g)
  {
    this.a.explicitDraw(g);
    this.d.explicitDraw(g);
  }
}

// battle sprites should have frames with dimension 64x64
//
//



const HEALTHTEXT_XL = 40;
const HEALTHTEXT_XR = WINDOW.X/2 + 40;
const HEALTHTEXT_Y = 382 - PANELS.HEALTH.HEIGHT/2 + 1;

export class Battle
{
  constructor(g, initiator, defender, music)
  {
    this.g = g;
    this.music = music;
    this.state = FIGHT;

    this.speech = []
    this.speechIdx = 0;
    this.speechName = null;
    this.speechArt = null;
    this.speechEnd = null;

    this.units = {atk: initiator,
		  def: defender};


    this.sprIni = new UnitBattleSprite(initiator, "atk", g, 100, 100);

    this.sprDef = new UnitBattleSprite(defender, "def", g, 100,100);
    
    this.healthPanels = new BattlePair(
			  new Panel(0, g.windowy - PANELS.HEALTH.HEIGHT,
				    g.windowx/2, PANELS.HEALTH.HEIGHT),
			  new Panel(g.windowx/2, g.windowy - PANELS.HEALTH.HEIGHT,
				    g.windowx/2, PANELS.HEALTH.HEIGHT) );

    this.statPanels = this.initStatPanels();

    this.commentPanel = new Panel(PANELS.STATS.WIDTH, g.windowy - PANELS.HEALTH.HEIGHT-PANELS.STATS.HEIGHT,
				  g.windowx - 2*PANELS.STATS.WIDTH, PANELS.STATS.HEIGHT),
    this.speechPanel = new Panel(PANELS.STATS.WIDTH + 45, g.windowy - PANELS.HEALTH.HEIGHT-PANELS.STATS.HEIGHT + 25,
				  g.windowx - 2*PANELS.STATS.WIDTH + 15, PANELS.STATS.HEIGHT + 15),
    this.speechPanel.createComponent(PanelType.TEXT, "", "text", 0, 0, "black", "13.25px ABCD Mono");
    let t = this.speechPanel.components.text;
    t.x += 8;
    t.y += 4;

    this.info = { atk: new BattleInfo(initiator, this.sprIni, g),
		  def: new BattleInfo(defender, this.sprDef, g),
		  rounds: 0
		};
    this.turns = new BattleQueue();
    this.dead = null;
    this.deadSpr = null;

    this.initTurns();

    this.loaded = new Promise( async (res) => {

      await this.sprIni.load();
      await this.sprDef.load();
      this.sprIni.setAnimation("idle");
      this.sprDef.setAnimation("idle");
      res();
    });

  }
  initStatPanels()
  {
    let a_statp = new Panel(
	0, this.g.windowy - PANELS.HEALTH.HEIGHT-PANELS.STATS.HEIGHT,
	PANELS.STATS.WIDTH, PANELS.STATS.HEIGHT, 2, 3);

    let d_statp = new Panel(
	this.g.windowx-PANELS.STATS.WIDTH, this.g.windowy-PANELS.HEALTH.HEIGHT-PANELS.STATS.HEIGHT,
	PANELS.STATS.WIDTH, PANELS.STATS.HEIGHT, 2, 3);

    a_statp.addComponent( new PanelComponent(PanelType.TEXT, "DMG"), "dmg", 0, 0,
	    "#000000", "11px ABCD Mono",  "left");
    a_statp.addComponent( new PanelComponent(PanelType.TEXT, "HIT"), "hit", 0, 1,
	    "#000000", "11px ABCD Mono",  "left");
    a_statp.addComponent( new PanelComponent(PanelType.TEXT, "CRT"), "crt", 0, 2,
	    "#000000", "11px ABCD Mono",  "left");

    d_statp.addComponent( new PanelComponent(PanelType.TEXT, "DMG"), "dmg", 0, 0,
	    "#000000", "11px ABCD Mono",  "left");
    d_statp.addComponent( new PanelComponent(PanelType.TEXT, "HIT"), "hit", 0, 1,
	    "#000000", "11px ABCD Mono",  "left");
    d_statp.addComponent( new PanelComponent(PanelType.TEXT, "CRT"), "crt", 0, 2,
	    "#000000", "11px ABCD Mono",  "left");

    a_statp.addComponent( new PanelComponent(PanelType.TEXT, "---"), "dmgv", 1, 0,
	    "#000000", "11px ABCD Mono",  "left");
    a_statp.addComponent( new PanelComponent(PanelType.TEXT, "---"), "hitv", 1, 1,
	    "#000000", "11px ABCD Mono",  "left");
    a_statp.addComponent( new PanelComponent(PanelType.TEXT, "---"), "crtv", 1, 2,
	    "#000000", "11px ABCD Mono",  "left");
    
    d_statp.addComponent( new PanelComponent(PanelType.TEXT, "---"), "dmgv", 1, 0,
	    "#000000", "11px ABCD Mono",  "left");
    d_statp.addComponent( new PanelComponent(PanelType.TEXT, "---"), "hitv", 1, 1,
	    "#000000", "11px ABCD Mono",  "left");
    d_statp.addComponent( new PanelComponent(PanelType.TEXT, "---"), "crtv", 1, 2,
	    "#000000", "11px ABCD Mono",  "left");

    return new BattlePair(a_statp, d_statp);

  }
  initTurns()
  {
    this.info.atk.canAttack = true;
    this.info.def.canAttack = true;
    let aAtks = 1;
    let dAtks = 1;

    this.oneAttack(this.sprIni, this.info.atk);
    this.oneAttack(this.sprDef, this.info.def);

    if (this.info.atk.stats.spd > this.info.def.stats.spd)
      this.oneAttack(this.sprIni, this.info.atk);
    else if (this.info.atk.stats.spd < this.info.def.stats.spd)
      this.oneAttack(this.sprDef, this.info.def);
  }
  oneAttack(who, info)
  {
    if (info.weapon.name == "No Weapon")
      return;
    this.addTurn(who);
    if (info.hasSkill("brave"))
      this.addTurn(who);
  }
  addTurn(who)
  {
    if (who.id == "atk")
    {
      this.turns.enqueue(new BattlePair(this.info.atk, this.info.def));
    }
    else
    {
      this.turns.enqueue(new BattlePair(this.info.def, this.info.atk));
    }
  }
  
  async executeAction()
  {
    let btl = this.turns.dequeue();
    let atkr = btl.a;
    let defr = btl.d;
    
    await atkr.sprite.moveCloser(defr.sprite, this);
    
    // damage here, and remove await on knockback
    let res = attack(atkr, defr, this.turns);
    let a_hp = res.a_hp;
    let d_hp = res.d_hp;
    
    let a_animDone = new Promise( resolve =>
    {
      if (res.crit)
	atkr.sprite.setAnimation("crt", resolve);
      else
	atkr.sprite.setAnimation("hit", resolve);
    });
    
    await atkr.sprite.onHit(async (done) =>
      {

	let knock = false;
	let a_drain = this.lifeDrain(atkr, a_hp);
	let d_drain = this.lifeDrain(defr, d_hp);
	if (res.miss)
	  MusicPlayer.play("FX_miss");
	else
	{
	  knock = this.knockBack(defr);
	  if (res.d_dmg)
	  {
	    MusicPlayer.play(atkr.sprite.ws.sfx);
	    if (res.crit)
	      MusicPlayer.play("FX_crit");
	  }
	  else// 0 damage dealt
	    MusicPlayer.play("FX_clink");
	}

	await Promise.all([knock, a_drain, d_drain, a_animDone]);
	done();
      }
    );
    
    let battleOver = false;

    for (let id of ["atk", "def"])
    {
      if (this.info[id].stats.hp == 0)
      {
	// only play this once
	if (battleOver == false)
	  MusicPlayer.play("FX_unitdeath");
	this.dead = this.units[id];
	this.deadSpr = this.info[id];
	battleOver = true;
      }
    }
    if (battleOver)
      this.turns.clear();
    

    await waitTime(500);
    
  }
  
  lifeDrain(target, finalAmount)
  {
    return new Promise( async (resolve)=>
      {
	if (finalAmount < target.stats.hp)
	{
	  while (target.stats.hp > finalAmount)
	  {
	    --target.stats.hp;
	    await waitTick();
	  }
	}
	else if (finalAmount > target.stats.hp)
	{
	  while (target.stats.hp < finalAmount)
	  {
	    ++target.stats.hp;
	    await waitTick();
	  }
	}
	target.stats.hp = finalAmount;
	resolve();
      }
    );
  }
  
  


  knockBack(target)
  {
    return new Promise( async (resolve)=>
      {
	for (let i = 4; i > 0; --i)
	{
	  target.sprite.x -= i/2;
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
  setStatPanels()
  {
    let ai = this.info.atk;
    let di = this.info.def;

    if (ai.canAttack)
    {
      let p = this.statPanels.a;
      p.setComponentData("dmgv", ai.stats.atk - di.stats.def);
      p.setComponentData("hitv", ai.dispHit(di));
      p.setComponentData("crtv", ai.dispCrt(di));
      p.explicitDraw(this.g);
    }
    if (di.canAttack)
    {
      let p = this.statPanels.d;
      p.setComponentData("dmgv", di.stats.atk - ai.stats.def);
      p.setComponentData("hitv", di.dispHit(ai));
      p.setComponentData("crtv", di.dispCrt(ai));
      p.explicitDraw(this.g);
    }
  }
  drawHealthBars(g)
  {
    g.Album.drawHealthBar(5, this.info.atk.stats.hp/this.info.atk.stats.maxhp,
      48	     , 382 - PANELS.HEALTH.HEIGHT/2);
    g.Album.drawHealthBar(5, this.info.def.stats.hp/this.info.def.stats.maxhp,
      WINDOW.X/2 + 48, 382 - PANELS.HEALTH.HEIGHT/2);

    g.setTextProperty(5, "#000000", "11px ABCD Mono",  "right");
    g.drawText(5, this.info.atk.stats.hp, HEALTHTEXT_XL, HEALTHTEXT_Y);
    g.drawText(5, this.info.def.stats.hp, HEALTHTEXT_XR, HEALTHTEXT_Y);
  }
  drawStatics(g)
  {
    g.ctx[0].fillStyle = "#000000";
    g.ctx[0].fillRect( 0, WINDOW.Y, WINDOW.X, 384);
    g.Album.draw(0, "B_backdrop", 0, 0, WINDOW.X, WINDOW.Y);

    this.healthPanels.explicitDraw(g);
    this.statPanels.explicitDraw(g);
    this.commentPanel.explicitDraw(g);
  }
  draw(g)
  {
    this.sprDef.draw(g);
    this.sprIni.draw(g);

    if (this.state == FIGHT)
    {
      this.drawHealthBars(g);
    }
  }
  select()
  {
    if (this.state == SPEECH)
    {
      ++ this.speechIdx;
      if (this.speechIdx >= this.speech.length)
	this.speechEnd();
      else
      {
	this.drawSpeech();
      }
    }

  }
  arrows(a)
  {
  }
  cancel()
  {
  }
  inform()
  {
  }
  drawSpeech()
  {
    this.g.ctx[4].fillStyle = "black";
    this.g.ctx[4].fillRect(0, this.g.windowy-PANELS.HEALTH.HEIGHT-PANELS.STATS.HEIGHT,
			512, PANELS.HEALTH.HEIGHT + PANELS.STATS.HEIGHT);


    this.speechPanel.setComponentData("text", this.speech[this.speechIdx]);

    this.speechPanel.explicitDraw(this.g);
    let w = 64*1.5;

    this.g.drawImage(4, this.speechArt, 20 , 250, w, w);



  }
  async beginSpeech(speechEnd)
  {
    this.speechEnd = speechEnd;
    this.drawSpeech();
  }
  async begin(Return)
  {
    this.Return = Return;

    await this.loaded;

    MusicPlayer.play(this.music);
    this.drawStatics(this.g);
    
    // fight each other
    while(this.turns.nonempty())
    {
      this.setStatPanels();
      await this.executeAction();
    }

    // update unit hp
    for (let id of ["atk", "def"])
    {
      this.units[id].stats.hp = this.info[id].stats.hp;
    }
    
    if (this.dead && this.deadSpr.sprite.deathQuote !== null)
    {
      this.speech = this.deadSpr.sprite.deathQuote;
      this.speechIdx = 0;
      this.speechName = this.dead.name;
      this.speechArt = this.dead.pArt;
      this.state = SPEECH;
      await MusicPlayer.fadestop(this.music);
      await new Promise( (resolve) => {this.beginSpeech(resolve)});
      this.state = FIGHT;
    }
    else
    {
      await waitTime(AFTER_BATTLE_DELAY);
      await MusicPlayer.fadestop(this.music);
    }
    this.end();
  }
  async end()
  {
  
    this.g.clearCtx(4);
    //return this.dead;
    this.Return();
  }

}

