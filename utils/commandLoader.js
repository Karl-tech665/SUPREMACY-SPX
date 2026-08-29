// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND LOADER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs = require("fs");
const path = require("path");

function loadCommands(commandsPath) {
    const commands = {};
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
    for (const file of files) {
        const command = require(path.join(commandsPath, file));
        if (command.name && command.execute) {
            commands[command.name] = command;
            if (command.aliases) {
                for (const alias of command.aliases) {
                    commands[alias] = command; // alias points to same command
                }
            }
        }
    }
    return commands;
}

module.exports = { loadCommands };
