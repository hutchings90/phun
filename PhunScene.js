class PhunScene extends Phaser.Scene {
	constructor() {
		super({key: 'PhunScene'});
		this.transitionTicks = 0;
		this.transitionCallback = null;
		this.transitionParams = null;
	}

	transition() {
		if (--this.transitionTicks < 1) this.transitionCallback(this.transitionParams);
	}

	setTransition(ticks, transitionCallback, params) {
		this.transitionTicks = ticks;
		this.setUpdateFunc(this.transition);
		this.transitionCallback = transitionCallback;
		this.transitionParams = params;
	}

	setUpdateFunc(updateFunc) {
		this.updateFunc = updateFunc;
	}
}