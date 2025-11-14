// ===============================
// CHARACTER SELECTION (CARD-BASED) - FIXED VERSION
// ===============================
//Creating shorthand and formatting for pushing information to the game log
const log = (text) => gameState.gameLog.push(text + "\n");

document.addEventListener('DOMContentLoaded', () => {
  const landing = document.getElementById('landing');
  const gameArea = document.getElementById('gameArea');
  const startBtn = document.getElementById('startGame');

  const CHARACTERS = { warrior: Orrick, mage: Flourish, dog: Poe };
  let selectedCharacter = null;

  document.querySelectorAll('.characterCard').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.characterCard').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedCharacter = CHARACTERS[card.dataset.char] || null;
      startBtn.disabled = false;
    });
  });

  startBtn.addEventListener('click', () => {
    if (!selectedCharacter) {
      alert('Please select a character first!');
      return;
    }
    gameState.player = selectedCharacter;

    const display = document.getElementById('characterDisplay');
    display.innerHTML = `
    <h4>${gameState.player.name}</h4>
    <p>${gameState.player.description}</p>
    <br>
    <p><strong>Health:</strong> ${gameState.player.health}/${gameState.player.maxHealth} | 
     <strong>Attack:</strong> ${gameState.player.attackPower}</p>`;

    landing.classList.add('collapsed');
    gameArea.classList.add('visible');
    gameState.gameLog = [];
    log(
      `You have chosen **${gameState.player.name}**.\n` +
      `Health: ${gameState.player.health}/${gameState.player.maxHealth} | ` +
      `Attack: ${gameState.player.attackPower}\n\n` +
      "The weather continues to be miserable as you arrive at the Grand Archive. Rain spits in your face and mud grips your "+
      "shoes as if trying to talk you out of getting closer, adding to your apprehension of the chaos waiting inside. \nThe large"+
      " wooden doors groan as you haul them open and, in surprising contrast to what you expected, the atmosphere is quite pleasant! "+
      "Warm lamplight glows across the polished tile floor of the oversized reception hall. High shelves line the walls, filled with"+
      " neat ledgers and visitor registers; their order almost defiant against the storm outside. A wide archway dominates the far"+
      " wall amd through its carved wooden frame, you can make out a corridor leading deeper into the Archive. To your right, a "+
      "sweeping spiral staircase coils upward into shadow, presumably toward the observatory you saw from outside. \nAt the center "+
      "of the hall stands an elderly scholar. He watches you with a mixture of urgency and relief, as though he's been waiting "+
      "far too long for someone to finally step through those doors." +
      "\n\nHow will you proceed? Type 'Help' for hints."
    );
    renderGameLog();
    document.getElementById('commandInput').focus();
  });
});

// ===============================
// Classes
// ===============================
class PlayerCharacter {
  constructor(name, description, maxHealth, health, attackPower, inventory) {
    this.name = name;
    this.description = description;
    this.maxHealth = maxHealth; //for calculating healing from items
    this.health = health;
    this.attackPower = attackPower;
    this.inventory = inventory;
  };

  takeDamage(amount) {
    this.health = Math.max(0, this.health - Math.max(0, amount));
    refreshSidebar();
  };

  attack(target) {
    if (!target) return 0;
    const dmg = Math.max(0, this.attackPower);
    target.health = Math.max(0, target.health - dmg);
    return dmg; //for logging
  };

  pickUpItem(item) {
    if (!this.inventory) this.inventory = [];
      this.inventory.push(item);
      renderGameLog();
  };

  viewInventory() {
    const inv = gameState.player?.inventory;
    if (inv.length === 0) {
      log("Your bag is empty.");
    } else {
      const names = inv.map(i => i.name).join(", ");
      log("You open your bag and see\n" + names + ".");
    }
  renderGameLog();
  }

  useItem(item) {
  if (!item || typeof item.name !== "string") {
    return "Please choose an item by number first.";
  }

  //Calculating amount of health to be restored
  if (item.type === "healing") {
    const healAmount = Math.floor(this.maxHealth * 0.3);
    this.health = Math.min(this.maxHealth, this.health + healAmount);

    //Removing the used item by reference
    const idx = this.inventory.indexOf(item);
    if (idx !== -1) this.inventory.splice(idx, 1);

    return `You drink ${item.name} and recover ${healAmount} HP. Your health is now ${this.health}/${this.maxHealth}.`;
  }
  return `You can't use this right now.`;
  }
};

