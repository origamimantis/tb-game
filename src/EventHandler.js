"use strict";

export class EventHandler
{
  constructor()
  {
    this.events = {};
  } 
    
  addEvent( id, priority, condition, action )
  {
    this.events[id] = new EventCondition(id, priority, condition, action);
  }
  delEvent( id )
  {
    if (this.events[id] !== undefined)
    {
      delete this.events[id];
    }
  }
  _priority(ec)
  {
    return ec.priority;
  }
  execute()
  {
    let active = [];
    for (let ec of Object.values(this.events))
    {
      if (ec.condition())
      {
	active.push(ec);
      }
    }
    active.sort(this._priority);
    for (let ec of active)
    {
      ec.action();
    }
  }
}

class EventCondition
{
  //        <id>        int / string: used for event removal
  //        <priority>  int:          0 is highest priority; executed first
  //        <condition> ()->bool: called on game instance, returns true if condition met
  //        <action>    ()->void: called if <condition> is true.
  constructor( id, priority, condition, action )
  {
    this.priority = priority;
    this.condition = condition;
    this.action = action;
  }
}
