/***************************************************/
/****************** T E X T U R E ******************/
/***************************************************/
function Texture(tileSheet, row, index, width, height, scale) {
    this.tileSheet = tileSheet;
    this.row = row;
    this.index = index;
    this.width = width;
    this.height = height;
    this.scale = scale;
};

function Sprite(game, texture, x, y) {
    this.game = game;
    this.position = {x:x, y:y};
    this.texture = texture;
    this.animation = null;
};

Sprite.prototype.setAnimation = function(animation) {
    this.animation = animation;
}

Sprite.prototype.draw = function(ctx) {
    if (this.animation) {
        this.animation.drawFrame(this.game.clockTick, ctx, this.position.x, this.position.y);
    } else {
        ctx.drawImage(this.texture.tileSheet,
            0, 0,  // source from sheet
            this.texture.width, this.texture.height,
            this.position.x, this.position.y,
            this.texture.width * this.texture.scale,
            this.texture.height * this.texture.scale);
    }
};

Sprite.prototype.drawOptions = function(ctx, offsetX, offsetY, widthAmount, heightAmount) {
    ctx.drawImage(this.texture.tileSheet,
                     0, 0,  // source from sheet
                     this.texture.width * widthAmount, this.texture.height * heightAmount,
                     this.position.x + offsetX, this.position.y + offsetY,
                     this.texture.width * widthAmount * this.texture.scale,
                     this.texture.height * heightAmount * this.texture.scale);
};

/*******************************************************/
/****************** A N I M A T I O N ******************/
/*******************************************************/
function Animation(spriteSheet, initialX, initialY, frameWidth, frameHeight, sheetWidth, frameDuration,
                   totalFrameNum, isLooped, scale) {
    this.initalX = initialX; // X coordinate of top right corner of the first frame
    this.initialY = initialY; // Y coordinate of top right corner of the first frame
    this.spriteSheet = spriteSheet;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.sheetWidth = sheetWidth;
    this.frameDuration = frameDuration;
    this.totalFrameNum = totalFrameNum;
    this.isLooped = isLooped;
    this.scale = scale;
    this.totalTime = totalFrameNum * frameDuration;
    this.elapsedTime = 0;
};

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
};

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
};

Animation.prototype.drawFrame = function(tick, ctx, x, y) {
    this.elapsedTime += tick;

    if (this.isDone() && this.isLooped) {
        this.elapsedTime = 0;
    }

    var currentFrameNum = this.currentFrame();
    var xIndex = currentFrameNum % this.sheetWidth;
    var yIndex = Math.floor(currentFrameNum / this.sheetWidth);
    ctx.drawImage(this.spriteSheet, this.initalX + xIndex * this.frameWidth, this.initialY + yIndex * this.frameHeight,
        this.frameWidth, this.frameHeight, x, y, this.scale * this.frameWidth, this.scale * this.frameHeight);
};

/*************************************************/
/****************** W E A P O N ******************/
/*************************************************/
function Knife(gameEngine, spriteSheet, owner, damage, movingToRight, x, y) {
    this.knifeAnimation = new Animation(spriteSheet, 582, 80, 25, 12, 11, 0.10, 11, true, 1);
    this.stuckAnimation = new Animation(spriteSheet, 582, 80, 25, 12, 1, 1, 1, true, 1);
    this.currentAnimation = this.knifeAnimation;
    Weapon.call(this, owner, damage, gameEngine, x, y, 6, 1);

    this.movingToRight = movingToRight;
    this.speed = 800;
    this.stuckTo = null;
    this.isHitEnemy = false;
    this.isDisabled = false;
    this.relativeY = 0; // Y value of this knife relative to y value of a being
};

Knife.prototype = new Weapon();
Knife.prototype.constructor = Knife;

Knife.prototype.update = function() {
    if (this.stuckTo && this.stuckTo instanceof Being) {
            if (this.movingToRight)         // The knife is stuck 
        	   this.position.x = this.stuckTo.position.x - this.width;
            else
                this.position.x = this.stuckTo.position.x + this.stuckTo.width - 20;

        if (this.relativeY == 0) {
            this.relativeY = this.position.y - this.stuckTo.position.y;
        }

        this.position.y = this.stuckTo.position.y + this.relativeY;
    	this.removeFromWorld = this.stuckTo.removeFromWorld;
    } else if (this.movingToRight) {
        this.body.velocity.x = this.game.clockTick * this.speed;
    } else {
        this.body.velocity.x = - this.game.clockTick * this.speed;
    }

    Weapon.prototype.update.call(this);
};

Knife.prototype.draw = function(ctx) {
    if (this.isHitEnemy) {
        // this shows hit effects when a knife hits the enemy
        ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 92, 170, 68, 36,
            this.position.x - 25, this.position.y - this.relativeY - 20, 68, 36);
    }

    if (this.movingToRight) {
        this.currentAnimation.drawFrame(this.game.clockTick, ctx, this.position.x, this.position.y);
    } else {
        ctx.save();
        ctx.translate(1000, 0);
        ctx.scale(-1, 1);
        this.currentAnimation.drawFrame(this.game.clockTick, ctx, 960 - this.position.x, this.position.y);
        ctx.restore();
    }
};

