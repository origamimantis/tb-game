'use strict';

/*
 * LoopSelector : a circular array with forward and backward iteration.
 *
 * constructor(Array contents, int initialIndex)
 *   creates a new LoopSelector using contents.
 *
 * next()
 *   iterates the LoopSelector forward 1 step, returning to the start
 *   if it goes too far.
 *
 * prev()
 *   iterates the LoopSelector backward 1 step, moving to the end
 *   if it goes too far.
 *
 * get()
 *   returns the current value of the LoopSelector
 *
 *
 * QueueSelector : a circular queue with forward and backward iteration.
 * Same member functions as LoopSelector.
 *
 * constructor(Queue contents, int initialIndex)
 *   creates a new QueueSelector using contents.

*/

export class LoopSelector
{
  constructor(list, index = 0)
  {
    this.list = list;
    this.length = list.length;
    this.idx = index;
    this._initIdx = index;
  }
  _d(delt)
  {
    if (this.length > 0)
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
  getIdx(i)
  {
    return this.list[i];
  }

  get()
  {
    if (this.length > 0)
      return this.list[this.idx];
    return undefined;
  }
  includes(v)
  {
    return this.list.includes(v);
  }
  reset()
  {
    this.idx = this._initIdx;
  }
  *[Symbol.iterator]()
  {
    for (let u of this.list)
    {
      yield u;
    }
  }
  deleteCurrent(toNext = false)
  {
    this.list.splice(this.idx, 1);
    --this.length;

    if (toNext == false)
      -- this.idx;

    this.idx %= this.length;
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
