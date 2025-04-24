import { achievementDescriptions } from "../achievements";

function createElem(type: string, properties = {}, styles = {}, ...children: Node[]) {
    const elem = document.createElement(type);
    Object.assign(elem, properties);
    Object.assign(elem.style, styles);
    for (const child of children) {
        elem.appendChild(child);
    }
    return elem;
}

for (const key in localStorage) {
    if (key.indexOf("achievement") === 0) {
        const achievementName = key.substring("achievement".length);
        const elem = createElem("div", {}, {},
            createElem("img", {id: "achievementImg", src: achievementDescriptions[achievementName.toLowerCase()].img}),
            createElem("div", {}, {},
                createElem("p", {id: "bruh", textContent: achievementName}),
                createElem("p", {id: "achievementName", textContent: achievementDescriptions[achievementName.toLowerCase()].description})
            )
        );
        elem.classList.add("achievement");
        document.body.appendChild(elem);
    }
}