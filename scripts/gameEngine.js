window.requestAnimFrame = (function () {
    return window.requestAnimationFrame    ||
        window.webkitRequestAnimationFrame  ||
        window.mozRequestAnimationFrame     ||
        window.oRequestAnimationFrame       ||
        window.msRequestAnimationFrame      ||
        function (callback, element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelRequestAnimFrame = (function() {
    return window.cancelAnimationFrame              ||
        window.webkitCancelRequestAnimationFrame    ||
        window.mozCancelRequestAnimationFrame       ||
        window.oCancelRequestAnimationFrame         ||
        window.msCancelRequestAnimationFrame        ||
        clearTimeout
})();



/*************************************************/
/****************** E N G I N E ******************/
/*************************************************/
function GameEngine() {
    this.isMuted = false;
    this.entities = [];
    this.players = [];
    this.idleEnemies = [];
    this.activeEnemies = [];
    this.scenery = [];
    this.music = [];
    this.gui = [];
    this.ctx = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
    this.camera = null;
    this.gravity = 9.2;
    this.collided = [];
    this.isGameOver = false;
    this.isWinner = false;
    this.alpha = 0.0;
    this.alpha2 = 0.0;
    this.playing = false;
    this.endBattle = false;
    this.isTrapped = false;
}

GameEngine.prototype.init = function(ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.timer = new Timer();
    this.camera = new Camera(ctx);
    //this.setInput();
}

GameEngine.prototype.start = function() {
    var that = this;
    this.ctx.font = "25px Arial";
    this.ctx.fillStyle = "rgba(255,255,0,1)";
    this.ctx.textAlign = "center";
    this.ctx.fillText("You have been captured by an evil clan of ninjas who reside in the forest.", this.camera.position.x + 5, this.camera.position.y - 60);
    this.ctx.fillText("They have locked you inside of their impenetrable stone cage as a prisoner.", this.camera.position.x + 5, this.camera.position.y - 30);
    this.ctx.fillText("You aren't doing much when one of the clansmen begins harrasing you.", this.camera.position.x + 5, this.camera.position.y);
    this.ctx.fillText("Now it is time to escape and destroy this band of ninjas and their leader...", this.camera.position.x + 5, this.camera.position.y + 30);

    this.ctx.font = "20px Arial";
    this.ctx.fillText("press spacebar to continue...", this.camera.position.x + 5, this.camera.position.y + 100);

    var that = this;
    this.startGame = function(event) {
        if (event.keyCode === 32 && !that.isPlaying) {
            AM.getSound("./sounds/rainforest.mp3").play();
            (function gameLoop() {
                that.loop();
                requestAnimFrame(gameLoop, that.ctx.canvas);
            })();
        }
        event.preventDefault();
    }

    document.addEventListener("keydown", this.startGame, false);
}

GameEngine.prototype.startGame = function() {}

GameEngine.prototype.addPlayer = function(player) {
    this.players.push(player);
    this.entities.push(player.character);
    this.camera.setFocus(player.character);
}

GameEngine.prototype.addEnemy = function(enemy) {
    var barBackgroundTexture = new Texture(AM.getAsset("./images/healthBarEnemyBackground.png"), 0, 0, 197, 22, 0.25);
    var barForegroundTexture = new Texture(AM.getAsset("./images/healthBarEnemyForeground.png"), 0, 0, 203, 25, 0.25);
    var healthBarTexture = new Texture(AM.getAsset("./images/healthBar.png"), 0, 0, 208, 16, 0.25);

    var enemyStatusBar = new EnemyStatusBar(enemy.position.x, enemy.position.y, enemy.position.x, enemy.position.y);
    enemyStatusBar.addSprite(new Sprite(gameEngine, barBackgroundTexture, 0, 0));
    enemyStatusBar.addSprite(new Sprite(gameEngine, healthBarTexture, 1, 1));
    enemyStatusBar.addSprite(new Sprite(gameEngine, barForegroundTexture, 0, 0));

    enemy.statusBar = enemyStatusBar;
    this.idleEnemies.push(enemy);
    this.addUserInterface(enemyStatusBar);
}

GameEngine.prototype.addEntity = function(entity) {
    this.entities.push(entity);
}

GameEngine.prototype.addScenery = function(sprite) {
    this.scenery.push(sprite);
}

GameEngine.prototype.addUserInterface = function(interface) {
    this.gui.push(interface);
}

GameEngine.prototype.addSound = function(sound) {
    this.music.push(sound);
}

GameEngine.prototype.draw = function() {
    this.ctx.clearRect(this.camera.position.x - this.surfaceWidth / 2, this.camera.position.y - this.surfaceHeight / 2,
        this.surfaceWidth, this.surfaceHeight);
    this.ctx.save();

    for (var i = 0; i < this.scenery.length; i++) {
        if (!this.camera.clip(this.scenery[i]))
            this.scenery[i].draw(this.ctx);
    }

    for (var i = 0; i < this.activeEnemies.length; i++) {
        this.activeEnemies[i].draw(this.ctx);
    }

    for (var i = 0; i < this.idleEnemies.length; i++) {
        this.idleEnemies[i].draw(this.ctx);
    }

    for (var i = 0; i < this.players.length; i++) {
        this.players[i].draw(this.ctx);
    }

    for (var i = 1; i < this.entities.length; i++) {
        if (!this.camera.clip(this.entities[i])) 
            this.entities[i].draw(this.ctx);
    }

    for (var i = 0; i < this.gui.length; i++) {
        this.gui[i].draw(this.ctx);
    }

    if (this.isGameOver) {
        if (this.alpha2 < 1) {
            this.alpha2 += 0.01;
        } else {
            if (this.alpha < 1)
                this.alpha += 0.01;

            this.ctx.fillStyle = 'rgba(0,0,0,' + this.alpha + ')';
            this.ctx.fillRect(this.camera.position.x - this.ctx.canvas.width / 2,
            this.camera.position.y - this.ctx.canvas.height / 2,
            this.ctx.canvas.width, this.ctx.canvas.height);
        }

        this.ctx.font = "100px Arial";
        this.ctx.fillStyle = "rgba(0,0,0," + this.alpha2 + ")";
        this.ctx.textAlign = "center";
        this.ctx.fillText("YOU DIED", this.camera.position.x + 5, this.camera.position.y + 5);

        this.ctx.font = "100px Arial";
        this.ctx.fillStyle = "rgba(255,0,0," + this.alpha2 + ")";
        this.ctx.textAlign = "center";
        this.ctx.fillText("YOU DIED", this.camera.position.x, this.camera.position.y);
    } else if (this.isWinner) {
        if (this.alpha2 < 1) {
            this.alpha2 += 0.01;
        } else {
            if (this.alpha < 1)
                this.alpha += 0.01;

            this.ctx.fillStyle = 'rgba(0,0,0,' + this.alpha + ')';
            this.ctx.fillRect(this.camera.position.x - this.ctx.canvas.width / 2,
            this.camera.position.y - this.ctx.canvas.height / 2,
            this.ctx.canvas.width, this.ctx.canvas.height);
        }

        this.ctx.font = "100px Arial";
        this.ctx.fillStyle = "rgba(0,0,0," + this.alpha2 + ")";
        this.ctx.textAlign = "center";
        this.ctx.fillText("CONGRATULATIONS", this.camera.position.x + 5, this.camera.position.y + 5);

        this.ctx.font = "100px Arial";
        this.ctx.fillStyle = "rgba(255,255,0," + this.alpha2 + ")";
        this.ctx.textAlign = "center";
        this.ctx.fillText("CONGRATULATIONS", this.camera.position.x, this.camera.position.y);
    } 
    
    this.ctx.restore();
}

// function displayGameOver(engine) {
//     engine.ctx.fillStyle = 'rgba(0,0,0,' + engine.alpha + ')';
//     engine.ctx.fillRect(engine.camera.position.x - engine.ctx.canvas.width / 2,
//         engine.camera.position.y - engine.ctx.canvas.height / 2,
//         engine.ctx.canvas.width, engine.ctx.canvas.height);
//     if (engine.alpha < 1) {
//         engine.alpha += 0.01;
//     } else {
//         engine.ctx.font = "100px Arial";
//         engine.ctx.fillStyle = "rgba(255,0,0,1.0)";
//         engine.ctx.textAlign = "center";
//         engine.ctx.fillText("YOU DIED", engine.camera.position.x, engine.camera.position.y);
//     }
// }

GameEngine.prototype.update = function() {
    if (this.players.length === 0) {
        this.isGameOver = true;
    }

    if (this.idleEnemies.length === 0) {
        if (!this.endBattle) {
            AM.getSound("./sounds/volatile.mp3").play();
            this.endBattle = true;
        }

        if (this.activeEnemies.length === 0) {
            this.isWinner = true;
        }
    }

    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].character.removeFromWorld) {
            this.players.splice(i, 1);
        } else {
            this.players[i].update();
            if (this.players[i].character.position.y < -1160 && this.players[i].character.position.x < 1000 && !this.isTrapped) {
                this.entities[this.entities.length - 1].movingRangeInY = 220;
                this.entities[this.entities.length - 1].verticalMoveCounter = 220;
                this.isTrapped = true;
            }
        }
    }

    for (var i = 0; i < this.idleEnemies.length; i++) {
        for (var j = 0; j < this.players.length; j++) {
            if (this.activateEnemy(this.idleEnemies[i], this.players[j])) {
                this.activeEnemies.push(this.idleEnemies.splice(i, 1)[0]);
            }
        }
    }

    /* this lets enemies locate the most closest player in the window. */
    for (var i = 0; i < this.players.length; i++) {
        for (var j = 0; j < this.activeEnemies.length; j++) {

            if (this.activeEnemies[j].playerBeingSeen === null) {
                this.activeEnemies[j].playerBeingSeen = this.players[i].character;
            } else if (Math.abs(this.activeEnemies[j].playerBeingSeen.body.aabb.centerX -
                    this.activeEnemies[j].body.aabb.centerX) >
                Math.abs(this.players[i].character.body.aabb.centerX
                    - this.activeEnemies[j].body.aabb.centerX)) {
                this.activeEnemies[j].playerBeingSeen = this.players[i].character;
            }
        }
    }

    for (var i = 0; i < this.activeEnemies.length; i++) {
        if (this.activeEnemies[i].removeFromWorld) {
            this.gui.splice(this.gui.indexOf(this.activeEnemies[i].statusBar), 1);
            this.activeEnemies.splice(i, 1);
        } else {
            this.activeEnemies[i].update();
        }
    }

    for (var i = 1; i < this.entities.length; i++) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        } else {
            this.entities[i].update();
        }
    }

    this.camera.update();
    for (var i = 0; i < this.gui.length; i++) {
        this.gui[i].position.x = this.camera.position.x - this.ctx.canvas.width / 2;
        this.gui[i].position.y = this.camera.position.y - this.ctx.canvas.height / 2;
    }
}

