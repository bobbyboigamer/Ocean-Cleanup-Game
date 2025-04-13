// will not separate files for now because no bundler + CORS prevents files from being split into modules

function scaleVector(x, y, length) {
    const distance = dist(0, 0, x, y);
    x = x / distance * length;
    y = y / distance * length;
    return [x, y];
}

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
        super(x, y, 0.1 * (Number(localStorage.getItem("speed") ?? 0) + 1), "img/noSwim.png", parentElem);
        this.maxHealth = 100 + 5 * Number(localStorage.getItem("health") ?? 0);
        this.health = this.maxHealth;
        this.healthBar = createElem("meter", {max: this.maxHealth, width: tileSize, value: this.maxHealth}, {position: "absolute", left: "0", top: "0"});
        this.defense = 1 * 0.85 ** Number(localStorage.getItem("armor") ?? 0);
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
        this.money = Number(localStorage.getItem("money")) ?? 0;
    }

    takeDamage(amount) {
        amount *= this.defense;
        this.health = bound(this.health - amount, 0, this.maxHealth);
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
        if (dist(this.x, this.y, trashPos[0], trashPos[1]) < 2 && this.tool.shit.length > 0) {
            if (this.money % 3 === 0) {
                this.promptQuestion();
            }
            this.money += this.tool.depositShit();
            localStorage.setItem("money", this.money);
            document.getElementById("trashCounter").textContent = `Trash: ${this.money}`;

        }
        this.tool.x = this.x + 0.5;
        this.tool.y = this.y + 0.5;
        this.tool.update();
        this.healthBar.value = this.health;
        this.healthBar.style.transform = `translate(${this.x * tileSize}px, ${this.y * tileSize + this.imgHeight}px)`;
        super.update();
    }

    // Function to prompt the user with a question
    promptQuestion() {
        const questions = [
            ["Where does a banana peel go", "compost"],
            ["Where does a plastic water bottle go", "recycle"],
            ["Where does a Aluminum soda can go", "recycle"],
            ["Where does a Broken glass jar go?", "trash"],
            ["Where does an Apple core go?", "compost"],
            ["Where does a Empty plastic yogurt container go?", "recycle"],
            ["Where does a Plastic shopping bag go?", "trash"],
            ["Where does a Newspaper go?", "recycle"],
            ["Where does an Egg carton (styrofoam) go?", "trash"],
            ["Where does a Cheese wrapper (plastic) go?", "trash"],
            ["Where does a Pineapple top go?", "compost"],
            ["Where does a clean Pizza box go?", "recycle"],
            ["Where does a Toothpaste tube go?", "trash"],
            ["Where does a Orange peel go?", "compost"],
            ["Where does a Tissue (used) go?", "trash"],
            ["Where does a Plastic milk jug go?", "recycle"],
            ["Where does a Eggshells go?", "compost"],
        ];
        const question = questions[Math.floor(Math.random() * questions.length)];

        const userAnswer = prompt(question[0] + " (compost, recycle, trash)");
        if (prefixDLev(userAnswer, question[1]) < 3) {
            alert("Correct! You've earned XP Environmental Sustainability");
            for (const key of this.keys.keys()) {
                this.keys.set(key, false);
            }
        } else {
            alert(`Incorrect answer. Answer was ${question[1]}. Try again!`);
            this.promptQuestion();
        }
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
            if (dist(netPos[0], netPos[1], shit.x, shit.y) <= this.grabRadius && !shit.dead) {
                this.shit.push(shit)
                shit.oof();
                return;
            }
        }
    }
}

class HarpoonGun extends Tool {
    maxCapacity = 1
    constructor(fireCooldownMs, projectiles, parentElem) {
        super(parentElem);
        this.projectiles = projectiles;
        this.image.src = "../img/harpoon.png";
        this.imgHeight = this.image.offsetHeight;
        this.fireCooldownMs = fireCooldownMs;
        this.fire = true;
    }

