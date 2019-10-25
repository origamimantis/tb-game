'use strict';

class Range
{
    constructor (min, max = -1)
    {
	this.min = min;
	this.max = min;
	if (max > 0)
	{
	    this.max = max;
	}
    }
}

export {Range};