class NPC {
  constructor(name, description, health, attackPower, searchReaction, dialogue, hostile) {
    this.name = name;
    this.description = description;
    this.health = health;
    this.attackPower = attackPower;
    this.searchReaction = searchReaction;
    this.dialogue = dialogue;
    this.hostile = hostile;
  }
}

class Location {
  constructor(name, description, connectedLocations, characters, items) {
    this.name = name;
    this.description = description;
    this.connectedLocations = connectedLocations;
    this.characters = characters;
    this.items = items;
  }

  enterLocation() {
    return this.description;
  }

  searchLocation() {
    if (this.items.length === 0 && this.characters.length === 0) {
      return `You scan the ${this.name.toLowerCase()}, but find nothing out of place.`;
    }

    const lines = [];

    if (this.items.length > 0) {
      const names = this.items.map(item => item.name).join(" and ");
      lines.push(`Among the clutter, you spot ${names}.`);
    }

    const reactions = buildSearchReaction(this.characters);
    if (reactions) {
      lines.push(reactions);
    }

    return lines.join(" ");
  }

  //Validating that a destination is reachable
  move(newLocation) {
    return Array.isArray(this.connectedLocations)
      && this.connectedLocations.some(link => link.to === newLocation);
  }
}

class Item {
  constructor(name, type, description, value) {
    this.name = name;
    this.type = type;
    this.description = description;
    this.value = value;
  }
}

// ===============================
// Items
// ===============================
const healthPot = new Item(
  "a health Pot",
  "healing",
  "A small flask filled with magical liquid. Heals user for 30% of max HP.",
  20
);

const riteOfCleansing = new Item(
  "a torn page",
  "quest",
  "A weathered page with faded ink and frayed edges. It appears to describe a spell called the Rite " +
  "of Cleansing. It may prove useful later.",
  0
);

const laughingTome = new Item(
  "Laughing Tome",
  "quest",
  "A heavily gilded tome emitting a strange purple aura and cackling endlessly. When you caught it floating around the library, it opened to a passage about a constellation called 'The Three Sisters'.",
  0
);

// ===============================
// Playable Characters
// ===============================
const Orrick = new PlayerCharacter(
  "Orrick Durnhald",
  "Once a knight of great renown, Orrick carries his past like a shadow. Steadfast and valiant despite his scars, his "+
  "strength is matched only by the weight of the memories he can't let go.",
   120, 
   120, 
   90, 
   [healthPot]);
const Flourish = new PlayerCharacter(
  "Flourish Pendergast",
  "Master of hexes and hidden lore, Flourish laughs in the face of safer schools of spellcraft. No amount of danger can dampen her curiosity.",
   90, 
   90, 
   120, 
   [healthPot]);
const Poe = new PlayerCharacter(
  "Poe", 
  "Don't let the fluffy tail fool you. Poe is a steadfast and spirited little dog, ready to follow the path of a true hero.",
  300, 
  300, 
  30, 
  [healthPot]);

// ===============================
// NPCs
// ===============================
const headArchivist = new NPC(
  "Head Archivist Jerrod",
  "A tall, stooped man with a hunched back earned from many years bent over tomes and scrolls. Despite his creased face and poor posture, his eyes sparkle with childlike curiosity.",
  1,
  0,
  "Head Archivist Jerrod jumps slightly as he looks up from his paperwork, clearly startled to see another soul about in the Archive.",
  [{prompt: "Greet Head Archivist Jerrod", 
    reply: "\"Ah, a visitor! You must be the Seeker the Guild told us to expect; thank you for helping us with our little... Issue.\""},
   {prompt: "Ask about what happened",
    reply: "Jerrod's face crumples pensively for a moment before he responds. \"It began a few nights ago... books flying from "+
    "the shelves, ink draining clean off the pages as though the words themselves were fleeing. Whole rooms have folded in on themselves,"+
    " and the library's corridors no longer lead where they should. Whatever is festering in the Forbidden Archive, it's spreading. Though,"+
    " oddly enough, the hallway to the library has twisted itself into such a maze even the curses can't get through.\""}, 
   {prompt: "Ask if anyone is in immediate danger",
    reply: "\"The Archive has been cleared for everyone's safety bar myself and Astrologian Thane- there's no getting that man out of the observatory.\""},
   {prompt: "Ask where to begin",
    reply: "\"Head through the archway behind me to get to the heart of the trouble. Though I must warn you, the hallway has become rather impenetrable "+
    "since the curse took hold. Though I suppose you could pay a visit to Astrologian Thane in the observatory if you wanted to work up to it.\""},
   {prompt: "End conversation", 
    reply: "You thank the Head Archivist and take your leave."}],
  false
);

