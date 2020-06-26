import {LoopSelector} from "./LoopSelector.js"
import {ItemPanel} from "./Panel.js"
import {itemAmtFn, weaponAmtFn, scrollSelect_LR, scrollSelect_UD} from "./Utils.js"


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

    this.unitSelect = new LoopSelector([this.left,this.right]);

    this.left.panel.items = new ItemPanel( TLOFF,Y,WIDTH,HEIGHT, 1, 8, this.left.items, "IT_", itemAmtFn);
    this.left.panel.weapons = new ItemPanel( TLOFF,Y,WIDTH,HEIGHT,1, 8, this.left.weapons, "WT_", weaponAmtFn);
    this.right.panel.items = new ItemPanel( 256+TLOFF,Y,WIDTH,HEIGHT,1, 8, this.right.items, "IT_", itemAmtFn);
    this.right.panel.weapons = new ItemPanel(256+TLOFF,Y,WIDTH,HEIGHT,1, 8, this.right.weapons, "WT_", weaponAmtFn);
    
    this.tradeMode = "weapons";
    this.state = OBSERVE;

    this.onDone = null;
    this.old_ctx_refresh = null;
  }
  update(g)
  {
    this.unitSelect.get().panel[this.tradeMode].update();
  }
  draw(g)
  {
    this.unitSelect.get().panel[this.tradeMode].draw(g);
  }
  explicitDraw(g)
  {
    let b = (this.unitSelect.idx == 0);
    this.left.panel[this.tradeMode].explicitDraw(g, 4, b);
    this.right.panel[this.tradeMode].explicitDraw(g, 4, !b);

  }
  begin(onDone)
  {
    this.onDone = onDone;

    this.old_ctx_refresh = this.g.ctx_refresh;
    this.g.ctx_refresh = [5];

    this.g.clearCtx(1);
    this.g.clearCtx(2);
    this.g.clearCtx(3);
    this.g.clearCtx(4);
    this.g.clearCtx(5);
    this.explicitDraw(this.g);
  }
  async arrows(a)
  {
    let old = this.unitSelect.get().panel[this.tradeMode];
    let lr = scrollSelect_LR(a, this.unitSelect, false);
    if (lr)
    {
      let sel = this.unitSelect.get().panel[this.tradeMode];
      // make sure still points at something valid
      sel.setIdx(Math.min(Math.max(0, sel._ls.length - 1), old.idx()));
      sel.updateY();
      this.explicitDraw(this.g);
    }
    else
    {
      if (scrollSelect_UD(a, old))
	this.explicitDraw(this.g);
    }
  }
  select()
  {
  }
  inform()
  {
    if (this.tradeMode != "weapons")
      this.tradeMode = "weapons";
    else
      this.tradeMode = "items";
    this.explicitDraw(this.g);
  }
  cancel()
  {
    if (this.state == OBSERVE)
      this.end();
    else
    {
      this.state = OBSERVE;
    }

  }
  end()
  {
    this.g.ctx_refresh = this.old_ctx_refresh;
    this.onDone();
  }
}
