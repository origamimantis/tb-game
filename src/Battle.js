'use strict';

const DELAY = 1500;
const CRITMULT = 3;



const SWEEP_BONUS_HIT = 12;
const SWEEP_BONUS_CRT = 7;

// changed sweeper to grow more powerful by turn, not by unit attack

class Battle
{
    constructor(g)
    {
	this.g = g;
	this.dist;
	this.dcancounter;
	this.order = [];
	this.units = { "a":null, "d":null};
	this.stats = { "a":{"hits":0, "attacks":0, "weap":null}  ,
	               "d":{"hits":0, "attacks":0, "weap":null}  };
	this.prevA = null;
	this.log = "";
	this.turns = 0;
    }
    
    
    fight( attacker, defender )
    {
	this.dist = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);
	this.log = "";
        this.g.inBattle = true;
        this.g.cursor.visible = false;
        this.g.takingInput = false;
	this.units["a"] = attacker;
	this.units["d"] = defender;
	
	this.stats["a"].weap = attacker.curWeap();
	this.stats["d"].weap = defender.curWeap();
	
	this.dcancounter = this.checkRange();
	
	this.units["a"].inCombat = true;
	this.units["d"].inCombat = true;

	this.calcStats();
        //console.log(attacker, defender);
        this.setOrder()
	// loop
	setTimeout(()=>{this._oneAction();}, DELAY/2);

    }
    checkRange()
    {
	let dr = this.stats["d"].weap.range;
	return ( this.dist >= dr.min && this.dist <= dr.max);
    }
    setOrder()
    {
	this.addatkA();
	this.addatkD();
        let sdiff = this.stats["a"].spd - this.stats["d"].spd;
        if      (sdiff > 0) { this.addatkA(); }
        else if (sdiff < 0) { this.addatkD(); }
    }
    addatkA()
    {
	if (this.stats["a"].weap.hasEffect("brave"))
	{
	    this.order.push("a");
	    this.order.push("a");
	}
	else
	{
	    this.order.push("a");
	}
    }
    addatkD()
    {
	if (this.stats["d"].weap.hasEffect("brave"))
	{
	    this.order.push("d");
	    this.order.push("d");
	}
	else
	{
	    this.order.push("d");
	}
    }
    invalid( u )
    {
	let noweapuses = this.stats[u].weap.uses <= 0;
	let dcantcounter = (u == "d" && !this.dcancounter);
	return (noweapuses || dcantcounter);

    }

    /////// TODO sometime:  have this.whack return  a duration that is used by the settimeout loops
    ///////                 this will give time for text boxes to appear
    _oneAction()
    {
	//retrieve next unit capable of attacking
	let u;
	//do { u = this.order.shift(); }                            // u == "d" -> d can counter
	do { u = this.order.shift();}
	
	// while ( u is defined and invalid for attacking )
	while (u != undefined && this.invalid( u ) )
	
	// let current unit attack
	if ( u != undefined)
	{   this.whack(u); }
	// wack things for this.conclude(); this is for consistent timings.
	else
	{   this.conclude(); return; }
	
	// if a unit died, end the battle
	let unitDied = this.killUnit();
	if (unitDied)
	{   setTimeout(()=>{this.conclude(unitDied);},DELAY*2); return; }

	// if there's more turns to be taken, time the next iteration
	setTimeout(()=>{
	if (this.order.length)
	{   setTimeout(()=>{this._oneAction();},DELAY/2); }

	// otherwise end the battle.
	else
	{   setTimeout(()=>{this.conclude();},DELAY/2); return; }
	}, DELAY/2);
    }

    whack( i )
    {
	if      (i == "a")
	{
	    this._whack("a","d");
	}
        else if (i == "d" && this.dcancounter)
	{
	    this._whack("d","a");
	}
        this.g.profileShown = false;

    }
    
    _whack(a, d)
    {
	this.log = this.units[a].name+" attacks.\n";

	//calcs hit, crt for next iteration
	setTimeout(()=>{this.calcHit();},DELAY/3);
	setTimeout(()=>{this.log = "";}, DELAY/3);

	let hitrn = this.g.RNG.get();
	let crtrn = this.g.RNG.get();
	console.log("HitRN = " + hitrn + "  " + "CritRN = " + crtrn);
/*SKIL*/if ( this.stats[a].weap.hasEffect("starnova") && this.g.RNG.get() <= this.stats[a].skl)
	{
	    for (let i = 0; i <  4; i++)
	    {this.order.unshift(a);}
	    this.log += "Activated Starnova!\n";
	}
	

	if (hitrn < this.stats[a].hit)
	{
	    let pow = this.stats[a].atk;
	    let def = this.stats[d].def;
	    
/*SKILL*/   if ( this.stats[a].weap.hasEffect("crescent") && this.g.RNG.get() <= this.stats[a].spd)
	    {   
		def = 0;
		this.log += "Activated Crescent!\n";
	    }

    
	    
	    let basedmg = Math.max(0, pow - def);
	    
	    let crit = false;
	    //crit multiplies dmg, not pow. sets min dmg = 1
/*CRIT*/    if (crtrn < this.stats[a].crt)
	    {   basedmg = Math.max(1, basedmg * CRITMULT); crit = true;}

	    let dmg = Math.min(this.units[d].stats.hp, basedmg);
	    this.units[d].stats.hp = Math.max(0, this.units[d].stats.hp - dmg);
	    
	    setTimeout(()=>{
	    this.log += (crit? "A critical hit!\n":"")+basedmg + " damage dealt!";}, DELAY/3);
/*SKILL*/   if ( this.stats[a].weap.hasEffect("vampiric") )
	    {
		let steal = Math.min(dmg, this.stats[a].maxhp - this.units[a].stats.hp);
		if (steal > 0)
		{
		    this.units[a].stats.hp += steal;
		    setTimeout(()=>{
		    this.log += "\n"+this.units[a].name+" healed  "+steal+ "!";},DELAY/3);
		}
	    }

	    //use weapon
	    this.stats[a].weap.use(); 

	    //update last attacker, attack count
	    this.prevA = a;
	    this.stats[a].hits ++;
	}
	else
	{
	    setTimeout(()=>{
	    this.log = this.units[a].name + " missed!";},DELAY/3);
	}
	// visuals
	this.units[a].boop(this.units[d]);

	this.stats[a].attacks ++;
	this.turns ++;

    }
    killUnit()
    {
	for (let u of [this.units["a"], this.units["d"]])
	{
	    if (u.stats.hp <= 0)
	    {
		setTimeout(() => {
		this.log = u.name + " fell.";
		this.g.map.removeUnit(this.g.units[u.id]);
		delete this.g.units[u.id]; }, DELAY);
		return true;
	    }
	}
	return false;
    }
    calcStats()
    {
	let matchup = Math.max(-1, Math.min(1, this.stats.a.weap.matchup( this.stats.d.weap) + this.stats.a.weap.matchup( this.stats.d.weap ) ));
	// unadv reverses weapon matchups
/*SKIL*/if ( this.stats.a.weap.hasEffect("unadv"))
	{   matchup = -matchup;}
        if ( this.stats.d.weap.hasEffect("unadv"))
	{   matchup = -matchup;}
	

	for (let u of ["a","d"])
	{
	    for (let [stat, value] of Object.entries(this.units[u].stats))
	    {
		this.stats[u][stat] = value;
	    }
	    this.stats[u]["atk"] += this.stats[u].weap.pow;
	    
	    //  class statbuff { this.boost = "atk"; this.value = 3;}  grants atk +3
	    for (let [stat, value] of Object.entries(this.stats[u].weap.bonus))
	    {
		this.stats[u][stat] += value;
	    }
	    this.stats[u].basehit = this.stats[u].skl + this.stats[u].weap.hit;
	    this.stats[u].basecrt = this.stats[u].skl/2 + this.stats[u].weap.crt;
	}
	
	this.stats.a.basehit += 15*matchup;
	this.stats.a.basecrt += 10*matchup;
	this.stats.d.basehit -= 15*matchup;
	this.stats.d.basecrt -= 10*matchup;
	
	this.stats.a.hit = this.stats.a.basehit;
	this.stats.a.crt = this.stats.a.basecrt;
	this.stats.d.hit = this.stats.d.basehit;
	this.stats.d.crt = this.stats.d.basecrt;

	this.calcHit();
	
    }
    calcHit()
    {
	for (let u of ["a","d"])
	{
/*SKILL*/   if ( this.stats[u].weap.hasEffect("fury") )
	    {
		this.stats[u].crt=this.stats[u].basecrt + 
		    100*(1-this.units[u].stats.hp/this.stats[u].maxhp);}

    /*SKILL sweep multiplies hit by 1.2, crt by 2.0 each successive attempt*/
	    if ( this.stats[u].weap.hasEffect("sweep") && this.turns != 0 )
	    {
		this.stats[u].hit += SWEEP_BONUS_HIT;
		this.stats[u].crt += SWEEP_BONUS_CRT;
	    }
	}

    }




    conclude(ded = false)
    {
	let timer = 0;
	if (!ded)
	{
	    this.log = "";
	    timer = DELAY;
	}
	setTimeout(()=>
	{
	    this.turns = 0;
	    this.units["a"].inCombat = false;
	    this.units["a"].wait();
	    this.units["d"].inCombat = false;
	    this.order = [];
	    this.units = { "a":null, "d":null};
	    this.stats = { "a":{"hits":0, "attacks":0, "weap":null}  ,
			   "d":{"hits":0, "attacks":0, "weap":null}  };
	    this.prevA = null;
	    this.g.inBattle = false;
	    this.g.mode = "idle";
	    this.g.takingInput = true;
	    this.g.cursor.visible = true;
	    this.g.profileShown = false;
	    
	    this.g.music.fadestop(this.g.btltheme, 500);
	    setTimeout(()=>{
		this.g.music.fadein(this.g.maptheme, 2000); }, 500);

	}, timer);
    }


}

export {Battle};
