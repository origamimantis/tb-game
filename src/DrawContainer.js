

class DrawContainer
{
  constructor()
  {
    this.stuff = {active:{}, paused:{}};
    this.hidden= {active:{}, paused:{}};
  }
  get(id)
  {
    if (this.stuff.active[id] != undefined)
    { return this.stuff.active[id];}

    else if (this.stuff.paused[id] != undefined)
    { return this.stuff.paused[id];}

    else if (this.hidden.active[id] != undefined)
    { return this.hidden.active[id];}

    else if (this.hidden.paused[id] != undefined)
    { return this.hidden.paused[id];}

    else
    { return undefined;}
  }
  set(id, val)
  {
    if (this.stuff.paused[id] != undefined)
    { this.stuff.paused[id] = val;}

    else if (this.hidden.active[id] != undefined)
    { this.hidden.active[id] = val;}

    else if (this.hidden.paused[id] != undefined)
    { this.hidden.paused[id] = val;}

    else
    { this.stuff.active[id] = val;}
  }
  del(id)
  {
    delete this.stuff.active[id];
    delete this.stuff.paused[id];
    delete this.hidden.active[id];
    delete this.hidden.paused[id];
  }
  draw( g )
  {
    for (let thing of Object.values(this.stuff.active))
    {
      thing.draw( g );
    }
    for (let thing of Object.values(this.stuff.paused))
    {
      thing.draw( g );
    }
  }
  hide( id )
  {
    if ( this.stuff.active[id] != undefined )
    {
      this.hidden.active[id] = this.stuff.active[id];
      delete this.stuff.active[id];
    }
    else if ( this.stuff.paused[id] != undefined )
    {
      this.hidden.paused[id] = this.stuff.paused[id];
      delete this.stuff.paused[id];
    }
    else
    {
      throw id + " cannot be hidden; it doesn't exist!";
    }
  }
  show( id )
  {
    if ( this.hidden.active[id] != undefined )
    {
      this.stuff.active[id] = this.hidden.active[id];
      delete this.hidden.active[id];
    }
    else if ( this.hidden.paused[id] != undefined )
    {
      this.stuff.paused[id] = this.stuff.paused[id];
      delete this.hidden.paused[id];
    }
    else
    {
      throw id + " cannot be shown; it doesn't exist!";
    }
  }
  resume( id )
  {
    if ( this.hidden.paused[id] != undefined )
    {
      this.hidden.active[id] = this.hidden.paused[id];
      delete this.hidden.paused[id];
    }
    else if ( this.stuff.paused[id] != undefined )
    {
      this.stuff.active[id] = this.stuff.paused[id];
      delete this.stuff.paused[id];
    }
    else
    {
      throw id + " cannot be resumed; it either doesn't exist or is already playing!";
    }
  }
  pause( id )
  {
    if ( this.hidden.active[id] != undefined )
    {
      this.hidden.paused[id] = this.hidden.active[id];
      delete this.hidden.active[id];
    }
    else if ( this.stuff.active[id] != undefined )
    {
      this.stuff.paused[id] = this.stuff.active[id];
      delete this.stuff.active[id];
    }
    else
    {
      throw id + " cannot be paused; it either doesn't exist or is already paused!";
    }
  }
  update(g)
  {
    for (let t of Object.values(this.stuff.active))
    {
      if (t.update != undefined)
      {
	t.update(g);
      }
    }
    for (let t of Object.values(this.hidden.active))
    {
      if (t.update != undefined)
      {
	t.update(g);
      }
    }
  }
  visible( id )
  {
    return ( this.stuff.active[id] != undefined || this.stuff.paused[id] != undefined );
  }
  hidden( id )
  {
    return ( this.hidden.active[id] != undefined || this.hidden.paused[id] != undefined );
  }
  active( id )
  {
    return ( this.stuff.active[id] != undefined || this.hidden.active[id] != undefined );
  }
  paused( id )
  {
    return ( this.stuff.paused[id] != undefined || this.hidden.paused[id] != undefined );
  }
}


export {DrawContainer};