Knife.prototype.collide = function(other) {
    if (other instanceof Being && !other.isEnabled)
        return;

    if (other instanceof Terrain && !this.isDisabled) {
        this.stuckTo = other;
        this.speed = 0;
        this.body.gravityEnabled = false;
        this.currentAnimation = this.stuckAnimation;
        this.isDisabled = true;

        if (!this.movingToRight) {
            this.position.x -= 20;
        }

    } else if (!this.isDisabled && ((this.owner === "naruto" && other instanceof Enemy)
        || (this.owner === "enemy" && other instanceof Naruto))) {
        this.stuckTo = other;
        this.speed = 0;
        this.body.gravityEnabled = false;
        this.currentAnimation = this.stuckAnimation;
        this.isDisabled = true;

        AM.getSound("./sounds/hit_by_knife.wav").play();
        this.isHitEnemy = true;

        // /* Knife has a chance to knock down an enemy. */
        // if (Math.floor(Math.random() * 6) === 5) {
        //     other.isHit = true;
        // }

    	this.applyDamage(other);
    };
    
    if (this.isDisabled) {
        var that = this;
        window.setTimeout(function(){
            that.removeFromWorld = true;
        }, 500);
    }
};

function ExplosiveKnife(gameEngine, spriteSheet, owner, damage, movingToRight, x, y) {
    Knife.call(this, gameEngine, spriteSheet, owner, damage, movingToRight, x, y);
    this.knifeAnimation = new Animation(spriteSheet, 596, 485, 35, 11, 2, 0.10, 2, true, 1);
    this.stuckAnimation = new Animation(spriteSheet, 596, 485, 35, 11, 1, 1, 1, true, 1);
    this.currentAnimation = this.knifeAnimation;
    this.explosionAnimation = new Animation(spriteSheet, 544, 167, 50, 55, 5, 0.10, 5, false, 1);
}

ExplosiveKnife.prototype = new Knife();
ExplosiveKnife.prototype.constructor = ExplosiveKnife;

ExplosiveKnife.prototype.draw = function(ctx) {
    if (this.isHitEnemy && !this.explosionAnimation.isDone()) {
        this.explosionAnimation.drawFrame(this.game.clockTick, ctx, this.position.x - 15,
            this.position.y - this.relativeY);
    } else {
        if (this.movingToRight) {
            this.currentAnimation.drawFrame(this.game.clockTick, ctx, this.position.x, this.position.y);
        } else {
            ctx.save();
            ctx.translate(1000, 0);
            ctx.scale(-1, 1);
            this.currentAnimation.drawFrame(this.game.clockTick, ctx, 960 - this.position.x, this.position.y);
            ctx.restore();
        }
    }
}

function Rasengan(gameEngine, spriteSheet, movingToRight, x, y) {
    this.rasenganAnimation = new Animation(spriteSheet, 460, 865, 100 ,76, 4, 0.2, 4, true, 1.5);
    Weapon.call(this, "naruto", 50, gameEngine, x, y,
        this.rasenganAnimation.frameWidth, this.rasenganAnimation.frameHeight);

    this.speed = 600;
    this.isHitEnemy = false;
    this.movingToRight = movingToRight;
    this.body.gravityEnabled = false;

    var that = this;
    window.setTimeout(function() {
        that.removeFromWorld = true;
    }, 5000);
};

Rasengan.prototype = new Weapon();
Rasengan.prototype.constructor = Rasengan;

Rasengan.prototype.update = function() {
    if (this.movingToRight) {
        this.body.velocity.x = this.game.clockTick * this.speed;
    } else {
        this.body.velocity.x = - this.game.clockTick * this.speed;
    }

    Weapon.prototype.update.call(this);
};

Rasengan.prototype.draw = function(ctx) {
    this.position.y -= 35;

    if (this.isHitEnemy) {
        // this shows hit visual effect for Rasengan when Rasengan hits the enemy
        ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 176, 167, 90, 40,
            this.position.x, this.position.y - 50, 90, 40);
        this.isHitEnemy = false;
    }

    if (this.movingToRight) {
        this.rasenganAnimation.drawFrame(this.game.clockTick, ctx, this.position.x, this.position.y);
    } else {
        ctx.save();
        ctx.translate(1000, 0);
        ctx.scale(-1, 1);
        this.rasenganAnimation.drawFrame(this.game.clockTick, ctx, 960 - this.position.x, this.position.y);
        ctx.restore();
    }

    this.position.y += 35;
};

Rasengan.prototype.collide = function(other) {
	if (other instanceof Enemy && other.isEnabled) {
        this.isHitEnemy = true;
        other.isHit = true;
		this.applyDamage(other);
	}
};

