document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("menuBtn");
    const menu = document.getElementById("sideMenu");

    btn.addEventListener("click", () => {
        menu.classList.toggle("open");
    });
});

const btn = document.getElementById("menuBtn");
const menu = document.getElementById("sideMenu");

btn.addEventListener("click", () => {
    menu.classList.toggle("open");
    btn.classList.toggle("open"); // animasyonu tetikler
});

