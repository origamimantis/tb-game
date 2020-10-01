import {LoopSelector} from "./LoopSelector.js"

export class Settings
{
  static init()
  {
    this.values = {
      visible_movement_costs : {allowed: ["Off","On"], map: {Off:false,On:true}, display: "Visible Movement Costs"},
      cut_skip : {allowed: ["Off","On"], map: {Off:false,On:true}, display: "Skip Cutscenes"},
      empty : {allowed: ["yea","nay"], display: "Placeholder Setting"}
    }



    this.numSettings = Object.keys(this.values).length;
    for (let k of Object.keys(this.values))
      this.values[k].allowed = new LoopSelector(this.values[k].allowed);
  }
  static set(s,val)
  {
    let set = this.values[s];
    if (set === undefined)
      throw "'" + s + "' is not a setting"
    let i = set.allowed.list.indexOf(val);
    if (i < 0)
      throw "'" + val + "' is not a value for setting '" + s + "' (" + set.allowed + ")"
    set.allowed.idx = i;
  }

  static get(s)
  {
    let set = this.values[s];
    if (set === undefined)
      throw "'" + s + "' is not a setting"
    
    if (set.map !== undefined)
      return set.map[set.allowed.get()];
    else
      return set.allowed.get();
  }



}