const astrologianThane = new NPC(
  "Astrologian Thane",
  "A kooky gentleman with ink-stained fingers and rumpled robes that smells faintly of jasmine. He clearly only leaves the Observatory when absolutely necessary.",
  1,
  0,
  "Astrologian Thane glances absently in your direction before returning to his research.",
  [],
  false
);

const biblios = new NPC(
  "Biblios",
  "A large, horned creature, its body dripping with black ink that obscures every feature. Only half-emerged from the book that binds it, its sheer presence makes your hair stand on end.",
  310,
  30,
  "The grotesque creature reaches out to you as it tries to free itself, making an indescernable gurgle.",
  [{prompt: "Attempt to communicate with the creature", reply: "It writhes and continues to reach for you. You almost feel tempted to take it's hand..."},
   {prompt: "Use the Rite of Cleansing on Biblios", reply: "Wait... That old page you found!", action: "Cleanse"},
   {prompt: "End Conversation", reply: "You back away slowly from the dripping mass, careful to stay out of its reach."}],
  true
);

// ==================================================================
// Locations
// ==================================================================
const receptionHall = new Location(
  "Reception Hall",
  "An oversized reception hall with polished tile floors, wood panelled walls and a large, ornately carved archway leading to the rest of the building.",
  [],
  [headArchivist],
  []
);

const hallway = new Location(
  "Hallway",
  "Walking through the arched entrance, you see the once simple path to the main library twisted into a complex maze with no end in sight."+
  " It seems the only way through is to keep moving and hope you eventually find the end.",
  [],
  [],
  []
);

const observatory = new Location(
  "Observatory",
  "A shockingly cluttered room filled with notes and astrological tomes scattered on the tables lining the walls. A large telescope fills the center of the room, angled to look out the domed glass ceiling.",
  [],
  [astrologianThane],
  [riteOfCleansing, healthPot]
);

const library = new Location(
  "Library",
  "Your relief from exiting that silly maze is quickly replaced with awe as you're overwhelmed by the sight before you."+
  " Books are ripping themselves from the shelves or flapping lazily through the air, some swooping low enough that "+
  "you could grab them if you tried. \nRaw magic pops like firecrackers amid the stacks, and a sickly purple mist coils"+
  " through the library, thickening as it drifts toward a strange, shining seal blocking the entrance to the Forbidden"+
  " Archives. Whatever caused this outbreak, the worst of it is surely waiting behind that barrier.",
  [],
  [],
  [laughingTome]
);

const forbiddenArchive = new Location(
  "Forbidden Archive",
  "The air grows colder with each step you take down the spiraling stairs. The sickly purple mist thickens, "+
  "clinging to your clothes like damp cobwebs. By the time you reach the bottom, the world feels muffled… as "+
  "though the Archive itself is holding its breath.\n\n"+
  "At the center of the chamber lies a great tome, splayed open on the floor. Its pages flutter violently, as "+
  "if caught in a hurricane that only it can feel. Ink pools around the book as a black, dripping creature rises"+
  " from it, writhing and twisting against the glowing seal scrawled across the stone. Each impact makes the "+
  "sigil flicker, threatening to fail.",
  [],
  [biblios],
  []
);

//Connecting locations
receptionHall.connectedLocations = [
  { label: "north", to: hallway },
  { label: "upstairs", to: observatory }
];

hallway.connectedLocations = [
  { label: "south", to: receptionHall },
  { label: "north", to: library }
];

observatory.connectedLocations = [
  { label: "downstairs", to: receptionHall }
];

library.connectedLocations = [
  { label: "south", to: hallway },
  { label: "east", to: forbiddenArchive }
];

forbiddenArchive.connectedLocations = [
  { label: "west", to: library }
];

