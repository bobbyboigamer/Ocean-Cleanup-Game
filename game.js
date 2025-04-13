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
    return [Math.cos(rotation) * radius, Math.sin(rotation) * radius];
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

class Entity {
    /**
     * @param x Entity topleft Cartesian X coordinate in tiles
     * @param y Entity Y coordinate
     * @param speed Speed in tiles / frame
     * @param imgSrc Path to this entity's image
     */
    constructor(x, y, speed, imgSrc, parentElem) {
        // move them comments into jsdoc
        this.oldX = NaN; // x coordinate from previous frame, used to update image only when necessary
        this.oldY = NaN; // old y coordinate
        this.oldRotation = 0; // old rotation
        this.x = x;
        this.y = y;
        this.rotation = 0; // rotation in radians
        this.speed = speed;
        this.image = createElem("img", {src: imgSrc, width: tileSize}, {position: "absolute", left: "0", top: "0"});
        // methinks messing with the DOM in an requestAnimationFrame is slow or smth
        this.parentElem = parentElem;
        this.parentElem.appendChild(this.image);
        this.rotationCenter = [0, 0]
        this.imgHeight = this.image.offsetHeight;
    }

    update() {
        this.x = bound(this.x, 0, mapWidth - 1);
        this.y = bound(this.y, 0, mapHeight - 1);
        // angle threshold arbitrarily chosen
        if (this.oldX !== this.x || this.oldY !== this.y || this.rotation !== this.oldRotation) {
            this.image.style.transform = `translate(${this.x * tileSize - tileSize * this.rotationCenter[0] / 100}px, ${this.y * tileSize - this.imgHeight * this.rotationCenter[1] / 100}px) rotate(${this.rotation}rad)`;
        }
        this.oldX = this.x;
        this.oldY = this.y;
        this.oldRotation = this.rotation;
    }

    oof() {
        this.image.remove();
    }
}

class Player extends Entity {
    constructor(x, y, parentElem, tool, shits) {
        super(x, y, 0.1, "img/noSwim.png", parentElem);
        this.health = 100;
        this.healthBar = createElem("meter", {max: 100, width: tileSize, value: this.health}, {position: "absolute", left: "0", top: "0"});
        this.parentElem.appendChild(this.healthBar);
        this.shits = shits;
        this.tool = tool;
        // they dont pay me enough
        this.keys = new Map();
        addEventListener("keydown", event => {
            this.keys.set(event.key, true)
        });
        addEventListener("keyup", event => {
            this.keys.set(event.key, false);
        });
        addEventListener("click", () => {
            this.tool.grabShit(this.shits);
        })
        // im sure throwing this shit in an event listener will have absolutely no problems with rotation change detection in update()
        this.parentElem.addEventListener("mousemove", event => {
            this.tool.rotation = Math.atan2((event.pageY - topOffset) / tileSize - this.y - 0.5, event.pageX / tileSize - this.x - 0.5);
        });
        this.money = 0;
    }

    update() {
        if (this.keys.get("w")) {
            this.y -= this.speed;
            this.image.src = "img/swimUp.png";
        }
        if (this.keys.get("s")) {
            this.y += this.speed;
            this.image.src = "img/swimDown.png";
        }
        if (this.keys.get("a")) {
            this.x -= this.speed;
            this.image.src = "img/swimLeft.png";
        }
        if (this.keys.get("d")) {
            this.x += this.speed;
            this.image.src = "img/swimRight.png";
        }
        if (this.x === this.oldX && this.y === this.oldY && this.image.src !== "img/noSwim.png") {
            this.image.src = "img/noSwim.png";
        }
        if (dist(this.x, this.y, trashPos[0], trashPos[1]) < 2) {
            this.money += this.tool.depositShit();
            document.getElementById("trashCounter").textContent = `Trash: ${this.money}`;
        }
        this.tool.x = this.x + 0.5;
        this.tool.y = this.y + 0.5;
        this.tool.update();
        this.healthBar.value = this.health;
        this.healthBar.style.transform = `translate(${this.x * tileSize}px, ${this.y * tileSize + this.imgHeight}px)`;
        super.update();
    }
}

class Tool extends Entity {
    constructor(parentElem) {
        super(-69, -420, 1, "img/placeholder.png", parentElem);
        this.shit = [];
        this.maxCapacity = -69;
    }