    grabShit(shits) {
        if (this.shit.length >= this.maxCapacity || !this.fire) {
            return;
        }
        this.fire = false;
        setTimeout(() => {
            this.fire = true;
        }, this.fireCooldownMs);
        this.projectiles.push(new Harpoon(this.x, this.y, polarToCartesian(1, this.rotation), 0.1, shits, this.parentElem, shit => {
            this.shit.push(shit);
            shit.oof();
        }));
    }
}

class Shit extends Entity {
    constructor(x, y, speed, parentElem, trashImgs, value = 1) {
        super(x, y, speed, trashImgs[Math.floor(Math.random() * trashImgs.length)], parentElem);
        this.value = value;
        this.dead = false;
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

class MovingShit extends Shit {
    constructor(x, y, parentElem, trashImgs, value = 1) {
        super(x, y, 0.01, parentElem, trashImgs, value);
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

class Harpoon extends Entity {
    constructor(x, y, moveVector, speed, victims, parentElem, onAttack) {
        super(x, y, speed, "img/harpoonProjectile.png", parentElem);
        this.rotation = Math.atan2(moveVector[1], moveVector[0]);
        this.moveVector = scaleVector(moveVector[0], moveVector[1], speed);
        this.rotationCenter = [0, 50];
        this.victims = victims;
        this.dead = false;
        this.onAttack = onAttack;
    }

    update() {
        if (this.dead) {
            return;
        }
        this.x += this.moveVector[0];
        this.y += this.moveVector[1];
        if (this.x < 0 || this.y < 0 || this.x >= mapWidth - 1 || this.y >= mapWidth - 1) {
            this.oof();
            return;
        }
        for (const victim of this.victims) {
            if (dist(this.x, this.y, victim.x, victim.y) < 1 && !victim.dead) {
                this.onAttack(victim);
                this.oof();
                return;
            }
        }
        super.update();
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

class TrashProjectile extends Entity {
    constructor(x, y, moveVector, speed, victims, damage, parentElem, onAttack = victim => victim.takeDamage(damage)) {
        let imgSrc = "";
        if (Math.abs(moveVector[0]) > Math.abs(moveVector[1])) {
            if (moveVector[0] < 0) {
                imgSrc = "img/projectileLeft.png";
            } else if (moveVector[0] > 0) {
                imgSrc = "img/projectileRight.png";
            }
        } else {
            if (moveVector[1] < 0) {
                imgSrc = "img/projectileUp.png";
            } else {
                imgSrc = "img/projectileDown.png"
            }
        }
        super(x, y, speed, imgSrc, parentElem);
        this.victims = victims;
        this.damage = damage;
        this.moveVector = scaleVector(moveVector[0], moveVector[1], this.speed);
        this.dead = false;
        this.onAttack = onAttack;
    }

    update() {
        if (this.dead) {
            return;
        }
        this.x += this.moveVector[0];
        this.y += this.moveVector[1];
        if (this.x < 0 || this.y < 0 || this.x >= mapWidth - 1 || this.y >= mapWidth - 1) {
            this.oof();
            return;
        }
        for (const victim of this.victims) {
            if (dist(this.x, this.y, victim.x, victim.y) < 1) {
                this.onAttack(victim);
                this.oof();
                return;
            }
        }
        super.update();
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

class AttackingShit extends Shit {
    constructor(victim, projectiles, x, y, parentElem, trashImgs, value = 1) {
        super(x, y, 0.02, parentElem, trashImgs, value);
        this.victim = victim;
        this.attackCooldown = Math.floor(Math.random() * 300) + 300;
        this.projectiles = projectiles;
    }

    update() {
        if (dist(this.x, this.y, this.victim.x, this.victim.y) < 3) {
            const moveVector = scaleVector(this.x - this.victim.x, this.y - this.victim.y, this.speed);
            this.x += moveVector[0];
            this.y += moveVector[1];
        }

        this.attackCooldown--;
        if (this.attackCooldown <= 0) {
            this.attackCooldown = Math.floor(Math.random() * 300) + 300;
            this.projectiles.push(new TrashProjectile(this.x, this.y, [this.victim.x - this.x, this.victim.y - this.y], 0.1, [this.victim], 10, this.parentElem));
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
    document.getElementById("trashCounter").textContent = `Trash: ${localStorage.getItem("money") ?? 0}`;
    document.getElementById("resetBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.reload();
    })
    document.getElementById("playButton").addEventListener("click", () => {
        document.body.style.backgroundImage = "url('img/background.png')";
        document.getElementById("playScreen").style.display = "none";
        const gameDiv = createElem("div", {}, {position: "absolute", left: "0", top: `${topOffset}px`, overflow: "hidden", display: "block", width: `${tileSize * mapWidth}px`, height: `${tileSize * mapHeight}px`, userSelect: "none"});
        gameDiv.addEventListener("dragstart", event => event.preventDefault());
        gameDiv.appendChild(trashElem);
        document.body.appendChild(gameDiv);

        let shit = [];
        const projectiles = [];
        const player = new Player(5, 5, gameDiv, localStorage.getItem("harpoon") ? new HarpoonGun(1000, projectiles, gameDiv) : new Net(gameDiv, 1, 1), shit);
        for (let i = 0; i < Math.floor(Math.random() * 5) + 5; i++) {
            shit.push(new MovingShit(Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["img/trash1.png", "img/trash3.png"]));

        }
        let level = 0;

        
        function gameLoop() {
            player.update();
            if (shit.length === 0) {
                if (level === 0) {
                    for (let i = 0; i < Math.floor(Math.random() * 5) + 5; i++) {
                        shit.push(new AttackingShit(player, projectiles, Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["img/trash2.png", "img/trash4.png"], 2));
                    }
                }
                level++;
            }
            shit = shit.filter(thing => {
                thing.update();
                return !thing.dead
            });
            for (const projectile of projectiles) {
                projectile.update();
            }
            player.shits = shit;
            window.scrollTo(player.x * tileSize - screen.availWidth / 2, player.y * tileSize - screen.availHeight / 2);
            if (player.health <= 0) {
                alert("you died score 0");
                localStorage.setItem("money", 0);
                gameDiv.remove();
                document.getElementById("playScreen").style.display = "flex";
            } else {
                requestAnimationFrame(gameLoop);
            }
        }
        requestAnimationFrame(gameLoop);
    });
})

function dLev(one, two) {
    let alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890- \'.,';
    let da = new Array(alphabet.length).fill(0);
    let matrix = new Array(one.length + 2).fill(0).map(() => new Array(two.length + 2).fill(0));
    let maxDist = one.length + two.length;
    matrix[0][0] = maxDist;
    for (let i = 0; i <= one.length; i++) {
        if (i > 0 && alphabet.indexOf(one[i - 1]) === -1) {
            alphabet += one[i - 1];
            da.push(0);
        }
        matrix[i + 1][0] = maxDist;
        matrix[i + 1][1] = i;
    }
    for (let i = 0; i <= two.length; i++) {
        if (i > 0 && alphabet.indexOf(two[i - 1]) === -1) {
            alphabet += two[i - 1];
            da.push(0);
        }
        matrix[0][i + 1] = maxDist;
        matrix[1][i + 1] = i;
    }
    for (let i = 1; i <= one.length; i++) {
        let db = 0;
        for (let j = 1; j <= two.length; j++) {
            let k = da[alphabet.indexOf(two[j - 1])];
            let l = db;
            let cost = 1;
            if (one[i - 1] === two[j - 1]) {
                cost = 0;
                db = j;
            }
            matrix[i + 1][j + 1] = Math.min(matrix[i][j] + cost, matrix[i + 1][j] + 1, matrix[i][j + 1] + 1, matrix[k][l] + (i - k - 1) + 1 + (j - l - 1));
        }
        da[alphabet.indexOf(one[i - 1])] = i;
    }
    return matrix[one.length + 1][two.length + 1];
}

function prefixDLev(one, two) {
    return dLev(one.substring(0, two.length), two);
}