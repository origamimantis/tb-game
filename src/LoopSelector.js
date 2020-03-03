'use strict';

export class LoopSelector
{
    constructor(list = [0], index = 0)
    {
	this.list = list;
	this.length = list.length;
	this.idx = index;
    }
    _d(delt)
    {
	//ensure positive modulus
	this.idx = ( this.length + this.idx + delt ) % this.length;
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

export class QueueSelector
{
    constructor(q)
    {
	this.queue = q;
	this.length = q.size;
	this.cur = q.h;
    }
    next()
    {
      this.cur = this.cur.n;
      if (this.cur == null)
      {
	this.cur = this.queue.h;
      }
    }
    prev()
    {
      this.cur = this.cur.p;
      if (this.cur == null)
      {
	this.cur = this.queue.t;
      }
    }
    get()
    {
	return this.cur.v;
    }
    reset()
    {
	this.cur = this.queue.h;
    }
}
