'use strict';
import {generatePath, inRange} from "./Utils.js";
import {Battle} from "./Battle.js";


export class EnemyController
{
  constructor(g)
  {
    this.g = g;
  }
  async execute(turn = "enemy")
  {
    for (let unit of this.g.Units)
    {
      if (unit.team == turn)
      {
	await this.offense(unit);
      }
    }
  }
  async offense(unit)
  {
    // check if any attackable units in range
    // if yes, find tiles that can attack that are in walkable.
    // pathfind and initiate battle
    // return
    let ranges = unit.movable(this.g, true);
    let [movable, attackable] = ranges;
    let target = null;
    for (let targ of this.g.Units)
    {
      if (attackable.contains(targ) && this.hostile(unit.team, targ.team))
      {
	target = targ;
	break;
      }
    }
    let coord = movable.last();
    if (target != null)
    {
      let possible = inRange(target, unit.getRange(), "tiles", this.g.Map)
      for (let c of possible)
      {
	let inhabitant = this.g.Map.getTile(c).unit;
	if (movable.contains(c) && (inhabitant == null || inhabitant.id == unit.id))
	{
	  coord = c;
	  break;
	}
      }
    }
    let path = await generatePath(this.g, unit.x, unit.y, coord.x, coord.y, unit.movcost);
    return {path:path, target:target, attacks:(target != null)};

  }
  hostile(a, b)
  {
    return (a != b);
  }
}
