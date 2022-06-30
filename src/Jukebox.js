import {MusicPlayer} from "./MusicPlayer.js";
import {Panel} from "./Panel.js";
import {PanelType, PanelComponent} from "./PanelComponent.js";
import {LoopSelector} from "./LoopSelector.js";
import {Album} from "./Images.js"
import {waitTime, scrollSelect_UD} from "./Utils.js";
import {TiledEffect} from "./TiledEffect.js";
import {applyArrowStall} from "./Utils.js";



class MusicPanel extends Panel
{
  constructor(g)
  {
    super(25, 50, 250, 300, 2, 12, 0, 0);//Settings.numSettings, 0, 0);

    this.g = g

    this.top = 0
    this.scrollOff = {x:30, y:0}


    let loopsong_list = [];
    for ( let [name, howl] of Object.entries(MusicPlayer.album) )
    {
      if (howl.isFX == false)
	loopsong_list.push(name)
    }

    this._ls = new LoopSelector(loopsong_list)
    this.idx = this._ls.idx;
    this.length = this._ls.length;

    for (let i = 0; i < this.length; ++i)
    {
      let name = this._ls.list[i];
      this.addComponent( new PanelComponent( PanelType.TEXT, name ), i, 0, i,
                         "#000000",  "11px ABCD Mono", "left");
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

    // side progress bar
    if (this.length > 12)
    {
      g.ctx[2].fillStyle = "#aaaaaa";
      g.ctx[2].fillRect(scrollx, this.body.y-1, 10, this.innerh+2)
      g.ctx[2].fillStyle = "#cccccc";
      g.ctx[2].fillRect(scrollx+1, this.body.y + this.innerh*this.top/this.length, 8, this.innerh*12/this.length)
    }

  }
  drawComp(g)
  {
    g.clearCtx(4);
    for (let i = this.top; i < Math.min(this.length, this.top + 12); ++i)
    {
      let name = this._ls.list[i]
      
      let o = this.components[i];
      o.comp.draw(g, this.body, o, this.scrollOff);
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


class MusicInfoPanel extends Panel
{
  constructor(g)
  {
    super(275, 50, 200, 300)

    this.g = g

    this.addComponent( new PanelComponent( PanelType.TEXT, "Currently playing:" ), "playing", 95, 100,
		       "#000000",  "11px ABCD Mono", "center");
    this.musicnamecomponent = new PanelComponent( PanelType.TEXT, "---" )
    this.addComponent( this.musicnamecomponent, "name", 95, 140,
		       "#000000",  "11px ABCD Mono", "center");

  }
  explicitDraw(g, ctx = 1)
  {
    this.drawBase(g, ctx);
  }
  updateSongName(name)
  {
    if (name === null)
      name = "---";

    this.musicnamecomponent.data = name;
  }
};

export class Jukebox
{
  constructor( assets, ctx , MAIN )
  {
    this.ctx = ctx
    this.MAIN = MAIN;
    this.inputting = true;

    this.playidx = null
    this.playing = null

    this.p = new MusicPanel(this);
    this.pinfo = new MusicInfoPanel(this);
  }

  async beginGame(chscript)
  {
    Album.clearAllCtx()
    this.explicitDraw()
    this.bg = new TiledEffect(-0.3,-0.4);
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

    this.pinfo.explicitDraw(this);
    this.pinfo.drawComp(this);
  }
  async arrows(a)
  {
    if (applyArrowStall(a)) return;

    if (scrollSelect_UD(a, this.p, false, false))
    {
      this.explicitDraw()
    }
  }

  async select()
  {
    MusicPlayer.stopAll()

    let toplay = this.p.get()
    if (toplay == this.playing)
    {
      this.playidx = null
      this.playing = null
    }
    else
    {
      this.playidx = this.p.idx
      this.playing = toplay
    }

    this.pinfo.updateSongName(this.playing)
    this.explicitDraw()

    if (this.playing !== null)
    {
      await waitTime(200);
      MusicPlayer.play(this.playing)
    }

  }
  inform()
  {
  }
  async cancel()
  {
    if (this.playing !== null)
    {
      MusicPlayer.stopAll()

      this.playidx = null
      this.playing = null
      this.pinfo.updateSongName(null)

      this.explicitDraw()
    }
    else
    {
      await this.MAIN.chload("./chtitle.js", null, {idx:2})
      this.MAIN.start();
    }
  }
}
