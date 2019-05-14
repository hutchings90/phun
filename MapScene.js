class MapScene extends PhunScene {
	constructor() {
		super({key: 'MapScene'});
		this.charT = 0;
		this.player = null;
		this.fires = null;
		this.cursors = null;
		this.lastVy = 0;
		this.lastVx = 0;
		this.msgBox = null;
		this.msgBoxI = 0;
		this.msgBoxJ = 0;
		this.msgBoxTexts = [];
		this.setUpdateFunc(this.move);
	}

	preload() {
		this.load.spritesheet('player', 'assets/player1.png', {
			frameWidth: 50,
			frameHeight: 80,
		});
		this.load.spritesheet('fire', 'assets/fireSheet.png', {
			frameWidth: 80,
			frameHeight: 80,
		});
		this.load.image('tileset', 'assets/tileset.png');
		this.load.tilemapTiledJSON('forest', 'assets/tilemaps/forest.json');
		this.load.image('firePallet', 'assets/firePallet.png');
	}

	create() {
		var forest = this.make.tilemap({ key: 'forest' });
		var start = forest.findObject('Objects', obj => obj.name == 'start');
		var fireObjects = forest.filterObjects('Objects', obj => obj.type == 'fire');
		var tileset = forest.addTilesetImage('tileset', 'tileset');
		var groundLayer = forest.createStaticLayer('ground', tileset, 0, 0);
		var worldLayer = forest.createStaticLayer('world', tileset, 0, 0);
		worldLayer.setCollisionByProperty({ collides: true }, true);

		if (this.fires) this.fires.destroy();
		this.fires = this.physics.add.staticGroup();
		this.createPalettes({
			paletteKey: 'firePallet',
			paletteNames: ['orange', 'purple', 'blue', 'green', 'white'],
			spriteSheet: {
				key: 'fire',
				frameWidth: 80,
				frameHeight: 80
			},
			animations: [{
				key: 'burn',
				startFrame: 0,
				endFrame: 2,
				frameRate: 12
			}]
		});

		if (this.player) this.player.destroy();
		this.player = this.physics.add.sprite(start.x, start.y, 'player');
		this.physics.add.collider(this.player, worldLayer);

		for (var i = fireObjects.length - 1; i >= 0; i--) {
			var fire = fireObjects[i];
			var color = '';
			for (var j = fire.properties.length - 1; j >= 0; j--) {
				var prop = fire.properties[j];
				if (prop.name == 'color') color = prop.value;
			}
			this.fires.create(fire.x, fire.y, 'fire-' + color).anims.play('fire-' + color + '-burn');
		}
		this.physics.add.collider(this.player, this.fires);

		this.cameras.main.setBounds(0, 0, forest.widthInPixels, forest.heightInPixels);
		this.cameras.main.startFollow(this.player);

		this.anims.create({
			key: 'standSide',
			frames: [ { key: 'player', frame: 6 } ],
			frameRate: 1
		});
		this.anims.create({
			key: 'standUp',
			frames: [ { key: 'player', frame: 3 } ],
			frameRate: 1
		});
		this.anims.create({
			key: 'standDown',
			frames: [ { key: 'player', frame: 0 } ],
			frameRate: 1
		});

		this.anims.create({
			key: 'walkSide',
			frames: [{ key: 'player', frame: 6 }, { key: 'player', frame: 7 }, { key: 'player', frame: 6 }, { key: 'player', frame: 8 }],
			frameRate: 7,
			repeat: -1
		});
		this.anims.create({
			key: 'walkUp',
			frames: [{ key: 'player', frame: 3 }, { key: 'player', frame: 4 }, { key: 'player', frame: 3 }, { key: 'player', frame: 5 }],
			frameRate: 7,
			repeat: -1
		});
		this.anims.create({
			key: 'walkDown',
			frames: [{ key: 'player', frame: 0 }, { key: 'player', frame: 1 }, { key: 'player', frame: 0 }, { key: 'player', frame: 2 }],
			frameRate: 7,
			repeat: -1
		});

		if (this.cursors) this.cursors.destroy();
		this.cursors = this.input.keyboard.createCursorKeys();
	}

	update() {
		this.updateFunc();
	}

	message() {
		var text = this.msgBox.text;
		if (this.msgBoxI < this.msgBoxTexts.length && ++this.charT > 1) {
			text += this.msgBoxTexts[this.msgBoxI][this.msgBoxJ++];
			if (this.msgBoxJ >= this.msgBoxTexts[this.msgBoxI].length) {
				this.msgBoxI++;
				this.msgBoxJ = 0;
				if (this.msgBoxI < this.msgBoxTexts.length) text += '\n';
			}
			this.msgBox.setText(text);
			this.charT = 0;
		}
		if (this.cursors.space.isDown) {
			if (this.msgBoxI >= this.msgBoxTexts.length - 1) {
				this.msgBox.destroy();
				this.setTransition(20, this.setUpdateFunc, this.move);
			}
			else if (this.msgBoxJ > Math.min(10, this.msgBoxTexts[this.msgBoxI].length)) {
				this.msgBox.setText(text + this.msgBoxTexts[this.msgBoxI].slice(this.msgBoxJ) + '\n');
				this.msgBoxI++;
				this.msgBoxJ = 0;
			}
		}
	}

	move() {
		// Initialize variables
		var vx = 0;
		var vy = 0;
		var prevVx = this.player.body.velocity.x;
		var prevVy = this.player.body.velocity.y;
		if ((!this.charT || --this.charT < 1) && this.cursors.space.isDown) {
			if (prevVy > 0) this.player.anims.play('standDown', true);
			else if (prevVy < 0) this.player.anims.play('standUp', true);
			else if (prevVx != 0) this.player.anims.play('standSide', true);
			else if (this.lastVy > 0) this.player.anims.play('standDown', true);
			else if (this.lastVy < 0) this.player.anims.play('standUp', true);
			else if (this.lastVx != 0) this.player.anims.play('standSide', true);
			this.displayMessage([ 'You made the message box show up!', 'You should feel so proud of yourself.', 'Well, don\'t you???', 'Has the text wrapped, yet?', 'I\'ll need to write more lines for this one.', 'I think this will be the last line.', 'Isn\'t that even just a little frustrating?' ]);
		}
		else {
			// Determine x and y velocities
			if (this.cursors.right.isDown) vx += 160;
			if (this.cursors.left.isDown) vx -= 160;
			if (this.cursors.down.isDown) vy += 160;
			if (this.cursors.up.isDown) vy -= 160;

			// Play animation
			if (vy > 0) this.player.anims.play('walkDown', true);
			else if (vy < 0) this.player.anims.play('walkUp', true);
			else if (vx > 0) {
				this.player.anims.play('walkSide', true);
				this.player.flipX = false;
			}
			else if (vx < 0) {
				this.player.anims.play('walkSide', true);
				this.player.flipX = true;
			}
			else if (prevVy > 0) this.player.anims.play('standDown', true);
			else if (prevVy < 0) this.player.anims.play('standUp', true);
			else if (prevVx != 0) this.player.anims.play('standSide', true);
			else if (this.lastVy > 0) this.player.anims.play('standDown', true);
			else if (this.lastVy < 0) this.player.anims.play('standUp', true);
			else if (this.lastVx != 0) this.player.anims.play('standSide', true);
			this.lastVy = vy;
			this.lastVx = vx;
		}
		// Set player velocity
		this.player.setVelocity(vx, vy);
	}

	// From Colbydude/phaser-3-palette-swapping-example github
	createPalettes(config) {
		// Create color lookup from palette image.
		var colorLookup = {};
		var paletteWidth = game.textures.get(config.paletteKey).getSourceImage().width;

		// Go through each pixel in the palette image and add it to the color lookup.
		for (var i = 0; i < config.paletteNames.length; i++) {
			var palette = config.paletteNames[i];
			colorLookup[palette] = [];

			for (var j = 0; j < paletteWidth; j++) {
				var pixel = game.textures.getPixel(j, i, config.paletteKey);
				colorLookup[palette].push(pixel);
			}
		}
		// Create sheets and animations from base sheet.
		var sheet = game.textures.get(config.spriteSheet.key).getSourceImage();
		for (var i = 0; i < config.paletteNames.length; i++) {
			var palette = config.paletteNames[i];
			var canvasKey = palette + '-temp';
			var atlasKey = config.spriteSheet.key + '-' + palette;

			// Create a canvas to draw new image data onto.
			var canvasTexture = game.textures.createCanvas(canvasKey, sheet.width, sheet.height);
			var canvas = canvasTexture.getSourceImage();
			var context = canvas.getContext('2d');

			// Copy the sheet.
			context.drawImage(sheet, 0, 0);

			// Get image data from the new shet.
			var imageData = context.getImageData(0, 0, sheet.width, sheet.height);
			var pixelArray = imageData.data;

			// Iterate through every pixel in the image.
			for (var j = 0; j < pixelArray.length / 4; j++) {
				var index = 4 * j;

				var r = pixelArray[index];
				var g = pixelArray[++index];
				var b = pixelArray[++index];
				var alpha = pixelArray[++index];

				// If this is a transparent pixel, ignore, move on.
				if (alpha == 0) continue;

				// Iterate through the colors in the palette.
				for (var k = 0; k < paletteWidth; k++) {
					var oldColor = colorLookup[config.paletteNames[0]][k];
					var newColor = colorLookup[palette][k];

					// If the color matches, replace the color.
					if (r == oldColor.r && g == oldColor.g && b == oldColor.b) {
						pixelArray[--index] = newColor.b;
						pixelArray[--index] = newColor.g;
						pixelArray[--index] = newColor.r;
					}
				}
			}

			// Put our modified pixel data back into the context.
			context.putImageData(imageData, 0, 0);

			// Add the canvas as a sprite sheet to the game.
			game.textures.addSpriteSheet(atlasKey, canvasTexture.getSourceImage(), {
				frameWidth: config.spriteSheet.frameWidth,
				frameHeight: config.spriteSheet.frameHeight
			});

			// Iterate over each animation.
			for (var j = 0; j < config.animations.length; j++) {
				var anim = config.animations[j];
				var animKey = atlasKey + '-' + anim.key;

				// Add the animation to the game.
				game.anims.create({
					key: animKey,
					frames: game.anims.generateFrameNumbers(atlasKey, { start: anim.startFrame, end: anim.endFrame }),
					frameRate: anim.frameRate,
					repeat: anim.repeat === undefined ? -1 : anim.repeat
				});
			}
			game.textures.get(canvasKey).destroy();
		}

		// Destroy textures that are no longer needed.
		// NOTE: This doesn't remove the textures from TextureManager.list. However, it does destroy source image data.
		game.textures.get(config.spriteSheet.key).destroy();
		game.textures.get(config.paletteKey).destroy();
	}
	// End From

	displayMessage(texts) {
		var worldView = this.cameras.main.worldView;
		if (this.msgBox) this.msgBox.destroy();
		this.msgBoxI = 0;
		this.msgBoxJ = 0;
		this.charT = 0;
		this.msgBoxTexts = texts;
		this.msgBox = this.add.text(worldView.x, worldView.y, '', {
			backgroundColor: 'black',
			color: 'white',
			height: 100,
			width: 1000
		});
		this.msgBox.setWordWrapWidth(990);
		this.setUpdateFunc(this.message);
	}
}