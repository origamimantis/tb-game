

class Queue
{
  constructor()
  {
    this.h = null;
    this.t = null;
    this.size = 0;
  }
  enqueue(val)
  {
    if (this.size > 0)
    {
      this.t.n = {v: val, n: null};
      this.t = this.t.n;
    }
    else
    {
      this.t = {v: val, n: null};
      this.h = this.t;
    }
    ++ this.size;
  }
  dequeue()
  {
    if (this.size > 0)
    {
      let v = this.h.v;
      this.h = this.h.n;
      -- this.size;
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
}



export {Queue};
