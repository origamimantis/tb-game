

class DrawContainer
{
  constructor()
  {
    this.stuff = {};
  }
  get(id)
  {
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

}


export {DrawContainer};
