import * as THREE from 'three';

/**
 * Billboard sprite that always faces the camera.
 * Supports spritesheet frame animation (horizontal strip).
 */
export class BillboardSprite {
  readonly sprite: THREE.Sprite;
  private material: THREE.SpriteMaterial;
  private totalFrames: number;

  constructor(texture: THREE.Texture, totalFrames = 1, scale = 1) {
    // Clone so we can modify offset/repeat independently
    const tex = texture.clone();
    tex.needsUpdate = true;
    tex.repeat.set(1 / totalFrames, 1);
    tex.offset.set(0, 0);

    this.material = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false,
    });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.set(scale, scale, scale);
    this.totalFrames = totalFrames;
  }

  setFrame(index: number) {
    const i = Math.max(0, Math.min(index, this.totalFrames - 1));
    this.material.map!.offset.x = i / this.totalFrames;
    this.material.map!.needsUpdate = true;
  }

  setPosition(x: number, y: number, z: number) {
    this.sprite.position.set(x, y, z);
  }

  setScale(s: number) {
    this.sprite.scale.set(s, s, s);
  }

  setVisible(v: boolean) {
    this.sprite.visible = v;
  }

  setTint(r: number, g: number, b: number) {
    this.material.color.setRGB(r, g, b);
  }

  addTo(scene: THREE.Scene) {
    scene.add(this.sprite);
  }

  removeFrom(scene: THREE.Scene) {
    scene.remove(this.sprite);
    this.material.dispose();
    this.material.map?.dispose();
  }

  get position() { return this.sprite.position; }
}