GameEngine.prototype.checkCollisions = function() {
    /* CHeck player against all entities. */
    for (var i = 0; i < this.players.length; i++) {
        for (var j = 1; j < this.entities.length; j++) {
            if (this.players[i] == this.entities[j]) {
                continue;
            }

            if (this.players[i].character.body.intersect(this.entities[j].body)) {
                this.entities[j].collide(this.players[i].character);
            }
        }

        for (var j = 0; j < this.activeEnemies.length; j++) {
            if (this.players[i].character.body.intersect(this.activeEnemies[j].body)) {
                this.activeEnemies[j].collide(this.players[i].character);
            }
        }
    }

    /* Check enemies against all other entities except Naruto. */
    for (var i = 0; i < this.activeEnemies.length; i++) {
        for (var j = 1; j < this.entities.length; j++) {
            if (this.activeEnemies[i].body.intersect(this.entities[j].body)) {
                this.activeEnemies[i].collide(this.entities[j]);
                this.entities[j].collide(this.activeEnemies[i]);
            }
        }
    }

    for (var i = 0; i < this.activeEnemies.length; i++) {
        for (var j = i + 1; j < this.activeEnemies.length; j++) {
            if (this.activeEnemies[i].body.intersect(this.activeEnemies[j].body)) {
                this.activeEnemies[i].collide(this.activeEnemies[j]);
            }
        }
    }

    for (var i = 0; i < this.idleEnemies.length; i++) {
        for (var j = 1; j < this.entities.length; j++) {
            if (this.entities[j] instanceof Weapon && this.idleEnemies[i].body.intersect(this.entities[j].body)) {
                this.entities[j].collide(this.idleEnemies[i]);
                this.activeEnemies.push(this.idleEnemies.splice(i, 1)[0]);
            }
        }
    }

    /* Check entities against all other entities--not the same types. */
    for (var i = 0; i < this.entities.length - 1; i++) {
        for (var j = i + 1; j < this.entities.length; j++) {

            if (this.entities[i] instanceof Naruto || this.entities[i].constructor.name === this.entities[j].constructor.name)
                continue;

            if (this.entities[i].body.intersect(this.entities[j].body)) {
                this.entities[j].collide(this.entities[i]);
                this.entities[i].collide(this.entities[j]);
            }
        }
    }
};