function FireBall(gameEngine, spriteSheet, movingToRight, x, y) {
    this.fireBallAnimation = new Animation(spriteSheet, 21, 843, 160, 118, 4, 0.3, 4, true, 1);
    Weapon.call(this, "enemy", 100, gameEngine, x, y, this.fireBallAnimation.frameWidth,
        this.fireBallAnimation.frameHeight);

    this.speed = 500;
    this.movingToRight = movingToRight;
    this.body.gravityEnabled = false;
}

FireBall.prototype = new Weapon();
FireBall.prototype.constructor = FireBall;

FireBall.prototype.update = function() {
    if (this.movingToRight) {
        this.body.velocity.x = this.game.clockTick * this.speed;
    } else {
        this.body.velocity.x = - this.game.clockTick * this.speed;
    }

    Weapon.prototype.update.call(this);
}

FireBall.prototype.draw = function(ctx) {
    if (this.movingToRight) {
        this.fireBallAnimation.drawFrame(this.game.clockTick, ctx, this.position.x, this.position.y);
    } else {
        ctx.save();
        ctx.translate(1000, 0);
        ctx.scale(-1, 1);
        this.fireBallAnimation.drawFrame(this.game.clockTick, ctx, 960 - this.position.x, this.position.y);
        ctx.restore();
    }
}

FireBall.prototype.collide = function(other) {
    if (other instanceof Naruto) {
        other.isHit = true;
        this.applyDamage(other);
    }

    if (other instanceof Naruto || other instanceof Terrain) {
        var that = this;

        window.setTimeout(function() {
            that.removeFromWorld = true;
        }, 200);
    }
}

function Fist(gameEngine, owner, x, y) {
    Weapon.call(this, owner, 5, gameEngine, x, y, 15, 30);

	this.isDisabled = false;
	this.body.gravityEnabled = false;
    this.isHitEnemy = false;

	var that = this;
	window.setTimeout(function() {
		that.isDisabled = true;
		that.removeFromWorld = true;
	}, 100);
};

Fist.prototype = new Weapon();
Fist.prototype.constructor = Fist;

Fist.prototype.draw = function(ctx) {
    if (this.isHitEnemy) {
        // this shows hit visual effects only when Naruto hits the enemy
        ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 25, 173, 50, 34,
            this.position.x - 6, this.position.y - 50, 50, 34);
    }
};

Fist.prototype.collide = function(other) {
    // this will hurt enemies as well as Naruto
    if (!this.isDisabled && ((this.owner === "naruto" && other instanceof Enemy)
        || (this.owner === "enemy" && other instanceof Naruto)) && other.isEnabled) {

        if (Math.floor(Math.random() * 20) === 19) { // Fist has a chance to knockdown.
            other.isHit = true;
        }

		this.isDisabled = true;
        this.isHitEnemy = true;
        this.applyDamage(other);

        window.setTimeout(function(){
            AM.getSound("./sounds/punch.wav").play();
        }, 100);
	}
};

/*********************************************************/
/****************** C H A R A C T E R S ******************/
/*********************************************************/
function Naruto(gameEngine, spriteSheet, x, y) {
    this.idleAnimation  = new Animation(spriteSheet, 30, 52, 44, 60, 6, 0.35, 6, true, 1.5);
    this.runAnimation   = new Animation(spriteSheet, 350, 174, 60, 60, 6, 0.10, 6, true, 1.5);
    this.jumpAnimation  = new Animation(spriteSheet, 244, 278, 50, 60, 4, 0.25, 4, false, 1.5);
    this.walkAnimation  = new Animation(spriteSheet, 16, 165, 40, 60, 6, 0.30, 6, true, 1.5);
    this.teleportAnimation = new Animation(spriteSheet, 19, 405, 70, 61, 7, 0.20, 7, false, 1.5);
    this.attackAnimation = new Animation(spriteSheet, 615, 272, 60, 60, 3, 0.10, 3, true, 1.5);
    this.throwKnifeAnimation = new Animation(spriteSheet, 385, 51, 60, 60, 3, 0.13, 3, false, 1.5);
    this.specialAttackAnimation = new Animation(spriteSheet, 15, 466, 125, 101, 8, 0.20, 24, false, 1.5);
    // the character stays still initially
    this.currentAnimation = this.idleAnimation;
    Being.call(this, 500, 50, 0, gameEngine, x, y, this.currentAnimation.frameWidth, this.currentAnimation.frameHeight + 25);

    this.movingForward = true;
    this.isJumping = false;
    this.isRunning = false;
    this.isTeleporting = false;
    this.isAttacking = false;
    this.isThrowing = false;
    this.specialAttacking = false;
    this.isBusy = false; // checks if Naruto is currently doing something
    this.isFalling = false;
    this.jumpCounter = 0; // a counter that counts number of consecutive jumps
    this.firstJump = 0; // a counter for visual effect of jump
    this.secondJump = 0; // a counter for visual effect of double jump
    this.justLanding = 0; // a counter for landing visual effect
    this.soundCoolDown = 300;
};

