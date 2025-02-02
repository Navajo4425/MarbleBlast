import THREE from "three";
import { AudioManager } from "../audio";
import OIMO from "../declarations/oimo";
import { TimeState } from "../level";
import { Shape } from "../shape";
import { Util } from "../util";

/** Nukes explode on contact and knock the marble away even more than mines do. */
export class Nuke extends Shape {
	dtsPath = "shapes/hazards/nuke/nuke.dts";
	disappearTime = -Infinity;
	sounds = ['nukeexplode.wav'];
	shareMaterials = false;

	onMarbleContact(time: TimeState) {
		let marble = this.level.marble;
		let minePos = Util.vecThreeToOimo(this.worldPosition);

		// Add velocity to the marble
		let explosionForce = this.computeExplosionForce(marble.lastPos.sub(minePos));
		marble.body.addLinearVelocity(explosionForce);
		marble.slidingTimeout = 2;
		this.disappearTime = time.timeSinceLoad;
		this.setCollisionEnabled(false);

		AudioManager.play(this.sounds[0]);
		this.level.particles.createEmitter(nukeParticle, this.worldPosition);
		this.level.particles.createEmitter(nukeSmokeParticle, this.worldPosition);
		this.level.particles.createEmitter(nukeSparksParticle, this.worldPosition);
		// Normally, we would add a light here, but that's too expensive for THREE, apparently.

		this.level.replay.recordMarbleContact(this);
	}

	/** Computes the force of the explosion based on the vector to the nuke. Ported from decompiled MBG. */
	computeExplosionForce(distVec: OIMO.Vec3) {
		const range = 10;
		const power = 100;

		let dist = distVec.length();
		if (dist < range) {
			let scalar = (1 - dist/range) * power;
			distVec.scaleEq(scalar);
		}

		return distVec;
	}

	tick(time: TimeState, onlyVisual: boolean) {
		if (onlyVisual) return;
		
		// Enable or disable the collision based on disappear time
		let visible = time.timeSinceLoad >= this.disappearTime + 15000;
		this.setCollisionEnabled(visible);
	}

	render(time: TimeState) {
		let opacity = Util.clamp((time.timeSinceLoad - (this.disappearTime + 15000)) / 1000, 0, 1);
		this.setOpacity(opacity);
	}
}

/** The fire particle. */
const nukeParticle = {
	ejectionPeriod: 0.2,
	ambientVelocity: new THREE.Vector3(0, 0, 0),
	ejectionVelocity: 2,
	velocityVariance: 1,
	emitterLifetime: 50,
	inheritedVelFactor: 0.2,
	particleOptions: {
		texture: 'particles/smoke.png',
		blending: THREE.AdditiveBlending,
		spinSpeed: 40,
		spinRandomMin: -90,
		spinRandomMax: 90,
		lifetime: 1000,
		lifetimeVariance: 150,
		dragCoefficient: 0.8,
		acceleration: 0,
		colors: [{r: 0.56, g: 0.36, b: 0.26, a: 1}, {r: 0.56, g: 0.36, b: 0.26, a: 0}],
		sizes: [0.5, 1],
		times: [0, 1]
	}
};
/** The smoke particle. */
export const nukeSmokeParticle = {
	ejectionPeriod: 0.5,
	ambientVelocity: new THREE.Vector3(0, 0, 0),
	ejectionVelocity: 1.3,
	velocityVariance: 0.5,
	emitterLifetime: 50,
	inheritedVelFactor: 0.25,
	particleOptions: {
		texture: 'particles/smoke.png',
		blending: THREE.NormalBlending,
		spinSpeed: 40,
		spinRandomMin: -90,
		spinRandomMax: 90,
		lifetime: 2500,
		lifetimeVariance: 300,
		dragCoefficient: 0.7,
		acceleration: -8,
		colors: [{r: 0.56, g: 0.36, b: 0.26, a: 1}, {r: 0.2, g: 0.2, b: 0.2, a: 0.85}, {r: 0, g: 0, b: 0, a: 0}],
		sizes: [1, 1.5, 2],
		times: [0, 0.5, 1]
	}
};
/** The sparks exploding away. */
export const nukeSparksParticle = {
	ejectionPeriod: 1.7,
	ambientVelocity: new THREE.Vector3(0, -0.5, 0),
	ejectionVelocity: 13 / 1.5,
	velocityVariance: 5 / 1,
	emitterLifetime: 5000,
	inheritedVelFactor: 0.2,
	particleOptions: {
		texture: 'particles/spark.png',
		blending: THREE.AdditiveBlending,
		spinSpeed: 40,
		spinRandomMin: -90,
		spinRandomMax: 90,
		lifetime: 4500,
		lifetimeVariance: 2500,
		dragCoefficient: 0.5,
		acceleration: 0 ?? -8,
		colors: [{r: 0.6, g: 0.4, b: 0.3, a: 1}, {r: 0.6, g: 0.4, b: 0.3, a: 1}, {r: 1, g: 0.4, b: 0.3, a: 0}],
		sizes: [0.5, 0.4, 0.2],
		times: [0, 0.5, 1]
	}
};