// ==================================================================
// Game State
// ==================================================================
const gameState = {
  player: null,
  currentLocation: receptionHall,
  gameLog: [],
  gameOver: false,
  pendingChoice: null,
  lastAction: null,
  flags: { hallwayMazeSolved: false, sealPuzzleSolved: false, bibliosCleansed: false }
};

//Tracking actions taken to ensure they are made in an actionable order
function markAction(name) {
  gameState.lastAction = name;
};

// ==================================================================
// Rendering
// ==================================================================
//Updating text display of the DOM
function renderGameLog() {
  const logDiv = document.getElementById("gameLog");
  if (!logDiv) return;
  logDiv.innerText = gameState.gameLog.join("\n");
  
  //Auto-scrolling text area to bottom
  const textDisplay = document.querySelector('.textDisplay');
  if (textDisplay) {
    textDisplay.scrollTop = textDisplay.scrollHeight;
  }
};

//Returning inventory as a numbered list
function itemListString(items) {
  return items.map((it, idx) => `${idx + 1}) ${it.name} - ${it.description}`).join("\n");
};

//Updating sidebar to reflect current health when damage taken
function refreshSidebar() {
  const display = document.getElementById('characterDisplay');
  if (gameState.player) {
    display.innerHTML = `
      <h4>${gameState.player.name}</h4>
      <p>${gameState.player.description}</p>
      <br>
      <p><strong>Health:</strong> ${gameState.player.health}/${gameState.player.maxHealth} | 
         <strong>Attack:</strong> ${gameState.player.attackPower}</p>
    `;
  }
}

// ==================================================================
// Commands
// ==================================================================
//Starting loop that moves the player
function moveLocations() {
  const movingFrom = gameState.currentLocation;
  const connected = movingFrom?.connectedLocations || [];

  //Gate: Hallway maze must be solved before normal movement
  if (movingFrom === hallway && !gameState.flags.hallwayMazeSolved) {
    startHallwayMaze();
    return;
  }

  //Gate: Offer seal interaction in the Library until solved
  if (movingFrom === library && !gameState.flags.sealPuzzleSolved) {
    const filtered = connected.filter(opt => opt.to !== forbiddenArchive);

    const lines = filtered.map((opt, i) => 
      `${i + 1}) Go ${opt.label} to ${opt.to.name}`
    );
    const sealIndex = filtered.length + 1;
    lines.push(`${sealIndex}) Inspect the seal`);

    gameState.pendingChoice = { 
      type: "library-exits", 
      moveOptions: filtered, 
      sealIndex 
    };
    log("Where would you like to go?\n" + lines.join("\n"));
    renderGameLog();
    return;
  }

  //Normal movement
  const optionList = connected.map((opt, idx) => 
    `${idx + 1}) Go ${opt.label} to ${opt.to.name}`
  );

  gameState.pendingChoice = { type: "move", options: connected };
  log("Where would you like to go?\n" + optionList.join("\n"));
  renderGameLog();
}

//Starting loop that confirms what players would pick up
function startPickUpFlow() {
  const here = gameState.currentLocation;
  const items = here.items;

  if (!Array.isArray(items) || items.length === 0) {
    log("There's nothing here to pick up.");
    renderGameLog();
    return;
  }

  //Picking up items until done/no items are left
  gameState.pendingChoice = { type: "pickup", options: items };
  const menu = itemListString(items) + "\n0) Done";
  log("What would you like to pick up?\n" + menu);
  renderGameLog();
};

function listItemsNumbered(items) {
  return items.map((it, i) => `${i + 1}) ${it.name}`).join("\n");
}

function startUseItemFlow() {
  const inv = gameState.player?.inventory || [];
  if (inv.length === 0) {
    log("Your bag is empty.");
    renderGameLog();
    return;
  }
  gameState.pendingChoice = { type: "use", options: inv.slice() };
  log("Which item would you like to use?\n" + listItemsNumbered(inv));
  renderGameLog();
}

//Checking for hostile NPCs
function getHostileHere() {
  const here = gameState.currentLocation;
  if (!here || !Array.isArray(here.characters)) return null;
  return here.characters.find(npc => npc.hostile && npc.health > 0) || null;
};

//looping combat scenario until battle is resolved
function showCombatMenu(foe) {
  gameState.pendingChoice = { type: "combat", foe: foe };
  log(
    "You are locked in combat. Choose:\n" +
    "1) Attack\n" +
    "2) Use item"
  );
  renderGameLog();
}

