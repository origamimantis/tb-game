import {LoopSelector} from "./LoopSelector.js"
import {ItemPanel, SelectionPointer} from "./Panel.js"
import {waitTick, toTitle, fracAmtFn, scrollSelect_LR, scrollSelect_UD} from "./Utils.js"
import {UNIT_MAX_WEAP, UNIT_MAX_ITEM} from "./Constants.js";
import {applyArrowStall} from "./Utils.js";




const TLOFF = 10;
const Y = 150;
const HEIGHT = 384 - Y - TLOFF;
const WIDTH = 256 - 2*TLOFF;

const OBSERVE = 0;
const TRADE = 1;


export class UnitTradeScreen
{
  // maintain layers 0,1,2,3
  // panel on 4
  // pointer on 5
  //
  // INFO to toggle weapon/item trade
  // SELECT to select
  // CANCEL to deselect or quit
  constructor(g, left, right)
  {
    this.g = g;
    this.left = {
      unit: left,
      panel: {},
      items: new LoopSelector(left.items),
      weapons: new LoopSelector(left.weapons)
    };

    this.right = {
      unit: right,
      panel:{},
      items: new LoopSelector(right.items),
      weapons: new LoopSelector(right.weapons)
    };

    if (left.weapons[left.eqWeap] !== undefined)
      left.weapons[left.eqWeap].TRADE_EQ_TMP = "l"
    if (right.weapons[right.eqWeap] !== undefined)
      right.weapons[right.eqWeap].TRADE_EQ_TMP = "r"

    this.unitSelect = new LoopSelector([this.left,this.right]);
    this.unitSelect2 = new LoopSelector([this.left,this.right]);

    this.left.panel.items = new ItemPanel( TLOFF,Y,WIDTH,HEIGHT, 1, 8, this.left.items, "IT_", fracAmtFn);
    this.left.panel.weapons = new ItemPanel( TLOFF,Y,WIDTH,HEIGHT,1, 8, this.left.weapons, "WT_", fracAmtFn, 
      (w)=>{return !left.canUseWeapon(w)});
    this.right.panel.items = new ItemPanel( 256+TLOFF,Y,WIDTH,HEIGHT,1, 8, this.right.items, "IT_", fracAmtFn);
    this.right.panel.weapons = new ItemPanel(256+TLOFF,Y,WIDTH,HEIGHT,1, 8, this.right.weapons, "WT_", fracAmtFn,
      (w)=>{return !right.canUseWeapon(w)});

    this._ptr1 = new SelectionPointer(this.left.panel.items);
    this._ptr2 = new SelectionPointer(this.left.panel.items);
    this.ptr = this._ptr1;

    this.idx1 = 0;
    this.idx2 = 0;
    this.prevObs = 0;
    
    this.tradeMode = "items";
    this.state = OBSERVE;

    this.traded = false;

    this.max = {weapons: UNIT_MAX_WEAP, items: UNIT_MAX_ITEM};

    this.Return = null;
    this.old_ctx_refresh = null;
    this.firstSwap = null;//{unit: ["left","right"], idx: int};
    this.secondSwap = null;
  }
  update(g)
  {
    //this.unitSelect.get().panel[this.tradeMode].update();
    this.ptr.update();
  }

  drawPortrait(g, ctx, u)
  {
    let x = 48;
    let w = 64*1.5;
    g.ctx[ctx].clearRect( x, Y - w, w, w);

    g.drawImage(ctx, u.pArt, x, Y-w, w, w);

  }
  drawTitle(g, ctx, text = this.tradeMode, maxwidth = undefined)
  {
    text = toTitle(text);
    //g.ctx[ctx].fillStyle = "brown";
    let w = 128;
    let c_x = 256;
    g.ctx[ctx].clearRect( c_x - w/2, Y - 36, w, 30);


    g.ctx[ctx].fillStyle = "black";
    g.ctx[ctx].globalAlpha = 0.5;
    if (maxwidth !== undefined)
      w = maxwidth;
    g.ctx[ctx].fillRect( c_x - w/2 , Y - 35, w, 26);
    g.ctx[ctx].globalAlpha = 1;

    g.setTextProperty(ctx, "#dedbef", "22px ABCD Mono", "center");
    g.drawText(ctx, text, c_x, Y - 32, maxwidth);
  }

