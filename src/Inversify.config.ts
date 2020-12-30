import 'reflect-metadata';

import { CommandService } from './services/command/CommandService';
import { ConfigService } from './services/config/configService';
import { ConnectionService } from './services/connection/connectionService';
import { Container } from 'inversify';
import { DownloadAllCommand } from './commands/downloadAllCommand';
import { FileService } from './services/file/FileService';
import { ICommand } from './commands/ICommand';
import { ICommandService } from './services/command/ICommandService';
import { IConfigService } from './services/config/IConfigService';
import { IConnectionService } from './services/connection/IConnectionService';
import { IFileService } from './services/file/IFileService';
import { IScriptService } from './services/script/IScriptService';
import { IStartup } from './IStartup';
import { IWorkspaceService } from './services/workspace/IWorkspaceService';
import { ScriptService } from './services/script/ScriptService';
import { Startup } from './Startup';
import TYPES from './Types';
import { UploadAllCommand } from './commands/UploadAllCommand';
import { UploadCurrentCommand } from './commands/UploadCurrentCommand';
import { WorkspaceService } from './services/workspace/WorkspaceService';

const container = new Container();

container.bind<IStartup>(TYPES.startup).to(Startup).inSingletonScope();

container.bind<IWorkspaceService>(TYPES.services.workspace).to(WorkspaceService).inSingletonScope();
container.bind<IConfigService>(TYPES.services.config).to(ConfigService).inSingletonScope();
container.bind<IConnectionService>(TYPES.services.connection).to(ConnectionService).inSingletonScope();
container.bind<IFileService>(TYPES.services.file).to(FileService).inSingletonScope();
container.bind<ICommandService>(TYPES.services.command).to(CommandService).inSingletonScope();
container.bind<IScriptService>(TYPES.services.script).to(ScriptService).inSingletonScope();

container.bind<ICommand>(TYPES.command).to(DownloadAllCommand);
container.bind<ICommand>(TYPES.command).to(UploadAllCommand);
container.bind<ICommand>(TYPES.command).to(UploadCurrentCommand);

export default container;