//Processing turn-based scenario
function attackEnemy() {
  const foe = getHostileHere();

  if (!foe) {
    log("There's nothing hostile here to attack.");
    renderGameLog();
    return;
  }

  //Player turn
  const dealt = gameState.player.attack(foe);
  log(`You strike ${foe.name} for ${dealt} damage. (${foe.health} HP left)`);

  //If victory
  if (foe.health <= 0) {
    log(
      `${foe.name} melts into a pool of ink, soaking the pages it was so desperate to escape from. ` +
      `You will never know the book's contents but the cursed magic is dispelled and you are victorious!`
    );
    renderGameLog();
    return;
  }

  //Enemy turn
  log("The creature still reaches for you, fighting the book that binds it before lashing out violently...");
  const incoming = Math.max(0, foe.attackPower);
  gameState.player.takeDamage(incoming);
  log(`${foe.name} lashes back for ${incoming} damage. (You: ${gameState.player.health}/${gameState.player.maxHealth})`);

  //If defeated after enemy hit
  if (gameState.player.health <= 0) {
    log("Your vision fades to black... \nAfter your defeat, Biblios escapes and plunges Scriptoria into chaos.");
    gameState.gameOver = true;
    renderGameLog();
    return;
  }

  //Stay in combat
  showCombatMenu(foe);
  renderGameLog();
}

function talkTo() {
  const here = gameState.currentLocation;
  if (!here || !Array.isArray(here.characters) || here.characters.length === 0) {
    log("There's no one here to talk to.");
    renderGameLog();
    return;
  }

  //Listing characters that have dialogue to choose from
  const candidates = [];
  for (let i = 0; i < here.characters.length; i++) {
    const npc = here.characters[i];
    if (npc && Array.isArray(npc.dialogue) && npc.dialogue.length > 0) {
      candidates.push(npc);
    }
  }

  const names = [];
  for (let i = 0; i < candidates.length; i++) {
    names.push((i + 1) + ") " + candidates[i].name);
  }

  gameState.pendingChoice = { type: "talk-npc", options: candidates };
  log("Who would you like to talk to?\n" + names.join("\n"));
  renderGameLog();
};

function getHelp() {
  log(
    "Commands: move, search, pick up, inventory, use, attack, help\n" +
    "Type a command. For choices, type the number shown."
  );
  renderGameLog();
};

//Setting custom responses depending on present NPCs during search
function buildSearchReaction(characters) {
  if (!Array.isArray(characters) || characters.length === 0) {
    return "";
  }

  const npc = characters[0];
  if (npc && typeof npc.searchReaction === "string" && npc.searchReaction.trim() !== "") {
    return npc.searchReaction;
  }

  return "";
};

//Attempting to cleanse Biblios with the Rite of Cleansing
function performCleansing() {
  const here = gameState.currentLocation;

  //Checking if in correct location
  if (here !== forbiddenArchive) {
    log("This is not the right place to use the rite.");
    renderGameLog();
    return false;
  }

  //Checking if correct target
  if (!biblios || biblios.health <= 0) {
    log("There is nothing here that needs cleansing.");
    renderGameLog();
    return false;
  }

  //Checking inventory for needed item
  const inv = gameState.player && Array.isArray(gameState.player.inventory) ? gameState.player.inventory : [];
  let pageIndex = -1;
  for (let i = 0; i < inv.length; i++) {
    const it = inv[i];
    if (it && typeof it.name === "string" && it.name.toLowerCase() === "a torn page") {
      pageIndex = i;
      break;
    }
  }

  if (pageIndex === -1) {
    log("You are missing the Rite of Cleansing.");
    renderGameLog();
    return false;
  }

  //Consuming the page and resolve the encounter
  inv.splice(pageIndex, 1);
  biblios.health = 0;
  gameState.flags.bibliosCleansed = true;
  gameState.gameOver = true;
  gameState.pendingChoice = null;

  log(
   "You raise the torn page and speak the words. The ink recoils, hissing. " +
  "As it fizzles away, a shape begins to emerge; a proud, horned spirit bathed in golden light. " +
  "The corruption falls from him like ash, and the once-cursed archives glow with warmth.\n\n" +
  "The guardian deity of knowledge and history, Biblios, thanks you for your mercy and praises your choice " +
  "to heal rather than destroy. With the curse broken and peace restored, you inform Jerrod that your quest " +
  "is complete and set out to report back to the guild.\n\n" +
  "Congratulations on an outstanding victory!"
  );
  renderGameLog();
  return true;
};

