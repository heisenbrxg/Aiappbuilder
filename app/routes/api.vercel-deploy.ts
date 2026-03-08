import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import type { VercelProjectInfo } from '~/types/vercel';

// Function to detect framework from project files
const detectFramework = (files: Record<string, string>): string => {
  // Check for package.json first
  const packageJson = files['package.json'];

  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

      // Check for specific frameworks
      if (dependencies.next) {
        return 'nextjs';
      }

      if (dependencies.react && dependencies['@remix-run/react']) {
        return 'remix';
      }

      if (dependencies.react && dependencies.vite) {
        return 'vite';
      }

      if (dependencies.react && dependencies['@vitejs/plugin-react']) {
        return 'vite';
      }

      if (dependencies['@nuxt/core']) {
        return 'nuxt';
      }

      if (dependencies['@sveltejs/kit']) {
        return 'sveltekit';
      }

      if (dependencies.astro) {
        return 'astro';
      }

      if (dependencies['@angular/core']) {
        return 'angular';
      }

      if (dependencies.vue) {
        return 'vue';
      }

      if (dependencies['@qwik-city/qwik']) {
        return 'qwik';
      }

      if (dependencies['@expo/react-native']) {
        return 'expo';
      }

      if (dependencies['react-native']) {
        return 'react-native';
      }

      // Generic React app
      if (dependencies.react) {
        return 'react';
      }

      // Check for build tools
      if (dependencies.vite) {
        return 'vite';
      }

      if (dependencies.webpack) {
        return 'webpack';
      }

      if (dependencies.parcel) {
        return 'parcel';
      }

      if (dependencies.rollup) {
        return 'rollup';
      }

      // Default to Node.js if package.json exists
      return 'nodejs';
    } catch (error) {
      console.error('Error parsing package.json:', error);
    }
  }

  // Check for other framework indicators
  if (files['next.config.js'] || files['next.config.ts']) {
    return 'nextjs';
  }

  if (files['remix.config.js'] || files['remix.config.ts']) {
    return 'remix';
  }

  if (files['vite.config.js'] || files['vite.config.ts']) {
    return 'vite';
  }

  if (files['nuxt.config.js'] || files['nuxt.config.ts']) {
    return 'nuxt';
  }

  if (files['svelte.config.js'] || files['svelte.config.ts']) {
    return 'sveltekit';
  }

  if (files['astro.config.js'] || files['astro.config.ts']) {
    return 'astro';
  }

  if (files['angular.json']) {
    return 'angular';
  }

  if (files['vue.config.js'] || files['vue.config.ts']) {
    return 'vue';
  }

  if (files['app.json'] && files['app.json'].includes('expo')) {
    return 'expo';
  }

  if (files['app.json'] && files['app.json'].includes('react-native')) {
    return 'react-native';
  }

  // Check for static site indicators
  if (files['index.html']) {
    return 'static';
  }

  // Default to unknown
  return 'static';
};

