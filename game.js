import {createElem, bound} from "./randomStuff.js";

// global variable spam cuz they dont pay me enough
const tileSize = 50;
const mapWidth = 10;
const mapHeight = 10;

class Entity {
    /**
     * @param x Entity topleft Cartesian X coordinate in tiles
     * @param Y Entity Y coordinate
     * @param health Maximum health
     * @param speed Speed in tiles / frame
     * @param imgSrc Path to this entity's image
     */
    constructor(x, y, health, speed, imgSrc) {
        this.oldX = x;
        this.oldY = y;
        this.oldRot = 0;
        this.x = x;
        this.y = y;
        this.rot = 0;
        this.health = health;
        this.speed = speed;
        this.image = createElem("img", {src: imgSrc, width: tileSize}, {position: "absolute", left: "0", top: "0"});
    }

    update() {
        this.x = bound(this.x, 0, mapWidth);
        this.y = bound(this.y, 0, mapHeight);
        if (this.oldX !== this.x || this.oldY !== this.y || this.oldRot !== this.rot) {
            this.image.style.transform = `translate(${this.x * tileSize}px, ${this.y * tileSize}px) rotate(${this.rot}rad)`;
        }
    }

    oof() {
        this.image.remove();
    }
}

class Player extends Entity {
    constructor() {
        super();
        // they dont pay me enough
        addEventListener("keydown", event => {
            if (event.key === "w") {
                this.y -= this.speed;
            }
            if (event.key === "s") {
                this.y += this.speed;
            }
            if (event.key === "a") {
                this.x -= this.speed;
            }
            if (event.key === "d") {
                this.y += this.speed;
            }
        });
    }
}
