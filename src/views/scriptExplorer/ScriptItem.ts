import * as path from 'path';
import * as vscode from 'vscode';

import { EngineType } from '../../models/EngineType';
import { Script } from "../../models/Script";

export class ScriptItem extends vscode.TreeItem {

    contextValue = "scriptItem";

    constructor(public script: Script) {
        super("", vscode.TreeItemCollapsibleState.None);
        
        this.label = this.getScriptName(script);
        this.iconPath = this.getIconPath(script);
        this.command = {
            title: "Open script",
            command: "iobroker-javascript.openFile",
            arguments: [
                script
            ]
        };
    }

    private getIconPath(script: Script): string | undefined {
        switch (script.common.engineType) {
            case EngineType.javascript:
                return this.getJsIcon();
            case EngineType.typescript:
                return this.getTsIcon();
            case EngineType.blockly:
                return this.getBlocklyIcon();
            default:
                return undefined;
        }
    }

    private getScriptName(script: Script) {
        const name = script.common?.name ?? "INVALID NAME";
        const state = script.common.enabled ? "▶" : "❚❚";

        return `${state} ${name}`;
    }

    private getJsIcon(): string {
        return path.join(__filename, '..', '..', 'resources', 'javascript.svg');
    }

    private getTsIcon(): string {
        return path.join(__filename, '..', '..', 'resources', 'typescript.svg');
    }

    private getBlocklyIcon(): string {
        return path.join(__filename, '..', '..', 'resources', 'blockly.svg');
    }
}
