'use strict';

import {Unit} from "./Unit.js";
import {Animation} from "./Animation.js";

class Leader extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
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
	super( g, id, x, y, caps, stats, name, classname, "P_lead");
	this.addAnim(0, new Animation( g, "S_lead1", [20,10,20,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}


class SwordKnight extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
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
	super( g, id, x, y, caps, stats, name, classname, "P_kn");
	this.addAnim(0, new Animation( g, "S_kn1", [20,10,20,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}
class BowKnight extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
    {
	let caps =
	    { "maxhp":60,
		"atk":30,
		"spd":36,
		"skl":30,
		"def":30,
		"con":30,
		"mov":10
	    };
	let classname = "Bow Knight";
	super( g, id, x, y, caps, stats, name, classname, "P_kn");
	this.addAnim(0, new Animation( g, "S_kn4", [20,10,20,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}

class LanceKnight extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
    {
	let caps =
	    { "maxhp":60,
		"atk":40,
		"spd":30,
		"skl":27,
		"def":30,
		"con":30,
		"mov":10
	    };
	let classname = "Lance Knight";
	super( g, id, x, y, caps, stats, name, classname, "P_kn");
	this.addAnim(0, new Animation( g, "S_kn0", [20,10,20,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}

class Janitor extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
    {
	let caps =
	    { "maxhp":85,
		"atk":60,
		"spd":10,
		"skl":55,
		"def":30,
		"con":60,
		"mov":12
	    };
	let classname = "Janitor";
	super( g, id, x, y, caps, stats, name, classname, "P_kn");
	this.addAnim(0, new Animation( g, "S_kn0", [20,10,20,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}



class AxeKnight extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
    {
	let caps =
	    { "maxhp":60,
		"atk":45,
		"spd":20,
		"skl":20,
		"def":35,
		"con":25,
		"mov":10
	    };
	let classname = "Axe Knight";
	super( g, id, x, y, caps, stats, name, classname, "P_kn");
	this.addAnim(0, new Animation( g, "S_kn2", [20,10,20,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}

class HeavySwordKnight extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
    {
	let caps =
	    { "maxhp":80,
		"atk":30,
		"spd":25,
		"skl":28,
		"def":60,
		"con":60,
		"mov":8
	    };
	let classname = "Sword Knight";
	super( g, id, x, y, caps, stats, name, classname, "P_kna");
	this.addAnim(0, new Animation( g, "S_kna0", [20,10,20,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}


class Vampire extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
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
	super( g, id, x, y, caps, stats, name, classname, "P_vmp");
	this.addAnim(0, new Animation( g, "S_vmp0", [20,10,20,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}



class Horseman extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
    {
	let caps =
	    { "maxhp":45,
		"atk":20,
		"spd":45,
		"skl":30,
		"def":20,
		"con":20,
		"mov":20
	    };
	let classname = "Horseman";
	super( g, id, x, y, caps, stats, name, classname, "P_kn");
	this.addAnim(0, new Animation( g, "S_knh0", [10,10,10,10,10,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}


class Cavalier extends Unit
{
    constructor(g, id, x,y, stats, name = "Unit "+id)
    {
	let caps =
	    { "maxhp":50,
		"atk":26,
		"spd":38,
		"skl":38,
		"def":24,
		"con":24,
		"mov":25
	    };
	let classname = "Cavalier";
	super( g, id, x, y, caps, stats, name, classname, "P_kn");
	this.addAnim(0, new Animation( g, "S_knh0", [10,10,10,10,10,10], true) );
	this.turnInit();
	this.g.addUnit(this);
    }
}




let Units =
{
    "SwordKnight": SwordKnight,
    "LanceKnight"  : LanceKnight  ,
    "AxeKnight"  : AxeKnight  ,
    "BowKnight"  : BowKnight  ,
    "HeavySwordKnight": HeavySwordKnight,
    "Vampire": Vampire,
    "Horseman": Horseman,
    "Cavalier": Cavalier,
    "Janitor": Janitor,






    "Leader":Leader
}
export {Units};
