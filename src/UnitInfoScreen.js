import {Panel, SelectionPanel} from "./Panel.js";
import {PanelType} from "./PanelComponent.js";
import {formattedHP, leftPad} from "./Utils.js";

export class UnitInfoScreen
{
  constructor(g, unit)
  {
    this.g = g;
    this.unit = unit;
    this.state = "observe"; // tooltip
    this._resolve = null;;
  }
  update(g)
  {
  }
  draw(g)
  {
  }
  async explicitDraw(g)
  {
    // base portrait panel
    this.p_portrait.explicitDraw(g, 0);
    
    // unit name
    g.setTextProperty(0, "#000000", "16.5px ABCD Mono", "center");
    g.drawText(0, this.unit.name, 64, 20);

    // unit class
    g.setTextFont(0, "11px ABCD Mono");
    g.drawText(0, this.unit.classname, 64, 40);

    // unit portrait
    g.drawImage(0, this.unit.pArt, 32, 64);
    
    // unit HP
    g.setTextJustify(0, "left");
    g.drawOutlinedText(0, "HP ", 16, 156, "16.5px ABCD Mono Bold", "#ffc635","#000000");
    g.drawText(0, formattedHP(this.unit.stats.hp, this.unit.stats.maxhp), 48, 156);

    // unit LVL
    g.ctx[0].textBaseline = "alphabetic";
    g.drawOutlinedText(0, "LVL", 16, 184, "11px ABCD Mono Bold", "#ffc635","#000000");
    g.setTextFont(0, "16.5px ABCD Mono");
    g.drawText(0, leftPad(this.unit.lvl, 2), 40, 184);

    // unit EXP
    g.drawOutlinedText(0, "EXP", 72, 184, "11px ABCD Mono Bold", "#ffc635","#000000");
    g.setTextFont(0, "16.5px ABCD Mono");
    g.drawText(0, leftPad(this.unit.exp, 2), 96, 184);
    g.ctx[0].textBaseline = "top";

  }
  begin(onDone)
  {
    this.g.Music.setVol(this.g.mapTheme, 0.15);
    this.onDone = onDone;
    // 512, 384
    this.p_portrait = new Panel(0,0, 128, 256);

    this.g.clearCtx(0);
    this.g.clearCtx(1);
    this.g.clearCtx(2);
    this.g.clearCtx(3);
    this.g.clearCtx(4);
    this.g.clearCtx(5);
    this.explicitDraw(this.g);
  }
  arrows(a)
  {
  }
  select()
  {
  }
  inform()
  {
  }
  cancel()
  {
    this.end();
  }
  end()
  {
    this.g.Music.setVol(this.g.mapTheme, 0.5);
    this.onDone();
  }
}
