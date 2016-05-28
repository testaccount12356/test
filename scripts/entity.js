/*******************************************/
/*************** E N T I T Y ***************/
/*******************************************/
function Entity(game, x, y, width, height) {
    this.game = game;
    this.position = {x:x, y:y};
    this.width = width;
    this.height = height;
    this.body = new PhysicsBody(x, y, width, height);
    this.removeFromWorld = false;
}

/*
 * This method will update the entity, the actual movement of the enity is
 * happening here.
 */
Entity.prototype.update = function() {
    if (this.position.y > 600)          // Fallen off of the map.
        this.removeFromWorld = true;

    this.body.update();

    if (this.body.gravityEnabled)
        this.position.y += this.body.velocity.y;    // Move entity in the Y-Axis direction.
    
    this.position.x += this.body.velocity.x;    // Move entity in the X-Axis direction.

    this.body.updateBounds(this.position.x, this.position.y,
                            this.width, this.height);
}

Entity.prototype.draw = function(ctx) {};

//Entity.prototype.rotateAndCache = function (image, angle) {
//    var offscreenCanvas = document.createElement('canvas');
//    var size = Math.max(image.width, image.height);
//    offscreenCanvas.width = size;
//    offscreenCanvas.height = size;
//    var offscreenCtx = offscreenCanvas.getContext('2d');
//    offscreenCtx.save();
//    offscreenCtx.translate(size / 2, size / 2);
//    offscreenCtx.rotate(angle);
//    offscreenCtx.translate(0, 0);
//    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
//    offscreenCtx.restore();
//    //offscreenCtx.strokeStyle = "red";
//    //offscreenCtx.strokeRect(0,0,size,size);
//    return offscreenCanvas;
//}

/**************************************************************/
/****************** P H Y S I C S    B O D Y ******************/
/**************************************************************/
function PhysicsBody(x, y, width, height, mass) {
    this.aabb = {minX: x, maxX: x + width,
                 minY: y, maxY: y + height,
                 centerX: x+width/2, centerY: y+height/2};
    this.velocity = {x:0, y:0};
    this.gravityEnabled = true;
}

/*
 * This method updates the physics body based on all of the affects
 * acting upon it--currently only gravity.
 */
PhysicsBody.prototype.update = function() {
    if (this.velocity.y < 10) {
        this.velocity.y += gameEngine.gravity * gameEngine.clockTick;
    }
}

/*
 * This method will update the bounds of the physics body.
 */
PhysicsBody.prototype.updateBounds = function(x, y, width, height) {
    this.aabb.minX = x;
    this.aabb.minY = y;
    this.aabb.maxX = x + width;
    this.aabb.maxY = y + height;
    this.aabb.centerX = x + width / 2;
    this.aabb.centerY = y + height / 2;
}

/*
 * This method will return true if it is intersecting with another
 * physics body(collision occurred).
 */
PhysicsBody.prototype.intersect = function(other) {
    return (this.aabb.minX <= other.aabb.maxX && this.aabb.maxX >= other.aabb.minX) 
        && (this.aabb.minY <= other.aabb.maxY && this.aabb.maxY >= other.aabb.minY);
}

/*********************************************/
/*************** T E R R A I N ***************/
/*********************************************/
function Terrain(game, texture, x, y, width, height, movingRangeInX, isMovingRight, movingRangeInY, isMovingUp) {
    this.texture = texture;
    this.movingRangeInX = movingRangeInX; // if this is a non-zero number, this terrain will move horizontally
    this.isMovingRight = isMovingRight; // this is initial horizontal direction
    this.movingRangeInY = movingRangeInY; // if this is a non-zero number, this terrain will move vertically
    this.isMovingUp = isMovingUp; // this is initial vertical direction
    this.horizontalMoveCounter = movingRangeInX;
    this.verticalMoveCounter = movingRangeInY;
    Entity.call(this, game, x, y, width, height);
}

Terrain.prototype = new Entity();
Terrain.prototype.constructor = Terrain;

Terrain.prototype.update = function() {
    if (this.movingRangeInX > 0) {
        if (this.isMovingRight) {
            this.position.x += 2;
        } else {
            this.position.x -= 2;
        }

        this.body.updateBounds(this.position.x, this.position.y, this.width, this.height);
        this.horizontalMoveCounter--;

        if (this.horizontalMoveCounter == 0) {
            this.isMovingRight = !this.isMovingRight;
            this.horizontalMoveCounter = this.movingRangeInX;
        }
    }

    if (this.movingRangeInY > 0) {
        if (this.isMovingUp) {
            this.position.y -= 2;
        } else {
            this.position.y += 2;
        }

        this.body.updateBounds(this.position.x, this.position.y, this.width, this.height);
        this.verticalMoveCounter--;

        if (this.verticalMoveCounter == 0) {
            this.isMovingUp = !this.isMovingUp;
            this.verticalMoveCounter = this.movingRangeInY;

            if (this === this.game.entities[this.game.entities.length - 1]) {
                console.log("RANGE = 0");
                this.movingRangeInY = 0;
            }
        }
    }

    
};

Terrain.prototype.draw = function(ctx) {
    var heightTiles = this.height / this.texture.height;
    var widthTiles = this.width / this.texture.width;

    for (var i = 0; i < heightTiles; i++) {
        for (var j = 0; j < widthTiles; j++) {
            ctx.drawImage(this.texture.tileSheet,
                     this.texture.index * this.texture.width, this.texture.row * this.texture.height,  // source from sheet
                     this.texture.width, this.texture.height,
                     this.position.x + j * this.texture.width, this.position.y + i * this.texture.height,
                     this.texture.width * this.texture.scale,
                     this.texture.height * this.texture.scale);
        }
    }
}
    
