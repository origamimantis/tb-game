"use strict";
import {Album} from "./Images.js"

export class DrawContainer
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
    if (this.get(id) == undefined)
    {
      throw "Id '" + id + "' not in DrawContainer";
    }
    delete this.stuff.active[id];
    delete this.stuff.paused[id];
    delete this.hidden.active[id];
    delete this.hidden.paused[id];
  }
  delc(id)
  {
    if (this.contains(id))
    {
      this.del(id);
    }
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
  }
  hideTough( id )
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
  showTough( id )
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
  *[Symbol.iterator]()
  {
    for (let thing of Object.values(this.stuff.active))
    {
      yield thing;
    }
    for (let thing of Object.values(this.stuff.paused))
    {
      yield thing;
    }
    for (let thing of Object.values(this.hidden.active))
    {
      yield thing;
    }
    for (let thing of Object.values(this.hidden.paused))
    {
      yield thing;
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
  logActive()
  {
    for (let thing of Object.keys(this.stuff.active))
    {
      console.log(thing);
    }
    for (let thing of Object.keys(this.hidden.active))
    {
      console.log(thing);
    }
  }

}

export class UnitContainer extends DrawContainer
{
  constructor()
  {
    super();
    this.teams = {};
    // name : Set(name)
    this.alliances = {};
  }
  addTeam(name)
  {
    this.teams[name] = new Set();
    this.alliances[name] = new Set();
  }
  // makes a treat b as friendly (but not the other way around)
  createAlliance(a, b)
  {
    this.alliances[a].add(b);
  }
  // makes a treat b as hostile (but not the other way around)
  destroyAlliance(a, b)
  {
    this.alliances[a].delete(b);
  }
  // returns whether unit1 treats unit2 as neutral or allied
  neutral(unit1, unit2)
  {
    return this.teamNeutral(unit1.team, unit2.team);
  }
  // returns whether unit1 treats unit2 as an enemy
  hostile(unit1, unit2)
  {
    return this.teamHostile(unit1.team, unit2.team);
  }
  teamNeutral(a, b)
  {
    return a == b || this.alliances[a].has(b);
  }
  // returns whether unit1 treats unit2 as an enemy
  teamHostile(a, b)
  {
    return !this.teamNeutral(a, b);
  }
  addUnit(unit)
  {
    this.teams[unit.team].add(unit);
    this.set(unit.id, unit)
  }
  switchTeam(unit, team)
  {
    this.teams[unit.team].delete(unit);
    unit._team = team;
    this.teams[team].add(unit);
  }
  delUnit(unit)
  {
    this.del(unit.id);
    this.teams[unit.team].delete(unit);
  }
  getTeam(name)
  {
    return this.teams[name];
  }
  //	   [str]
  getTeams(teams)
  {
    let ret = new Set();
    for (let t of teams)
    {
      if (this.teams[t] != undefined)
      {
	for ( let u of this.teams[t] )
	{
	  ret.add(u);
	}
      }
    }
    return ret;
  }
  draw( g )
  {
    for (let thing of Object.values(this.stuff.active))
    {
      if (g.camera.visible(thing))
	thing.draw( g );
    }
    for (let thing of Object.values(this.stuff.paused))
    {
      if (g.camera.visible(thing))
	thing.draw( g );
    }
  }
  update(g)
  {
    for (let t of Object.values(this.stuff.active))
    {
      t.tickAnim();
      t.update(g);
    }
    
    for (let t of Object.values(this.hidden.active))
    {
      t.tickAnim();
      t.update(g);
    }
  }


}

export class PanelContainer extends DrawContainer
{
  constructor(g)
  {
    super();
    this.g = g;
  }
  set(id, val, draw = true)
  {
    if (draw)
      val.explicitDraw(this.g);
    super.set(id, val);
  }
  del(id)
  {
    this.g.clearCtx(4);
    super.del(id);
  }
  show(id)
  {
    this.get(id).explicitDraw(this.g);
    super.show(id);
  }
  hide(id)
  {
    this.g.clearCtx(4);
    super.hide(id);
  }
  shift(id)
  {
    this.get(id).shift();
    this.redraw(id);
  }
  redraw(id)
  {
    this.g.clearCtx(4);
    this.get(id).explicitDraw(this.g);
  }
}


export class ScriptDrawer
{
  constructor(script)
  {
    this.s = script;
  }
  draw(g)
  {
    for (let [c, v] of Object.entries(this.s.interactions))
    {
      if (v.drawSprite())
      {
        c = c.split(",");
        let coord = {x: parseInt(c[0]), y: parseInt(c[1])};
        if (g.camera.visible(coord))
        {
          let off = g.camera.getOffset();
          Album.draw(1, v.mapSprite, g.gx*(coord.x - off.x), g.gy*(coord.y - off.y));
        }
      }
    }
  }
  update()
  {}
}