Naruto.prototype = new Being();
Naruto.prototype.constructor = Naruto;

Naruto.prototype.update = function() {
	if (this.isDead()) {		// Player has died.
		this.removeFromWorld = true;
		return;
	}

	Being.prototype.update.call(this);
};

/*
 * Determines how Naruto is shown on the canvas.
 */
Naruto.prototype.draw = function(ctx) {
    if (this.specialAttacking) {
        this.position.y -= 60;
    }

    if (this.justLanding) {
        // landing visual effect
        ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 20, 96, 56, 18,
            this.position.x - 10, this.position.y + 75, 56, 18);
        this.justLanding--;
    }

    if (this.firstJump) {
        // visual effect for jump
        ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 110, 40, 85, 15,
            this.position.x - 20, this.position.y + 80, 85, 15);
        this.firstJump--;
    }

    if (this.secondJump) {
        // visual effect for double jump
        ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 234, 40, 85, 15,
            this.position.x - 20, this.position.y + 80, 85, 15);
        this.secondJump--;
    }

    if (this.movingForward) {
        if (this.isRunning && !this.isJumping) {
            // visual effect for running
            ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 39, 26, 19, 33,
                this.position.x - 20, this.position.y + 56, 19, 33);
        }

        this.currentAnimation.drawFrame(this.game.clockTick, ctx, this.position.x, this.position.y);
    } else {
        ctx.save();
        ctx.translate(1000, 0);
        ctx.scale(-1, 1);

        if (this.isRunning && !this.isJumping) {
            // visual effect for running
            ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 39, 26, 19, 33,
                940 - this.position.x, this.position.y + 56, 19, 33);
        }

        this.currentAnimation.drawFrame(this.game.clockTick, ctx, 960 - this.position.x, this.position.y);
        ctx.restore();
    }

    if (this.specialAttacking) {
        this.position.y += 60;
    }
};

/*
 * Determines how Naruto attacks in the game.
 */
Naruto.prototype.attack = function() {
    this.isAttacking = true;
    this.speed = 0;
    this.body.velocity.x = 0;
    this.isRunning = false;
    this.currentAnimation = this.attackAnimation;
    this.isAttacking = this.controller.pressedKeys[73];
    this.isBusy = this.isAttacking;

    if (this.isAttacking && this.currentAnimation.currentFrame() == 2) {
    	var x = this.movingForward ? this.position.x + this.width + 15 : this.position.x - 20;
    	this.game.addEntity(new Fist(gameEngine, "naruto", x, this.position.y + this.height / 2 + 30));

        
    }
};

/*
 * Shows idle animation when Naruto's state is idle
 */
Naruto.prototype.idle = function() {
    this.speed = 0;
    this.body.velocity.x = 0;
    this.isBusy = false;
    this.isRunning = false;
    this.jumpCounter = 0;
    this.specialAttacking = false;
    this.currentAnimation = this.idleAnimation;
};

/*
 * Determines how Naruto jumps in the game.
 */
Naruto.prototype.jump = function() {
    if (!this.isJumping && this.jumpCounter < 1) {
        this.firstJump = 3;
        this.isJumping = true;
        this.isFalling = true;
        this.isBusy = true;
        AM.getSound("./sounds/jump.mp3").play();
    }

    this.body.velocity.x = Math.abs(this.body.velocity.x) == 300 ? 0 : this.body.velocity.x; // this resolves a bug (jump right after teleporation)

    if (this.isJumping) {
        this.currentAnimation = this.jumpAnimation;
        var jumpDistance = this.currentAnimation.elapsedTime / this.currentAnimation.totalTime;
        if (jumpDistance < 0.5) {
            this.body.velocity.y = -150.0 * this.game.clockTick;
        }

        if (this.currentAnimation.isDone() || (!this.isFalling && jumpDistance > 0.5)) { // this makes sure when Naruto falls on the ground, it shows idle animation
            this.isJumping = false;
            this.body.velocity.x = 0;
            this.currentAnimation.elapsedTime = 0;
            this.currentAnimation = this.idleAnimation;
            this.justLanding = 3;
            AM.getSound("./sounds/landed.mp3").play();
        } else if (this.isFalling && jumpDistance > 0.9) { // this makes sure when Naruto is descending, it shows the frames for falling
            this.currentAnimation.elapsedTime = this.currentAnimation.totalTime / 2;
        }

        // this enables a second jump
        if (this.controller.pressedKeys[87] && jumpDistance > 0.5 && this.jumpCounter < 1 && this.spendEnergy(5)) {
            this.secondJump = 3;
            this.jumpCounter++;
            this.currentAnimation.elapsedTime = 0;
            AM.getSound("./sounds/jump.mp3").play();
        }

        if (!this.isFalling) {
            this.jumpCounter = 0;
        }

        this.isBusy = this.isJumping;
    }
};

