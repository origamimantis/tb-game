

class DrawContainer
{
  constructor()
  {
    this.stuff = {};
    this.hidden= {};
  }
  get(id)
  {
    if (this.stuff[id] == undefined)
    {
      return this.hidden[id];
    }
    return this.stuff[id];
  }
  set(id, val)
  {
    this.stuff[id] = val;
  }
  del(id)
  {
    delete this.stuff[id];
  }
  draw( g )
  {
    for (let thing of Object.values(this.stuff))
    {
      thing.draw( g );
    }
  }
  hide( id )
  {
    this.hidden[id] = this.stuff[id];
    delete this.stuff[id];
  }
  show( id )
  {
    this.stuff[id] = this.hidden[id];
    delete this.hidden[id];
  }

}


export {DrawContainer};
