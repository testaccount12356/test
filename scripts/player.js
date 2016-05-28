/*
 * This is used by a player to control the main character.
 */
function Player(entity, statusBar=null) {
    this.character = entity;
	this.character.controller = new Controller(this);
    this.statusBar = statusBar;
    this.noclip = false;
}

// Player.prototype = new Being(100, 50, 0);
// Player.prototype.constructor = Player;

Player.prototype.update = function() {
    if (this.noclip) {

        if (this.character.controller.pressedKeys[65]) {
            this.character.position.x -= 10;
        } else if (this.character.controller.pressedKeys[68]) {
            this.character.position.x += 10;
        }

        if (this.character.controller.pressedKeys[87]) {
            this.character.position.y -= 10;
        } else if (this.character.controller.pressedKeys[83]) {
            this.character.position.y += 10;
        }
        return;
    }
    this.handleKeys();

    this.character.update();

   if (this.statusBar)
        this.statusBar.updateStatus(this.character.currentHealth / this.character.health, 
                                this.character.currentEnergy / this.character.energy);
}

Player.prototype.draw = function(ctx) {
    this.character.draw(ctx);
}

Player.prototype.setStatusBar = function (statusBar) {
    if (statusBar instanceof PlayerStatusBar)
        this.statusBar = statusBar;
}

/*
 * This sets up the controls for the player.
 */
Player.prototype.handleKeys = function() {
    if (this.character.controller.pressedKeys[65] || this.character.controller.pressedKeys[68]) {
        this.character.walkOrRun();
    }

    if ((this.character.controller.pressedKeys[80] && !this.character.isBusy) || this.character.specialAttacking) {
        this.character.specialAttack();
    } else if ((this.character.controller.pressedKeys[83] && !this.character.isBusy) || this.character.isTeleporting) {
        this.character.teleport();
    } else if (this.character.controller.pressedKeys[87] || this.character.isJumping) {
        this.character.jump();
    } else if (this.character.controller.pressedKeys[73] || this.character.isAttacking) {
        this.character.attack();
    } else if (this.character.controller.pressedKeys[79] || this.character.isThrowing) {
        this.character.throwKnife();
    } else if (!this.character.controller.pressedKeys[65] && !this.character.controller.pressedKeys[68]){
        this.character.idle();
    }
}

/*
 * This sets up keyboard listeners for the player.
 */
function Controller(player) {
    this.player = player;
	this.pressedKeys = {};
	this.enabled = true;

    var that = this;
	this.handleKeyDown = function(event) {
   		that.pressedKeys[event.keyCode] = true;

        if (event.keyCode == 65) {
            that.keyAPressedTime = gameEngine.timer.gameTime;
        } else if (event.keyCode == 68) {
            that.keyDPressedTime = gameEngine.timer.gameTime;
        } else if(event.keyCode == 192) {

            that.player.noclip ^= true;
            if (that.player.noclip) {
                this.character.being.isEnabled = false;
            } else {
                this.character.being.isEnabled = true;
            }
        }

        event.preventDefault();
	}
	this.handleKeyUp = function(event) {
		that.pressedKeys[event.keyCode] = false;

        if (event.keyCode == 65) {
            that.keyAReleasedTime = gameEngine.timer.gameTime;
        } else if (event.keyCode == 68) {
            that.keyDReleasedTime = gameEngine.timer.gameTime;
        }

        event.preventDefault();
	}

	/* Hook keyboard events. */
   document.addEventListener("keydown", this.handleKeyDown, false);
   document.addEventListener("keyup", this.handleKeyUp, false);
}
    