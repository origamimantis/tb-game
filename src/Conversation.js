import {waitTick, waitTime, triggerEvent} from "./Utils.js";
import {Panel} from "./Panel.js"
import {PanelComponent, PanelType} from "./PanelComponent.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {Inputter} from "./Inputter.js";
import {Settings} from "./Settings.js";


// layer 3 gray
// layer 4 base portraits, text box
// layer 5 text, speaker indicator, face animations (TODO)

const Y = 200;
const CONV = {TEXT: 0, SWAP: 1, MUSIC:2, TURN:3, LEAVE:4, ENTER:5, PAUSE:6, CTXT: 7};

export class Conversation
{
  constructor(g)
  {
    this.g = g;
    this.conversation = []; // [{type: (text,swap), data = (string, name)]
    this.speakers = {}; // name : [portrait art, x-position, facing (true := left)]
    this.curSpeaker = null;
    this.convIdx = 0;

    this.textPanel = new Panel(0, 250, 512, 134, 1, 1);
    this.textPanel.createComponent(PanelType.TEXT, "", "text", 0, 0, "black", "13.25px ABCD Mono", "left");
    let t = this.textPanel.components.text;
    t.x += 8;
    t.y += 4;
    this.curMusic = null;
    this.musicContinue = false; //true for cutscenes
    this.mfade = false;
  }
  setMusicContinue(bool)
  {
    this.musicContinue = bool;
  }
  delSpeaker(name)
  {
    delete this.speakers[name];
  }
  addSpeaker(name, portrait, x, facing, initiallyVisible=true)
  {
    this.speakers[name] = [portrait, x, facing, initiallyVisible];
  }
  speaker(name)
  {
    this.conversation.push({type:CONV.SWAP, data:name});
  }
  say(text)
  {
    this.conversation.push({type:CONV.TEXT, data:text});
  }
  turn(name)
  {
    this.conversation.push({type:CONV.TURN, data:name});
  }
  leave(name)
  {
    this.conversation.push({type:CONV.LEAVE, data:name});
  }
  clear()
  {
    this.conversation.push({type:CONV.CTXT});
  }
  enter(name)
  {
    this.conversation.push({type:CONV.ENTER, data:name});
  }
  pause(duration)
  {
    this.conversation.push({type:CONV.PAUSE, data:duration});
  }
  music(name, fadeout, fadein)
  {
    this.conversation.push({type:CONV.MUSIC, data:name, fadeout:fadeout, fadein: fadein });
  }

  drawPortrait(name)
  {
    let [art, x, left] = this.speakers[name];
    if (art !== null)
    {
      let c = this.g.ctx[4];
      if (left)
      {
	c.scale(-1,1);
	c.translate(-512,0);
	x = 512 - x;
      }

      let w = 64*1.5;
      this.g.ctx[4].clearRect( x - w/2, Y - w, w, w);

      this.g.drawImage(4, art, x - w/2, Y-w, w, w);

      if (left)
      {
	c.translate(512,0);
	c.scale(-1,1);
      }
    }
  }
  drawPortraits(g, ctx)
  {
    for (let speaker of Object.keys(this.speakers))
    {
      if (this.speakers[speaker][3] == true)
	this.drawPortrait(speaker);
    }
  }
  async updateConvo()
  {
    if (this.convIdx >= this.conversation.length)
      this.end();
    else
    {
      let part = this.conversation[this.convIdx];
      ++ this.convIdx;

      if (part.type == CONV.TEXT)
	this.updateText(part.data);
      else
      {
	switch(part.type)
	{
	  case CONV.SWAP:
	    this.updateSpeaker(part.data);
	    break;
	  case CONV.MUSIC:
	    await this.updateMusic(part);
	    break;
	  case CONV.TURN:
	    await this.turnSpeaker(part.data);
	    break;
	  case CONV.LEAVE:
	    await this.speakerLeave(part.data);
	    break;
	  case CONV.ENTER:
	    await this.speakerEnter(part.data);
	    break;
	  case CONV.PAUSE:
	    await this.convoPause(part.data);
	    break;
	  case CONV.CTXT:
	    await this.clearText();
	    break;
	}
	await this.updateConvo();
      }
    }
  }
  updateText(text)
  {
    this.textPanel.setComponentData("text", text);
    this.textPanel.explicitDraw(this.g, 4);

    this.g.ctx[5].clearRect( 0, 228, 512, 32);
    this.g.drawImage(5, "C_talk_indicator", this.speakers[this.curSpeaker][1] - 16, 228)
  }
  clearText(text)
  {
    this.textPanel.setComponentData("text", "");
    this.textPanel.explicitDraw(this.g, 4);
    this.g.ctx[5].clearRect( 0, 228, 512, 32);
  }
  async convoPause(time)
  {
    await waitTime(time);
  }
  async speakerLeave(name)
  {
    for (let i = 0; i < 12; ++i)
    {
      this.g.ctx[4].globalAlpha = 1-(i+1)/12
      this.drawPortrait(name);
      await waitTick();
    }
    this.g.ctx[4].globalAlpha = 1;
    await waitTime(250);
  }
  async speakerEnter(name)
  {
    for (let i = 0; i < 12; ++i)
    {
      this.g.ctx[4].globalAlpha = (i+1)/12
      this.drawPortrait(name);
      await waitTick();
    }
    this.g.ctx[4].globalAlpha = 1;
    await waitTime(250);
  }

