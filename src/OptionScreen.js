import {Panel, SelectionPointer} from "./Panel.js";
import {PanelType, PanelComponent} from "./PanelComponent.js";
import {formattedHP, leftPad} from "./Utils.js";
import {AnimatedObject} from "./AnimatedObject.js";
import {scrollSelect_LR, scrollSelect_UD, fracAmtFn, triggerEvent} from "./Utils.js";
import {LoopSelector} from "./LoopSelector.js";
import {STATS} from "./Constants.js";
import {TiledEffect} from "./TiledEffect.js";
import {Settings} from "./Settings.js";
import {MusicPlayer} from "./MusicPlayer.js";



// Layer 0: background
// Layer 1: item/weapon/skill panels
// Layer 2: portrait panel
// Layer 3: pointer



let unselected = {s:"#000000", w:"11px ABCD Mono", h:"center"};
let selected = {s:"#7c9e03", w:"13.25px ABCD Mono", h:"center"};

class OptionPanel extends Panel
{
  constructor()
  {
    super(50, 50, 400, 300, 2, 12, 0, 0);//Settings.numSettings, 0, 0);

    this._ls = new LoopSelector(Object.entries(Settings.values));
    this.idx = this._ls.idx;
    this.length = this._ls.length;

    for (let i = 0; i < this._ls.length; ++i)
    {
      let entry = this._ls.list[i][1];
      let name = entry.display;
      let values = entry.allowed;
      this.addComponent( new PanelComponent( PanelType.TEXT, name ), i, 0, i,
                         "#000000",  "11px ABCD Mono", "left");
      for (let j = 0; j < values.length; ++j)
      {
	this.addComponent( new PanelComponent(PanelType.TEXT, values.getIdx(j)), i.toString()+values.getIdx(j),
			  1 + (j + 0.5)/(values.length), i,
                         "#000000",  "11px ABCD Mono", "center");
      }
    }

  }
  explicitDraw(g, ctx = 1)
  {
    this.drawBase(g, ctx);

    g.ctx[1].fillStyle = "#9eefff";
    let y = this.components[this.idx].y;
    g.ctx[1].fillRect(this.body.x, this.body.y + y + 3, this.w-20, 12)

  }
  drawComp(g)
  {
    g.clearCtx(4);
    for (let i = 0; i < this._ls.length; ++i)
    {
      let vals = this._ls.list[i][1].allowed;
      
      let o = this.components[i];
      o.comp.draw(g, this.body, o);

      for (let j = 0; j < vals.length; ++j)
      {
	let comp = this.components[i.toString() + vals.getIdx(j)];
	let thing = { ...comp }
	if (vals.idx == j)
	  Object.assign(thing, selected)
	else
	  Object.assign(thing, unselected)
	
	comp.comp.draw(g, this.body, thing);
      }

    }
  }
  get()
  {
    return this._ls.get();
  }
  next()
  {
    this._ls.next();
    this.idx = this._ls.idx;
  }
  prev()
  {
    this._ls.prev();
    this.idx = this._ls.idx;
  }




}


export class OptionScreen
{
  constructor(g)
  {
    this.g = g;

    this._resolve = null;

    this.contents = new OptionPanel();
  }
  update(g)
  {
    this.bg.update();
  }
  draw(g)
  {
    this.bg.draw(g, 0);
  }
  explicitDraw(g)
  {
    this.contents.explicitDraw(g);
    this.contents.drawComp(g);
  }
  async begin(onDone)
  {
    this.bg = new TiledEffect(-0.25,0.5);
    await this.bg.load("BG_unitprofile");

    this.old_ctx_refresh = this.g.ctx_refresh;
    this.g.ctx_refresh = [0];

    MusicPlayer.setVol(this.g.mapTheme, 0.15);
    this.onDone = onDone;

    this.g.clearCtx(0);
    this.g.clearCtx(1);
    this.g.clearCtx(2);
    this.g.clearCtx(3);
    this.g.clearCtx(4);
    this.g.clearCtx(5);
    this.explicitDraw(this.g);
  }
  async arrows(a)
  {
    if (scrollSelect_UD(a, this.contents, false, false))
    {
      this.contents.explicitDraw(this.g)
    }
    else if (scrollSelect_LR(a, this.contents.get()[1].allowed, false, false))
    {
      this.contents.drawComp(this.g)
    }
  }
  select()
  {
  }
  inform()
  {
    // TODO tooltips?
  }
  cancel()
  {
    this.end();
  }
  end()
  {
    MusicPlayer.setVol(this.g.mapTheme, 0.5);
    this.g.ctx_refresh = this.old_ctx_refresh;
    this.onDone();
  }
}
