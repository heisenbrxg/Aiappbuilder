import type { WebContainer } from '@webcontainer/api';
import { path as nodePath } from '~/utils/path';
import { atom, map, type MapStore } from 'nanostores';
import type { ActionAlert, BoltAction, DeployAlert, FileHistory, SupabaseAction, SupabaseAlert } from '~/types/actions';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';
import type { ActionCallbackData } from './message-parser';
import type { BoltShell } from '~/utils/shell';

const logger = createScopedLogger('ActionRunner');

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

export type BaseActionState = BoltAction & {
  status: Exclude<ActionStatus, 'failed'>;
  abort: () => void;
  executed: boolean;
  abortSignal: AbortSignal;
};

export type FailedActionState = BoltAction &
  Omit<BaseActionState, 'status'> & {
    status: Extract<ActionStatus, 'failed'>;
    error: string;
  };

export type ActionState = BaseActionState | FailedActionState;

type BaseActionUpdate = Partial<Pick<BaseActionState, 'status' | 'abort' | 'executed'>>;

export type ActionStateUpdate =
  | BaseActionUpdate
  | (Omit<BaseActionUpdate, 'status'> & { status: 'failed'; error: string });

type ActionsMap = MapStore<Record<string, ActionState>>;

class ActionCommandError extends Error {
  readonly _output: string;
  readonly _header: string;

  constructor(message: string, output: string) {
    // Create a formatted message that includes both the error message and output
    const formattedMessage = `Failed To Execute Shell Command: ${message}\n\nOutput:\n${output}`;
    super(formattedMessage);

    // Set the output separately so it can be accessed programmatically
    this._header = message;
    this._output = output;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ActionCommandError.prototype);

    // Set the name of the error for better debugging
    this.name = 'ActionCommandError';
  }

  // Optional: Add a method to get just the terminal output
  get output() {
    return this._output;
  }
  get header() {
    return this._header;
  }
}

export class ActionRunner {
  #webcontainer: Promise<WebContainer>;
  #currentExecutionPromise: Promise<void> = Promise.resolve();
  #shellTerminal: () => BoltShell;
  runnerId = atom<string>(`${Date.now()}`);
  actions: ActionsMap = map({});
  onAlert?: (alert: ActionAlert) => void;
  onSupabaseAlert?: (alert: SupabaseAlert) => void;
  onDeployAlert?: (alert: DeployAlert) => void;
  buildOutput?: { path: string; exitCode: number; output: string };
  onActionComplete?: (action: ActionState) => void;

  constructor(
    webcontainerPromise: Promise<WebContainer>,
    getShellTerminal: () => BoltShell,
    onAlert?: (alert: ActionAlert) => void,
    onSupabaseAlert?: (alert: SupabaseAlert) => void,
    onDeployAlert?: (alert: DeployAlert) => void,
    onActionComplete?: (action: ActionState) => void,
  ) {
    this.#webcontainer = webcontainerPromise;
    this.#shellTerminal = getShellTerminal;
    this.onAlert = onAlert;
    this.onSupabaseAlert = onSupabaseAlert;
    this.onDeployAlert = onDeployAlert;
    this.onActionComplete = onActionComplete;
  }

