import { useEffect, useMemo, useState } from 'react';
import { classNames } from '~/utils/classNames';
import type { MCPConfig } from '~/lib/services/mcpService';
import { toast } from 'react-toastify';
import { useMCPStore } from '~/lib/stores/mcp';
import McpServerList from '~/components/workbench/McpServerList';

const EXAMPLE_MCP_CONFIG: MCPConfig = {
  mcpServers: {
    everything: {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-everything'],
    },
    deepwiki: {
      type: 'streamable-http',
      url: 'https://mcp.deepwiki.com/mcp',
    },
    'local-sse': {
      type: 'sse',
      url: 'http://localhost:8000/sse',
      headers: {
        Authorization: 'Bearer mytoken123',
      },
    },
  },
};

export default function McpPanel() {
  const settings = useMCPStore((state) => state.settings);
  const isInitialized = useMCPStore((state) => state.isInitialized);
  const serverTools = useMCPStore((state) => state.serverTools);
  const initialize = useMCPStore((state) => state.initialize);
  const updateSettings = useMCPStore((state) => state.updateSettings);
  const checkServersAvailabilities = useMCPStore((state) => state.checkServersAvailabilities);

  const [isSaving, setIsSaving] = useState(false);
  const [mcpConfigText, setMCPConfigText] = useState('');
  const [maxLLMSteps, setMaxLLMSteps] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingServers, setIsCheckingServers] = useState(false);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      initialize().catch((err) => {
        setError(`Failed to initialize MCP settings: ${err instanceof Error ? err.message : String(err)}`);
        toast.error('Failed to load MCP configuration');
      });
    }
  }, [isInitialized, initialize]);

  useEffect(() => {
    setMCPConfigText(JSON.stringify(settings.mcpConfig, null, 2));
    setMaxLLMSteps(settings.maxLLMSteps);
    setError(null);
  }, [settings]);

  const parsedConfig = useMemo(() => {
    try {
      setError(null);
      return JSON.parse(mcpConfigText) as MCPConfig;
    } catch (e) {
      setError(`Invalid JSON format: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }, [mcpConfigText]);

  const handleMaxLLMCallChange = (value: string) => {
    setMaxLLMSteps(parseInt(value, 10));
  };

  const handleSave = async () => {
    if (!parsedConfig) {
      return;
    }

    setIsSaving(true);

    try {
      await updateSettings({
        mcpConfig: parsedConfig,
        maxLLMSteps,
      });
      toast.success('MCP configuration saved');

      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save configuration');
      toast.error('Failed to save MCP configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadExample = () => {
    setMCPConfigText(JSON.stringify(EXAMPLE_MCP_CONFIG, null, 2));
    setError(null);
  };

  const checkServerAvailability = async () => {
    if (serverEntries.length === 0) {
      return;
    }

    setIsCheckingServers(true);
    setError(null);

    try {
      await checkServersAvailabilities();
    } catch (e) {
      setError(`Failed to check server availability: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsCheckingServers(false);
    }
  };

  const toggleServerExpanded = (serverName: string) => {
    setExpandedServer(expandedServer === serverName ? null : serverName);
  };

  const serverEntries = useMemo(() => Object.entries(serverTools), [serverTools]);

  return (
    <div className="h-full flex flex-col bg-monzed-elements-background-depth-2 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-monzed-elements-borderColor">
        <h2 className="text-lg font-semibold text-monzed-elements-textPrimary flex items-center gap-2">
          <div className="i-ph:hard-drives-bold w-5 h-5" />
          MCP Servers
        </h2>
        <p className="text-xs text-monzed-elements-textSecondary mt-1">
          Configure Model Context Protocol servers for AI tool integration
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Server Status Section */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-monzed-elements-textPrimary">Configured Servers</h3>
            <button
              onClick={checkServerAvailability}
              disabled={isCheckingServers || !parsedConfig || serverEntries.length === 0}
              className={classNames(
                'px-3 py-1.5 rounded-lg text-xs',
                'bg-monzed-elements-background-depth-3 hover:bg-monzed-elements-background-depth-4',
                'text-monzed-elements-textPrimary',
                'transition-all duration-200',
                'flex items-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isCheckingServers ? (
                <div className="i-svg-spinners:90-ring-with-bg w-3 h-3 text-monzed-elements-loader-progress animate-spin" />
              ) : (
                <div className="i-ph:arrow-counter-clockwise w-3 h-3" />
              )}
              Check
            </button>
          </div>
          <McpServerList
            checkingServers={isCheckingServers}
            expandedServer={expandedServer}
            serverEntries={serverEntries}
            toggleServerExpanded={toggleServerExpanded}
          />
        </section>

        {/* Configuration Section */}
        <section>
          <h3 className="text-sm font-medium text-monzed-elements-textPrimary mb-3">Configuration</h3>

          <div className="space-y-3">
            <div>
              <label htmlFor="mcp-config" className="block text-xs text-monzed-elements-textSecondary mb-2">
                Configuration JSON
              </label>
              <textarea
                id="mcp-config"
                value={mcpConfigText}
                onChange={(e) => setMCPConfigText(e.target.value)}
                className={classNames(
                  'w-full px-3 py-2 rounded-lg text-xs font-mono h-48',
                  'bg-[#F8F8F8] dark:bg-[#1A1A1A]',
                  'border',
                  error ? 'border-monzed-elements-icon-error' : 'border-[#E5E5E5] dark:border-[#333333]',
                  'text-monzed-elements-textPrimary',
                  'focus:outline-none focus:ring-1 focus:ring-monzed-elements-focus',
                )}
              />
            </div>
            {error && <p className="text-xs text-monzed-elements-icon-error">{error}</p>}
            
            <div>
              <label htmlFor="max-llm-steps" className="block text-xs text-monzed-elements-textSecondary mb-2">
                Max LLM Steps
              </label>
              <input
                id="max-llm-steps"
                type="number"
                min="1"
                max="20"
                value={maxLLMSteps}
                onChange={(e) => handleMaxLLMCallChange(e.target.value)}
                className="w-full px-3 py-2 text-monzed-elements-textPrimary text-xs rounded-lg bg-white dark:bg-monzed-elements-background-depth-4 border border-monzed-elements-borderColor focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="text-xs text-monzed-elements-textSecondary">
              Format is identical to Claude Desktop.{' '}
              <a
                href="https://modelcontextprotocol.io/examples"
                target="_blank"
                rel="noopener noreferrer"
                className="text-monzed-elements-link hover:underline inline-flex items-center gap-1"
              >
                View examples
                <div className="i-ph:arrow-square-out w-3 h-3" />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-monzed-elements-borderColor flex justify-between gap-2">
        <button
          onClick={handleLoadExample}
          className="px-3 py-2 rounded-lg text-xs border border-monzed-elements-borderColor
                    bg-monzed-elements-background-depth-2 text-monzed-elements-textSecondary
                    hover:bg-monzed-elements-background-depth-3"
        >
          Load Example
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving || !parsedConfig}
          className={classNames(
            'px-3 py-2 rounded-lg text-xs flex items-center gap-2',
            'bg-monzed-elements-item-backgroundAccent text-monzed-elements-item-contentAccent',
            'hover:bg-monzed-elements-item-backgroundActive',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <div className="i-ph:floppy-disk w-3 h-3" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