//Starting the hallway maze by initializing answer key
const HALLWAY_MAZE_SEQUENCE = [2, 3, 1];

function startHallwayMaze() {
  gameState.pendingChoice = { type: "maze", progress: 0 };
  log(
    "The hallway warps and bends inexplicably. You have no choice but to trust your instincts.\n" +
    "Choose a path:\n" +
    "1) Left\n" +
    "2) Right\n" +
    "3) Straight\n" +
    "0) Give up"
  );
  renderGameLog();
}

//Initializing choices for archive seal puzzle
const SEAL_OPTIONS = [
  "Altairen's Path",
  "The Lyre",
  "Virellion",
  "The Three Sisters",
  "The Crowned Serpent",
  "Oberon's Forge"
];

function startSealPuzzle() {
  gameState.pendingChoice = { type: "seal" };
  const lines = [];
  for (let i = 0; i < SEAL_OPTIONS.length; i++) {
    lines.push((i + 1) + ") " + SEAL_OPTIONS[i]);
  }
  lines.push("0) Step away");

  log(
    "The way to the Forbidden Archive is blocked by a magical barrier. The intricate glowing sigil is ringed with what looks like constellations; "+
    "You feel compelled to draw one in the middle. Which do you choose?\n" +
    lines.join("\n")
  );
  renderGameLog();
};

//==================================================================
// Input handling
//==================================================================
const submitCommand = document.getElementById("submitCommand");
const commandInput = document.getElementById("commandInput");