  draw(g)
  {
    //this.unitSelect.get().panel[this.tradeMode].draw(g);
    this._ptr1.draw(g);
    if (this.state == TRADE)
      this._ptr2.draw(g);
  }
  explicitDraw(g)
  {
    let l = false;
    let lh = [];
    let r = false;
    let rh = [];

    let lp = this.left.panel[this.tradeMode];
    let rp = this.right.panel[this.tradeMode];

    l = (this._ptr1.x < 256);
    r = !l;
    if (l) lh.push(this.idx1);
    else rh.push(this.idx1);

    if (this.state == TRADE)
    {
      let l2 = (this._ptr2.x < 256);
      l = l || l2;
      r = r || !l2;
      if (l2) lh.push(this.idx2);
      else rh.push(this.idx2);
    }
    if (lh.length == 0) lh = null;
    if (rh.length == 0) rh = null;

    this.left.panel[this.tradeMode].explicitDraw(g, 4, l, lh);
    this.right.panel[this.tradeMode].explicitDraw(g, 4, r, rh);

    this.drawTitle(g, 4);
    this.drawPortrait(g, 4, this.left.unit);

    let c = g.ctx[4];
    c.scale(-1,1);
    c.translate(-512,0);

    this.drawPortrait(g, 4, this.right.unit);
    c.translate(512,0);
    c.scale(-1,1);
  }
  resetLoopSelector(which)
  {
    which[this.tradeMode] = new LoopSelector(which.unit[this.tradeMode]);
    which.panel[this.tradeMode].resetLoopSelector(which[this.tradeMode]);
  }
  removeNull(which)
  {
    let inven1 = which.unit[this.tradeMode];
    for (let i = 0; i < inven1.length; ++i)
    {
      if (inven1[i] == null)
      {
	inven1.splice(i, 1);
	return true;
      }
    }
    return false;
  }
  async begin(Return)
  {
    this.Return = Return;

    this.old_ctx_refresh = this.g.ctx_refresh;
    this.g.ctx_refresh = [5];

    this.g.clearCtx(1);
    //this.g.clearCtx(2);
    this.g.clearCtx(3);
    this.g.clearCtx(4);
    this.g.clearCtx(5);

    await this.g.Album.fadeIn(3, 6 ,0.75,"#676767");

    this.explicitDraw(this.g);
  }
  async arrows(a)
  {
    if (applyArrowStall(a)) return;

    let old = this.unitSelect.get().panel[this.tradeMode];
    let lr = scrollSelect_LR(a, this.unitSelect, false, false);
    if (lr)
    {
      let sel = this.unitSelect.get().panel[this.tradeMode];
      // make sure still points at something valid
      sel.setIdx(Math.min(Math.max(0, sel._ls.length - 1), old.idx()));
      
      sel.updateX(this.ptr);
      sel.updateY(this.ptr);
      
      if (this.state == OBSERVE)
	this.idx1 = sel.idx();
      else
	this.idx2 = sel.idx();

      this.explicitDraw(this.g);
    }
    else
    {
      if (scrollSelect_UD(a, old))
      {
	old.updateY(this.ptr);
	if (this.state == OBSERVE)
	  this.idx1 = old.idx();
	else
	  this.idx2 = old.idx();

	this.explicitDraw(this.g);
      }
    }
  }
  select()
  {
    if (this.state == OBSERVE)
    {
      if (this.unitSelect.get().unit[this.tradeMode].length > 0)
      {
	// move to the other unit's panel
	this.prevObs = this.unitSelect.idx;
	this.unitSelect.next();
	let opp = this.unitSelect.get();
	this._ptr2.setTarget(opp.panel.items);
	this.ptr = this._ptr2;
	this.state = TRADE;

	let u = opp.unit[this.tradeMode];
	if (u.length < this.max[this.tradeMode])
	  u.push(null);

	opp[this.tradeMode] = new LoopSelector(opp.unit[this.tradeMode]);
	let sel = opp.panel[this.tradeMode];
	sel.resetLoopSelector(opp[this.tradeMode]);
	sel.setIdx(sel._ls.length - 1);
	this.idx2 = sel.idx();
	sel.updateX(this.ptr);
	sel.updateY(this.ptr);

	this.explicitDraw(this.g);
      }
    }
    else if (this.state == TRADE)
    {
      let u1 = ((this._ptr1.x < 256)? this.left: this.right);
      let u2 = ((this._ptr2.x < 256)? this.left: this.right);

      let inven1 = u1.unit[this.tradeMode];
      let inven2 = u2.unit[this.tradeMode];

      // swap if not same item
      if (inven1 !== inven2 || this.idx1 != this.idx2)
      {
	let tmp = inven1[this.idx1];
	inven1[this.idx1] = inven2[this.idx2];
	inven2[this.idx2] = tmp;
	this.traded = true;
      }

      this.removeNull(this.left);
      this.removeNull(this.right);
      
      this.resetLoopSelector(this.left);
      this.resetLoopSelector(this.right);

      this.ptr = this._ptr1;
      this.unitSelect.idx = this.prevObs;

      let p = this.unitSelect.get().panel[this.tradeMode];
      this.idx1 = Math.max(0, Math.min(this.idx1, this.unitSelect.get()[this.tradeMode].length - 1));
      p.setIdx(this.idx1);
      p.updateY(this.ptr);
      this.state = OBSERVE;

      this.explicitDraw(this.g);
    }
  }
  inform()
  {
    if (this.state == OBSERVE)
    {
      if (this.tradeMode != "weapons")
	this.tradeMode = "weapons";
      else
	this.tradeMode = "items";

      this.idx1 = Math.max(0, Math.min(this.idx1, this.unitSelect.get()[this.tradeMode].length - 1));

      let p = this.unitSelect.get().panel[this.tradeMode];
      p.setIdx(this.idx1);
      p.updateY(this.ptr);

      this.explicitDraw(this.g);
    }
  }
  cancel()
  {
    if (this.state == OBSERVE)
      this.end();
    else
    {
      this.unitSelect.idx = this.prevObs;
      this.ptr = this._ptr1;
      this.state = OBSERVE;

      if (this.removeNull(this.left))
	this.resetLoopSelector(this.left);
      else if (this.removeNull(this.right))
	this.resetLoopSelector(this.right);

      this.explicitDraw(this.g);
    }

  }
  async end()
  {
    this.g.ctx[4].clearRect(0, 0, 512, 384);
    this.g.ctx[5].clearRect(0, 0, 512, 384);

    await this.g.Album.fadeOut(3, 6 ,0.75,"#676767");
   
    this.explicitDraw(this.g);

    this.g.ctx_refresh = this.old_ctx_refresh;
    this.g.temp.acted = this.g.temp.acted || this.traded;

    this.g.clearCtx(4);
    this.g.clearCtx(5);

    this.reEquip()
    this.Return(this.traded);
  }
  reEquip()
  {
    let leq = null
    let left = this.left.unit
    // check if original equipped weapon still in inventory and also remove markers
    left.weapons.forEach((w,i,_)=>
    {
      if (w.TRADE_EQ_TMP !== undefined && w.TRADE_EQ_TMP == "l")
      {
	leq = i
      }
      delete w.TRADE_EQ_TMP
    });
    // if original equipped weapon still in inventory then requip it
    if (leq !== null)
    {
      left.eqWeap = leq
    }
    // if not in inventory then equip first usable weapon (or 0 if none usable)
    if (leq === null || left.canUseWeapon(left.weapons[left.eqWeap]) == false)
    {
      left.eqWeap = -1
      let i = 0;
      for (let w of left.weapons)
      {
	if (left.canUseWeapon(w))
	{
	  left.eqWeap = i
	  break
	}
	++i;
      }
    }

    let req = null
    let right = this.right.unit
    right.weapons.forEach((w,i,_)=>
    {
      if (w.TRADE_EQ_TMP !== undefined && w.TRADE_EQ_TMP == "r")
      {
	req = i
      }
      delete w.TRADE_EQ_TMP
    });
    if (req !== null)
    {
      right.eqWeap = req
    }
    if (req === null || right.canUseWeapon(right.weapons[right.eqWeap]) == false)
    {
      right.eqWeap = -1
      let i = 0;
      for (let w of right.weapons)
      {
	if (right.canUseWeapon(w))
	{
	  right.eqWeap = i
	  break
	}
	++i;
      }
    }
  }
}
