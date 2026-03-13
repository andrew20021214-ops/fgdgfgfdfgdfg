const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const loginFilePath = path.join(__dirname, 'api', 'login.js');

function addUser(username, password, options = {}) {
    const { 
        isBanned = false, 
        banReason = "", 
        isDeleted = false, 
        deleteReason = "", 
        isBought = true,
        hwid = "",
        expiryInput = ""
    } = options;

    let expiresAt = "2026-12-31T23:59:59Z"; // Default

    if (expiryInput === "lifetime") {
        expiresAt = "9999-12-31T23:59:59Z";
    } else if (expiryInput) {
        // Format: DAY.MONTH.YEAR.HOUR.MINUTE (11.03.2026.18.40)
        const parts = expiryInput.split('.');
        if (parts.length === 5) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            const hour = parts[3].padStart(2, '0');
            const min = parts[4].padStart(2, '0');
            // ISO format: YYYY-MM-DDTHH:MM:SSZ
            expiresAt = `${year}-${month}-${day}T${hour}:${min}:00Z`;
        }
    }
    
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    const newUser = {
        username,
        passwordHash: hash,
        isBought,
        expiresAt,
        isBanned,
        banReason,
        isDeleted,
        deleteReason,
        HWID: hwid
    };

    let content = fs.readFileSync(loginFilePath, 'utf8');
    
    // SAFETY FIRST: We will split the file by the array markers instead of complex regex
    const startMarker = 'const USERS = [';
    const endMarker = '];';
    
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);

    if (startIndex === -1 || endIndex === -1) {
        console.error("CRITICAL ERROR: Could not find USERS array markers in login.js");
        process.exit(1);
    }

    // Get everything before and after the array
    const prefix = content.substring(0, startIndex + startMarker.length);
    const suffix = content.substring(endIndex);
    const currentArrayContent = content.substring(startIndex + startMarker.length, endIndex).trim();

    // Check for duplicate username
    if (currentArrayContent.toLowerCase().includes(`username: "${username.toLowerCase()}"`) || 
        currentArrayContent.toLowerCase().includes(`username: '${username.toLowerCase()}'`)) {
        console.error(`User "${username}" already exists!`);
        process.exit(1);
    }

    // Format new user string safely for a JS file
    // We use JSON.stringify and then a safer way to make it look like "clean" JS
    const newUserStr = JSON.stringify(newUser, null, 8)
        .replace(/"([^"]+)":/g, '$1:'); // Only remove quotes from keys
    
    // Note: We keep double quotes for values to avoid single quote bugs like "Andrew's"

    let updatedArrayContent = currentArrayContent;
    if (updatedArrayContent.length > 0) {
        updatedArrayContent += ',\n';
    }
    updatedArrayContent += '    ' + newUserStr;

    const newFileContent = prefix + '\n' + updatedArrayContent + '\n' + suffix;

    fs.writeFileSync(loginFilePath, newFileContent);
    console.log(`\n[SUCCESS] User "${username}" added safely.`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node manage_users.js adduser <username> <password> ...");
    process.exit(1);
}

const command = args[0];

if (command === 'adduser') {
    const username = args[1]?.trim();
    const password = args[2]?.trim();
    const banReason = args[3] || "";
    const isBanned = banReason !== "";
    const isDeleted = args[4] === "true";
    const deleteReason = args[5] || "";
    const hwid = args[6] || "";
    const expiryInput = args[7] || "";
    
    if (!username || !password) {
        console.error("Error: Username and Password are required!");
        process.exit(1);
    }
    
    addUser(username, password, { isBanned, banReason, isDeleted, deleteReason, hwid, expiryInput });
} else if (command === 'resethwid') {
    const username = args[1];
    resetHwid(username);
} else if (command === 'deleteuser') {
    const username = args[1];
    deleteUser(username);
}

function deleteUser(username) {
    let content = fs.readFileSync(loginFilePath, 'utf8');
    const startMarker = 'const USERS = [';
    const endMarker = '];';
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);

    if (startIndex === -1 || endIndex === -1) {
        console.error("Could not find USERS array markers");
        process.exit(1);
    }

    let arrayContent = content.substring(startIndex + startMarker.length, endIndex);
    
    // Improved regex to capture the entire user object in the array
    const userRegex = new RegExp(`\\s*{\\s*username:\\s*['"]${username}['"][\\s\\S]*?},?\\n?`, 'i');
    
    if (!userRegex.test(arrayContent)) {
        console.error(`User "${username}" not found.`);
        process.exit(1);
    }

    let updatedArray = arrayContent.replace(userRegex, '');
    
    // Clean up potential trailing commas after deletion
    updatedArray = updatedArray.trim();
    if (updatedArray.endsWith(',')) {
        updatedArray = updatedArray.slice(0, -1);
    }

    const newContent = content.substring(0, startIndex + startMarker.length) + '\n    ' + updatedArray + '\n' + content.substring(endIndex);

    fs.writeFileSync(loginFilePath, newContent);
    console.log(`\n[SUCCESS] User "${username}" completely removed from login.js.`);
}

function resetHwid(username) {
    let content = fs.readFileSync(loginFilePath, 'utf8');
    const startMarker = 'const USERS = [';
    const endMarker = '];';
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);

    if (startIndex === -1 || endIndex === -1) {
        console.error("Could not find USERS array markers");
        process.exit(1);
    }

    let arrayContent = content.substring(startIndex + startMarker.length, endIndex);
    const userRegex = new RegExp(`(username:\\s*['"]${username}['"][\\s\\S]*?HWID:\\s*['"])([^'"]*)(['"])`, 'i');
    
    if (!userRegex.test(arrayContent)) {
        console.error(`User "${username}" not found.`);
        process.exit(1);
    }

    const updatedArray = arrayContent.replace(userRegex, `$1$3`);
    const newContent = content.substring(0, startIndex + startMarker.length) + updatedArray + content.substring(endIndex);

    fs.writeFileSync(loginFilePath, newContent);
    console.log(`\n[SUCCESS] HWID for "${username}" reset.`);
}