Terrain.prototype.collide = function(other) {
    if (this.movingRangeInX > 0) {
        // this makes sure any entity on a moving terrain will move with the terrain
        if (this.isMovingRight) {
            other.position.x += 2;
        } else {
            other.position.x -= 2;
        }
    }

    if (this.movingRangeInY > 0) {
        // this makes sure any entity on a moving terrain will move with the terrain
        if (this.isMovingUp) {
            other.position.y -= 2;
        } else {
            other.position.y += 2;
        }
    }

    var rightDX = this.body.aabb.maxX - other.body.aabb.minX;
    var leftDX = other.body.aabb.maxX - this.body.aabb.minX; 
    var topDY = other.body.aabb.maxY - this.body.aabb.minY;
    var bottomDY = this.body.aabb.maxY - other.body.aabb.minY;

    if(topDY <= bottomDY && topDY <= rightDX && topDY <= leftDX) {  // Push up.
        other.position.y -= topDY;
        if (other instanceof Naruto)
            other.isFalling = false;
    } else if (bottomDY <= rightDX && bottomDY <= leftDX) {         // Push Down.
         other.position.y += bottomDY;
         other.body.velocity.y = 0;
    } else if (rightDX <= leftDX) {                                 // Push Right.
        other.position.x += rightDX;
        other.body.velocity.x = 0;
    } else {                                                        // Push Left.
        other.position.x -= leftDX;
        other.body.velocity.x = 0;
    }

    other.body.updateBounds(other.position.x, other.position.y,
                            other.width, other.height);
};

/*********************************************/
/***************** B E I N G *****************/
/*********************************************/
function Being(health, energy, speed, gameEngine, x, y, width, height) {
    this.health = health;
    this.energy = energy;
    this.speed = speed;
    this.isEnabled = true;

    this.currentHealth = health;
    this.currentEnergy = energy;
    this.currentSpeed = speed;
    this.beenDamaged = false;
    Entity.call(this, gameEngine, x, y, width, height);
}

Being.prototype = new Entity();
Being.prototype.constructor = Being;

Being.prototype.update = function(health, energy, speed, gameEngine, x, y, width, height) {
    if (this.currentHealth < this.health)
        if (this instanceof Naruto) {
            this.currentHealth += 0.025;
        } else {
            this.currentHealth += 0.01;
        }
    if (this.currentEnergy < this.energy)
        this.currentEnergy += 0.025;
    Entity.prototype.update.call(this, gameEngine, x, y, width, height);
}

Being.prototype.dealDamage = function(damage) {
    var that = this;
    if (this.isEnabled && !this.beenDamaged) {
        this.currentHealth -= damage;
        this.beenDamaged = true; 

        if (this instanceof Enemy) {
            this.statusBar.enable(true);
            this.statusBar.resetTimer();
        }

        window.setTimeout(function(){
            that.beenDamaged = false;
        }, 300);  
    }
}

Being.prototype.isDead = function() {
    if (this.currentHealth <= 0)
        return true;
}

Being.prototype.spendEnergy = function(cost) {
    if (cost > this.currentEnergy)
        return false;
    this.currentEnergy -= cost;
    return true;
}

Being.prototype.setEnabled = function(enabled) {
    this.isEnabled = enabled
}

/*************************************************/
/****************** W E A P O N ******************/
/*************************************************/
function Weapon(owner, damage, game, x, y, width, height) {
    this.owner = owner;
    this.damage = damage;
    Entity.call(this, game, x, y, width, height);
}

Weapon.prototype = new Entity();
Weapon.prototype.constructor = Weapon;

Weapon.prototype.update = function() {
    Entity.prototype.update.call(this);
}

Weapon.prototype.applyDamage = function(other) {
    other.dealDamage(this.damage);
}

/*********************************************/
/****************** I T E M ******************/
/*********************************************/
function Item(game, x, y, width, height, expires) {
    Entity.call(this, game, x, y, width, height);
    this.expires = expires;
}

Item.prototype = new Entity();
Item.prototype.constructor = Item;

Item.prototype.update = function() {};
Item.prototype.collide = function() {};


function HealthPotion(game, x, y, width, height, expires=true) {
    this.healthPoint = 200;
    var that = this;
    Item.call(this, game, x, y, width, height, expires);

    if (this.expires) {
        window.setTimeout(function(){
            that.removeFromWorld = true;
        }, 6000);
    }
};

HealthPotion.prototype = new Item();
HealthPotion.prototype.constructor = HealthPotion;

HealthPotion.prototype.collide = function(other) {
    if (other instanceof Naruto) {
        other.currentHealth = Math.min(other.health, other.currentHealth + this.healthPoint);
        this.removeFromWorld = true;
    }
};

HealthPotion.prototype.draw = function(ctx) {
    ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 136, 93, 24, 24,
        this.position.x, this.position.y, 24, 24);
};


function EnergyPotion(game, x, y, width, height) {
    this.energyPoint = 25;
    var that = this;
    Item.call(this, game, x, y, width, height);

    window.setTimeout(function(){
        that.removeFromWorld = true;
    }, 6000);
};

EnergyPotion.prototype = new Item();
EnergyPotion.prototype.constructor = EnergyPotion;

EnergyPotion.prototype.collide = function(other) {
    if (other instanceof Naruto) {
        other.currentEnergy = Math.min(other.energy, other.currentEnergy + this.energyPoint);
        this.removeFromWorld = true;
    }
};

EnergyPotion.prototype.draw = function(ctx) {
    ctx.drawImage(AM.getAsset("./images/visual_effects.png"), 207, 89, 36, 32,
        this.position.x, this.position.y, 36, 32);
};