  addAction(data: ActionCallbackData) {
    const { actionId } = data;

    const actions = this.actions.get();
    const action = actions[actionId];

    if (action) {
      // action already added
      return;
    }

    const abortController = new AbortController();

    this.actions.setKey(actionId, {
      ...data.action,
      status: 'pending',
      executed: false,
      abort: () => {
        abortController.abort();
        this.#updateAction(actionId, { status: 'aborted' });
      },
      abortSignal: abortController.signal,
    });

    this.#currentExecutionPromise.then(() => {
      this.#updateAction(actionId, { status: 'running' });
    });
  }

  async runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { actionId } = data;
    const action = this.actions.get()[actionId];

    if (!action) {
      unreachable(`Action ${actionId} not found`);
    }

    if (action.executed) {
      return; // No return value here
    }

    if (isStreaming && action.type !== 'file') {
      return; // No return value here
    }

    this.#updateAction(actionId, { ...action, ...data.action, executed: !isStreaming });

    this.#currentExecutionPromise = this.#currentExecutionPromise
      .then(() => {
        return this.#executeAction(actionId, isStreaming);
      })
      .catch((error) => {
        console.error('Action failed:', error);
      });

    await this.#currentExecutionPromise;

    return;
  }

  async #executeAction(actionId: string, isStreaming: boolean = false) {
    const action = this.actions.get()[actionId];

    this.#updateAction(actionId, { status: 'running' });

    try {
      switch (action.type) {
        case 'shell': {
          await this.#runShellAction(action);
          break;
        }
        case 'file': {
          await this.#runFileAction(action);
          break;
        }
        case 'supabase': {
          try {
            await this.handleSupabaseAction(action as SupabaseAction);
          } catch (error: any) {
            // Update action status
            this.#updateAction(actionId, {
              status: 'failed',
              error: error instanceof Error ? error.message : 'Supabase action failed',
            });

            // Return early without re-throwing
            return;
          }
          break;
        }
        case 'build': {
          const buildOutput = await this.#runBuildAction(action);

          // Store build output for deployment
          this.buildOutput = buildOutput;
          break;
        }
        case 'start': {
          // making the start app non blocking

          this.#runStartAction(action)
            .then(() => this.#updateAction(actionId, { status: 'complete' }))
            .catch((err: Error) => {
              if (action.abortSignal.aborted) {
                return;
              }

              this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });
              logger.error(`[${action.type}]:Action failed\n\n`, err);

              if (!(err instanceof ActionCommandError)) {
                return;
              }

              this.onAlert?.({
                type: 'error',
                title: err.header.includes('TypeScript Validation Failed') 
                  ? 'TypeScript Validation Failed' 
                  : 'Dev Server Failed',
                description: err.header,
                content: err.output,
              });
            });

          /*
           * adding a delay to avoid any race condition between 2 start actions
           * i am up for a better approach
           */
          await new Promise((resolve) => setTimeout(resolve, 2000));

          return;
        }
      }

      this.#updateAction(actionId, {
        status: isStreaming ? 'running' : action.abortSignal.aborted ? 'aborted' : 'complete',
      });

      // Trigger callback for successful file actions
      if (!isStreaming && !action.abortSignal.aborted && action.type === 'file' && this.onActionComplete) {
        this.onActionComplete(action);
      }
    } catch (error) {
      if (action.abortSignal.aborted) {
        return;
      }

      this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });
      logger.error(`[${action.type}]:Action failed\n\n`, error);

      if (!(error instanceof ActionCommandError)) {
        return;
      }

      this.onAlert?.({
        type: 'error',
        title: 'Dev Server Failed',
        description: error.header,
        content: error.output,
      });

      // re-throw the error to be caught in the promise chain
      throw error;
    }
  }

  async #runShellAction(action: ActionState) {
    if (action.type !== 'shell') {
      unreachable('Expected shell action');
    }

    const shell = this.#shellTerminal();
    await shell.ready();

    if (!shell || !shell.terminal || !shell.process) {
      unreachable('Shell terminal not found');
    }

    // Pre-validate command for common issues
    const validationResult = await this.#validateShellCommand(action.content);

    if (validationResult.shouldModify && validationResult.modifiedCommand) {
      logger.debug(`Modified command: ${action.content} -> ${validationResult.modifiedCommand}`);
      action.content = validationResult.modifiedCommand;
    }

    const resp = await shell.executeCommand(this.runnerId.get(), action.content, () => {
      logger.debug(`[${action.type}]:Aborting Action\n\n`, action);
      action.abort();
    });

    if (resp?.exitCode != 0) {
      const enhancedError = this.#createEnhancedShellError(action.content, resp?.exitCode, resp?.output);
      throw new ActionCommandError(enhancedError.title, enhancedError.details);
    }
  }

  async #runStartAction(action: ActionState) {
    if (action.type !== 'start') {
      unreachable('Expected shell action');
    }

    if (!this.#shellTerminal) {
      unreachable('Shell terminal not found');
    }

    const shell = this.#shellTerminal();
    await shell.ready();

    if (!shell || !shell.terminal || !shell.process) {
      unreachable('Shell terminal not found');
    }

    // PRE-START VALIDATION: Run TypeScript check before starting dev server
    logger.info('Running pre-start TypeScript validation...');
    const validationResult = await this.#runPreStartValidation(shell);
    
    if (!validationResult.passed) {
      logger.error('Pre-start validation failed:', validationResult.errors);
      throw new ActionCommandError(
        'TypeScript Validation Failed - Fix Required Before Starting',
        `The project has TypeScript errors that must be fixed before starting:\n\n${validationResult.errors}\n\nPlease fix these errors and the app will start automatically.`
      );
    }

    logger.info('Pre-start validation passed! Starting application...');

    const resp = await shell.executeCommand(this.runnerId.get(), action.content, () => {
      logger.debug(`[${action.type}]:Aborting Action\n\n`, action);
      action.abort();
    });

    if (resp?.exitCode != 0) {
      throw new ActionCommandError('Failed To Start Application', resp?.output || 'No Output Available');
    }

    return resp;
  }

  /**
   * Run pre-start validation checks (TypeScript, ESLint, etc.)
   * This ensures the app is error-free before showing it to the user
   */
  async #runPreStartValidation(shell: BoltShell): Promise<{ passed: boolean; errors: string }> {
    try {
      const webcontainer = await this.#webcontainer;
      
      // Check if TypeScript is available in the project
      const hasTsConfig = await this.#fileExists(webcontainer, 'tsconfig.json');
      const hasPackageJson = await this.#fileExists(webcontainer, 'package.json');
      
      if (!hasTsConfig && !hasPackageJson) {
        // No TypeScript config, skip validation
        return { passed: true, errors: '' };
      }

      // Check if typescript is installed
      let packageJson: any = {};
      try {
        const packageJsonContent = await webcontainer.fs.readFile('package.json', 'utf-8');
        packageJson = JSON.parse(packageJsonContent);
      } catch (e) {
        // No package.json or invalid, skip
        return { passed: true, errors: '' };
      }

      const hasTypeScript = 
        packageJson.dependencies?.typescript || 
        packageJson.devDependencies?.typescript;

      if (!hasTypeScript) {
        // TypeScript not installed, skip validation
        return { passed: true, errors: '' };
      }

      // Run TypeScript check (non-blocking, capture output)
      logger.info('Running: npx tsc --noEmit');
      const tscResult = await shell.executeCommand(
        this.runnerId.get(),
        'npx tsc --noEmit --pretty false',
        () => {}
      );

      if (tscResult?.exitCode === 0) {
        // No TypeScript errors
        return { passed: true, errors: '' };
      }

      // TypeScript errors found
      const errors = tscResult?.output || 'Unknown TypeScript errors';
      
      // Clean up the error output for better readability
      const cleanedErrors = this.#cleanTypeScriptErrors(errors);
      
      return { 
        passed: false, 
        errors: cleanedErrors 
      };

    } catch (error) {
      // If validation itself fails, log but don't block the start
      logger.error('Pre-start validation check failed:', error);
      return { passed: true, errors: '' }; // Fail open to avoid blocking
    }
  }

  /**
   * Clean and format TypeScript errors for better AI comprehension
   */
  #cleanTypeScriptErrors(rawErrors: string): string {
    // Remove ANSI codes and format for clarity
    const cleaned = rawErrors
      .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI color codes
      .split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => !line.includes('Found') || line.includes('error')) // Keep error summary
      .join('\n');

    return cleaned;
  }

  /**
   * Check if a file exists in WebContainer
   */
  async #fileExists(webcontainer: WebContainer, filePath: string): Promise<boolean> {
    try {
      await webcontainer.fs.readFile(filePath, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  async #runFileAction(action: ActionState) {
    if (action.type !== 'file') {
      unreachable('Expected file action');
    }

    const webcontainer = await this.#webcontainer;
    const relativePath = nodePath.relative(webcontainer.workdir, action.filePath);

    let folder = nodePath.dirname(relativePath);

    // remove trailing slashes
    folder = folder.replace(/\/+$/g, '');

    if (folder !== '.') {
      try {
        await webcontainer.fs.mkdir(folder, { recursive: true });
      } catch (error) {
        logger.error('Failed to create folder\n\n', error);
      }
    }

    try {
      await webcontainer.fs.writeFile(relativePath, action.content);
    } catch (error) {
      logger.error('Failed to write file\n\n', error);
    }
  }

  #updateAction(id: string, newState: ActionStateUpdate) {
    const actions = this.actions.get();

    this.actions.setKey(id, { ...actions[id], ...newState });
  }

  async #validateShellCommand(command: string): Promise<{
    shouldModify: boolean;
    modifiedCommand?: string;
    warning?: string;
  }> {
    const trimmedCommand = command.trim();

    // Handle rm commands that might fail due to missing files
    if (trimmedCommand.startsWith('rm ') && !trimmedCommand.includes(' -f')) {
      const rmMatch = trimmedCommand.match(/^rm\s+(.+)$/);

      if (rmMatch) {
        const filePaths = rmMatch[1].split(/\s+/);

        // Check if any of the files exist using WebContainer
        try {
          const webcontainer = await this.#webcontainer;
          const existingFiles = [];

          for (const filePath of filePaths) {
            if (filePath.startsWith('-')) {
              continue;
            } // Skip flags

            try {
              await webcontainer.fs.readFile(filePath);
              existingFiles.push(filePath);
            } catch {
              // File doesn't exist, skip it
            }
          }

          if (existingFiles.length === 0) {
            // No files exist, modify command to use -f flag to avoid error
            return {
              shouldModify: true,
              modifiedCommand: `rm -f ${filePaths.join(' ')}`,
              warning: 'Added -f flag to rm command as target files do not exist',
            };
          } else if (existingFiles.length < filePaths.length) {
            // Some files don't exist, modify to only remove existing ones with -f for safety
            return {
              shouldModify: true,
              modifiedCommand: `rm -f ${filePaths.join(' ')}`,
              warning: 'Added -f flag to rm command as some target files do not exist',
            };
          }
        } catch (error) {
          logger.debug('Could not validate rm command files:', error);
        }
      }
    }

    // Handle cd commands to non-existent directories
    if (trimmedCommand.startsWith('cd ')) {
      const cdMatch = trimmedCommand.match(/^cd\s+(.+)$/);

      if (cdMatch) {
        const targetDir = cdMatch[1].trim();

        try {
          const webcontainer = await this.#webcontainer;
          await webcontainer.fs.readdir(targetDir);
        } catch {
          return {
            shouldModify: true,
            modifiedCommand: `mkdir -p ${targetDir} && cd ${targetDir}`,
            warning: 'Directory does not exist, created it first',
          };
        }
      }
    }

    // Handle cp/mv commands with missing source files
    if (trimmedCommand.match(/^(cp|mv)\s+/)) {
      const parts = trimmedCommand.split(/\s+/);

      if (parts.length >= 3) {
        const sourceFile = parts[1];

        try {
          const webcontainer = await this.#webcontainer;
          await webcontainer.fs.readFile(sourceFile);
        } catch {
          return {
            shouldModify: false,
            warning: `Source file '${sourceFile}' does not exist`,
          };
        }
      }
    }

    return { shouldModify: false };
  }

  #createEnhancedShellError(
    command: string,
    exitCode: number | undefined,
    output: string | undefined,
  ): {
    title: string;
    details: string;
  } {
    const trimmedCommand = command.trim();
    const firstWord = trimmedCommand.split(/\s+/)[0];

    // ========== COMPREHENSIVE ERROR PATTERNS (25+ patterns) ==========
    const errorPatterns = [
      // File system errors
      {
        pattern: /cannot remove.*No such file or directory/,
        title: 'File Not Found',
        getMessage: () => {
          const fileMatch = output?.match(/'([^']+)'/);
          const fileName = fileMatch ? fileMatch[1] : 'file';
          return `The file '${fileName}' does not exist and cannot be removed.\n\nSuggestions:\n1. Use 'ls' to check what files exist\n2. Use 'rm -f' to ignore missing files\n3. Check if the file path is correct`;
        },
      },
      {
        pattern: /No such file or directory/,
        title: 'File or Directory Not Found',
        getMessage: () => {
          if (trimmedCommand.startsWith('cd ')) {
            const dirMatch = trimmedCommand.match(/cd\s+(.+)/);
            const dirName = dirMatch ? dirMatch[1] : 'directory';
            return `The directory '${dirName}' does not exist.\n\nSuggestions:\n1. Use 'mkdir -p ${dirName}' to create it\n2. Check available directories with 'ls'\n3. Verify the directory path`;
          }
          return `The specified file or directory does not exist.\n\nSuggestions:\n1. Check the path with 'ls'\n2. Verify spelling and case sensitivity\n3. Use absolute paths to avoid confusion`;
        },
      },
      {
        pattern: /Permission denied/,
        title: 'Permission Denied',
        getMessage: () =>
          `Permission denied for '${firstWord}'.\n\nSuggestions:\n1. Try 'chmod +x filename' to make executable\n2. Check file ownership\n3. Verify you have write access to the directory`,
      },
      {
        pattern: /command not found/,
        title: 'Command Not Found',
        getMessage: () =>
          `The command '${firstWord}' is not available in WebContainer.\n\nSuggestions:\n1. Check if the command is installed\n2. Try 'npm install -g ${firstWord}' for Node packages\n3. Verify the command spelling`,
      },
      {
        pattern: /Is a directory/,
        title: 'Target is a Directory',
        getMessage: () =>
          `Cannot perform this operation - target is a directory.\n\nSuggestions:\n1. Use 'ls' to list directory contents\n2. Add '-r' flag for recursive operations\n3. Specify a file instead of directory`,
      },
      {
        pattern: /File exists/,
        title: 'File Already Exists',
        getMessage: () => 
          `File already exists.\n\nSuggestions:\n1. Use a different filename\n2. Add '-f' flag to force overwrite\n3. Backup the existing file first`,
      },

      // Node.js / JavaScript errors
      {
        pattern: /Cannot find module ['"]([^'"]+)['"]/,
        title: 'Module Not Found',
        getMessage: () => {
          const moduleName = output?.match(/Cannot find module ['"]([^'"]+)['"]/)?.[1];
          const isRelative = moduleName?.startsWith('./') || moduleName?.startsWith('../');
          return `Cannot find module '${moduleName}'.\n\nSuggestions:\n1. Run 'npm install ${isRelative ? '' : moduleName}'\n2. Check if module is in package.json\n3. Verify the import path is correct\n4. Try 'npm install' to install all dependencies`;
        },
      },
      {
        pattern: /Module not found.*Can't resolve ['"]([^'"]+)['"]/,
        title: 'Module Resolution Failed',
        getMessage: () => {
          const module = output?.match(/Can't resolve ['"]([^'"]+)['"]/)?.[1];
          return `Cannot resolve module '${module}'.\n\nSuggestions:\n1. Check if the file exists at that path\n2. Verify import statement syntax\n3. Check tsconfig.json or jsconfig.json path mappings\n4. Run 'npm install' to ensure dependencies are installed`;
        },
      },
      {
        pattern: /SyntaxError:/,
        title: 'JavaScript Syntax Error',
        getMessage: () => {
          const errorLine = output?.split('\n').find(line => line.includes('SyntaxError'));
          return `Syntax error in JavaScript code.\n\n${errorLine}\n\nSuggestions:\n1. Check for missing brackets, quotes, or semicolons\n2. Verify ES6+ syntax is supported\n3. Check for mismatched parentheses\n4. Review the error line number`;
        },
      },
      {
        pattern: /TypeError:/,
        title: 'JavaScript Type Error',
        getMessage: () => {
          const errorLine = output?.split('\n').find(line => line.includes('TypeError'));
          return `Type error in JavaScript code.\n\n${errorLine}\n\nSuggestions:\n1. Check if variable is undefined or null\n2. Verify object properties exist before accessing\n3. Use optional chaining (?.) for safety\n4. Add type checking`;
        },
      },

      // npm/yarn errors
      {
        pattern: /npm ERR! peer dep missing/,
        title: 'Peer Dependency Missing',
        getMessage: () =>
          `Missing peer dependency.\n\nSuggestions:\n1. Run 'npm install --legacy-peer-deps'\n2. Update dependencies to compatible versions\n3. Check package.json for peer dependency requirements\n4. Try 'npm install --force' as last resort`,
      },
      {
        pattern: /npm ERR! EACCES/,
        title: 'npm Permission Denied',
        getMessage: () =>
          `npm doesn't have permission to write.\n\nSuggestions:\n1. Try 'npm install --unsafe-perm'\n2. Check folder permissions\n3. Don't use sudo with npm\n4. Fix npm permissions globally`,
      },
      {
        pattern: /npm ERR! code ENOENT/,
        title: 'npm File Not Found',
        getMessage: () =>
          `npm cannot find a required file.\n\nSuggestions:\n1. Check if package.json exists\n2. Run 'npm init' if starting new project\n3. Verify file paths in package.json\n4. Try deleting node_modules and reinstalling`,
      },
      {
        pattern: /npm WARN deprecated/,
        title: 'Deprecated Package Warning',
        getMessage: () => {
          const pkg = output?.match(/npm WARN deprecated ([^@\s]+)/)?.[1];
          return `Package '${pkg}' is deprecated.\n\nSuggestions:\n1. Update to a maintained alternative\n2. Check npm for replacement packages\n3. Review package documentation for migration\n4. Consider the security implications`;
        },
      },

      // Port / Network errors
      {
        pattern: /EADDRINUSE.*:(\d+)/,
        title: 'Port Already in Use',
        getMessage: () => {
          const port = output?.match(/EADDRINUSE.*:(\d+)/)?.[1];
          return `Port ${port} is already in use by another process.\n\nSuggestions:\n1. Kill process: 'lsof -ti:${port} | xargs kill -9'\n2. Use a different port in your config\n3. Check for other dev servers running\n4. Restart your development server`;
        },
      },
      {
        pattern: /ECONNREFUSED.*:(\d+)/,
        title: 'Connection Refused',
        getMessage: () => {
          const port = output?.match(/ECONNREFUSED.*:(\d+)/)?.[1];
          return `Cannot connect to service on port ${port}.\n\nSuggestions:\n1. Check if the service is running\n2. Verify the port number is correct\n3. Check firewall settings\n4. Ensure the service started successfully`;
        },
      },
      {
        pattern: /ETIMEDOUT/,
        title: 'Connection Timed Out',
        getMessage: () =>
          `Network connection timed out.\n\nSuggestions:\n1. Check your internet connection\n2. Verify the server is responding\n3. Check firewall/proxy settings\n4. Try increasing timeout duration`,
      },

      // Memory / Resource errors
      {
        pattern: /heap out of memory|JavaScript heap/,
        title: 'Out of Memory',
        getMessage: () =>
          `JavaScript heap ran out of memory.\n\nSuggestions:\n1. Increase memory: 'NODE_OPTIONS="--max-old-space-size=4096"'\n2. Check for memory leaks in your code\n3. Optimize large data processing\n4. Use streaming for large files`,
      },
      {
        pattern: /ENOMEM|not enough memory/,
        title: 'Insufficient Memory',
        getMessage: () =>
          `System is out of memory.\n\nSuggestions:\n1. Close other applications\n2. Increase system memory allocation\n3. Optimize your code to use less memory\n4. Process data in smaller chunks`,
      },
      {
        pattern: /EMFILE|too many open files/,
        title: 'Too Many Open Files',
        getMessage: () =>
          `System limit for open files reached.\n\nSuggestions:\n1. Close unnecessary files/connections\n2. Increase file descriptor limit\n3. Check for file handle leaks\n4. Use file watchers more efficiently`,
      },

      // Git errors
      {
        pattern: /fatal: not a git repository/,
        title: 'Not a Git Repository',
        getMessage: () =>
          `Current directory is not a git repository.\n\nSuggestions:\n1. Run 'git init' to initialize a repository\n2. Navigate to a git repository\n3. Clone an existing repository\n4. Check if .git folder exists`,
      },
      {
        pattern: /fatal.*would be overwritten/,
        title: 'Git Merge Conflict',
        getMessage: () =>
          `Local changes would be overwritten by git operation.\n\nSuggestions:\n1. Commit your changes: 'git commit -am "save work"'\n2. Stash changes: 'git stash'\n3. Check status: 'git status'\n4. Use 'git pull --rebase' for cleaner history`,
      },
      {
        pattern: /fatal: remote .* does not appear to be a git repository/,
        title: 'Invalid Git Remote',
        getMessage: () =>
          `Git remote is not configured or invalid.\n\nSuggestions:\n1. Check remote: 'git remote -v'\n2. Add remote: 'git remote add origin <url>'\n3. Verify repository URL is correct\n4. Check network connectivity`,
      },

      // Build / TypeScript errors
      {
        pattern: /TS\d+:/,
        title: 'TypeScript Error',
        getMessage: () => {
          const tsError = output?.match(/(TS\d+:.*)/)?.[1];
          return `TypeScript compilation error: ${tsError}\n\nSuggestions:\n1. Check type definitions\n2. Verify imports are correct\n3. Review tsconfig.json settings\n4. Install missing @types packages`;
        },
      },
      {
        pattern: /ERROR in/,
        title: 'Build Error',
        getMessage: () => {
          const firstError = output?.split('ERROR in')[1]?.split('\n')[0];
          return `Build process failed.\n\n${firstError}\n\nSuggestions:\n1. Check the file mentioned in error\n2. Verify all dependencies are installed\n3. Clear cache and rebuild\n4. Check webpack/vite configuration`;
        },
      },

      // JSX / React errors
      {
        pattern: /Expected corresponding JSX closing tag|Unexpected closing.*tag does not match opening.*tag/,
        title: 'JSX Tag Mismatch',
        getMessage: () => {
          // Extract file and line info
          const fileMatch = output?.match(/([^\/\s]+\.(?:tsx|jsx)):(\d+):(\d+)/);
          const file = fileMatch ? fileMatch[1] : 'your file';
          const line = fileMatch ? fileMatch[2] : '?';
          
          // Extract tag names
          const closingMatch = output?.match(/Unexpected closing ["']([^"']+)["'] tag|closing tag for <([^>]+)>/);
          const openingMatch = output?.match(/opening ["']([^"']+)["'] tag|opening tag for <([^>]+)>/);
          
          const closingTag = closingMatch?.[1] || closingMatch?.[2] || 'closing tag';
          const openingTag = openingMatch?.[1] || openingMatch?.[2] || 'opening tag';
          
          return `JSX tags don't match in ${file} at line ${line}.

Opening tag: <${openingTag}>
Closing tag: </${closingTag}>

Suggestions:
1. Check that all opening tags have matching closing tags
2. Verify the tag names match exactly (case-sensitive)
3. Use your editor's bracket matching to find mismatches
4. Look for missing closing tags above line ${line}
5. Common issue: Mixing HTML tags with custom components`;
        },
      },
      {
        pattern: /The character ["'].*["'] is not valid inside a JSX element/,
        title: 'Invalid JSX Character',
        getMessage: () => {
          const charMatch = output?.match(/The character ["'](.+)["'] is not valid/);
          const char = charMatch ? charMatch[1] : '?';
          return `Invalid character '${char}' inside JSX element.

Suggestions:
1. Escape special characters: use {'${char}'} instead of ${char}
2. For curly braces, use {'{}'} or {'${char}'}
3. Check for unmatched braces or brackets
4. Move JavaScript expressions inside curly braces {}`;
        },
      },
      {
        pattern: /Unexpected end of file.*closing.*tag/,
        title: 'Missing Closing Tag',
        getMessage: () => {
          const tagMatch = output?.match(/closing ["']([^"']+)["'] tag|<([^>]+)> tag/);
          const tag = tagMatch?.[1] || tagMatch?.[2] || 'element';
          const lineMatch = output?.match(/line (\d+)/);
          const line = lineMatch ? lineMatch[1] : '?';
          
          return `Missing closing tag for <${tag}> (opened around line ${line}).

Suggestions:
1. Add the closing tag: </${tag}>
2. Check for missing closing tags in nested elements
3. Use your editor's "Go to matching bracket" feature
4. Review the component structure carefully
5. Check if you accidentally deleted a closing tag`;
        },
      },
      {
        pattern: /plugin:vite:react-babel|Pre-transform error/,
        title: 'React/Babel Transform Error',
        getMessage: () => {
          // Try to extract the actual error message
          const errorMatch = output?.match(/error: (.+?)(?:\n|$)/i) || 
                            output?.match(/\[ERROR\] (.+?)(?:\n|$)/);
          const errorMsg = errorMatch ? errorMatch[1] : 'Syntax error in React component';
          
          return `React/Babel failed to transform your component.\n\n${errorMsg}\n\nSuggestions:\n1. Check for JSX syntax errors (mismatched tags)\n2. Verify all JSX is properly closed\n3. Check for missing imports (React, components)\n4. Look for invalid JavaScript inside JSX\n5. Review line numbers in the error for exact location`;
        },
      },
    ];

    // Try to match known error patterns
    for (const errorPattern of errorPatterns) {
      if (output && errorPattern.pattern.test(output)) {
        return {
          title: errorPattern.title,
          details: errorPattern.getMessage(),
        };
      }
    }

    // Generic error with suggestions based on command type
    let suggestion = '';

    if (trimmedCommand.startsWith('npm ')) {
      suggestion = '\n\nSuggestion: Try running "npm install" first or check package.json.';
    } else if (trimmedCommand.startsWith('git ')) {
      suggestion = "\n\nSuggestion: Check if you're in a git repository or if remote is configured.";
    } else if (trimmedCommand.match(/^(ls|cat|rm|cp|mv)/)) {
      suggestion = '\n\nSuggestion: Check file paths and use "ls" to see available files.';
    }

    return {
      title: `Command Failed (exit code: ${exitCode})`,
      details: `Command: ${trimmedCommand}\n\nOutput: ${output || 'No output available'}${suggestion}`,
    };
  }

  async getFileHistory(filePath: string): Promise<FileHistory | null> {
    try {
      const webcontainer = await this.#webcontainer;
      const historyPath = this.#getHistoryPath(filePath);
      const content = await webcontainer.fs.readFile(historyPath, 'utf-8');

      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to get file history:', error);
      return null;
    }
  }

  async saveFileHistory(filePath: string, history: FileHistory) {
    // const webcontainer = await this.#webcontainer;
    const historyPath = this.#getHistoryPath(filePath);

    await this.#runFileAction({
      type: 'file',
      filePath: historyPath,
      content: JSON.stringify(history),
      changeSource: 'auto-save',
    } as any);
  }

  #getHistoryPath(filePath: string) {
    return nodePath.join('.history', filePath);
  }

  async #runBuildAction(action: ActionState) {
    if (action.type !== 'build') {
      unreachable('Expected build action');
    }

    // Trigger build started alert
    this.onDeployAlert?.({
      type: 'info',
      title: 'Building Application',
      description: 'Building your application...',
      stage: 'building',
      buildStatus: 'running',
      deployStatus: 'pending',
      source: 'netlify',
    });

    const webcontainer = await this.#webcontainer;

    // Create a new terminal specifically for the build
    const buildProcess = await webcontainer.spawn('npm', ['run', 'build']);

    let output = '';
    buildProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          output += data;
        },
      }),
    );

    const exitCode = await buildProcess.exit;

    if (exitCode !== 0) {
      // Trigger build failed alert
      this.onDeployAlert?.({
        type: 'error',
        title: 'Build Failed',
        description: 'Your application build failed',
        content: output || 'No build output available',
        stage: 'building',
        buildStatus: 'failed',
        deployStatus: 'pending',
        source: 'netlify',
      });

      throw new ActionCommandError('Build Failed', output || 'No Output Available');
    }

    // Trigger build success alert
    this.onDeployAlert?.({
      type: 'success',
      title: 'Build Completed',
      description: 'Your application was built successfully',
      stage: 'deploying',
      buildStatus: 'complete',
      deployStatus: 'running',
      source: 'netlify',
    });

    // Check for common build directories
    const commonBuildDirs = ['dist', 'build', 'out', 'output', '.next', 'public'];

    let buildDir = '';

    // Try to find the first existing build directory
    for (const dir of commonBuildDirs) {
      const dirPath = nodePath.join(webcontainer.workdir, dir);

      try {
        await webcontainer.fs.readdir(dirPath);
        buildDir = dirPath;
        break;
      } catch {
        continue;
      }
    }

    // If no build directory was found, use the default (dist)
    if (!buildDir) {
      buildDir = nodePath.join(webcontainer.workdir, 'dist');
    }

    return {
      path: buildDir,
      exitCode,
      output,
    };
  }
  async handleSupabaseAction(action: SupabaseAction) {
    const { operation, content, filePath } = action;
    logger.debug('[Supabase Action]:', { operation, filePath, content });

    switch (operation) {
      case 'migration':
        if (!filePath) {
          throw new Error('Migration requires a filePath');
        }

        // Show alert for migration action
        this.onSupabaseAlert?.({
          type: 'info',
          title: 'Supabase Migration',
          description: `Create migration file: ${filePath}`,
          content,
          source: 'supabase',
        });

        // Only create the migration file
        await this.#runFileAction({
          type: 'file',
          filePath,
          content,
          changeSource: 'supabase',
        } as any);
        return { success: true };

      case 'query': {
        // Always show the alert and let the SupabaseAlert component handle connection state
        this.onSupabaseAlert?.({
          type: 'info',
          title: 'Supabase Query',
          description: 'Execute database query',
          content,
          source: 'supabase',
        });

        // The actual execution will be triggered from SupabaseChatAlert
        return { pending: true };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  // Add this method declaration to the class
  handleDeployAction(
    stage: 'building' | 'deploying' | 'complete',
    status: ActionStatus,
    details?: {
      url?: string;
      error?: string;
      source?: 'netlify' | 'vercel' | 'github';
    },
  ): void {
    if (!this.onDeployAlert) {
      logger.debug('No deploy alert handler registered');
      return;
    }

    const alertType = status === 'failed' ? 'error' : status === 'complete' ? 'success' : 'info';

    const title =
      stage === 'building'
        ? 'Building Application'
        : stage === 'deploying'
          ? 'Deploying Application'
          : 'Deployment Complete';

    const description =
      status === 'failed'
        ? `${stage === 'building' ? 'Build' : 'Deployment'} failed`
        : status === 'running'
          ? `${stage === 'building' ? 'Building' : 'Deploying'} your application...`
          : status === 'complete'
            ? `${stage === 'building' ? 'Build' : 'Deployment'} completed successfully`
            : `Preparing to ${stage === 'building' ? 'build' : 'deploy'} your application`;

    const buildStatus =
      stage === 'building' ? status : stage === 'deploying' || stage === 'complete' ? 'complete' : 'pending';

    const deployStatus = stage === 'building' ? 'pending' : status;

    this.onDeployAlert({
      type: alertType,
      title,
      description,
      content: details?.error || '',
      url: details?.url,
      stage,
      buildStatus: buildStatus as any,
      deployStatus: deployStatus as any,
      source: details?.source || 'netlify',
    });
  }
}
