'use strict';

import {Unit} from "./Unit.js";
import {Animation} from "./Animation.js";
import * as Walk from "./BattleWalkAnimation.js";


export class Bandit extends Unit
{
  // TODO name = null, and in Unit if name === null name = classname
    constructor(id, x,y, stats, name = "Unit "+id, skills = [])
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
	let classname = "Bandit";
	super( id, x, y, caps, stats, name, classname, "P_bandit", skills, Walk.walkMelee);
	
	this.addAnim("idle", new Animation( {image: "S_bandit", weights: [20,10,20,10], loops: true}) );
	this.addAnim("wait", new Animation( {image: "S_bandit_wait", weights: [1,1,1,1], loops: false}) );
    }
}
export class Child extends Unit
{
    constructor(id, x,y, stats, name = "Unit "+id, skills = [])
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
	let classname = "Child";
	super( id, x, y, caps, stats, name, classname, "P_gen", skills, Walk.walkMelee);
	
	this.skills.push("noncombatant");
	
	this.addAnim("idle", new Animation( {image: "S_child", weights: [30,30], loops: true}) );
	this.addAnim("wait", new Animation( {image: "S_child_wait", weights: [1,1], loops: false}) );
    }
}

export class Farmer extends Unit
{
    constructor(id, x,y, stats, name = "Unit "+id, skills = [])
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
	let classname = "Farmer";
	super( id, x, y, caps, stats, name, classname, "P_gen", skills, Walk.walkMelee);
	
	this.addAnim("idle", new Animation( {image: "S_farmer"+name, weights: [20,10,20,10], loops: true}) );
	this.addAnim("wait", new Animation( {image: "S_farmer"+name +"_wait", weights: [1,1,1,1], loops: false}) );
    }
}

export class Leader extends Unit
{
    constructor(id, x,y, stats, name = "Unit "+id, skills = [])
    {
	let caps =
	    { "maxhp":90,
		"atk":64,
		"spd":56,
		"skl":70,
		"def":64,
		"con":90,
		"mov":20
	    };
	let classname = "Sword Knight";
	super( id, x, y, caps, stats, name, classname, "P_lead");
	this.addAnim(0, new Animation( "S_lead1", [20,10,20,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}


export class SwordKnight extends Unit
{
    constructor(id, x,y, stats, name = "Unit "+id, anim = "S_kn1", skills = [])
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
	let classname = "Sword Knight";
	super( id, x, y, caps, stats, name, classname, "P_kn", skills, Walk.walkMelee);
	
	this.addAnim("idle", new Animation( {image: anim, weights: [20,10,20,10], loops: true}) );
	this.addAnim("wait", new Animation( {image: anim + "_wait", weights: [100,100,100,100], loops: false}) );
    }
}

export class BowKnight extends Unit
{
    constructor(id, x,y, stats, name = "kn", anim = null, skills = [])
    {
        if (anim == null)
	{
	    if (name == "kn")
		anim = "S_kn4"
	    else
	        anim = "S_" + name + "_BowKnight"
	}
	let caps =
	    { "maxhp":60,
		"atk":30,
		"spd":30,
		"skl":30,
		"def":30,
		"con":30,
		"mov":10
	    };
	let classname = "Bow Knight";
	super( id, x, y, caps, stats, name, classname, "P_" + name, skills, Walk.walkMelee);

        if (name == "kn")
            name = classname
	
	this.addAnim("idle", new Animation( {image: anim, weights: [20,10,20,10], loops: true}) );
	this.addAnim("wait", new Animation( {image: anim + "_wait", weights: [100,100,100,100], loops: false}) );
    }
}


export class Vampire extends Unit
{
    constructor(id, x,y, stats, name = "Unit "+id, skills = [])
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
	let classname = "Vampire";
	super( id, x, y, caps, stats, name, classname, "P_vmp", skills, Walk.walkMelee);

	this.addAnim("idle", new Animation( {image: "S_vmp0", weights: [20,10,20,10], loops:true} ) );
	this.addAnim("wait", new Animation( {image: "S_vmp0_wait", weights: [100,100,100,100], loops:false} ) );
	//this.addAnim(0, new Animation( "S_vmp0", [20,10,20,10], true) );
    }
}