GameEngine.prototype.activateEnemy = function(enemy, player) {
    if ((Math.abs(enemy.position.x - player.character.position.x) < this.ctx.canvas.width / 4) 
        && ((enemy.position.y > this.camera.position.y - this.ctx.canvas.height / 2) 
                && (enemy.position.y < this.camera.position.y + this.ctx.canvas.height / 2))) {
        return true;
    }
    return false;
}

GameEngine.prototype.loop = function() {
    this.clockTick = this.timer.tick();
    this.update();
    this.checkCollisions();
    this.draw();
}

/***********************************************/
/****************** T I M E R ******************/
/***********************************************/
function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

/*************************************************/
/****************** C A M E R A ******************/
/*************************************************/
function Camera(ctx, focus, offset={x:0, y:0}) {
    this.ctx = ctx;
    this.focus;
    this.position = {x:ctx.canvas.width / 2, y:ctx.canvas.height / 2};
    this.offset = offset;
}

/*
 * Updates the camera, it will track whatever it is focused on.
 */
Camera.prototype.update = function() {
    if (!this.focus)    // There is no focus, do not update.
        return;

    /* How much to move the camera and translate the canvas. */
    var step = Math.max(2, this.focus.speed / 60);

    if (this.focus.position.x > this.position.x + 120) {
        this.position.x += step;
        this.ctx.translate(-step, 0);
    } else if (this.focus.position.x < this.position.x - 120) {
        this.position.x -= step;
        this.ctx.translate(step, 0);
    }

    /* If the player gets off the screen re-center the player. */
    var translateStep = this.focus.position.x - this.position.x;
    if (Math.abs(translateStep) > this.ctx.canvas.width / 2 - 20) {
        this.ctx.translate(-translateStep, 0);
        this.position.x = this.focus.position.x;
    }


    if (this.focus.position.y > this.position.y + 60) {
        this.position.y += 2;
        this.ctx.translate(0, -2);
    } else if (this.focus.position.y < this.position.y - 90) {
        this.position.y -= 2;
        this.ctx.translate(0, 2);
    }

    /* If the player gets off the screen re-center the player. */
    translateStep = this.focus.position.y - this.position.y;
    if (Math.abs(translateStep) > this.ctx.canvas.height / 2 - 40) {
        this.ctx.translate(0, -translateStep);
        this.position.y = this.focus.position.y;
    }
}

