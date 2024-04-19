import {Panel, SelectionPanel, UnitProfileItemPanel, UnitProfileStatPanel,
	TooltipWeaponPanel, TooltipItemPanel, SelectionPointer} from "./Panel.js";
import {PanelType} from "./PanelComponent.js";
import {formattedHP, leftPad} from "./Utils.js";
import {AnimatedObject} from "./AnimatedObject.js";
import {scrollSelect_LR, scrollSelect_UD, fracAmtFn, triggerEvent} from "./Utils.js";
import {LoopSelector as LS} from "./LoopSelector.js";
import {STATS} from "./Constants.js";
import {TiledEffect} from "./TiledEffect.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {applyArrowStall} from "./Utils.js";
import {Settings} from "./Settings.js";


// Layer 0: background
// Layer 1: item/weapon/skill panels
// Layer 2: portrait panel
// Layer 3: pointer


const OBSERVE = 0;
const TOOLTIP = 1;

export class UnitInfoScreen
{
  constructor(g, unit)
  {
    this.g = g;
    this.unit = unit;

    this.uc = new AnimatedObject();
    this.uc.addAnim("idle", unit.getAnim("idle").copy());
    this.uc.setAnim("idle");

    // 512, 384
    this.p_portrait = new Panel(0,0, 128, 256);
    this.p_tooltip = new Panel(144,40, 352, 216);

    this.p_x = 144;
    this.p_y = 40;
    this.p_w = 352;
    this.p_h = 216;
    this.Weapons = new UnitProfileItemPanel(this.p_x, this.p_y, this.p_w, this.p_h, new LS(unit.weapons),
      fracAmtFn, (w)=>{return !unit.canUseWeapon(w)});
    this.Items = new UnitProfileItemPanel(this.p_x, this.p_y, this.p_w, this.p_h, new LS(unit.items),
      fracAmtFn);
    this.Equipment = new UnitProfileItemPanel(this.p_x, this.p_y, this.p_w, this.p_h, new LS(unit.equipment),
      (c)=>{return ""});
    
    this.Stats = new UnitProfileStatPanel(this.p_x, this.p_y, this.p_w, this.p_h, this._unitStatFormat());
    
    // TODO new panel type for skills

    // TODO stats, skills, other
    this.pages = new LS(["Stats", "Weapons", "Items", "Equipment"]);
    this.cur = this.pages.get();

    this.state = OBSERVE;
    this._resolve = null;

    this.t_alpha = 0;
    this.t_pos = 0;
    this.t_dir = 0;
    this.t_active = false;
    this.t_out = 0;
    this.t_in = 0;
    this.t_res = null;
  }
  _unitStatFormat()
  {
    let st = this.unit.stats;

    let bn_unfmt = {}
    for (let s of ["atk","spd","skl","def","mov" ])
    {
      bn_unfmt[s] = 0
    }

    for (let i of this.unit.equipment)
    {
      for (let [stat, amt] of Object.entries(i.stats))
      {
        bn_unfmt[stat] += amt
      }
    }

    let bn = {}
    for (let s of ["atk","spd","skl","def","mov" ])
    {
      let b = bn_unfmt[s]
      if (b == 0)
	bn[s] = ""
      else if (b > 0)
	bn[s] = "+ "+b
      else
	bn[s] = "- "+ (-b)
    }

    return `Str ${st.atk} ${bn.atk}\nSpd ${st.spd} ${bn.spd}\nSkl ${st.skl} ${bn.skl}\nDef ${st.def} ${bn.def}\nMov ${st.mov} ${bn.mov}\n\nAff ${this.unit.team}`;
  }
  update(g)
  {
    this.uc.tickAnim();
    this.bg.update();
    if (this.state == TOOLTIP)
      this[this.cur].update();
    else if (this.t_active)
    {
      this.t_pos += 1/8;
      this[this.t_out].x = this.t_pos * this.t_dir * (32 + this.p_w) + this.p_x;
      this[this.t_in].x = (this.t_pos - 1) * this.t_dir * (32 + this.p_w) + this.p_x;

      g.clearCtx(1);
      this.drawPanel(g, 1, this.t_in);
      this.drawPanel(g, 1, this.t_out);
      g.ctx[1].clearRect(0, this.p_y, 20, this.p_h);

      let title = (this.t_pos < 0.5) ? this.t_out : this.t_in;
      this.drawTitle(g, 1, title, this.p_w*Math.abs(this.t_pos-0.5))

      if (this.t_pos >= 1)
      {
	let r = this.t_res;
	this.t_res = null;
	this.t_out = 0;
	this[this.t_in].x = this.p_x;
	this.t_in = 0;
	this.t_active = false;
	r();
      }
    }
  }
  draw(g)
  {
    this.bg.draw(g, 0);
    let append = g.getAffiliation(this.unit);
    this.uc.draw(g, 3, 64, 216, 1, append);
    if (this.state == TOOLTIP)
      this[this.cur].draw(g, 3);
  }
  drawTitle(g, ctx, text = this.cur, maxwidth = undefined)
  {
    //g.ctx[ctx].fillStyle = "brown";
    g.ctx[ctx].clearRect( this.p_x, this.p_y - 36, this.p_w, 30);

    let c_x = this.p_x + this.p_w / 2;

    g.ctx[ctx].fillStyle = "black";
    g.ctx[ctx].globalAlpha = 0.5;
    let w = this.p_w;
    if (maxwidth !== undefined)
      w = maxwidth;
    g.ctx[ctx].fillRect( c_x - w/2 , this.p_y - 35, w, 26);
    g.ctx[ctx].globalAlpha = 1;

    g.setTextProperty(ctx, "#dedbef", "22px ABCD Mono", "center");
    g.drawText(ctx, text, c_x, this.p_y - 32, maxwidth);
  }
  drawPanel(g, ctx, panel = this.cur)
  {
    let eq = -1;
    if (panel == "Weapons")
      eq = this.unit.eqWeap;
    this[panel].explicitDraw(g, ctx, eq, (this.state == TOOLTIP));
  }
  drawTooltip(g, ctx)
  {
    let p;
    if (this.cur == "Weapons")
    {
      p = new TooltipWeaponPanel();
      p.fontsize = "13.75"
    }
    else if (this.cur == "Items")
    {
      p = new TooltipItemPanel();
      p.fontsize = "13.75"
    }
    else if (this.cur == "Equipment")
    {
      p = new TooltipItemPanel();
      p.fontsize = "13.75"
    }
    else
      console.error( "BROTHER YOU FORGOT TO IMPLEMENT TOLLTIP FOR STATE = " + this.cur );

    p.explicitDraw(g, ctx, this[this.cur].get());
  }
  drawUnitOverview(g, ctx)
  {
    // base portrait panel
    this.p_portrait.explicitDraw(g, ctx);
    
    // unit name
    g.setTextProperty(ctx, "#000000", "16.5px ABCD Mono", "center");
    g.drawText(ctx, this.unit.name, 64, 20);

    // unit class
    g.setTextFont(ctx, "11px ABCD Mono");
    g.drawText(ctx, this.unit.classname, 64, 40);

    // unit portrait
    g.drawImage(ctx, this.unit.pArt, 32, 64);
    
    // unit HP
    g.setTextJustify(ctx, "left");
    g.drawOutlinedText(ctx, "HP ", 16, 156, "16.5px ABCD Mono Bold", "#ffc635","#000000");
    g.drawText(ctx, formattedHP(this.unit.stats.hp, this.unit.stats.maxhp), 48, 156);

    // unit LVL
    g.ctx[ctx].textBaseline = "alphabetic";
    g.drawOutlinedText(ctx, "LVL", 16, 184, "11px ABCD Mono Bold", "#ffc635","#000000");
    g.setTextFont(ctx, "16.5px ABCD Mono");
    g.drawText(ctx, leftPad(this.unit.lvl, 2), 40, 184);

    // unit EXP
    g.drawOutlinedText(ctx, "EXP", 72, 184, "11px ABCD Mono Bold", "#ffc635","#000000");
    g.setTextFont(ctx, "16.5px ABCD Mono");
    g.drawText(ctx, leftPad(this.unit.exp, 2), 96, 184);
    g.ctx[ctx].textBaseline = "top";
  }
  explicitDraw(g)
  {
    this.drawUnitOverview(g, 2);
    this.drawTitle(g, 1);
    this.drawPanel(g, 1);
  }
  async begin(onDone)
  {
    this.bg = new TiledEffect(0.5,0.25);
    await this.bg.load("BG_unitprofile");

    this.old_ctx_refresh = this.g.ctx_refresh;
    this.g.ctx_refresh = [0, 3];

    MusicPlayer.muffle()
    this.onDone = onDone;

    this.g.clearCtx(0);
    this.g.clearCtx(1);
    this.g.clearCtx(2);
    this.g.clearCtx(3);
    this.g.clearCtx(4);
    this.g.clearCtx(5);
    this.explicitDraw(this.g);
  }
  // a: prev, b: next
  transition(a, b)
  {
    if (a == b)
      return;
    return new Promise( (resolve)=>
    {
      //this.g.clearCtx(4);
      let dx = Math.sign(a - b);
      if (a - b != dx)
	dx *= -1;
      
      this.t_dir = dx;
      this.t_out = this.pages.list[a];
      this.t_in = this.pages.list[b];
      this.t_pos = 0;
      this.t_active = true;
      this.t_res = resolve;
    });

  }
  async arrows(a)
  {
    if (this.state == OBSERVE)
    {
      if (applyArrowStall(a, 1, Settings.get("option_scroll_speed", "Slow"))) return;

      let prev = this.pages.idx;
      if (scrollSelect_LR(a, this.pages))
      {
	this.g.blockInput();
	this.cur = this.pages.get();
	await this.transition(prev, this.pages.idx);
	this.drawTitle(this.g, 1);
	this.drawPanel(this.g, 1);
	this.g.unblockInput();
      }
    }
    else if (this.state == TOOLTIP)
    {
      if (applyArrowStall(a)) return;

      if (scrollSelect_UD(a, this[this.cur]))
      {
	this.drawTitle(this.g, 1);
	this.drawPanel(this.g, 1);
	this.drawTooltip(this.g, 4);
      }
    }
  }
  select()
  {
    this.inform();
  }
  inform()
  {
    if (this.state == OBSERVE)
    {
      if (this.cur != "Stats" && this[this.cur].nonempty())
      {
	this.state = TOOLTIP;
	this.drawPanel(this.g, 1);
	this.drawTooltip(this.g, 4);
      }
      else
      {
	MusicPlayer.play("errbeep");
      }
    }
  }
  cancel()
  {
    if (this.state == OBSERVE)
      this.end();
    else
    {
      this.state = OBSERVE;
      this.drawPanel(this.g, 1);
      this.g.clearCtx(4);
    }
  }
  end()
  {
    MusicPlayer.unmuffle()
    this.g.ctx_refresh = this.old_ctx_refresh;
    this.onDone();
  }
}
