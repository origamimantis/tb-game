import {MusicPlayer} from "./MusicPlayer.js";
import {Panel} from "./Panel.js";
import {PanelType, PanelComponent} from "./PanelComponent.js";
import {LoopSelector} from "./LoopSelector.js";
import {Album} from "./Images.js"
import {waitTime, scrollSelect_UD} from "./Utils.js";
import {TiledEffect} from "./TiledEffect.js";



class TitlePanel extends Panel
{
  constructor(g, idx)
  {
    super(25, 50, 450, 300, 2, 12, 0, 0);//Settings.numSettings, 0, 0);

    this.g = g

    this.top = 0
    this.scrollOff = {x:30, y:0}

    this._ls = new LoopSelector(Object.keys(g.optionlist), idx)
    this.idx = this._ls.idx;
    this.length = this._ls.length;

    for (let i = 0; i < this.length; ++i)
    {
      let name = this._ls.list[i];
      this.addComponent( new PanelComponent( PanelType.TEXT, name ), i, 1, 12-this.length+i,
                         "#000000",  "11px ABCD Mono", "center");
    }

  }
  explicitDraw(g, ctx = 1)
  {
    this.drawBase(g, ctx);

    let scrollx = this.body.x + this.innerw - 15

    // currently playing indicator
    if (this.g.playidx !== null && this.g.playidx >= this.top && this.g.playidx < this.top + 12)
    {
      // dark highlight
      g.ctx[1].fillStyle = "#8ddeee";
      let y = this.components[this.g.playidx].y;
      g.ctx[1].fillRect(this.body.x + 25, this.body.y + y + 3 + this.scrollOff.y, this.innerw - 45, 12)

      // audio symbol
      g.ctx[2].drawImage(Album.get("C_audio"), this.body.x, this.body.y + y + this.scrollOff.y - 1);
    }

    // selection indicator
    g.ctx[1].fillStyle = "#9eefff";
    let y = this.components[this.idx].y;
    g.ctx[1].fillRect(this.body.x + 25, this.body.y + y + 3 + this.scrollOff.y, this.innerw - 45, 12)

  }
  
  get()
  {
    return this._ls.get();
  }
  next()
  {
    this._ls.next();
    this.idx = this._ls.idx;
    if (this.idx > this.top + 12 - 1)
      this.top = this.idx - 12 + 1
    
    this.scrollOff.y = -this.gsy*this.top

  }
  prev()
  {
    this._ls.prev();
    this.idx = this._ls.idx;
    if (this.idx < this.top)
      this.top = this.idx

    this.scrollOff.y = -this.gsy*this.top
  }
}

export class TitleScreen
{
  constructor( assets, ctx , MAIN )
  {
    this.ctx = ctx
    this.MAIN = MAIN;
    this.inputting = true;

    this.playidx = null
    this.playing = null

    let idx = 0
    if (assets.idx !== undefined)
      idx = assets.idx

    this.optionlist = {"Play":    "lvlsel",
                       "Options": "option",
                       "Music":   "music"
                      }

    this.p = new TitlePanel(this, idx);
  }

  async beginGame(chscript)
  {
    Album.clearAllCtx();
    this.explicitDraw();

    this.bg = new TiledEffect(0,-0.4);
    await this.bg.load("BG_unitprofile");
  }

  update()
  {
    this.bg.update();
  }
  draw()
  {
    this.bg.draw(this, 0);

  }
  explicitDraw()
  {
    Album.clearCtx(2)
    this.p.explicitDraw(this);
    this.p.drawComp(this);
  }
  async arrows(a)
  {
    if (scrollSelect_UD(a, this.p, false, false))
    {
      this.explicitDraw()
    }
  }

  async select()
  {
    let selection = this.p.get()
    let lvlID = this.optionlist[selection]
    let lvlToLoad = "./ch" + lvlID + ".js"

    await this.MAIN.chload(lvlToLoad, null)
    this.MAIN.start();
  }
  inform()
  {
  }
  cancel()
  {
    MusicPlayer.stopAll()

    this.playidx = null
    this.playing = null

    this.explicitDraw()
  }
}