/*
 * Sets the camera's focus, its focus is what it will track.
 */
Camera.prototype.setFocus = function(entity) {
    this.focus = entity;
}

Camera.prototype.clip = function(entity) {
    if ((entity.position.x + entity.width < this.position.x - this.ctx.canvas.width / 2
            || entity.position.x > this.position.x + this.ctx.canvas.width / 2)) {
        return true;
    }
    return false;
}

/****************************************************/
/*********** U S E R    I N T E R F A C E ***********/
/****************************************************/

/*
 * A UserInterface may consist of multiple different sprites located around
 * the same origin. When a sprite is added to a UI, the sprite's position is now
 * an offset to the UI's position. Sprites in the beginning of the list will be
 * drawn first(behind), the last sprite in the list will be drawn last in front of
 * all the previously drawn sprites.
 */
function UserInterface(xc, yc, offsetX, offsetY) {
    this.position = {x:xc, y:yc};
    this.x = xc;
    this.y = yc - 18;
    this.offset = {x:offsetX, y:offsetY};
    this.sprites = [];
    this.enabled = true;
};

UserInterface.prototype.draw = function(ctx) {
    if (this.enabled) {
        for (var i = 0; i < this.sprites.length; i++) {
            this.sprites[i].drawOptions(ctx, this.position.x, this.position.y, 1.0, 1.0);
        }
    }
}

