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
		    },
		    recolor:
		    {},
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
		    },
		    recolor:
		    {},
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
		      hitr:  "anims/Chloe/Farmer/hitr",
		      crtr:  "anims/Chloe/Farmer/crtr",
		    },
		    recolor:
		    {},
		  },
		}
	      },
    "Timmy":  { portrait: "P_child",
		deathQuote: ["Ack!"]
	      },
    "Vargas":  {
		portrait: "P_lead",
		deathQuote: ["No...\nI was bested by bandits?", "How disappointing..."],
		battleAnimation:
		{ "Sword Knight":
		  { scripts:
		    { idle: "anims/Vargas/SwordKnight/idle",
		      run:  "anims/Vargas/SwordKnight/run",
		      hit:  "anims/Vargas/SwordKnight/hit",
		      crt:  "anims/Vargas/SwordKnight/crt",
		    },
		    recolor:
		    {},
		  },
		},
	      },
    "Yuliza":  {portrait: "P_Yuliza",
                deathQuote: ["oh man oh god oh man oh god"],
		battleAnimation:
		{ "Bow Knight":
		  { scripts:
		    { idle: "anims/Yuliza/BowKnight/idle",
		      run:  "anims/Yuliza/BowKnight/run",
		      hitr:  "anims/Yuliza/BowKnight/hit",
		      crtr:  "anims/Yuliza/BowKnight/crt"
		    },
		    recolor:
		    {},
		  },
		},
	      },

    "Malidale":  {portrait: "P_Malidale",
                deathQuote: ["i do be deadge"],
		battleAnimation:
		{ "Bow Knight":
		  { scripts:
		    { idle: "anims/Malidale/BowKnight/idle",
		      run:  "anims/Malidale/BowKnight/run",
		      hitr:  "anims/Malidale/BowKnight/hit",
		      crtr:  "anims/Malidale/BowKnight/crt"
		    },
		    recolor:
		    {},
		  },
		},
	      },





    "generic":
	      { portrait: "P_gen",
		battleAnimation:
		{ "Sword Knight":
		  { scripts:
		    { idle: "anims/generic/ranged/idle",
		      run:  "anims/generic/ranged/run",
		      hitr:  "anims/generic/ranged/hit",
		      crtr:  "anims/generic/ranged/hit"
		    },
		    recolor:
		    {},
		  },
		  "Bandit":
		  { scripts:
		    { idle: "anims/generic/Bandit/idle",
		      run:  "anims/generic/Bandit/run",
		      hit:  "anims/generic/Bandit/hit",
		      crt:  "anims/generic/Bandit/hit"
		    },
		    recolor:
		    { "":       [ [[0,0,255],[255,255,255]] ],
		      "_enemy": [ [[0,0,255],[255,0,0]] ]
		    },
		  },
		  "Child":
		  { scripts:
		    { idle: "anims/generic/Child/idle",
		      run:  "anims/generic/Child/idle",
		      hit:  "anims/generic/Child/idle",
		      crt:  "anims/generic/Child/idle",
		    },
		    recolor:
		    {},
		  },
		  "Bow Knight":
		  { scripts:
		    { idle: "anims/generic/ranged/idle",
		      run:  "anims/generic/ranged/run",
		      hitr:  "anims/generic/ranged/hit",
		      crtr:  "anims/generic/ranged/crt"
		    },
		    recolor:
		    { "":       [ [[0,0,255],[255,255,255]] ],
		      "_enemy": [ [[0,0,255],[255,0,0]] ]
		    },
		  },
		  "Mage Knight":
		  { scripts:
		    { idle: "anims/generic/test/idle",
		      run:  "anims/generic/test/run",
		      hitr:  "anims/generic/test/hit",
		      crtr:  "anims/generic/test/hit"
		    },
		    recolor:
		    { "":       [ [[0,0,255],[255,255,255]] ],
		      "_enemy": [ [[0,0,255],[255,0,0]] ]
		    },
		  },



		}
	      }



  }
