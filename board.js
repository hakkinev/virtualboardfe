const API_URL = "https://virtualboardbe.onrender.com/";

// Token som sparades vid login
const token = localStorage.getItem("authToken");

// Om ingen token => tillbaka till login
if (!token) {
    alert("Ingen token hittad, logga in igen.");
    window.location = "index.html";
}

// global flagga för att veta om vi drar en note just nu
let isDragging = false; // stoppa reload av notes under drag

let currentBoardId = null;  // vilken board man jobbar med just nu

// Hämta alla notes
// fetch(): https://developer.mozilla.org/en-US/docs/Web/API/fetch
async function loadNotes() {
    if (isDragging) return;

    // bygga URL med ev. boardId
    const url = new URL(API_URL)
    if (currentBoardId) {
        url.searchParams.set("boardId", currentBoardId)
    }

    const res = await fetch(url, {
        headers: {
            Authorization: "Bearer " + token
        }
    });

    if (!res.ok) {
        console.error("Kunde inte hämta notes", await res.text());
        return;
    }

    const notes = await res.json();
    renderNotes(notes); // visa på skärmen
}

// Visa notes på skärmen
// DOM-manipulation: https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
function renderNotes(notes) {
    const board = document.getElementById("board");

    // Rensa allt före 
    board.innerHTML = "";

    notes.forEach(note => {

        // Skapa HTML element för varje note
        const box = document.createElement("div");
        box.className = "note";
        box.style.position = "absolute";
        box.style.left = note.x + "px";
        box.style.top = note.y + "px";
        box.style.backgroundColor = note.color || "#ffffff";

        // Spara id i DOM
        box.dataset.id = note.id;

        // Skapa en enkel "header" för knappar
        const header = document.createElement("div");
        header.className = "note-header";

        // Färg-knapp (RGB-boll)
        const colorBtn = document.createElement("button");
        colorBtn.className = "note-color";
        colorBtn.textContent = "●";
        colorBtn.addEventListener("click", (e) => {
            e.stopPropagation();// starta inte drag
            changeColor(box);
        });

        // Edit-knapp
        const editBtn = document.createElement("button");
        editBtn.className = "note-edit";
        editBtn.textContent = "✎";
        editBtn.addEventListener("click", async (e) => {
            e.stopPropagation();// starta inte drag
            await editNote(box);
        });

        // Delete-knapp
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "note-delete";
        deleteBtn.textContent = "x";
        deleteBtn.addEventListener("click", async (e) => {
            e.stopPropagation();// starta inte drag
            await deleteNote(box);
        });

        // Lägg till knappar i header
        header.appendChild(colorBtn);
        header.appendChild(editBtn);
        header.appendChild(deleteBtn);

        // Själva textdelen
        const content = document.createElement("div");
        content.className = "note-content";
        content.innerText = note.note || "(tom)";

        box.appendChild(header);
        box.appendChild(content);

        // Gör den dragbar
        enableDrag(box, note.id);

        // Lägg till i board
        board.appendChild(box);
    });
}

// Skapa ny note
async function createNote() {
    await fetch(API_URL, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ // skicka tom note
            note: "Ny note",
            x: 100,
            y: 100,
            boardId: currentBoardId,  // koppla till aktuell board
            color: "#ffffff"
        })
    });

    loadNotes(); // rita om
}

// Redigera note-text med prompt
async function editNote(noteBox) {
    const content = noteBox.querySelector(".note-content"); // hitta textdelen
    const currentText = content.innerText;                  // nuvarande text

    const newText = prompt("Ny text för noten:", currentText); // visa prompt
    if (newText === null) return; // avbryt om cancel

    content.innerText = newText; // uppdatera i DOM

    const id = noteBox.dataset.id; // hämta id

    // Skicka uppdatering till REST API
    await fetch(API_URL + "/" + id, {
        method: "PUT",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ // skicka ny text och position
            note: newText,
            x: parseInt(noteBox.style.left),
            y: parseInt(noteBox.style.top)
        })
    });
}