UserInterface.prototype.addSprite = function(sprite) {
    if (sprite instanceof Sprite)
        this.sprites.push(sprite);
}

UserInterface.prototype.enable = function(enabled) {
    this.enabled = enabled;
}

/*
 * A PlayerStatusBar is a UserInterface element consisting of three different "depths," a
 * background(usually black filling), a midground, and a foreground. The elements should
 * be drawn in the order that they were mentioned previously. The health bar and energy bar
 * are located in the "midground" at elements 1 and 2 resepectively.
 */
function PlayerStatusBar(x, y, offsetX, offsetY) {
    this.healthAmount = 1.0;
    this.energyAmount = 1.0;
    UserInterface.call(this, x, y, offsetX, offsetY);
};

PlayerStatusBar.prototype = new UserInterface();
PlayerStatusBar.prototype.constructor = PlayerStatusBar;

PlayerStatusBar.prototype.draw = function(ctx) {
    if (this.enabled) {
        for (var i = 0; i < this.sprites.length; i++) {
            if (i === 2) {                                      // Health Bar.
                this.sprites[i].drawOptions(ctx, this.position.x + this.offset.x,
                    this.position.y + this.offset.y, this.healthAmount, 1.0);
            } else if (i === 3) {                               // Energy Bar.
                this.sprites[i].drawOptions(ctx, this.position.x + this.offset.x,
                    this.position.y + this.offset.y, this.energyAmount, 1.0);
            } else {                                            // Other UI ELEMENTS.
                this.sprites[i].drawOptions(ctx, this.position.x + this.offset.x,
                    this.position.y + this.offset.y, 1.0, 1.0);
            }
        }
    }
}

PlayerStatusBar.prototype.updateStatus = function(healthAmount, energyAmount) {
    this.healthAmount = healthAmount;
    this.energyAmount = energyAmount;
}

function EnemyStatusBar(x, y, offsetX, offsetY) {
    this.healthAmount = 1.0;
    UserInterface.call(this, x, y, offsetX, offsetY);
    var that = this;
    this.enabled = true;
    this.disableBarTimer = window.setTimeout(function()
                            {that.enabled = false;}, 0);
}

EnemyStatusBar.prototype = new UserInterface();
EnemyStatusBar.prototype.constructor = EnemyStatusBar;

EnemyStatusBar.prototype.draw = function(ctx) {
    if (this.enabled) {
        for (var i = 0; i < this.sprites.length; i++) {
            if (i === 1) {                                      // Health Bar.
                this.sprites[i].drawOptions(ctx, this.x,
                    this.y, this.healthAmount, 1.0);
            } else {                                            // Background & Foreground.
                this.sprites[i].drawOptions(ctx, this.x,
                    this.y, 1.0, 1.0);
            }
        }
    }
}

EnemyStatusBar.prototype.updateStatus = function(healthAmount) {
    this.healthAmount = healthAmount;
}

EnemyStatusBar.prototype.resetTimer = function() {
    var that = this;
    window.clearTimeout(this.disableBarTimer);

    this.disableBarTimer = window.setTimeout(function() {
        that.enabled = false;
    }, 4000);
}