// Add loader function to handle GET requests
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const token = url.searchParams.get('token');

  if (!projectId || !token) {
    return json({ error: 'Missing projectId or token' }, { status: 400 });
  }

  try {
    // Get project info
    const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!projectResponse.ok) {
      return json({ error: 'Failed to fetch project' }, { status: 400 });
    }

    const projectData = (await projectResponse.json()) as any;

    // Get latest deployment
    const deploymentsResponse = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!deploymentsResponse.ok) {
      return json({ error: 'Failed to fetch deployments' }, { status: 400 });
    }

    const deploymentsData = (await deploymentsResponse.json()) as any;

    const latestDeployment = deploymentsData.deployments?.[0];

    return json({
      project: {
        id: projectData.id,
        name: projectData.name,
        url: `https://${projectData.name}.vercel.app`,
      },
      deploy: latestDeployment
        ? {
            id: latestDeployment.id,
            state: latestDeployment.state,
            url: latestDeployment.url ? `https://${latestDeployment.url}` : `https://${projectData.name}.vercel.app`,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching Vercel deployment:', error);
    return json({ error: 'Failed to fetch deployment' }, { status: 500 });
  }
}

interface DeployRequestBody {
  projectId?: string;
  files: Record<string, string>;
  sourceFiles?: Record<string, string>;
  chatId: string;
  framework?: string;
}

// Existing action function for POST requests
export async function action({ request }: ActionFunctionArgs) {
  let body: (DeployRequestBody & { token: string }) | null = null;
  
  try {
    // Try to parse the request body
    try {
      body = (await request.json()) as DeployRequestBody & { token: string };
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return json({ error: 'Invalid request body' }, { status: 400 });
    }

    console.log('Vercel deploy request received:', { 
      hasProjectId: !!body.projectId,
      hasFiles: !!body.files,
      fileCount: body.files ? Object.keys(body.files).length : 0,
      hasToken: !!body.token,
      hasChatId: !!body.chatId
    });

    const { projectId, files, sourceFiles, token, chatId, framework } = body;

    if (!token) {
      console.error('Missing Vercel token');
      return json({ error: 'Not connected to Vercel' }, { status: 401 });
    }

    if (!files || Object.keys(files).length === 0) {
      console.error('No files provided for deployment');
      return json({ error: 'No files to deploy' }, { status: 400 });
    }

    if (!chatId) {
      console.error('Missing chatId');
      return json({ error: 'Missing chatId parameter' }, { status: 400 });
    }

    let targetProjectId = projectId;
    let projectInfo: VercelProjectInfo | undefined;

    // For pre-built file deployments, we don't need framework detection
    // Framework detection is only needed if we're deploying source files and letting Vercel build
    // Since we're deploying already-built static files, set framework to null
    const deployFramework = null;

    // If no projectId provided, create a new project
    if (!targetProjectId) {
      // Shorten project name to avoid Vercel's length limits (max 100 chars, safe limit 50)
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits
      const chatIdShort = chatId.slice(0, 8); // First 8 chars of UUID
      const projectName = `monzed-${chatIdShort}-${timestamp}`;
      
      console.log('Creating new Vercel project:', projectName, 'as static site (no build)');
      
      try {
        const createProjectResponse = await fetch('https://api.vercel.com/v9/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            framework: deployFramework,
            buildCommand: null,
            devCommand: null,
            installCommand: null,
          }),
        });

        console.log('Vercel project creation response status:', createProjectResponse.status);

        if (!createProjectResponse.ok) {
          const errorData = (await createProjectResponse.json().catch(() => ({}))) as any;
          const errorMsg = errorData.error?.message || errorData.message || `HTTP ${createProjectResponse.status}`;
          console.error('Failed to create Vercel project:', errorMsg, errorData);
          return json(
            { error: `Failed to create project: ${errorMsg}` },
            { status: createProjectResponse.status || 400 },
          );
        }

        const newProject = (await createProjectResponse.json()) as any;
        console.log('Vercel project created successfully:', newProject.id);
        
        targetProjectId = newProject.id;
        projectInfo = {
          id: newProject.id,
          name: newProject.name,
          url: `https://${newProject.name}.vercel.app`,
          chatId,
        };
      } catch (fetchError) {
        console.error('Network error creating Vercel project:', fetchError);
        return json(
          { error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
          { status: 500 },
        );
      }
    } else {
      // Get existing project info
      const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${targetProjectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (projectResponse.ok) {
        const existingProject = (await projectResponse.json()) as any;
        
        // Update project settings to ensure no build commands are set
        await fetch(`https://api.vercel.com/v9/projects/${targetProjectId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            framework: null,
            buildCommand: null,
            devCommand: null,
            installCommand: null,
          }),
        }).catch(() => {
          // Ignore errors - project will still work with existing settings
          console.log('Could not update project settings, continuing with deployment');
        });
        
        projectInfo = {
          id: existingProject.id,
          name: existingProject.name,
          url: `https://${existingProject.name}.vercel.app`,
          chatId,
        };
      } else {
        // If project doesn't exist, create a new one
        const timestamp = Date.now().toString().slice(-8);
        const chatIdShort = chatId.slice(0, 8);
        const projectName = `monzed-${chatIdShort}-${timestamp}`;
        
        const createProjectResponse = await fetch('https://api.vercel.com/v9/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            framework: null,
            buildCommand: null,
            devCommand: null,
            installCommand: null,
          }),
        });

        if (!createProjectResponse.ok) {
          const errorData = (await createProjectResponse.json().catch(() => ({}))) as any;
          const errorMsg = errorData.error?.message || errorData.message || `HTTP ${createProjectResponse.status}`;
          console.error('Failed to create fallback Vercel project:', errorMsg, errorData);
          return json(
            { error: `Failed to create project: ${errorMsg}` },
            { status: createProjectResponse.status || 400 },
          );
        }

        const newProject = (await createProjectResponse.json()) as any;
        targetProjectId = newProject.id;
        projectInfo = {
          id: newProject.id,
          name: newProject.name,
          url: `https://${newProject.name}.vercel.app`,
          chatId,
        };
      }
    }

    // Prepare files for deployment
    const deploymentFiles = [];

    for (const [filePath, content] of Object.entries(files)) {
      // Ensure file path doesn't start with a slash for Vercel
      const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      deploymentFiles.push({
        file: normalizedPath,
        data: content,
      });
    }

    console.log('Preparing deployment with', deploymentFiles.length, 'files for project:', targetProjectId);

    // Create a new deployment
    try {
      const deployResponse = await fetch(`https://api.vercel.com/v13/deployments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectInfo.name,
          project: targetProjectId,
          target: 'production',
          files: deploymentFiles,
          // Routes are now handled by vercel.json file
        }),
      });

      console.log('Vercel deployment creation response status:', deployResponse.status);

      if (!deployResponse.ok) {
        const errorData = (await deployResponse.json().catch(() => ({}))) as any;
        const errorMsg = errorData.error?.message || errorData.message || `HTTP ${deployResponse.status}`;
        console.error('Failed to create Vercel deployment:', errorMsg, errorData);
        return json(
          { error: `Failed to create deployment: ${errorMsg}` },
          { status: deployResponse.status || 400 },
        );
      }

      const deployData = (await deployResponse.json()) as any;
      console.log('Deployment created, ID:', deployData.id, 'URL:', deployData.url);

      // Poll for deployment status
      let retryCount = 0;
      const maxRetries = 60;
      let deploymentUrl = '';
      let deploymentState = '';

      while (retryCount < maxRetries) {
        const statusResponse = await fetch(`https://api.vercel.com/v13/deployments/${deployData.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (statusResponse.ok) {
          const status = (await statusResponse.json()) as any;
          deploymentState = status.readyState;
          deploymentUrl = status.url ? `https://${status.url}` : '';

          if (status.readyState === 'READY' || status.readyState === 'ERROR') {
            break;
          }
        }

        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (deploymentState === 'ERROR') {
        return json({ error: 'Deployment failed' }, { status: 500 });
      }

      if (retryCount >= maxRetries) {
        return json({ error: 'Deployment timed out' }, { status: 500 });
      }

      return json({
        success: true,
        deploy: {
          id: deployData.id,
          state: deploymentState,

          // Return public domain as deploy URL and private domain as fallback.
          url: projectInfo.url || deploymentUrl,
        },
        project: projectInfo,
      });
    } catch (deployError) {
      console.error('Network error creating deployment:', deployError);
      return json(
        { error: `Deployment network error: ${deployError instanceof Error ? deployError.message : 'Unknown error'}` },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Vercel deploy error:', error);
    
    // Return detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Deployment failed';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error('Error details:', errorDetails);
    
    return json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      }, 
      { status: 500 }
    );
  }
}
