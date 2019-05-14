var game = new Phaser.Game({
	type: Phaser.AUTO,
	width: 1000,
	height: 750,
	physics: {
		default: 'arcade'
	},
	scene: new MapScene()
});