function readCommand() {
  console.log("readCommand wired");
  const command = (commandInput.value || "").trim().toLowerCase();

  //==================================================================
  // MOVE
  //==================================================================
  if (gameState.pendingChoice?.type === "move") {
    const choiceIndex = parseInt(command, 10) - 1;
    const options = gameState.pendingChoice.options;

    if (Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < options.length) {
      const { label, to: destination } = options[choiceIndex];
      const activeLocation = gameState.currentLocation;

      if (activeLocation.move(destination)) {
        gameState.currentLocation = destination;
        log(`You go ${label} to the ${destination.name}.`);
        log(destination.enterLocation());
        gameState.pendingChoice = null;
      } else {
        log("That way isn't available.");
      }
    } else {
      log("Please enter a number from the list.");
    }

    markAction("move");
    renderGameLog();
    commandInput.value = "";
    return;
  }

  //==================================================================
  // PICK-UP
  //==================================================================
  if (gameState.pendingChoice?.type === "pickup") {
    const choiceIndex = parseInt(command, 10) - 1;
    const options = gameState.pendingChoice.options;

    if (Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < options.length) {
      const item = options[choiceIndex];
      const items = gameState.currentLocation.items;
      const position = items.indexOf(item);
      if (position !== -1) items.splice(position, 1);

      if (!gameState.player) {
        log("You don't have a selected character yet!");
      } else {
        gameState.player.pickUpItem(item);
        log(`You pick up ${item.name}.`);
      }

      if (items.length > 0) {
        gameState.pendingChoice = { type: "pickup", options: items };
        const menu = itemListString(items) + "\n0) Done";
        log("What would you like to pick up?\n" + menu);
      } else {
        gameState.pendingChoice = null;
      }
    } else if (command !== "0") {
      log("Please enter a number from the list.");
    } else {
      gameState.pendingChoice = null;
    }

    renderGameLog();
    commandInput.value = "";
    return;
  }

  //==================================================================
  // USE ITEM
  //==================================================================
  if (gameState.pendingChoice?.type === "use") {
    const choiceIndex = parseInt(command, 10) - 1;
    const { options, returnTo, foe } = gameState.pendingChoice;

    if (Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < options.length) {
      const item = options[choiceIndex];
      const result = gameState.player.useItem(item);
      log(result);
      gameState.pendingChoice = null;

      if (returnTo === "combat" && foe && foe.health > 0 && gameState.player.health > 0) {
        showCombatMenu(foe);
      }
    } else {
      log("Please enter a number from the list.");
    }

    renderGameLog();
    commandInput.value = "";
    return;
  }

  //==================================================================
  // TALK – NPC selection
  //==================================================================
  if (gameState.pendingChoice?.type === "talk-npc") {
    const choiceIndex = parseInt(command, 10) - 1;
    const options = gameState.pendingChoice.options;

    if (Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < options.length) {
      const npc = options[choiceIndex];

      //Filter Biblios dialogue if the player lacks the torn page
      if (npc === biblios) {
        const inv = gameState.player?.inventory || [];
        const hasPage = inv.some(it => it.name.toLowerCase() === "a torn page");
        if (!hasPage) {
          npc.dialogue = npc.dialogue.filter(d => !d.prompt.toLowerCase().includes("rite of cleansing"));
        }
      }

      if (!Array.isArray(npc.dialogue) || npc.dialogue.length === 0) {
        log(`${npc.name} has nothing to discuss right now.`);
        gameState.pendingChoice = null;
        renderGameLog();
        commandInput.value = "";
        return;
      }

      const prompts = npc.dialogue.map((entry, i) => `${i + 1}) ${entry.prompt}`);

      gameState.pendingChoice = { type: "talk-topic", npc, options: npc.dialogue };
      log(`What would you like to discuss with ${npc.name}?\n${prompts.join("\n")}`);
    } else {
      log("Please enter a number from the list.");
    }

    renderGameLog();
    commandInput.value = "";
    return;
  }

  //==================================================================
  // TALK – topic selection
  //==================================================================
if (gameState.pendingChoice?.type === "talk-topic") {
    const choiceIndex = parseInt(command, 10) - 1;
    const { npc, options } = gameState.pendingChoice;

    if (Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < options.length) {
      const entry = options[choiceIndex];

      //Check for special action
      if (entry.action === "cleanse") {
        if (performCleansing()) {
          //Success: victory handled inside performCleansing()
          gameState.pendingChoice = null;
        } else {
          //Failed: show message and continue dialogue
          log("There must be a way to purify this creature instead of cleansing it...");
          const prompts = npc.dialogue.map((d, i) => `${i + 1}) ${d.prompt}`);
          log(`What would you like to discuss with ${npc.name}?\n${prompts.join("\n")}`);
        }
      } else {
        //Normal dialogue
        log(entry.reply);

        const isEnd = entry.prompt?.toLowerCase().includes("end conversation");
        if (isEnd) {
          gameState.pendingChoice = null;
        } else {
          const prompts = npc.dialogue.map((d, i) => `${i + 1}) ${d.prompt}`);
          gameState.pendingChoice = { type: "talk-topic", npc, options: npc.dialogue };
          log(`What would you like to discuss with ${npc.name}?\n${prompts.join("\n")}`);
        }
      }
    } else {
      log("Please enter a number from the list.");
    }

    renderGameLog();
    commandInput.value = "";
    return;
  }

  //==================================================================
  // COMBAT
  //==================================================================
  if (gameState.pendingChoice?.type === "combat") {
    const choiceIndex = parseInt(command, 10);
    const foe = gameState.pendingChoice.foe;

    if (choiceIndex === 1) {
      attackEnemy();
    } else if (choiceIndex === 2) {
      const inv = gameState.player?.inventory || [];
      if (inv.length === 0) {
        log("Your bag is empty.");
        renderGameLog();
      } else {
        gameState.pendingChoice = { type: "use", options: inv.slice(), returnTo: "combat", foe };
        log(`Which item would you like to use?\n${listItemsNumbered(inv)}`);
        renderGameLog();
      }
    } else {
      log("Please enter a number from the list.");
      renderGameLog();
    }

    commandInput.value = "";
    return;
  }

  //==================================================================
  // HALLWAY MAZE
  //==================================================================
  if (gameState.pendingChoice?.type === "maze") {
    const raw = command.trim();

    if (raw === "0") {
      log("Overwhelmed by the unsettling aura it emits, you step back from the shifting corridor.");
      gameState.pendingChoice = null;
      renderGameLog();
      commandInput.value = "";
      return;
    }

    const choice = parseInt(raw, 10);
    const progress = gameState.pendingChoice.progress | 0;
    const expected = HALLWAY_MAZE_SEQUENCE[progress];

    if (Number.isInteger(choice) && choice >= 1 && choice <= 3) {
      if (choice === expected) {
        gameState.pendingChoice.progress = progress + 1;
        if (gameState.pendingChoice.progress >= HALLWAY_MAZE_SEQUENCE.length) {
          gameState.flags.hallwayMazeSolved = true;
          gameState.pendingChoice = null;
          log(
            "The hall heaves and contorts nauseatingly until the path to the Library is directly ahead of you. " +
            "Well done! You can now pass freely between the library and the reception hall."
          );
          renderGameLog();
          commandInput.value = "";
          return;
        }
        log(
          "The corridor creaks and groans as it shifts again. Choose:\n1) Left\n2) Right\n3) Straight\n0) Give up"
        );
      } else {
        log("A wrong turn dumps you unceremoniously at the start of the maze.");
        gameState.pendingChoice.progress = 0;
        log("Choose:\n1) Left\n2) Right\n3) Straight\n0) Give up");
      }
    } else {
      log("Please enter a number from the list.");
    }

    renderGameLog();
    commandInput.value = "";
    return;
  }

  //========================================================
  // SEAL PUZZLE
  //========================================================
  if (gameState.pendingChoice?.type === "seal") {
    const raw = command.trim();

    if (raw === "0") {
      log("You decide to investigate elsewhere.");
      gameState.pendingChoice = null;
      renderGameLog();
      commandInput.value = "";
      return;
    }

    const choice = parseInt(raw, 10);
    if (!Number.isInteger(choice) || choice < 1 || choice > SEAL_OPTIONS.length) {
      log("Please enter a number from the list.");
      renderGameLog();
      commandInput.value = "";
      return;
    }

    if (choice === 4) { //The Three Sisters is correct
      gameState.flags.sealPuzzleSolved = true;
      gameState.pendingChoice = null;
      log("The Three Sisters glows with a gentle light before the seal flickers out. The Archive now stands open.");
    } else {
      log("The glyphs flare angrily and reset. If only you had a hint...");
      const lines = SEAL_OPTIONS.map((opt, i) => `${i + 1}) ${opt}`);
      lines.push("0) Step away");
      log(lines.join("\n"));
    }

    renderGameLog();
    commandInput.value = "";
    return;
  }

  //========================================================
  // LIBRARY EXIT + SEAL INSPECTION
  //========================================================
  if (gameState.pendingChoice?.type === "library-exits") {
    const choiceIndex = parseInt(command, 10) - 1;
    const { moveOptions, sealIndex } = gameState.pendingChoice;

    if (Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < moveOptions.length) {
      const { label, to: destination } = moveOptions[choiceIndex];
      const activeLocation = gameState.currentLocation;

      if (activeLocation.move(destination)) {
        gameState.currentLocation = destination;
        log(`You go ${label} to the ${destination.name}.`);
        log(destination.enterLocation());
        gameState.pendingChoice = null;
      } else {
        log("That way isn't available.");
      }
    } else if (choiceIndex === sealIndex - 1) {
      //Starts puzzle when 'inspect seal' selected
      startSealPuzzle();
    } else {
      log("Please enter a number from the list.");
    }

    renderGameLog();
    commandInput.value = "";
    return;
  }

  //========================================================
  // NORMAL COMMANDS (no pending choice)
  //========================================================
  switch (command) {
    case "move":
      moveLocations();
      markAction("move-menu");
      break;
    case "search":
      log(gameState.currentLocation.searchLocation());
      markAction("search");
      renderGameLog();
      break;
    case "pick up":
      startPickUpFlow();
      markAction("pickup-menu");
      break;
    case "inventory":
      gameState.player.viewInventory();
      markAction("inventory");
      break;
    case "use":
      if (gameState.lastAction !== "inventory") {
        log("Please open your inventory first!");
        renderGameLog();
        break;
      }
      startUseItemFlow();
      markAction("used-item");
      break;
    case "attack":
      attackEnemy();
      break;
    case "talk":
      talkTo();
      markAction("talk");
      break;
    case "help":
      getHelp();
      break;
    default:
      log("This is not a valid command. Type 'help' to see available commands.");
      renderGameLog();
      break;
  }

  commandInput.value = "";
}

//Listening for submission either by click or by hitting enter
if (submitCommand) submitCommand.addEventListener("click", readCommand);
if (commandInput) {
  commandInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") readCommand();
  });
}

//Character Selection screen listeners
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.characterCard');
  const startBtn = document.getElementById('startGame');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      startBtn.disabled = false;
    });
  });
});