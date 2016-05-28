soundManager.url = 'swf/';
soundManager.flashVersion = 9;
soundManager.debugFlash = false;
soundManager.debugMode = true;

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
    this.soundsQueue = [];
}

AssetManager.prototype.queueDownload = function (path) {
    this.downloadQueue.push(path);
}

AssetManager.prototype.queueSound = function(id, path) {
    this.soundsQueue.push({id: id, path: path});
}

AssetManager.prototype.downloadSounds = function(soundsCallback) {
    var that = this;
    soundManager.onready(function() {
        console.log('soundManager ready');
        for (var i = 0; i < that.soundsQueue.length; i++) {
            that.downloadSound(that.soundsQueue[i].id, that.soundsQueue[i].path, soundsCallback);
        }
    });
    soundManager.ontimeout(function() {
        console.log('SM2 did not start');
    });
}

AssetManager.prototype.downloadSound = function(id, path, soundsCallback) {
    var that = this;
    this.cache[path] = soundManager.createSound({
        id: id,
        autoLoad: true,
        url: path,
        onload: function() {
            console.log(this.url + ' is loaded');
            that.successCount += 1;

            if (that.isDone()) {
                soundsCallback();
            }
        },
        onfinish: function() {
            if (id === "rainforest") {
                soundManager.play(id);
            }
        }, 
        volume: 
        function() {
    		if (id === "foot_steps" || id === "throw_knife" || id === "hit_by_knife") {
    			return 30;
    		} else if (id === "teleport") {
    			return 70;
    		} else if (id === "attack") {
    			return 10;
    		}
    		return 80;
  		}()
    });
}

AssetManager.prototype.isDone = function () {
    return (this.downloadQueue.length + this.soundsQueue.length) === (this.successCount + this.errorCount);
}

AssetManager.prototype.downloadAll = function (callback) {
    this.downloadSounds(callback);

    for (var i = 0; i < this.downloadQueue.length; i++) {
        var img = new Image();
        var that = this;

        var path = this.downloadQueue[i];

        img.addEventListener("load", function () {
            that.successCount++;
            if(that.isDone()) callback();
        });

        img.addEventListener("error", function () {
            console.log("Error loading " + this.src);
            that.errorCount++;
            if (that.isDone()) callback();
        });

        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.getSound = function(path) {
    return this.cache[path];
}

AssetManager.prototype.getAsset = function (path) {
    return this.cache[path];
}