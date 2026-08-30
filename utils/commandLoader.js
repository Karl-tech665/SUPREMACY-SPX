const fs = require("fs");
const path = require("path");

function registerCommand(commands, command, label) {
    if (!command || !command.name || !command.execute) {
        console.log(`⚠️ Skipped an entry in ${label} — missing "name" or "execute"`);
        return;
    }
    commands[command.name] = command;
    if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) commands[alias] = command;
    }
}

function loadCommands(commandsPath) {
    const commands = {};
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
    for (const file of files) {
        const label = file;
        try {
            const exported = require(path.join(commandsPath, file));
            if (Array.isArray(exported)) {
                for (const command of exported) registerCommand(commands, command, label);
            } else {
                registerCommand(commands, exported, label);
            }
        } catch (e) {
            console.log(`❌ Failed to load command file "${label}": ${e.message}`);
        }
    }
    return commands;
}

module.exports = { loadCommands };