Naruto.prototype.specialAttack = function() {
	if (!this.specialAttacking && this.spendEnergy(25)) {
    	this.specialAttacking = true;
    	this.isBusy = true;
        AM.getSound("./sounds/rasengan.mp3").play();
	}

    if (this.specialAttacking) {
        this.currentAnimation = this.specialAttackAnimation;

        if (this.currentAnimation.isDone()) {
            this.specialAttacking = false;
            this.currentAnimation.elapsedTime = 0;
            this.currentAnimation = this.idleAnimation;
            this.isBusy = false;
            var startX = this.movingForward ? this.position.x + 70 : this.position.x - 50;
            this.game.addEntity(new Rasengan(gameEngine, AM.getAsset("./images/naruto.png"), this.movingForward,
                startX, this.position.y + 15));
        }
    }
};

/*
 * Determine how Naruto teleports in the game.
 */
Naruto.prototype.teleport = function() {
    // makes sure velocity and speed are zero when teleportation just begins
    if (!this.isTeleporting) {
        this.body.velocity.x = 0;
        this.speed = 0;
    }

    var originY = this.position.y;
    var originX = this.position.x;
    var terrain = null;

    if (!this.isTeleporting && this.spendEnergy(18)) {
        AM.getSound("./sounds/teleport.mp3").play();
	    this.isTeleporting = true;
	    this.isBusy = true;
	    this.setEnabled(false);
	}

    if (this.isTeleporting) {
        this.currentAnimation = this.teleportAnimation;

        if (this.currentAnimation.isDone()) {
            this.isTeleporting = false;
            this.currentAnimation.elapsedTime = 0;
            this.currentAnimation = this.idleAnimation;
            // teleports to somewhere 300 pixels away
            this.position.x += this.movingForward ? 300 : -300;
            this.isBusy = false;
            this.setEnabled(true);

            for (var j = 1; j < this.game.entities.length; j++) {
                if (this.body.intersect(this.game.entities[j].body)) {
                    this.game.entities[j].collide(this);

                    if (Math.abs(originY - this.position.y) > 10)
                        terrain = this.game.entities[j];
                }
            } 

            if (terrain) {
                this.position.x = originX;
                this.position.y = originY;
            }
        }
    }
};

/*
 * Determines how Naruto throws knives in the game.
 */
Naruto.prototype.throwKnife = function() {
    this.isThrowing = true;
    this.speed = 0;
    this.body.velocity.x = 0;
    this.isRunning = false;
    this.currentAnimation = this.throwKnifeAnimation;

    if (this.currentAnimation.isDone()) {
        this.currentAnimation.elapsedTime = 0;
        this.isThrowing = this.controller.pressedKeys[79];
        
        var startX = this.movingForward ? this.position.x + this.width + 20 : this.position.x - this.width;
        this.game.addEntity(new Knife(gameEngine, AM.getAsset("./images/naruto.png"), "naruto", 10, this.movingForward,
            startX, this.position.y + this.height - 50));
        AM.getSound("./sounds/throw_knife.wav").play();
    }

    this.isBusy = this.isThrowing;
};

/*
 * Determines how Naturo moves horizontally.
 */
Naruto.prototype.walkOrRun = function() {
    if (!this.isBusy) {
        this.isBusy = true;
        var keyATimeDiff = this.controller.keyAPressedTime - this.controller.keyAReleasedTime;
        var keyDTimeDiff = this.controller.keyDPressedTime - this.controller.keyDReleasedTime;

        // check time difference when the key is pressed twice and determines if Naruto should run
        if ((keyATimeDiff > 0 && keyATimeDiff < 0.2) || (keyDTimeDiff > 0 && keyDTimeDiff < 0.2)) {
            this.isRunning = true;
        }

        if (this.isRunning) {
            this.currentAnimation = this.runAnimation;
            this.speed = 300;
            this.soundCoolDown = 300;
            this.playFrequency = 15;
        } else {
            this.currentAnimation = this.walkAnimation;
            this.speed = 100;
            this.soundCoolDown = 300;
            this.playFrequency = 50;
        }
    }

    if (!this.isJumping) {
        if (this.soundCoolDown % this.playFrequency == 0) {
            AM.getSound("./sounds/foot_steps.wav").play();
        }

        this.soundCoolDown--;
    }


    this.movingForward = this.controller.pressedKeys[68];

    if (this.movingForward) {
        this.body.velocity.x = this.game.clockTick * this.speed;
    } else {
        this.body.velocity.x = - this.game.clockTick * this.speed;
    }
};

