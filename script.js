"use strict";
// MockAPI resource URL — do not add :endpoint here.
const API_URL =
    "https://6adb5a6b3b7e90b8208fd467.mockapi.io/users-api";

// Select HTML elements.
const userForm = document.getElementById("userForm");
const userIdInput = document.getElementById("userId");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const searchIdInput = document.getElementById("searchId");
const searchBtn = document.getElementById("searchBtn");
const searchResult = document.getElementById("searchResult");
const userList = document.getElementById("userList");
const message = document.getElementById("message");
const refreshBtn = document.getElementById("refreshBtn");

// Reusable API request function.
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                `Unexpected response. Check API URL. HTTP ${response.status}`
            );
        }
    }

    if (!response.ok) {
        throw new Error(
            data?.message || `HTTP error: ${response.status}`
        );
    }

    return data;
}

// GET: Fetch all users.
async function getAllUsers() {
    message.textContent = "Loading users...";
    userList.replaceChildren();

    try {
        const users = await apiRequest(API_URL);

        console.log("GET all users:", users);

        if (!Array.isArray(users)) {
            throw new Error("API did not return a users list.");
        }

        if (users.length === 0) {
            message.textContent = "No users found. Add a user.";
            return;
        }

        users.forEach(createUserCard);
        message.textContent = `Total users: ${users.length}`;
    } catch (error) {
        console.error("GET all users error:", error);
        message.textContent = error.message;
    }
}

// Display a user detail safely.
function addDetail(container, label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = `${label}: `;
    paragraph.appendChild(strong);
    paragraph.appendChild(
        document.createTextNode(String(value ?? "Not provided"))
    );

    container.appendChild(paragraph);
}

// Create a user card with Edit and Delete buttons.
function createUserCard(user) {
    const card = document.createElement("article");
    card.className = "user-card";

    const heading = document.createElement("h3");
    heading.textContent = user.name || "Unnamed User";
    card.appendChild(heading);

    addDetail(card, "ID", user.id);
    addDetail(card, "Email", user.email);
    addDetail(card, "Phone", user.phone);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.type = "button";
    editBtn.addEventListener("click", () => startEditing(user));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";

    deleteBtn.addEventListener("click", async () => {
        if (confirm(`Delete ${user.name || "this user"}?`)) {
            try {
                await deleteUser(user.id);
            } catch (error) {
                message.textContent = error.message;
            }
        }
    });

    actions.append(editBtn, deleteBtn);
    card.appendChild(actions);
    userList.appendChild(card);
}

// GET: Fetch one user by ID.
async function getUserById(id) {
    if (!String(id).trim()) {
        throw new Error("Please enter a user ID.");
    }

    return await apiRequest(
        `${API_URL}/${encodeURIComponent(id)}`
    );
}

// Search for a user.
async function searchUser() {
    searchResult.replaceChildren();

    try {
        const id = searchIdInput.value.trim();
        const user = await getUserById(id);

        const card = document.createElement("article");
        card.className = "user-card";

        const heading = document.createElement("h3");
        heading.textContent = user.name || "Unnamed User";
        card.appendChild(heading);

        addDetail(card, "ID", user.id);
        addDetail(card, "Email", user.email);
        addDetail(card, "Phone", user.phone);

        searchResult.appendChild(card);
    } catch (error) {
        searchResult.textContent = error.message;
    }
}

// POST: Create a new user.
async function createUser(userData) {
    return await apiRequest(API_URL, {
        method: "POST",
        body: JSON.stringify(userData)
    });
}

// PUT: Update an existing user.
async function updateUser(id, userData) {
    return await apiRequest(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            body: JSON.stringify(userData)
        }
    );
}

// DELETE: Delete a user.
async function deleteUser(id) {
    await apiRequest(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
            method: "DELETE"
        }
    );

    message.textContent = "User deleted successfully.";
    await getAllUsers();
}

// Fill the form when Edit is clicked.
function startEditing(user) {
    userIdInput.value = user.id;
    nameInput.value = user.name || "";
    emailInput.value = user.email || "";
    phoneInput.value = user.phone || "";

    formTitle.textContent = "Update User";
    submitBtn.textContent = "Update User";
    cancelBtn.hidden = false;

    userForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Reset form to Add User mode.
function resetForm() {
    userForm.reset();
    userIdInput.value = "";

    formTitle.textContent = "Add New User";
    submitBtn.textContent = "Add User";
    cancelBtn.hidden = true;
}

// Handle Add and Update form submissions.
userForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const userData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim()
    };

    const editingId = userIdInput.value;
    submitBtn.disabled = true;

    try {
        if (editingId) {
            await updateUser(editingId, userData);
            message.textContent = "User updated successfully.";
        } else {
            await createUser(userData);
            message.textContent = "User created successfully.";
        }

        resetForm();
        await getAllUsers();
    } catch (error) {
        console.error("Save user error:", error);
        message.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
    }
});

// Connect buttons.
searchBtn.addEventListener("click", searchUser);
refreshBtn.addEventListener("click", getAllUsers);
cancelBtn.addEventListener("click", resetForm);

searchIdInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchUser();
    }
});

// Load users when the page opens.
getAllUsers();