// Ta bort note
async function deleteNote(noteBox) {
    const id = noteBox.dataset.id;

    await fetch(API_URL + "/" + id, {
        method: "DELETE",
        headers: {
            Authorization: "Bearer " + token
        }
    });

    loadNotes(); // ladda om efter delete
}

// Byta färg på note 
// CSS colors: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
// Byta färg på note 
// CSS colors: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
async function changeColor(noteBox) {
    const colors = ["#c94545ff", "#7244f3ff", "#6ddf7bff", "#e0d255ff"];

    let index = parseInt(noteBox.dataset.colorIndex || "0", 10); // hämta nuvarande färg, default = 0
    index = (index + 1) % colors.length;  // gå till nästa färg, loopa tillbaka vid slutet

    noteBox.dataset.colorIndex = index; // spara index i elementets dataset

    const newColor = colors[index];
    noteBox.style.backgroundColor = newColor; // byt bakgrundsfärg direkt i DOM

    const id = noteBox.dataset.id; // hämta note-id
    const text = noteBox.querySelector(".note-content").innerText;

    // uppdatering till REST API så färgen sparas
    await fetch(API_URL + "/" + id, {
        method: "PUT",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            note: text,
            x: parseInt(noteBox.style.left),
            y: parseInt(noteBox.style.top),
            color: newColor // spara färgen
        })
    });
}

async function loadBoards() {
    const res = await fetch("http://localhost:8080/boards", {
        headers: {
            Authorization: "Bearer " + token
        }
    })

    if (!res.ok) {
        console.error("Kunde inte hämta boards", await res.text())
        return
    }

    const boards = await res.json()

    const select = document.getElementById("boardSelect")
    select.innerHTML = ""

    boards.forEach(board => {
        const opt = document.createElement("option")
        opt.value = board.id
        opt.textContent = board.name
        select.appendChild(opt)
    })

    if (boards.length > 0) {
        currentBoardId = boards[0].id
        select.value = currentBoardId
        loadNotes() // hämta notes för första boarden
    }

    // byt board när man ändrar i dropmenu
    select.addEventListener("change", () => {
        currentBoardId = parseInt(select.value)
        loadNotes()
    })
}



// Dragbara notes
// https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event
function enableDrag(elem, noteId) {

    let offsetX = 0;
    let offsetY = 0;

    elem.onmousedown = (event) => {

        // ignorerar klick på knappar i header
        if (event.target.tagName === "BUTTON") return;

        // hindrar browsern från att markera text etc.
        event.preventDefault(); // stoppa blå textmarkering (Chatgpt fix)

        isDragging = true; // bölrjan av drag, stoppa polling

        // var på noten klicket träffade
        offsetX = event.offsetX;
        offsetY = event.offsetY;

        // När musen rör sig
        document.onmousemove = (moveEvent) => {
            elem.style.left = (moveEvent.pageX - offsetX) + "px";
            elem.style.top = (moveEvent.pageY - offsetY) + "px";
        };

        // När musen släpps
        document.onmouseup = async () => {

            // Stoppa drag
            document.onmousemove = null;
            document.onmouseup = null;

            const id = noteId;
            const text = elem.querySelector(".note-content").innerText;
            const color = elem.style.backgroundColor;   // hämta aktuell färg

            // PUT (uppdatera position)
            await fetch(API_URL + "/" + noteId, {
                method: "PUT",
                headers: {
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    // skicka texten vi har på lappen
                    note: elem.querySelector(".note-content").innerText,
                    x: parseInt(elem.style.left),
                    y: parseInt(elem.style.top),
                    color: color  // spara färgen också
                })
            });

            isDragging = false; // slut emd drag,, tillåt polling igen
        };
    };
}


// Knapp för att skapa ny note
document.getElementById("newNoteBtn").addEventListener("click", createNote);

// LOGOUT ta bort token och gå till login sidan
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("authToken");   // rensa JWT
    window.location = "index.html";         // tillbaka till login
});


// Ladda notes direkt när sidan öppnas
loadBoards();

// Polling 2 sekunder 
// setInterval(): https://developer.mozilla.org/en-US/docs/Web/API/setInterval
setInterval(loadNotes, 2000);