  async turnSpeaker(name)
  {
    for (let i = 0; i < 4; ++i)
    {
      this.g.ctx[4].globalAlpha = 1-(i+1)/4
      this.drawPortrait(name);
      await waitTick();
    }
    this.speakers[name][2] = !this.speakers[name][2];
    for (let i = 0; i < 4; ++i)
    {
      this.g.ctx[4].globalAlpha = (i+1)/4
      this.drawPortrait(name);
      await waitTick();
    }
    this.g.ctx[4].globalAlpha = 1;
  }
  updateSpeaker(name)
  {
    // TODO maybe put speaker name somewhere

    this.curSpeaker = name;
    this.g.ctx[5].clearRect( 0, 228, 512, 32);
    this.g.drawImage(5, "C_talk_indicator", this.speakers[name][1] - 16, 228)
  }
  // null to stop music
  async updateMusic(part)
  {
    this.mfade = true;
    if (this.curMusic !== null)
    {
      if (part.fadeout)
	await MusicPlayer.fadestop(this.curMusic);
      else
	MusicPlayer.stop(this.curMusic);
    }
    this.curMusic = part.data;

    if (this.curMusic !== null)
    {
      if (part.fadein)
	MusicPlayer.playin(part.data);
      else
	MusicPlayer.play(part.data);
    }
    this.mfade = false;
  }
  
  update(g)
  {
    this.g.temp.mapState.update();
  }
  draw(g)
  {
    this.g.temp.mapState.draw(g);
  }
  arrows(a)
  {
  }
  async select()
  {
    // TODO add text scroll skipping or stuff like that
    if (this.mfade == false)
    {
      triggerEvent("sfx_play_beep_effect")
      await this.updateConvo();
    }
  }
  cancel()
  {
    // TODO too buggy for now
    /*
    if (this.mfade == false)
      this.end();
    */
  }
  inform()
  {
  }
  async begin(Return)
  {
    if (Settings.get("cut_skip") == true)
    {
      Return();
      return;
    }
    
    this.mfade = true;

    this.Return = Return;

    this.old_ctx_refresh = this.g.ctx_refresh;
    this.g.ctx_refresh = [2];

    this.g.clearCtx(1);
    //this.g.clearCtx(2);
    this.g.clearCtx(4);
    this.g.clearCtx(5);

    this.g.ctx[3].fillStyle = "#676767";
    for (let i = 0; i < 12; ++i)
    {
      this.g.ctx[3].clearRect(0, 0, 512, 384);
      this.g.ctx[3].globalAlpha = i*0.04;
      this.g.ctx[3].fillRect(0, 0, 512, 384);
      await waitTick();
    }
  
    this.drawPortraits(this.g, 4);
    this.textPanel.explicitDraw(this.g, 4);
    if (this.conversation.length == 0)
      this.end();
    else
      this.convIdx = 0;

    await this.updateConvo();
    this.mfade = false;
  }
  async end()
  {
    this.mfade = true;
    if (this.curMusic !== null && this.musicContinue == false)
      await MusicPlayer.fadestop(this.curMusic);

    for (let i = 12; i > 0; --i)
    {
      this.g.ctx[3].clearRect(0, 0, 512, 384);
      this.g.ctx[3].globalAlpha = i*0.04;
      this.g.ctx[3].fillRect(0, 0, 512, 384);
      await waitTick();
    }
    this.g.ctx[3].globalAlpha = 1;

    this.g.clearCtx(3);
    this.g.clearCtx(4);
    this.g.clearCtx(5);

    this.g.ctx_refresh = this.old_ctx_refresh;
    this.Return();
  }

}


