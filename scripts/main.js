var AM = new AssetManager();
var gameEngine = new GameEngine();

function loadAssets() {
    AM.queueSound("foot_steps", "./sounds/foot_steps.wav");
    AM.queueSound("teleport", "./sounds/teleport.mp3");
    AM.queueSound("attack", "./sounds/punch.wav");
    AM.queueSound("throw_knife", "./sounds/throw_knife.wav");
    AM.queueSound("hit_by_knife", "./sounds/hit_by_knife.wav");
    AM.queueSound("jump", "./sounds/jump.mp3");
    AM.queueSound("landed", "./sounds/landed.mp3");
    AM.queueSound("rasengan", "./sounds/rasengan.mp3");
    AM.queueSound("fire_ball", "./sounds/fire_jutsu.mp3");
    AM.queueSound("rainforest", "./sounds/rainforest.mp3");
    AM.queueSound("battle", "./sounds/volatile.mp3");

    AM.queueDownload("./images/naruto.png");
    AM.queueDownload("./images/enemy.png");
    AM.queueDownload("./images/boss.png");
    AM.queueDownload("./images/tileSheet.jpg");
    AM.queueDownload("./images/background.jpg");
    AM.queueDownload("./images/arrow.png");
    AM.queueDownload("./images/statusBarBackground.png");
    AM.queueDownload("./images/statusBarForeground.png");
    AM.queueDownload("./images/healthBarEnemyForeground.png");
    AM.queueDownload("./images/healthBarEnemyBackground.png");
    AM.queueDownload("./images/healthBar.png");
    AM.queueDownload("./images/energyBar.png");
    AM.queueDownload("./images/naruto_headshots.png");
    AM.queueDownload("./images/visual_effects.png");

	AM.downloadAll(startGame);
}

