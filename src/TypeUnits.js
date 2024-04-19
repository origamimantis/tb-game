'use strict';

import {Unit} from "./Unit.js";
import {Animation} from "./Animation.js";
import * as Walk from "./BattleWalkAnimation.js";

export class Bandit extends Unit
{
    constructor(stats, name = null, skills = [])
    {
	let caps =
	    { "maxhp":80,
		"atk":80,
		"spd":60,
		"skl":33,
		"def":35,
		"con":90,
		"mov":7
	    };
	super(caps, stats, name, "P_bandit", skills, Walk.walkMelee);
	
	this.addAnim("idle", new Animation( {image: this.an("bandit"), weights: [20,10,20,10], loops: true}) );
    }
}
export class Child extends Unit
{
    constructor(stats, name = null, skills = [])
    {
	let caps =
	    { "maxhp":20,
		"atk":4,
		"spd":4,
		"skl":4,
		"def":4,
		"con":4,
		"mov":7
	    };
	super(caps, stats, name, null, skills, Walk.walkMelee);
	
	this.skills.push("noncombatant");
	
	this.addAnim("idle", new Animation( {image: this.an("child"), weights: [30,30], loops: true}) );
    }
}

export class Farmer extends Unit
{
    constructor(stats, name = null, skills = [])
    {
	let caps =
	    { "maxhp":90,
		"atk":50,
		"spd":41,
		"skl":41,
		"def":55,
		"con":90,
		"mov":20
	    };
	super(caps, stats, name, null, skills, Walk.walkMelee);
	
	this.addAnim("idle", new Animation( {image: this.an(null), weights: [20,10,20,10], loops: true}) );
    }
}

export class SwordKnight extends Unit
{
    constructor(stats, name = null, skills = [])
    {
	let caps =
	    { "maxhp":60,
		"atk":30,
		"spd":30,
		"skl":30,
		"def":30,
		"con":30,
		"mov":10
	    };
	super(caps, stats, name, "P_kn", skills, Walk.walkMelee);
	
	this.addAnim("idle", new Animation( {image: this.an("kn1"), weights: [20,10,20,10], loops: true}) );
    }
}

export class BowKnight extends Unit
{
    constructor(stats, name = null, skills = [])
    {
	let caps =
	    { "maxhp":60,
		"atk":30,
		"spd":30,
		"skl":30,
		"def":30,
		"con":30,
		"mov":10
	    };
	super(caps, stats, name, "P_kn", skills, Walk.walkMelee);

	this.addAnim("idle", new Animation( {image: this.an("kn4"), weights: [20,10,20,10], loops: true}) );
    }
}


export class MageKnight extends Unit
{
    constructor(stats, name = null, skills = [])
    {
	let caps =
	    { "maxhp":60,
		"atk":30,
		"spd":30,
		"skl":30,
		"def":30,
		"con":30,
		"mov":10
	    };
	super(caps, stats, name, "P_kn", skills, Walk.walkMelee);

	this.addAnim("idle", new Animation( {image: this.an("kn0"), weights: [20,10,20,10], loops: true}) );
    }
}



export class Vampire extends Unit
{
    constructor(stats, name = null, skills = [])
    {
	let caps =
	    { "maxhp":80,
		"atk":40,
		"spd":45,
		"skl":28,
		"def":25,
		"con":30,
		"mov":12
	    };
	super(caps, stats, name, "P_vmp", skills, Walk.walkMelee);

	this.addAnim("idle", new Animation( {image: this.an("vmp0"), weights: [20,10,20,10], loops:true} ) );
    }
}
