'use strict';

class RNG
{
    constructor(l = null)
    {
	this.l = [];
	if (l != null && typeof l == Array)
	{
	    this.l = l.slice(0);
	}
	this.generate()
    }
    generate()
    {
	for (let i = 0; i < 20; i++)
	{
	    this.l.push(100*Math.random());
	}
    }
    get()
    {
	if (this.l.length <= 1)
	{
	    this.generate();
	}
	return this.l.shift();
    }
}



export {RNG};
