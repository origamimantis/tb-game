

class Queue
{
  constructor()
  {
    this.h = null;
    this.t = null;
    this.sz = 0;
  }
  enqueue(val)
  {
    if (this.sz > 0)
    {
      this.t.n = {v: val, n: null};
      this.t = this.t.n;
    }
    else
    {
      this.t = {v: val, n: null};
      this.h = this.t;
    }
    ++ this.sz;
  }
  dequeue()
  {
    if (this.sz > 0)
    {
      let v = this.h.v;
      this.h = this.h.n;
      -- this.sz;
      return v;
    }
    else
    {
      throw "Attempted to dequeue an empty queue.";
    }
  }
  front()
  {
    return this.h.v;
  }
  nonempty()
  {
    return this.sz > 0;
  }
  empty()
  {
    return this.sz <= 0;
  }
  size()
  {
    return this.sz;
  }
}



export {Queue};