/*********************************************/
/***************** E N E M Y *****************/
/*********************************************/
function Enemy(gameEngine, spriteSheet, x, y, health, energy, yOffset) {
    this.idleAnimation = new Animation(spriteSheet, 3, 2, 45, 45, 3, 0.2, 3, true, 1.5);
    this.runAnimation = new Animation(spriteSheet, 163, 1, 45, 45, 3, 0.10, 3, true, 1.5);
    this.punchAnimation = new Animation(spriteSheet, 3, 53, 50, 45, 4, 0.15, 4, false, 1.5);
    this.throwKnifeAnimation = new Animation(spriteSheet, 213, 53, 45, 45, 3, 0.15, 3, false, 1.5);
    this.fallDownAnimation = new Animation(spriteSheet, 4, 101, 55, 45, 5, 0.20, 5, false, 1.5);
    this.getUpAnimation = new Animation(spriteSheet, 14, 166, 50, 45, 3, 0.20, 3, false, 1.5);
    this.teleportAnimation = new Animation(spriteSheet, 198, 189, 35, 45, 2, 0.30, 2, false, 1.5);
    this.currentAnimation = this.idleAnimation;

    this.movingToRight = false;
    this.isRunning = false;
    this.isPunching = false;
    this.isThrowingKnife = false;
    this.isHit = false; // shows whether or not this enemy is hit by a weapon
    this.isFallingDown = false;
    this.isGettingUp = false;
    this.isTeleporting = false;
    this.playerBeingSeen = null;
    this.collideWithWall = false;
    this.soundCoolDown = 260;

    Being.call(this, health, energy, 0, gameEngine, x, y, this.currentAnimation.frameWidth,
        this.currentAnimation.frameHeight + yOffset);
    this.brain = new EnemyAI(this);
    this.statusBar = null;
};

Enemy.prototype = new Being();
Enemy.prototype.constructor = Enemy;

Enemy.prototype.run = function() {
    if (!this.isRunning) {
        this.currentAnimation.elapsedTime = 0; // reset previous animation
    }

    this.isRunning = true;
    this.speed = 260;
    this.currentAnimation = this.runAnimation;
    this.playFrequency = 15;

    if (this.soundCoolDown % this.playFrequency == 0) {
        AM.getSound("./sounds/foot_steps.wav").play();
    }

    if (this.soundCoolDown == 0) {
        this.soundCoolDown = 260;
    }

    this.soundCoolDown--;

    if (this.movingToRight) {
        this.body.velocity.x = this.game.clockTick * this.speed;
    } else {
        this.body.velocity.x = -this.game.clockTick * this.speed;
    }
};

Enemy.prototype.punch = function() {
    if (!this.isPunching) {
        this.currentAnimation.elapsedTime = 0; // reset previous animation
    }

    this.isPunching = true;
    this.speed = 0;
    this.body.velocity.x = 0;
    this.currentAnimation = this.punchAnimation;

    if (this.currentAnimation.isDone()) {
        this.currentAnimation.elapsedTime = 0;
        this.isPunching = false;

        var x = this.movingToRight ? this.position.x + this.width + 2 : this.position.x - 10;
        this.game.addEntity(new Fist(this.game, "enemy", x, this.position.y + 20));
        AM.getSound("./sounds/punch.wav").play();
    }
};

Enemy.prototype.throwKnife = function() {
    if (!this.isThrowingKnife) {
        this.currentAnimation.elapsedTime = 0; // reset previous animation
    }

    this.isThrowingKnife = true;
    this.speed = 0;
    this.body.velocity.x = 0;
    this.currentAnimation = this.throwKnifeAnimation;

    if (this.currentAnimation.isDone()) {
        this.currentAnimation.elapsedTime = 0;
        this.isThrowingKnife = false;

        var startX = this.movingToRight ? this.position.x + this.width + 5 : this.position.x - this.width;
        this.game.addEntity(new Knife(this.game, AM.getAsset("./images/naruto.png"), "enemy", 20, this.movingToRight,
            startX, this.position.y + this.height - 50));
        AM.getSound("./sounds/throw_knife.wav").play();
    }
};

Enemy.prototype.fallDown = function() {
    if (!this.isFallingDown) {
        this.currentAnimation.elapsedTime = 0; // reset previous animation
    }

    this.isFallingDown = true;
    this.speed = 0;
    this.body.velocity.x = 0;
    this.currentAnimation = this.fallDownAnimation;
    // this.setEnabled(false);

    if (this.currentAnimation.isDone()) {
        this.currentAnimation.elapsedTime = 0;
        this.isFallingDown = false;
        this.isHit = false;
        this.isGettingUp = true;
        // this.setEnabled(true);
    }
};

Enemy.prototype.getUp = function() {
    if (!this.isGettingUp) {
        this.currentAnimation.elapsedTime = 0; // reset previous animation
    }

    this.currentAnimation = this.getUpAnimation;

    if (this.currentAnimation.isDone()) {
        this.currentAnimation.elapsedTime = 0;
        this.isGettingUp = false;
        this.idle();
    }
};

