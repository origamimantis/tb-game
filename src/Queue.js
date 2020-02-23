

export class Queue
{
  constructor()
  {
    this.h = null;
    this.t = null;
    this.c_x = {};
    this.sz = 0;
  }
  push(c, val = true)
  {
    this.enqueue(c, val);
  }
  enqueue(c, val = true)
  {
    if (val == undefined)
    {
      throw "Cannot set a value of undefined";
    }
    else if (this.c_x[c.x] == undefined)
    {
      this.c_x[c.x] = {};
    }
    if (this.c_x[c.x][c.y] == undefined)
    {
      this.c_x[c.x][c.y] = {v: undefined, ct : 0};
    }
    this.c_x[c.x][c.y].v = val;
    ++this.c_x[c.x][c.y].ct;

    if (this.sz > 0)
    {
      this.t.n = {v: c, p: this.t, n: null};
      this.t = this.t.n;
    }
    else
    {
      this.t = {v: c, p: null, n: null};
      this.h = this.t;
    }
    ++ this.sz;
  }
  dequeue()
  {
    if (this.sz > 0)
    {

      let v = this.h.v;

      if (this.c_x[v.x][v.y].ct <= 1)
      {
	delete this.c_x[v.x][v.y];
      }
      else
      {
	--this.c_x[v.x][v.y].ct;
	this.c_x[v.x][v.y].v = undefined;
      }


      this.h = this.h.n;
      if (this.h != null)
      {
	this.h.p = null;
      }
      else
      {
	this.t = null;
      }
      -- this.sz;
      return v;
    }
    else
    {
      throw "Attempted to dequeue an empty queue.";
    }
  }
  pop()
  {
    if (this.sz > 0)
    {
      let v = this.t.v;

      if (this.c_x[v.x][v.y].ct <= 1)
      {
	delete this.c_x[v.x][v.y];
      }
      else
      {
	--this.c_x[v.x][v.y].ct;
	this.c_x[v.x][v.y].v = undefined;
      }

      this.t = this.t.p;
      if (this.t != null)
      {
	this.t.n = null;
      }
      -- this.sz;
      return v;
    }
    else
    {
      throw "Attempted to dequeue an empty queue.";
    }
  }
  get(c)
  {
    if (this.c_x[c.x] == undefined)
    {
      return undefined;
    }
    return this.c_x[c.x][c.y].v;
  }
  
  count(c)
  {
    if (this.c_x[c.x] == undefined || this.c_x[c.x][c.y] == undefined)
      {
	return 0;
      }
    return this.c_x[c.x][c.y].ct;
  }
  contains(c)
  {
    if (this.c_x[c.x] == undefined || this.c_x[c.x][c.y] == undefined)
    {
      return false;
    }
    return true;
  }
  doesNotContain(c)
  {
    return this.contains(c) == false;
  }


  front()
  {
    if (this.h == null)
    {
      return undefined;
    }
    return this.h.v;
  }
  last()
  {
    if (this.t == null)
    {
      return undefined;
    }
    return this.t.v;
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
  forEach( f )
  {
    let cur = this.h;
    while (cur != null)
    {
      f(cur.v);
      cur = cur.n;
    }
  }
  
  intersect(q)
  {
    let smol = this;
    let other = q;
    if (q.size() < this.sz)
    {
      smol = q;
      other = this;
    }
    for (let c of smol)
    {
      if (other.contains(c))
      {
	return true;
      }
    }
    return false;

  }
  consume(q)
  {
    this.h = q.h;
    this.t = q.t;
    this.c_x = q.c_x;
    this.sz = q.sz;
  }
  
  *[Symbol.iterator]()
  {
    let cur = this.h;
    while (cur != null)
    {
      yield cur.v;
      cur = cur.n;
    }
  }
  iter()
  {
    return new QueueIterator(this);
  }
  log()
  {
    let c = this.h;
    while (c != null)
    {
      console.log(c.v);
      c = c.n;
    }
  }
}

// actually only a forward iterator
class QueueIterator
{
  constructor(q)
  {
    this._cur = q.h;
    this._left = q.sz;
  }
  val()
  {
    return this._cur.v;
  }
  next()
  {
    if (this._cur == null)
    {
      throw "End.";
    }
    this._cur = this._cur.n;
    -- this._left;
  }
  left()
  {
    return this._left;
  }
}

