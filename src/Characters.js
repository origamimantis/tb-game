import {Unit} from "./Unit.js";

export const Characters = 
  {
    "Alfred": { portrait: "P_Alfred",
		deathQuote: ["I've failed... the village..."],
		battleAnimation:
		{ Farmer:
		  { scripts:
		    { idle: "anims/Alfred/Farmer/idle",
		      run:  "anims/Alfred/Farmer/run",
		      hit:  "anims/Alfred/Farmer/hit",
		      crt:  "anims/Alfred/Farmer/crt",
		    }
		  },
		}
	      },
    "Billy":  { portrait: "P_Billy",
		deathQuote: ["Ugh... I shouldn't have eaten\nthat last muffin...", "But it was so... tasty..."],
		battleAnimation:
		{ Farmer:
		  { scripts:
		    { idle: "anims/Billy/Farmer/idle",
		      run:  "anims/Billy/Farmer/run",
		      hit:  "anims/Billy/Farmer/hit",
		      crt:  "anims/Billy/Farmer/crt",
		    }
		  },
		}
	      },
    "Chloe":  { portrait: "P_Chloe",
		deathQuote: ["Ow! That kind of hurts!", "Huh? I'm getting dizzy..."],
		battleAnimation:
		{ Farmer:
		  { scripts:
		    { idle: "anims/Chloe/Farmer/idle",
		      run:  "anims/Chloe/Farmer/run",
		      hit:  "anims/Chloe/Farmer/hit",
		      crt:  "anims/Chloe/Farmer/crt",
		    }
		  },
		}
	      },
    "Timmy":  { deathQuote: ["Ack!"]
	      },


    "generic":
	      { portrait: "P_gen",
		battleAnimation:
		{ "Sword Knight":
		  { scripts:
		    { idle: "anim0",
		      run:  "anim1",
		      hit:  "anim2",
		      crt:  "anim3",
		    }
		  },
		  "Bandit":
		  { scripts:
		    { idle: "anims/generic/Bandit/idle",
		      run:  "anims/generic/Bandit/run",
		      hit:  "anims/generic/Bandit/hit",
		      crt:  "anims/generic/Bandit/hit"
		    }
		  },
		  "Child":
		  { scripts:
		    { idle: "anims/generic/Child/idle",
		      run:  "anims/generic/Child/idle",
		      hit:  "anims/generic/Child/idle",
		      crt:  "anims/generic/Child/idle",
		    }
		  },
		}
	      }



  }
