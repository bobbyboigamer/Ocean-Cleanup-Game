/**
 * Create an element but stupid
 * @param type Type of element
 * @param properties Element properties set using regular object properties
 * @param children List of element's childrens, added with appendChild
 * @return Element
 */
export function createElem(type, properties = {}, styles = {}, ...children) {
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
export function bound(value, min, max) {
    return Math.max(Math.min(value, max), min);
}

/**
 * Polar coordinates to cartesian coordinates
 * @param r Radius
 * @param theta Angle in radians, including coterminal
 * @returns Cartesian [x, y]
 */
export function polarToCartesian(radius, rotation) {
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
export function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Angle between two radian points. May handle negatives. Will not handle coterminal angles.
 * @param one First radian angle
 * @param two Second radian angle
 * @returns Possibly negative difference in radians
 */
export function angleDiff(one, two) {
    // dont ask me what this is
    return mod((one - two) + Math.PI, 2 * Math.PI) - Math.PI;
}