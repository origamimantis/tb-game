import {DrawContainer, UnitContainer, ScriptDrawer} from "./DrawContainer.js"
import {Camera} from "./Camera.js"
import {Album} from "./Images.js"
import {cursorStop} from "./Utils.js"
import {ARROWS, ARROW} from "./Inputter.js";
import {Coord} from "./Path.js";


import {FPS,
        TICK_RATE,
        C_WIDTH,
        C_HEIGHT,
        SCALE,
	TILES,
        WINDOWGRID_X,
        WINDOWGRID_Y,
        GRIDSIZE_X,
        GRIDSIZE_Y,
        CURSOR_SPEED,
        NUMLAYER,
        TEST_ENABLED} from "./Constants.js";


const WALK_SPEED = 0.0625;


class CollisionBox
{
  constructor(g)
  {
    this.xo = 0.2;
    this.yo = 0.8;
    this.w = 0.6;
    this.h = 0.25;
    this.g = g;
  }
  draw(g)
  {
    if (this.g.unit === null)
      return;
    g.ctx[3].globalAlpha = 1;
    g.ctx[3].fillStyle = "#bb0000";
    g.ctx[3].fillRect(
      (this.g.unit.vis.x + this.xo - this.g.camera.offset.x)*GRIDSIZE_X,
      (this.g.unit.vis.y + this.yo - this.g.camera.offset.y)*GRIDSIZE_Y,
      this.w*GRIDSIZE_X, this.h*GRIDSIZE_Y)
    g.ctx[3].globalAlpha = 1;
  }
  tl()
  {
    let a = new Coord(this.g.unit.vis);
    return a.plus(new Coord(this.xo, this.yo));
  }
  tr()
  {
    return this.tl().plus(new Coord(this.w, 0));
  }
  bl()
  {
    return this.tl().plus(new Coord(0, this.h));
  }
  br()
  {
    return this.tl().plus(new Coord(this.w, this.h));
  }
}

export class WalkScene
{

  constructor( assets, ctx )
  {
    this.windowx = C_WIDTH/SCALE;
    this.windowy = C_HEIGHT/SCALE;
    this.gx = GRIDSIZE_X;
    this.gy = GRIDSIZE_Y;

    this.Map = assets.Map;

    this.ctx = [];
    this.ctx_refresh = [1,2,3,5];
    this.ctx = ctx;

    this.objects = new DrawContainer();
    this.Units = new UnitContainer();

    //this.cursor = new Cursor(this, 0, 0, CURSOR_SPEED);

    this.collide = new CollisionBox(this);
    this.camera = new Camera(this, WINDOWGRID_X, WINDOWGRID_Y);
    //this.objects.set("collisionBox", this.collide);
    this.objects.set("map", this.Map);
    this.objects.set("Units", this.Units);

    this.inputting = false;

    this.unit = null;
  }
  async addUnit( unit, from = null)
  {
    let curTile = this.Map.getTile(unit.x, unit.y);
    if ( curTile != null && curTile.unit == null )
    {
      curTile.unit = unit;
      this.Units.addUnit(unit);
      if (from !== null)
      {
        this.blockInput();
        let dx = unit.x - from.x;
        let dy = unit.y - from.y;
        for (let i = 0; i < 6; ++i)
        {
          unit.vis.x = from.x + i*dx/6;
          unit.vis.y = from.y + i*dy/6;
          await waitTick();
        }
        unit.vis.x = unit.x;
        unit.vis.y = unit.y;
        this.unblockInput();
      }
    }
    else
    {
      console.error( "ERROR - attempted to add unit in position (", unit.x, ", ",unit.y,")!");
    }
  }

  control(unit)
  {
    this.unit = unit;
    this.collide.unit = unit;
    this.camera.setTarget(this.unit);
  }
  beginGame(chscript)
  {
      this.chapterScript = chscript;

    for (let td of chscript.teams)
      this.Units.addTeam(td.name);
    this.initAlliances()

    this.objects.set("scriptItems", new ScriptDrawer(chscript));
    this.camera.setPos(chscript.cameraInit.x, chscript.cameraInit.y);
    this.unblockInput();
    chscript.onBegin(this);

  }
  draw()
  {
    for (let c of this.ctx_refresh)
      Album.clearCtx(c);

    this.objects.draw(this);
    //this.Panels.draw(this);
  }
  update()
  {
    this.objects.update(this);
    this.camera.update(this);
  }
  canMove(xc)
  {
    for (let c of xc)
    {
      c.x = Math.floor(c.x);
      c.y = Math.floor(c.y);
      let t = this.Map.getTile(c);
      if (t === null || t.tile != TILES.ROAD)
	return false;
    }
    return true;
  }
  async arrows(a)
  {
    if (this.unit === null)
      return;
    let delta = new Coord(0,0);
    for (let x of a.once) delta.add(ARROWS[x]);
    for (let x of a.held) delta.add(ARROWS[x]);

    let dx = new Coord(delta.x*WALK_SPEED, 0);
    let xc = [];
    if (delta.x > 0)
    {
      xc.push(this.collide.tr().plus(dx));
      xc.push(this.collide.br().plus(dx));
    }
    else if (delta.x < 0)
    {
      xc.push(this.collide.tl().plus(dx));
      xc.push(this.collide.bl().plus(dx));
    }
    if (this.canMove(xc))
    {
      this.unit.vis.x += dx.x;
      this.unit.x = Math.floor(this.unit.vis.x);
    }
    
    let dy = new Coord(0, delta.y*WALK_SPEED);
    let yc = [];
    if (delta.y > 0)
    {
      yc.push(this.collide.bl().plus(dy));
      yc.push(this.collide.br().plus(dy));
    }
    else if (delta.y < 0)
    {
      yc.push(this.collide.tl().plus(dy));
      yc.push(this.collide.tr().plus(dy));
    }
    if (this.canMove(yc))
    {
      this.unit.vis.y += dy.y;
      this.unit.y = Math.floor(this.unit.vis.y);
    }

    // check each corner of the collision box.  If they lie on a wall tile, restrict movement 
    // ormove as close as possible.




    //Album.draw(4, "C_atk", (tpos.x - this.camera.offset.x)*GRIDSIZE_X, (tpos.y-this.camera.offset.y)*GRIDSIZE_Y);
    //this.unit.y = Math.round(this.unit.vis.y);
  }
  async select()
  {
  }
  async cancel()
  {
  }
  async inform()
  {
  }

  blockInput()
  {
    this.inputting = false;
  }
  unblockInput()
  {
    this.inputting = true;
  }

  ///////////////////////////////////
  // TODO please clean this up future me
  ///////////////////////////////////
  initAlliances()
  {
    let all = this.chapterScript.alliances;
    for (let [a, bb] of Object.entries(all))
    {
      for (let b of bb)
      {
        this.Units.createAlliance(a, b);
      }
    }
  }
  getAffiliation(unit)
  {
    if (unit.team == "Player")
      return "";
    if (this.Units.teamHostile(unit.team, "Player"))
      return "_enemy";
    return "_ally";
  }
  xg(x)
  {
    return this.gx*x;
  }
  yg(y)
  {
    return this.gy*y;
  }
  ///////////////////////////////////




}
