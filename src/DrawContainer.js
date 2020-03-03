

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
  isVisible( id )
  {
    return ( this.stuff.active[id] != undefined || this.stuff.paused[id] != undefined );
  }
  isHidden( id )
  {
    return ( this.hidden.active[id] != undefined || this.hidden.paused[id] != undefined );
  }
  isActive( id )
  {
    return ( this.stuff.active[id] != undefined || this.hidden.active[id] != undefined );
  }
  isPaused( id )
  {
    return ( this.stuff.paused[id] != undefined || this.hidden.paused[id] != undefined );
  }
  contains(id)
  {
    return (this.get(id) != undefined);
  }
  toggleVisible(id)
  {
    if (this.contains(id) == false)
    {
      throw "object not in container!";
    }
    if (this.isHidden(id) == true)
    {
      this.show(id);
    }
    else if (this.isVisible(id) == true)
    {
      this.hide(id);
    }
  }
  toggleActive(id)
  {
    if (this.contains(id) == false)
    {
      throw "object not in container!";
    }
    if (this.isPaused(id) == true)
    {
      this.resume(id);
    }
    else if (this.isActive(id) == true)
    {
      this.pause(id);
    }
  }
  forEach(f)
  {
    for (let thing of Object.values(this.stuff.active))
    {
      f(thing);
    }
    for (let thing of Object.values(this.stuff.paused))
    {
      f(thing);
    }
    for (let thing of Object.values(this.hidden.active))
    {
      f(thing);
    }
    for (let thing of Object.values(this.hidden.paused))
    {
      f(thing);
    }




  }

}


export {DrawContainer};