Enemy.prototype.teleport = function(position) {
    if (!this.isTeleporting) {
        this.currentAnimation.elapsedTime = 0; // reset previous animation
        window.setTimeout(function(){
            AM.getSound("./sounds/teleport.mp3").play();
        }, 30);
    }

    this.body.velocity.x = 0;
    this.speed = 0;
    this.isTeleporting = true;
    this.currentAnimation = this.teleportAnimation;

    if (this.currentAnimation.isDone()) {
        this.currentAnimation.elapsedTime = 0;
        this.isTeleporting = false;
        this.collideWithWall = false;
        this.idle();

        this.position.x = position.x;
        this.position.y = position.y;
    }
};

Enemy.prototype.idle = function() {
    this.speed = 0;
    this.body.velocity.x = 0;
    this.isRunning = false;
    this.isPunching = false;
    this.isThrowingKnife = false;
    this.isFallingDown = false;
    this.isGettingUp = false;
    this.isTeleporting = false;
    this.currentAnimation.elapsedTime = 0;
    this.currentAnimation = this.idleAnimation;
};

Enemy.prototype.update = function() {
    if (this.isDead()) {		// Enemy has died.
        this.removeFromWorld = true;
        var dropItem = false;

        if (Math.random() > 0.8) {
            this.game.addEntity(new HealthPotion(this.game, this.position.x, this.position.y + 40, 24, 24));
            dropItem = true;
        }

        if (!dropItem && Math.random() > 0.8) {
            this.game.addEntity(new EnergyPotion(this.game, this.position.x, this.position.y + 35, 24, 24));
        }

        return;
    }
    
    this.brain.decideAction();

    Being.prototype.update.call(this);

    if (this.statusBar) {       // Update the status bar.
        this.statusBar.x = this.position.x;
        this.statusBar.y = this.position.y - 18;
        this.statusBar.updateStatus(this.currentHealth / this.health);
    }
};

Enemy.prototype.draw = function(ctx) {
    if (this.movingToRight) {
        ctx.save();
        ctx.translate(1000, 0);
        ctx.scale(-1, 1);
        this.currentAnimation.drawFrame(this.game.clockTick, ctx, 960 - this.position.x, this.position.y);
        ctx.restore();
    } else {
        this.currentAnimation.drawFrame(this.game.clockTick, ctx, this.position.x, this.position.y);
    }
};

Enemy.prototype.collide = function(other) {
    if (other instanceof Naruto) {
        if (other.isEnabled && !this.isHit)
            other.dealDamage(15);
    } else if (other instanceof Terrain && other.body.aabb.centerY < this.body.aabb.maxY) {
        this.collideWithWall = true;
    } else if (other instanceof Enemy && !other.isRunning && !this.isRunning) {
        if (other.body.aabb.minX < this.body.aabb.minX) {
            other.position.x -= 5;
        } else {
            other.position.x += 5;
        }
    }
};

/*******************************************/
/***************** B O S S *****************/
/*******************************************/

function Boss(gameEngine, spriteSheet, x, y, health, energy, yOffset) {
    Enemy.call(this, gameEngine, spriteSheet, x, y, health, energy, yOffset);
    this.idleAnimation = new Animation(spriteSheet, 12, 43, 35, 67, 4, 0.2, 4, true, 1.2);
    this.runAnimation = new Animation(spriteSheet, 14, 143, 65, 67, 6, 0.10, 6, true, 1.2);
    this.punchAnimation = new Animation(spriteSheet, 18, 447, 70, 67, 4, 0.15, 4, false, 1.2);
    this.throwKnifeAnimation = new Animation(spriteSheet, 468, 637, 60, 67, 4, 0.15, 4, false, 1.2);
    this.fallDownAnimation = new Animation(spriteSheet, 10, 277, 70, 67, 4, 0.20, 4, false, 1.2);
    this.getUpAnimation = new Animation(spriteSheet, 425, 288, 50, 67, 2, 0.20, 2, false, 1.2);
    this.teleportAnimation = new Animation(spriteSheet, 430, 453, 30, 67, 2, 0.30, 2, false, 1.2);
    this.specialAttackAnimation = new Animation(spriteSheet, 17, 639, 55, 67, 5, 1.40, 5, false, 1.2);
    this.currentAnimation = this.idleAnimation;

    this.brain = new BossAI(this);
    this.specialAttacking = false;
    this.specialAttackCoolDown = 300;
}

Boss.prototype = new Enemy();
Boss.prototype.constructor = Boss;

