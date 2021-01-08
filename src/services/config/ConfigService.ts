import { Config, NoConfig } from "../../models/Config";
import { window } from "vscode";

import { IConfigService } from "./IConfigService";
import { inject, injectable } from "inversify";
import TYPES from '../../Types';
import { ITypeDefinitionService } from '../typeDefinition/ITypeDefinitionService';

@injectable()
export class ConfigService implements IConfigService {
    
    constructor(
        @inject(TYPES.services.typeDefinition) private typeDefinitionService: ITypeDefinitionService
    ) {}

    async createConfigInteractivly(): Promise<Config> {
        const ioBrokerUrl = await window.showInputBox({prompt: "The URL to your ioBroker installation", value: "http://localhost"});
        if (!ioBrokerUrl) {
            return new NoConfig();
        }

        const port = await window.showInputBox({prompt: "The port of the socket.io Adapter", value: "8081"});
        if (!port) {
            return new NoConfig();
        }

        const scriptPath = await window.showInputBox({prompt: "The relative path in your workspace to the scripts", value: "/"});
        if (!scriptPath) {
            return new NoConfig();
        }

        const shouldCreateTypeDefinitionConfig = await window.showQuickPick(["Yes", "No"], {canPickMany: false, placeHolder: "Configure ioBroker type defintions?"});
        if (!shouldCreateTypeDefinitionConfig) {
            return new NoConfig();
        }
        
        if (shouldCreateTypeDefinitionConfig && shouldCreateTypeDefinitionConfig === "Yes") {
            await this.typeDefinitionService.downloadFromGithubAndSave();
            await this.typeDefinitionService.createConfig();
        }

        return new Config(ioBrokerUrl, Number.parseInt(port), scriptPath);            
    }
}
