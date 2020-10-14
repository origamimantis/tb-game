'use strict';
import {generatePath, inRange, randInt, randChoice} from "./Utils.js";
import {Battle} from "./Battle.js";

function naiveUnitStrengthEvaluation(unit1, unit2)
{
  // scores a unit based on their base stat total.
  let s1 = unit1.stats;
  let s2 = unit2.stats;
  let w1 = unit1.getWeapon().pow;
  let w2 = unit2.getWeapon().pow;
  return s1.hp + s1.atk + w1 + s1.spd + s1.skl + s1.def - (s2.hp + s2.atk + w2 + s2.spd + s2.skl + s2.def);
}


export class EnemyController
{
  constructor(g)
  {
    this.g = g;
    this.unitEvaluation = naiveUnitStrengthEvaluation;
    this.chooseAttackLocation = randChoice;
  }
  async offense(unit)
  {
    let decision = await this[unit.ai + "AI"](unit);
    decision.attacks = (decision.target !== null);
    let path = await generatePath(this.g, unit.x, unit.y, decision.dest.x, decision.dest.y, unit.movcost);
    decision.path = path;
    decision.action = (decision.attacks || decision.dest.x != unit.x || decision.dest.y != unit.y);
    return decision;
  }
  // moves towards the weakest unit, ggetting distracted along the way.
  async targetWeakestAI(unit)
  {
    let ret = {};
    let [movable, attackable] = unit.movable(this.g, true);
    attackable = this.enemiesAttackable(unit, attackable);
    attackable.sort(this.unitEvaluation);

    let weakest = this.weakestAttackable(unit, movable, attackable);

    ret.target = weakest.target;
    if (weakest.target !== null)
      ret.dest = this.chooseAttackLocation(weakest.dests);
    else
    {
      let enemies = this.allEnemies(unit);
      if (enemies.length == 0)
      {
	ret.dest = unit;
      }
      else
      {
	enemies.sort(this.unitEvaluation);
	weakest = enemies[0];
	// find a path
	let path = await generatePath(this.g, unit.x, unit.y, weakest.x, weakest.y, unit.movcost);

	let targetDest = this.furthestMovableTile(path, movable);
	let dests = this.closestMovableTile(targetDest, movable, unit);
	ret.dest = this.chooseAttackLocation(dests);
      }
    }

    return ret;
  }
  allEnemies(unit)
  {
    return Array.from(this.g.Units.getTeams(this.g.getHostile(unit.team)));
  }
  // returns the furthest movable tile on a given path
  furthestMovableTile(path, movable)
  {
    // path[0] is the unit's location
    let prv;
    let cur = path.h;
    while (cur !== null && movable.contains(cur.v))
    {
      prv = cur;
      cur = cur.n;
    }
    return prv.v
  }
  // returns the closest movable tile to a given point
  // can't use this by itself in the case of a large wall in between unit and the point
  closestMovableTile(target, movable, unit)
  {
    let found = false
    let rangeTest = [0];
    let dests = [];
    
    while (found == false)
    {
      let tiles = inRange(target, rangeTest, "tiles", this.g.Map)
      for (let c of tiles)
      {
        let inhabitant = this.g.Map.getTile(c).unit;
        if (movable.contains(c) && (inhabitant === null || inhabitant.id == unit.id))
        {
          dests.push(c)
          found = true;
        }
      }
      ++ rangeTest[0];
    }
    return dests;
  }
  // AI that does nothing every turn
  doNothingAI(unit)
  {
    return {dest: unit, target:null};
  }
  // AI will not move unless someone enters its range, then it moves to attack it.
  // does not return afterwards.
  guardAI(unit)
  {
    let ret = {};
    let [movable, attackable] = unit.movable(this.g, true);
    attackable = this.enemiesAttackable(unit, attackable);
    attackable.sort(this.unitEvaluation);
  
    let weakest = this.weakestAttackable(unit, movable, attackable);
    
    ret.target = weakest.target;
    if (weakest.target !== null)
      ret.dest = this.chooseAttackLocation(weakest.dests);
    else
      ret.dest = unit;

    return ret;
  }
  enemiesAttackable(unit, attackable)
  {
    let ret = [];
    for (let targ of this.g.Units)
    {
      if (attackable.contains(targ) && this.g.Units.hostile(unit, targ))
	ret.push(targ);
    }
    return ret;
  }

  // returns the weakest (by evaluation) enemy that can be attacked and a list of tiles to attack from
  weakestAttackable(unit, movable, attackable)
  {
    let target = null;
    let dests = [];
    for (let enemy of attackable)
    {
      let tilesThatCanHitEnemy = inRange(enemy, unit.getRange(), "tiles", this.g.Map)
      let canAttack = false;
      for (let c of tilesThatCanHitEnemy)
      {
        let inhabitant = this.g.Map.getTile(c).unit;
        if (movable.contains(c) && (inhabitant == null || inhabitant.id == unit.id))
        {
          dests.push(c)
          canAttack = true;
        }
      }
      if (canAttack)
      {
	target = enemy;
        break;
      }
    }
    return {target: target, dests: dests};
  }
  randomMoveFirstTargetAI(unit)
  {
    // check if any attackable units in range
    // if yes, find tiles that can attack that are in walkable.
    let ranges = unit.movable(this.g, true);
    let [movable, attackable] = ranges;
    let target = null;
    for (let targ of this.g.Units)
    {
      if (attackable.contains(targ) && this.g.Units.hostile(unit, targ))
      {
	target = targ;
	break;
      }
    }
    let m = movable.toArray();
    let ind = randInt(0, m.length);
    let coord = m[ind];
    while (coord !== undefined && this.g.Map.getTile(coord).unit != null)
    {
      m.splice(ind, 1);
      ind = randInt(0, m.length);
      coord = m[ind];
    }
    if (coord === undefined)
      coord = new Coord(unit);

    if (target != null)
    {
      let possible = inRange(target, unit.getRange(), "tiles", this.g.Map)
      let canAttack = false;
      for (let c of possible)
      {
	let inhabitant = this.g.Map.getTile(c).unit;
	if (movable.contains(c) && (inhabitant == null || inhabitant.id == unit.id))
	{
	  coord = c;
	  canAttack = true;
	  break;
	}
      }
      if (canAttack == false)
      {
	target = null;
      }
    }
    return {dest:coord, target:target};

  }
}