Boss.prototype.throwKnife = function() {
    if (!this.isThrowingKnife) {
        this.currentAnimation.elapsedTime = 0; // reset previous animation
    }

    this.isThrowingKnife = true;
    this.speed = 0;
    this.body.velocity.x = 0;
    this.currentAnimation = this.throwKnifeAnimation;

    if (this.currentAnimation.isDone()) {
        this.currentAnimation.elapsedTime = 0;
        this.isThrowingKnife = false;

        var startX = this.movingToRight ? this.position.x + this.width + 5 : this.position.x - this.width;
        this.game.addEntity(new ExplosiveKnife(this.game, AM.getAsset("./images/boss.png"), "enemy", 35, this.movingToRight,
            startX, this.position.y + this.height - 50));
        AM.getSound("./sounds/throw_knife.wav").play();
    }
};

Boss.prototype.specialAttack = function() {
    if (!this.specialAttacking && this.spendEnergy(50)) {
        this.currentAnimation.elapsedTime = 0; // reset previous animation
        AM.getSound("./sounds/fire_jutsu.mp3").play();
        this.specialAttacking = true;
    }

    if (this.specialAttacking) {
        this.currentAnimation = this.specialAttackAnimation;
        this.speed = 0;
        this.body.velocity.x = 0;

        if (this.currentAnimation.isDone()) {
            this.specialAttacking = false;
            this.currentAnimation.elapsedTime = 0;
            this.specialAttackCoolDown = 300;
            this.idle();
            var startX = this.movingForward ? this.position.x + 70 : this.position.x - 50;
            this.game.addEntity(new FireBall(gameEngine, AM.getAsset("./images/boss.png"), this.movingToRight,
                startX, this.position.y - 50));
        }
    }
}

Boss.prototype.idle = function() {
    this.specialAttacking = false;
    Enemy.prototype.idle.call(this);
}

Boss.prototype.draw = function(ctx) {
    if (this.movingToRight) {
        this.currentAnimation.drawFrame(this.game.clockTick, ctx, this.position.x, this.position.y);
    } else {
        ctx.save();
        ctx.translate(1000, 0);
        ctx.scale(-1, 1);
        this.currentAnimation.drawFrame(this.game.clockTick, ctx, 960 - this.position.x, this.position.y);
        ctx.restore();
    }
};


/**************************************************/
/***************** E N E M Y  A I *****************/
/**************************************************/
function EnemyAI(enemy) {
    this.enemy = enemy;
};

EnemyAI.prototype.decideAction = function() {
    if (this.enemy.isHit) {
        this.enemy.fallDown();
        return;
    } else if (this.enemy.isGettingUp) {
        this.enemy.getUp();
        return;
    }

    var distance = this.calculateDistance();
    // update the direction this enemy needs to face to.
    this.enemy.movingToRight = (distance.x > 0);
    var moving = this.track(distance.x, distance.y);

    if (!moving && !this.enemy.isTeleporting) {
        if ((Math.abs(distance.x) < 50 && distance.y < 50) || this.enemy.isPunching) {
            // punch when enemy is less than 60 pixels away from Naruto
            this.enemy.punch();
        } else if (distance.y < 50 || this.enemy.isThrowingKnife) {
            // throw knives when enemy is less than 200 pixels away from Naruto
            this.enemy.throwKnife();
        } else {
            this.enemy.idle();
        }
    } else if (this.enemy.collideWithWall) {
        // if enemy tries to catch up Naruto but collides with a wall, enemy will teleport to where Naruto is
        this.enemy.teleport({x: this.enemy.playerBeingSeen.position.x, y: this.enemy.playerBeingSeen.position.y});
    } else {
        this.enemy.run();
    }
}

EnemyAI.prototype.track = function(xDistance, yDistance) {
    // determine if or not enemy should track Naruto
    return Math.abs(xDistance) > 200 && yDistance < 400;
}

EnemyAI.prototype.calculateDistance = function() {
    var distance = {x:0, y:0};
    distance.x = this.enemy.playerBeingSeen.body.aabb.centerX - this.enemy.body.aabb.centerX;
    distance.y = Math.abs(this.enemy.playerBeingSeen.body.aabb.centerY - this.enemy.body.aabb.centerY);

    return distance;
}

function BossAI(boss) {
    EnemyAI.call(this, boss);
}

BossAI.prototype = new EnemyAI();
BossAI.prototype.constructor = BossAI;

BossAI.prototype.decideAction = function() {
    var distance = this.calculateDistance();
    // update the direction this enemy needs to face to.
    this.enemy.movingToRight = (distance.x > 0);
    var moving = this.track(distance.x, distance.y);

    if (((!moving && !this.enemy.isTeleporting) || this.enemy.specialAttacking) && (!this.enemy.isHit && !this.enemy.isGettingUp)) {
        if ((this.enemy.specialAttackCoolDown === 0 && this.enemy.currentEnergy > 50) || this.enemy.specialAttacking) {
            this.enemy.specialAttack();
        }
    }

    if (!this.enemy.specialAttacking || (this.enemy.isHit || this.enemy.isGettingUp)) {
        EnemyAI.prototype.decideAction.call(this);
    }

    if (this.enemy.specialAttackCoolDown > 0) {
        this.enemy.specialAttackCoolDown--;
    }
}


