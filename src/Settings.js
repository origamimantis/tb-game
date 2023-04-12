import {LoopSelector} from "./LoopSelector.js"
import {linspace} from "./Utils.js"

export class Settings
{
  static init()
  {
    this.values = {
      cut_skip : {
		    allowed: ["Off","On"],
		    map: {Off:false,On:true},
		    display: "Skip Cutscenes",
	            type: "Text"
      },
      lvl_skip : {
		    allowed: ["Off","On"],
		    map: {Off:false,On:true},
		    display: "Enable Level Skip",
	            type: "Text"
      },
      visible_movement_costs : {
		    allowed: ["Off","On"],
		    map: {Off:false,On:true},
		    display: "Visible Movement Costs",
	            type: "Text"
      },
      option_scroll_speed : {
		    allowed:["Fast", "Medium", "Slow"],
		    map: {Fast:[8,4],Medium:[12,6], Slow:[12,12]},
		    display: "Menu Scroll Speed",
	            type: "Text"
      },
      music_volume : {
		    allowed:[0,0.5,11],
		    map: undefined,
		    display: "Music Volume",
	            type: "Bar",
      },
    }



    this.numSettings = Object.keys(this.values).length;
    for (let k of Object.keys(this.values))
    {
      switch (this.values[k].type)
      {
	case "Text":
	  this.values[k].allowed = new LoopSelector(this.values[k].allowed);
	  break;
	case "Bar":
	  this.values[k].allowed = new LoopSelector(linspace(...this.values[k].allowed), -1);
	  break;
      }
    }
    //this.values.cut_skip.allowed.next()
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

    for (let cb of Object.values(set.allowed.onchange))
      cb(set.allowed)

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

  static addCallback(s, name, onchange)
  {
    let ls = this.values[s].allowed;
    if (ls.onchange[name] === undefined)
      ls.onchange[name] = onchange
    else
      throw "Cannot add callback with name `" + name + "` to setting `" + s + "`, already exists."
  }

  static delCallback(s, name, onchange)
  {
    let ls = this.values[s].allowed;
    if (ls.onchange[name] !== undefined)
      delete ls.onchange[name]
    else
      throw "Cannot remove callback with name `" + name + "` from setting `" + s + "`, does not exist."
  }

}
