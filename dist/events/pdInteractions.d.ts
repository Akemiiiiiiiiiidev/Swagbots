import { ButtonInteraction, ModalSubmitInteraction, RoleSelectMenuInteraction } from "discord.js";
export declare const PD_BTN_SETUP_CARGO = "pd:setup_cargo";
export declare const PD_BTN_SETUP_ACESSO = "pd:setup_acesso";
export declare const PD_BTN_SETAR = "pd:setar";
export declare const PD_BTN_REMOVER = "pd:remover";
export declare const PD_MODAL_SETAR = "pd:modal_setar";
export declare const PD_MODAL_REMOVER = "pd:modal_remover";
export declare const PD_SELECT_CARGO = "pd:select_cargo";
export declare const PD_SELECT_ACESSO = "pd:select_acesso";
export declare function isPdInteraction(customId: string): boolean;
export declare function buildPdAdminPanel(guildId: string): import("discord.js").ContainerBuilder;
export declare function buildPdUserPanel(guildId: string, executorId: string): import("discord.js").ContainerBuilder;
export declare function handlePdButton(interaction: ButtonInteraction): Promise<boolean>;
export declare function handlePdRoleSelect(interaction: RoleSelectMenuInteraction): Promise<boolean>;
export declare function handlePdModal(interaction: ModalSubmitInteraction): Promise<boolean>;
//# sourceMappingURL=pdInteractions.d.ts.map