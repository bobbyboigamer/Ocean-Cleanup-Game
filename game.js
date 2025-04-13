import {createElem, bound, polarToCartesian, dist} from "./randomStuff.js";

// global variable spam cuz they dont pay me enough
export const tileSize = 50;
export const mapWidth = 10;
export const mapHeight = 10;

class Entity {
    /**
     * @param x Entity topleft Cartesian X coordinate in tiles
     * @param Y Entity Y coordinate
     * @param health Maximum health
     * @param speed Speed in tiles / frame
     * @param imgSrc Path to this entity's image
     */
    constructor(x, y, health, speed, imgSrc, parentElem) {
        // move them comments into jsdoc
        this.oldX = x; // x coordinate from previous frame, used to update image only when necessary
        this.oldY = y; // old y coordinate
        this.oldRotation = 0; // old rotation
        this.x = x;
        this.y = y;
        this.rotation = 0; // rotation in radians
        this.health = health;
        this.speed = speed;
        this.image = createElem("img", {src: imgSrc, width: tileSize}, {position: "absolute", left: "0", top: "0"});
        this.parentElem = parentElem;
        this.parentElem.appendChild(this.image);
    }

    update() {
        this.x = bound(this.x, 0, mapWidth);
        this.y = bound(this.y, 0, mapHeight);
        // angle threshold arbitrarily chosen
        if (this.oldX !== this.x || this.oldY !== this.y || angleDiff(this.rotation, this.oldRotation) > Math.PI / 16) {
            this.image.style.transform = `translate(${this.x * tileSize}px, ${this.y * tileSize}px) rotate(${this.rotation}rad)`;
        }
    }

    oof() {
        this.image.remove();
    }
}

export class Player extends Entity {
    constructor(tool) {
        this.tool = tool;
        super();
        // they dont pay me enough
        keys = new Map();
        this.parentElem.addEventListener("keydown", event => {
            this.keys.set(event.key, true)
        });
        this.parentElem.addEventListener("keyup", event => {
            this.keys.set(event.key, false);
        });
        // im sure throwing this shit in an event listener will have absolutely no problems with rotation change detection in update()
        this.parentElem.addEventListener("mousemove", event => {
            this.tool.rotation = Math.atan2(event.pageY / tileSize - this.y, event.pageX / tileSize - this.x);
        });
    }

    update() {
        if (this.keys.get("w")) {
            this.y -= this.speed;
        }
        if (this.keys.get("s")) {
            this.y += this.speed;
        }
        if (this.keys.get("a")) {
            this.x -= this.speed;
        }
        if (this.keys.get("d")) {
            this.y += this.speed;
        }
        super.update();
    }

    die() {
        removeEventListener("keydown", this.handleKeyboard)
    }
}

class Tool extends Entity {
    constructor() {
        super();
        this.shit = [];
        this.maxCapacity = -69;
    }

    grabShit(worldShit) {
        throw new Error("override this you idiot")
    }

    depositShit() {
        for (const shit of this.shit) {
            shit.oof();
        }
        this.shit = [];
    }
}

export class Net extends Tool {
    maxCapacity = 1
    constructor(grabberLength, grabRadius) {
        this.grabberLength = grabberLength;
        this.grabRadius = grabRadius;
    }

    grabShit(worldShit) {
        if (this.shit.length >= this.maxCapacity) {
            return;
        }
        const netPos = polarToCartesian(this.grabberLength, this.rotation);
        netPos[0] += this.x;
        netPos[1] += this.y;
        for (const shit of worldShit) {
            if (dist(netPos[0], netPos[1], shit.x, shit.y) <= this.grabRadius) {
                this.shit.push(shit)
                shit.die();
                return;
            }
        }
    }
}