// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND LOADER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs = require("fs");
const path = require("path");

/**
 * Recursively collects all .js files inside a directory (including subfolders).
 */
function getAllJsFiles(dirPath) {
    let results = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(getAllJsFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            results.push(fullPath);
        }
    }

    return results;
}

/**
 * Loads all valid command files from a directory (and subdirectories).
 * Skips broken files instead of crashing the whole bot.
 */
function loadCommands(commandsPath) {
    const commands = {};

    if (!fs.existsSync(commandsPath)) {
        console.log(`⚠️ Commands directory not found: ${commandsPath}`);
        return commands;
    }

    const files = getAllJsFiles(commandsPath);
    let loadedCount = 0;
    let failedCount = 0;

    for (const filePath of files) {
        try {
            // Clear require cache in case of reload
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            if (!command.name || !command.execute) {
                console.log(`⚠️ Skipped ${path.basename(filePath)} — missing "name" or "execute"`);
                continue;
            }

            if (commands[command.name]) {
                console.log(`⚠️ Duplicate command name "${command.name}" in ${path.basename(filePath)} — overwriting previous.`);
            }

            commands[command.name] = command;

            if (Array.isArray(command.aliases)) {
                for (const alias of command.aliases) {
                    if (commands[alias]) {
                        console.log(`⚠️ Alias "${alias}" from ${path.basename(filePath)} conflicts with an existing command/alias — overwriting.`);
                    }
                    commands[alias] = command;
                }
            }

            loadedCount++;
        } catch (e) {
            failedCount++;
            console.log(`❌ Failed to load command file "${path.basename(filePath)}": ${e.message}`);
        }
    }

    console.log(`✅ Loaded ${loadedCount} command(s)${failedCount > 0 ? `, ${failedCount} failed` : ""}.`);
    return commands;
}

module.exports = { loadCommands };