    grabShit(shit) {
        throw new Error("override this you idiot")
    }

    depositShit() {
        let value = 0;
        for (const shit of this.shit) {
            value += shit.value;
            shit.oof();
        }
        this.shit = [];
        trashElem.src = "img/trash.png";
        return value;
    }

    update() {
        if (this.shit.length === this.maxCapacity && trashElem.src !== "img/trashActive.png") {
            trashElem.src = "img/trashActive.png";
        }
        super.update();
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

    grabShit(shits) {
        if (this.shit.length >= this.maxCapacity) {
            return;
        }
        const netPos = polarToCartesian(this.grabberLength, this.rotation);
        netPos[0] += this.x;
        netPos[1] += this.y;
        for (const shit of shits) {
            if (dist(netPos[0], netPos[1], shit.x, shit.y) <= this.grabRadius) {
                this.shit.push(shit)
                shit.oof();
                return;
            }
        }
    }
}

class Shit extends Entity {
    constructor(x, y, parentElem, trashImgs) {
        super(x, y, 0.01, trashImgs[Math.floor(Math.random() * trashImgs.length)], parentElem);
        this.value = 1;
        this.update();
        this.dead = false;
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

class MovingShit extends Shit {
    constructor(...args) {
        super(...args);
        this.driftDirection = ["up", "down", "left", "right"][Math.floor(Math.random() * 4)];
        this.driftCounter = 0;
        this.maxDriftFrames = Math.floor(Math.random() * 300);
    }

    update() {
        if (this.driftDirection === "up") {
            this.y -= this.speed;
        } else if (this.driftDirection === "down") {
            this.y += this.speed;
        } else if (this.driftDirection === "left") {
            this.x -= this.speed;
        } else if (this.driftDirection === "right") {
            this.x += this.speed;
        }
        this.driftCounter++;
        if (this.driftCounter >= this.maxDriftFrames) {
            this.driftCounter = 0;
            this.driftDirection = ["up", "down", "left", "right"][Math.floor(Math.random() * 4)];
            this.maxDriftFrames = Math.floor(Math.random() * 300);
        }
        super.update();
    }
}


// global variable spam cuz they dont pay me enough
const tileSize = 50;
const topOffset = 100;
const mapWidth = 20;
const mapHeight = 20;
const trashPos = [0, 0];

const trashElem = createElem("img", {src: "img/trash.png", width: tileSize, height: tileSize}, {position: "absolute", left: `${trashPos[0] * tileSize}px`, top: `${trashPos[1] * tileSize}px`});

addEventListener("DOMContentLoaded", () => {
    document.getElementById("playButton").addEventListener("click", () => {
        document.body.style.backgroundImage = "url('img/background.png')";
        document.getElementById("playScreen").remove();
        const gameDiv = createElem("div", {}, {position: "absolute", left: "0", top: `${topOffset}px`, overflow: "hidden", display: "block", width: `${tileSize * mapWidth}px`, height: `${tileSize * mapHeight}px`, userSelect: "none"});
        gameDiv.addEventListener("dragstart", event => event.preventDefault());
        gameDiv.appendChild(trashElem);
        document.body.appendChild(gameDiv);

        let shit = [];
        for (let i = 0; i < Math.floor(Math.random() * 5) + 5; i++) {
            shit.push(new MovingShit(Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["img/trash1.png", "img/trash3.png"]));
        }
        const player = new Player(5, 5, gameDiv, new Net(gameDiv, 1, 1), shit);
        let level = 0;
        
        function gameLoop() {
            player.update();
            if (shit.length === 0) {
                if (level === 0) {
                    for (let i = 0; i < Math.floor(Math.random() * 5) + 5; i++) {
                        shit.push(new MovingShit(Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["img/trash2.png", "img/trash3.png"]));
                    }
                }
                level++;
            }
            shit = shit.filter(thing => {
                thing.update();
                return !thing.dead
            });
            player.shits = shit;
            window.scrollTo(player.x * tileSize - screen.availWidth / 2, player.y * tileSize - screen.availHeight / 2);
            requestAnimationFrame(gameLoop);
        }
        requestAnimationFrame(gameLoop);
    });
})