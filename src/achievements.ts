function createElem(type: string, properties = {}, styles = {}, ...children: Node[]) {
    const elem = document.createElement(type);
    Object.assign(elem, properties);
    Object.assign(elem.style, styles);
    for (const child of children) {
        elem.appendChild(child);
    }
    return elem;
}

// do this better bruh
const achievementDescriptions: Record<string, string> = {
    rockefeller: "Waste over a thousand trash"
}

for (const key in localStorage) {
    console.log(key, key.indexOf("achievement"));
    if (key.indexOf("achievement") === 0) {
        const achievementName = key.substring("achievement".length);
        const elem = createElem("div", {}, {},
            createElem("img", {id: "achievementImg", src: localStorage.getItem(key)}),
            createElem("div", {}, {},
                createElem("p", {id: "bruh", textContent: achievementName}),
                createElem("p", {id: "achievementName", textContent: achievementDescriptions[achievementName.toLowerCase()]})
            )
        );
        elem.classList.add("achievement");
        document.body.appendChild(elem);
    }
}