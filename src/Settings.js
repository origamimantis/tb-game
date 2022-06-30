import {LoopSelector} from "./LoopSelector.js"

export class Settings
{
  static init()
  {
    this.values = {
      cut_skip : {
		    allowed: ["Off","On"],
		    map: {Off:false,On:true},
		    display: "Skip Cutscenes"
      },
      lvl_skip : {
		    allowed: ["Off","On"],
		    map: {Off:false,On:true},
		    display: "Enable Level Skip"
      },
      visible_movement_costs : {
		    allowed: ["Off","On"],
		    map: {Off:false,On:true},
		    display: "Visible Movement Costs"
      },
      option_scroll_speed : {
		    allowed:["Fast", "Medium", "Slow"],
		    map: {Fast:[8,4],Medium:[12,6], Slow:[12,12]},
		    display: "Menu Scroll Speed"
      },
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

  static get(s, spec = null)
  {
    let set = this.values[s];
    if (set === undefined)
      throw "'" + s + "' is not a setting"
    
    let opt = set.allowed.get();
    if (spec !== null)
      opt = spec

    if (set.map !== undefined)
      return set.map[opt]
    else
      return opt
  }



}