function startGame() {
	var canvas = document.getElementById("gameWorld");
	var ctx = canvas.getContext("2d");
    var muteBtn = document.getElementById("mute-btn");
    muteBtn.addEventListener("click", function(event) {
        gameEngine.isMuted = !gameEngine.isMuted;

        if (gameEngine.isMuted) {
            soundManager.mute();
            muteBtn.childNodes[1].className = "glyphicon glyphicon-volume-off";
            muteBtn.childNodes[2].innerHTML = " Unmute";
        } else {
            soundManager.unmute();
            muteBtn.childNodes[1].className = "glyphicon glyphicon-volume-up";
            muteBtn.childNodes[2].innerHTML = " Mute";
        }

        event.preventDefault();
    }, false);

	gameEngine.init(ctx);

    var player = new Player(new Naruto(gameEngine, AM.getAsset("./images/naruto.png"), 40, 450));
    gameEngine.addPlayer(player);


    gameEngine.addEnemy(new Enemy(gameEngine, AM.getAsset("./images/enemy.png"), 400, 430, 50, 25, 22));
    gameEngine.addEnemy(new Enemy(gameEngine, AM.getAsset("./images/enemy.png"), 1200, 430, 50, 25, 22));
    gameEngine.addEnemy(new Enemy(gameEngine, AM.getAsset("./images/enemy.png"), 2800, 430, 50, 25, 22));

    gameEngine.addEnemy(new Enemy(gameEngine, AM.getAsset("./images/enemy.png"), 3910, 430, 50, 25, 22));
    gameEngine.addEnemy(new Enemy(gameEngine, AM.getAsset("./images/enemy.png"), 3930, 430, 50, 25, 22));
    gameEngine.addEnemy(new Enemy(gameEngine, AM.getAsset("./images/enemy.png"), 3970, 430, 50, 25, 22));
    gameEngine.addEnemy(new Enemy(gameEngine, AM.getAsset("./images/enemy.png"), 3990, 430, 50, 25, 22));
    

    var floorTexture = new Texture(AM.getAsset("./images/tileSheet.jpg"), 0, 2, 30, 30, 1.0);
    var cageTexture = new Texture(AM.getAsset("./images/tileSheet.jpg"), 1, 8, 30, 30, 1.0);

    var backgroundTexture = new Texture(AM.getAsset("./images/background.jpg"), 0, 0, 9500, 3000, 1.0);

    /* FLOOR */                                            // X    Y     NO. OF TILES WIDTH      NO. OF TILES HEIGHT
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 0, 500, floorTexture.width * 60, floorTexture.height * 6, 0, false, 0, false));    // Floor
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2300, 500, floorTexture.width * 80, floorTexture.height * 6, 0, false, 0, false));    // Floor
    
    /* CAGE */
    gameEngine.addEntity(new Terrain(gameEngine, cageTexture,  30, 350, floorTexture.width * 5, floorTexture.height * 1,  0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, cageTexture,  30, 470, floorTexture.width * 5, floorTexture.height * 1,  0, false, 0, false));         // Highest Platform.
    gameEngine.addEntity(new Terrain(gameEngine, cageTexture,  30, 350, floorTexture.width * 1, floorTexture.height * 5,  0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, cageTexture, 150, 350, floorTexture.width * 1, floorTexture.height * 5,  0, false, 0, false));

    /* STRUCTURES */
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture,  800, 440, floorTexture.width * 2, floorTexture.height * 2, 0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 1000, 290, floorTexture.width * 2, floorTexture.height * 7, 0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 1200,   0, floorTexture.width * 2, floorTexture.height * 7, 0, false, 0, false));

    /* SECRET AREA */
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture,  -400, 360, floorTexture.width *  1, floorTexture.height * 1, 0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture,  -480, 550, floorTexture.width *  1, floorTexture.height * 1, 0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, -1500, 600, floorTexture.width * 20, floorTexture.height * 1, 0, false, 0, false));         // Platform nearest floor.
    gameEngine.addEntity(new HealthPotion(gameEngine, -1490, 590, 24, 24, false));

    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2300, 350, floorTexture.width *  3, floorTexture.height * 5, 0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 1400, 200, floorTexture.width * 10, floorTexture.height * 1, 100, true, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 1460,  70, floorTexture.width * 39, floorTexture.height * 1, 0, false, 0, false));


    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2600,  70, floorTexture.width *  1, floorTexture.height * 6,  0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2600, 220, floorTexture.width *  2, floorTexture.height * 1,  0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2800,-200, floorTexture.width *  1, floorTexture.height * 12,  0, false, 50, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 3000, 200, floorTexture.width * 12, floorTexture.height * 10, 0, false, 0, false));

    /* TRANSPORT TO UPPER LEVEL */
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 4800, 500, floorTexture.width * 4, floorTexture.height * 1, 0, false, 650, true));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 5200, -900, floorTexture.width * 2, floorTexture.height * 1, 0, false, 0, false));    
    gameEngine.addEntity(new HealthPotion(gameEngine, 5220, -900, 24, 24, false));

    /* UPPER LEVEL */
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 3000, -500, floorTexture.width * 54, floorTexture.height * 1, 0, false, 0, false));


    /* MOVING PILLARS */
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 4000, -1200, floorTexture.width * 1, floorTexture.height * 20, 0, false, 50, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 3900, -1150, floorTexture.width * 1, floorTexture.height * 18, 0, false, 46, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 3790, -1130, floorTexture.width * 1, floorTexture.height * 18, 0, false, 43, false));
    gameEngine.addEnemy(new Enemy(gameEngine, AM.getAsset("./images/enemy.png"), 3850, -570, 50, 25, 22));
    
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 3680, -1200, floorTexture.width * 1, floorTexture.height * 20, 0, false, 50, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 3590, -1210, floorTexture.width * 1, floorTexture.height * 20, 0, false, 52, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 3470, -1170, floorTexture.width * 1, floorTexture.height * 19, 0, false, 46, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 3380, -1160, floorTexture.width * 1, floorTexture.height * 18, 0, false, 47, false));
    gameEngine.addEnemy(new Enemy(gameEngine, AM.getAsset("./images/enemy.png"), 3300, -570, 50, 25, 22));

    /* HORIZONTAL PLATFORMS */
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2500, -600, floorTexture.width * 4, floorTexture.height * 1, 100, true, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 3100, -700, floorTexture.width * 3, floorTexture.height * 1, 100, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2600, -820, floorTexture.width * 3, floorTexture.height * 1, 80, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2900, -960, floorTexture.width * 4, floorTexture.height * 1, 110, true, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2550, -1000, floorTexture.width * 2, floorTexture.height * 1, 110, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 2000, -950, floorTexture.width * 4, floorTexture.height * 1, 100, false, 100, true));

    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, -300, -1160, floorTexture.width * 60 , floorTexture.height * 3, 0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, -300, -1600, floorTexture.width * 60 , floorTexture.height * 3, 0, false, 0, false));

    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, -300, -1580, floorTexture.width * 3 , floorTexture.height * 17, 0, false, 0, false));
    gameEngine.addEntity(new Terrain(gameEngine, floorTexture, 1410, -2080, floorTexture.width * 3 , floorTexture.height * 17, 0, false, 0, false));

    gameEngine.addEnemy(new Boss(gameEngine, AM.getAsset("./images/boss.png"), -200, -1240, 350, 200, 30));


    /* BACKGROUND SCENERY */
    gameEngine.addScenery(new Sprite(gameEngine, backgroundTexture, -2800, -2000));
    var arrowSprite = new Sprite(gameEngine, null, 4840, 350);
    arrowSprite.setAnimation(new Animation(AM.getAsset("./images/arrow.png"), 0, 0, 247, 680, 4, 0.5, 4, true, 0.2));
    gameEngine.addScenery(arrowSprite);

    var statusBarForegroundTexture = new Texture(AM.getAsset("./images/statusBarForeground.png"), 0, 0, 300, 125, 1.0);
    var statusBarBackgroundTexture = new Texture(AM.getAsset("./images/statusBarBackground.png"), 0, 0, 300, 125, 1.0);
    var statusBarIconTexture = new Texture(AM.getAsset("./images/naruto_headshots.png"), 0, 0, 95, 100, 0.8);
    var healthBarTexture = new Texture(AM.getAsset("./images/healthBar.png"), 0, 0, 195, 16, 1.0);
    var energyBarTexture = new Texture(AM.getAsset("./images/energyBar.png"), 0, 0, 187, 12, 1.0);    

    var playerStatus = new PlayerStatusBar(0, 100, 5, 0);
    playerStatus.addSprite(new Sprite(gameEngine, statusBarBackgroundTexture, 0, 0));
    playerStatus.addSprite(new Sprite(gameEngine, statusBarIconTexture, 12, 18));
    playerStatus.addSprite(new Sprite(gameEngine, healthBarTexture, 94, 35));
    playerStatus.addSprite(new Sprite(gameEngine, energyBarTexture, 98, 55));
    playerStatus.addSprite(new Sprite(gameEngine, statusBarForegroundTexture, 0, 0));
    
    player.setStatusBar(playerStatus);

    gameEngine.addUserInterface(playerStatus);

    gameEngine.start();
}

