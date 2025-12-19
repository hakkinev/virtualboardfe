const API_URL = "https://virtualboardbe.onrender.com/users/login";

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

        if (res.ok && data.accessToken && data.refreshToken) {

            // spara access token (kort)
            localStorage.setItem("authToken", data.accessToken)

            // spara refresh token (lång)
            localStorage.setItem("refreshToken", data.refreshToken)

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
