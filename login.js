const API_URL = "https://virtualboardbe.onrender.com/login";

document.getElementById("loginButton").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log("Server response:", data);

        if (res.ok && data.jwt) {
            // spara token i localStorage
            localStorage.setItem("authToken", data.jwt);

            alert("Inloggning lyckades!");

            // gå vidare till whiteboard-sidan
            window.location = "board.html";
        } else {
            alert("Fel email eller lösenord!");
        }

    } catch (err) {
        console.error("Fel vid fetch:", err);
        alert("Serverfel!");
    }
});
