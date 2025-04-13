// will not separate files for now because no bundler + CORS prevents files from being split into modules

/**
 * Modulus. Like remainder but also for negative numbers.
 * mod(420, 69) = 6; mod(-69, 420) = 351;
 * @param num Dividend
 * @param divisor Divisor
 * @returns Mod
 */
function mod(num, divisor) {
    return ((num % divisor) + divisor) % divisor;
}

/**
 * Create an element but stupid
 * @param type Type of element
 * @param properties Element properties set using regular object properties
 * @param children List of element's childrens, added with appendChild
 * @return Element
 */
function createElem(type, properties = {}, styles = {}, ...children) {
    const elem = document.createElement(type);
    Object.assign(elem, properties);
    Object.assign(elem.style, styles);
    for (const child of children) {
        elem.appendChild(child);
    }
    return elem;
}

/**
 * Bound a number between min and max
 * @value value to bound
 * @min minimum
 * @max maximum
 * @return bounded value
 */
function bound(value, min, max) {
    return Math.max(Math.min(value, max), min);
}

/**
 * Polar coordinates to cartesian coordinates
 * @param r Radius
 * @param theta Angle in radians, including coterminal
 * @returns Cartesian [x, y]
 */
function polarToCartesian(radius, rotation) {
    return [Math.cos(theta) * r, Math.sin(theta) * r];
}

/**
 * Distance between two cartesian points using pythagorean theorems.
 * @param x1 X coordinate of first point
 * @param y1 Y coordinate of first point
 * @param x2 X coordinate of second point
 * @param y2 Y coordinate of second point
 * @returns Distance
 */
function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Angle between two radian points. May handle negatives. Will not handle coterminal angles.
 * @param one First radian angle
 * @param two Second radian angle
 * @returns Possibly negative difference in radians
 */
function angleDiff(one, two) {
    // dont ask me what this is
    return mod((one - two) + Math.PI, 2 * Math.PI) - Math.PI;
}



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
        // methinks messing with the DOM in an requestAnimationFrame is slow or smth
        this.parentElem = parentElem;
        this.parentElem.appendChild(this.image);
        this.rotationCenter = [50, 50]
        this.imgHeight = this.image.offsetHeight;
    }

    update() {
        this.x = bound(this.x, 0, mapWidth - 1);
        this.y = bound(this.y, 0, mapHeight - 1);
        // angle threshold arbitrarily chosen
        if (this.oldX !== this.x || this.oldY !== this.y || angleDiff(this.rotation, this.oldRotation) > Math.PI / 16) {
            this.image.style.transform = `translate(${this.x * tileSize - tileSize * this.rotationCenter[0] / 100}px, ${this.y * tileSize - this.imgHeight * this.rotationCenter[1] / 100}px) rotate(${this.rotation}rad)`;
        }
    }

    oof() {
        this.image.remove();
    }
}

class Player extends Entity {
    constructor(x, y, parentElem, tool) {
        super(x, y, 100, 1, "img/placeholder.png", parentElem);
        this.tool = tool;
        this.rotationCenter = [0, 0]
        // they dont pay me enough
        this.keys = new Map();
        addEventListener("keydown", event => {
            this.keys.set(event.key, true)
        });
        addEventListener("keyup", event => {
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
            this.x += this.speed;
        }
        this.tool.x = this.x + 0.5;
        this.tool.y = this.y + 0.5;
        this.tool.update();
        super.update();
    }

    die() {
        removeEventListener("keydown", this.handleKeyboard)
    }
}

class Tool extends Entity {
    constructor(parentElem) {
        super(-69, -420, 1, 1, "img/placeholder.png", parentElem);
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

class Net extends Tool {
    maxCapacity = 1
    constructor(parentElem, grabberLength, grabRadius) {
        super(parentElem);
        this.image.src = "img/net.png";
        this.imgHeight = this.image.offsetHeight
        this.grabberLength = grabberLength;
        this.grabRadius = grabRadius;
        this.rotationCenter = [0, 18];
        this.image.style.transformOrigin = `${this.rotationCenter[0]}% ${this.rotationCenter[1]}%`
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


addEventListener("DOMContentLoaded", () => {
    document.getElementById("playButton").addEventListener("click", () => {
        document.getElementById("playScreen").remove();
        const gameDiv = createElem("div", {}, {position: "absolute", left: "0", top: "0", overflow: "hidden", display: "block", width: `${tileSize * mapWidth}px`, height: `${tileSize * mapHeight}px`});
        document.body.appendChild(gameDiv);
        const idk = new Player(5, 5, gameDiv, new Net(gameDiv, 69, 420));
        
        function shit() {
            idk.update();
            requestAnimationFrame(shit);
        }
        requestAnimationFrame(shit);
    });
})