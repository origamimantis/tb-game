'useStrict';

class LoopSelector
{
    constructor(list = [0], index = 0)
    {
	this.list = list.slice(0);
	this.len = list.length;
	this.idx = index;
    }
    _d(delt)
    {
	//ensure positive modulus
	this.idx = ( this.len + this.idx + delt ) % this.len;
    }
    next()
    {
	this._d(1);
    }
    prev()
    {
	this._d(-1);
    }
    get()
    {
	return this.list[this.idx];
    }
    reset()
    {
	this.idx = 0;
    }
}


export {LoopSelector};
