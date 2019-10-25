'use strict';

const T = 2000;

class Tester
{
    constructor(g) {this.g = g; this.enabled=true; this.count = 0;}
    
    _action()
    {
	if(!this.g.inBattle)
	{
	    if (this.count%2 == 0)
	    {
		this.g.fight(this.g.units[0], this.g.units[1]);
	    }
	    else
	    {
		this.g.fight(this.g.units[1], this.g.units[0]);

	    }

	}



    }
    action()
    {
	if (!this.g.test || !this.enabled) {return;}
	this.enabled = false;
	this._action();
	this.count ++;
	setTimeout( () => {this.enabled = true;}, T );
    }
}



export {Tester};
