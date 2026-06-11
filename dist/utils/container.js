"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V = exports.E = void 0;
exports.buildOrganizedContainer = buildOrganizedContainer;
exports.containerMessage = containerMessage;
exports.containerReply = containerReply;
exports.containerEdit = containerEdit;
exports.containerEditOrganized = containerEditOrganized;
exports.containerReplyOrganized = containerReplyOrganized;
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const BLACK = 0x000000;
exports.E = "<:1supra_white:1514705873627381840>";
exports.V = "<a:Verified:1514716584407470252>";
function buildContainer(text) {
    return new builders_1.ContainerBuilder()
        .setAccentColor(BLACK)
        .addTextDisplayComponents(new builders_1.TextDisplayBuilder().setContent(text));
}
function buildOrganizedContainer(sections) {
    const container = new builders_1.ContainerBuilder().setAccentColor(BLACK);
    sections.forEach((section, index) => {
        container.addTextDisplayComponents(new builders_1.TextDisplayBuilder().setContent(section));
        if (index < sections.length - 1) {
            container.addSeparatorComponents(new builders_1.SeparatorBuilder().setDivider(true));
        }
    });
    return container;
}
function containerMessage(sections) {
    return {
        components: [buildOrganizedContainer(sections)],
        flags: discord_js_1.MessageFlags.IsComponentsV2,
    };
}
function containerReply(text, options) {
    const flags = options?.ephemeral
        ? (discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral)
        : discord_js_1.MessageFlags.IsComponentsV2;
    return {
        components: [buildContainer(text)],
        flags: flags,
    };
}
function containerEdit(text) {
    return {
        components: [buildContainer(text)],
        flags: discord_js_1.MessageFlags.IsComponentsV2,
    };
}
function containerEditOrganized(sections) {
    return {
        components: [buildOrganizedContainer(sections)],
        flags: discord_js_1.MessageFlags.IsComponentsV2,
    };
}
function containerReplyOrganized(sections, options) {
    const flags = options?.ephemeral
        ? (discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral)
        : discord_js_1.MessageFlags.IsComponentsV2;
    return {
        components: [buildOrganizedContainer(sections)],
        flags: flags,
    };
}
//# sourceMappingURL=container.js.map