import { playAudio } from "./randomShit";

export const achievementDescriptions: Record<string, {description: string, img: string}> = {
    rockefeller: {
        description: "Waste over a thousand trash",
        img: "../img/rockefeller.jpg"
    }
}

export function doAchievement(name: string) {
    if (localStorage.getItem(`achievement${name}`) !== null) {
        return;
    }
    localStorage.setItem(`achievement${name}`, "tgr43gt45hngt54yhn6thnutjegtrdefuefr");
    const achievementName = document.getElementById("achievementName")
    const achievementImg = document.getElementById("achievementImg") as HTMLImageElement;
    const achievementNotif = document.getElementById("achievementNotif");
    if (achievementName === null || achievementImg === null || achievementNotif === null) {
        throw new Error("where the achievement stuff bro");
    }
    achievementName.textContent = name;
    achievementImg.src = achievementDescriptions[name.toLowerCase()].img;
    achievementNotif.style.right = "0";
    setTimeout(() => achievementNotif.style.right = "-300px", 4000);
    playAudio("../noise/challenge.mp3");
}