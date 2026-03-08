export interface FigmaDesignTokens {
  colors: string[];
  fonts: string[];
  spacing: string[];
  borderRadius: string[];
  shadows: string[];
}

export interface FigmaFileData {
  name: string;
  designTokens: FigmaDesignTokens;
  components: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  screenshots: string[];
}

export class FigmaService {
  private static readonly API_BASE = 'https://api.figma.com/v1';

  /**
   * Extract Figma file ID from various URL formats
   */
  static extractFileId(url: string): string | null {
    try {
      // Handle various Figma URL formats:
      // https://www.figma.com/file/ABC123/Project-Name
      // https://www.figma.com/design/ABC123/Project-Name
      // https://figma.com/file/ABC123
      const patterns = [
        /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
        /figma\.com\/proto\/([a-zA-Z0-9]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Validate Figma URL format
   */
  static isValidFigmaUrl(url: string): boolean {
    return this.extractFileId(url) !== null;
  }

  /**
   * Fetch Figma file data and extract design tokens
   */
  static async fetchFileData(fileId: string, accessToken: string): Promise<FigmaFileData> {
    try {
      // Fetch file metadata
      const fileResponse = await fetch(`${this.API_BASE}/files/${fileId}`, {
        headers: {
          'X-Figma-Token': accessToken,
        },
      });

      if (!fileResponse.ok) {
        throw new Error(`Figma API error: ${fileResponse.status} ${fileResponse.statusText}`);
      }

      const fileData: any = await fileResponse.json();

      // Extract design tokens from the file
      const designTokens = this.extractDesignTokens(fileData);

      // Extract component information
      const components = this.extractComponents(fileData);

      // Generate screenshots for key frames
      const screenshots = await this.generateScreenshots(fileId, accessToken, fileData);

      return {
        name: fileData.name || 'Untitled',
        designTokens,
        components,
        screenshots,
      };
    } catch (error) {
      console.error('Error fetching Figma file:', error);
      throw new Error(`Failed to fetch Figma file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract design tokens from Figma file data
   */
  private static extractDesignTokens(fileData: any): FigmaDesignTokens {
    const tokens: FigmaDesignTokens = {
      colors: [],
      fonts: [],
      spacing: [],
      borderRadius: [],
      shadows: [],
    };

    try {
      // Extract colors from styles
      if (fileData.styles) {
        Object.values(fileData.styles).forEach((style: any) => {
          if (style.styleType === 'FILL' && style.fills) {
            style.fills.forEach((fill: any) => {
              if (fill.type === 'SOLID' && fill.color) {
                const { r, g, b, a = 1 } = fill.color;
                const hex = this.rgbaToHex(r, g, b, a);
                if (hex && !tokens.colors.includes(hex)) {
                  tokens.colors.push(hex);
                }
              }
            });
          }
        });
      }

      // Extract fonts from text styles
      if (fileData.styles) {
        Object.values(fileData.styles).forEach((style: any) => {
          if (style.styleType === 'TEXT' && style.fontFamily) {
            if (!tokens.fonts.includes(style.fontFamily)) {
              tokens.fonts.push(style.fontFamily);
            }
          }
        });
      }

      // Traverse document to find more design tokens
      if (fileData.document) {
        this.traverseNodes(fileData.document, tokens);
      }

      // Add default values if none found
      if (tokens.colors.length === 0) {
        tokens.colors = ['#000000', '#FFFFFF', '#F3F4F6', '#3B82F6'];
      }
      if (tokens.fonts.length === 0) {
        tokens.fonts = ['Inter', 'Roboto', 'Arial'];
      }
      if (tokens.spacing.length === 0) {
        tokens.spacing = ['4px', '8px', '16px', '24px', '32px'];
      }

    } catch (error) {
      console.warn('Error extracting design tokens:', error);
    }

    return tokens;
  }

  /**
   * Extract component information from Figma file
   */
  private static extractComponents(fileData: any): Array<{ name: string; type: string; description?: string }> {
    const components: Array<{ name: string; type: string; description?: string }> = [];

    try {
      if (fileData.components) {
        Object.values(fileData.components).forEach((component: any) => {
          components.push({
            name: component.name || 'Unnamed Component',
            type: component.type || 'COMPONENT',
            description: component.description,
          });
        });
      }
    } catch (error) {
      console.warn('Error extracting components:', error);
    }

    return components;
  }

  /**
   * Generate screenshots of key frames
   */
  private static async generateScreenshots(fileId: string, accessToken: string, fileData: any): Promise<string[]> {
    try {
      // Find main frames to screenshot
      const frameIds: string[] = [];
      
      if (fileData.document && fileData.document.children) {
        fileData.document.children.forEach((page: any) => {
          if (page.children) {
            page.children.forEach((node: any) => {
              if (node.type === 'FRAME' && frameIds.length < 3) {
                frameIds.push(node.id);
              }
            });
          }
        });
      }

      if (frameIds.length === 0) {
        return [];
      }

      // Request image exports
      const imageResponse = await fetch(
        `${this.API_BASE}/images/${fileId}?ids=${frameIds.join(',')}&format=png&scale=1`,
        {
          headers: {
            'X-Figma-Token': accessToken,
          },
        }
      );

      if (!imageResponse.ok) {
        console.warn('Failed to generate screenshots');
        return [];
      }

      const imageData: any = await imageResponse.json();
      return Object.values(imageData.images || {}) as string[];
    } catch (error) {
      console.warn('Error generating screenshots:', error);
      return [];
    }
  }

  /**
   * Traverse Figma nodes to extract design tokens
   */
  private static traverseNodes(node: any, tokens: FigmaDesignTokens): void {
    try {
      // Extract colors from fills
      if (node.fills && Array.isArray(node.fills)) {
        node.fills.forEach((fill: any) => {
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b, a = 1 } = fill.color;
            const hex = this.rgbaToHex(r, g, b, a);
            if (hex && !tokens.colors.includes(hex)) {
              tokens.colors.push(hex);
            }
          }
        });
      }

      // Extract fonts from text nodes
      if (node.type === 'TEXT' && node.style && node.style.fontFamily) {
        if (!tokens.fonts.includes(node.style.fontFamily)) {
          tokens.fonts.push(node.style.fontFamily);
        }
      }

      // Extract border radius
      if (node.cornerRadius && !tokens.borderRadius.includes(`${node.cornerRadius}px`)) {
        tokens.borderRadius.push(`${node.cornerRadius}px`);
      }

      // Recursively traverse children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => this.traverseNodes(child, tokens));
      }
    } catch (error) {
      // Silently continue if there's an error with a specific node
    }
  }

  /**
   * Convert RGBA to hex color
   */
  private static rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
    try {
      const toHex = (n: number) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      return a < 1 ? `${hex}${toHex(a)}` : hex;
    } catch {
      return '#000000';
    }
  }

  /**
   * Generate enhanced AI prompt with Figma design context
   */
  static generateEnhancedPrompt(originalPrompt: string, figmaData: FigmaFileData): string {
    const { designTokens, components, name } = figmaData;

    let enhancedPrompt = `${originalPrompt}\n\n`;
    enhancedPrompt += `DESIGN CONTEXT FROM FIGMA FILE: "${name}"\n\n`;

    // Add color palette
    if (designTokens.colors.length > 0) {
      enhancedPrompt += `COLOR PALETTE:\n`;
      enhancedPrompt += `- Primary colors: ${designTokens.colors.slice(0, 6).join(', ')}\n`;
      enhancedPrompt += `- Use these exact colors in your design\n\n`;
    }

    // Add typography
    if (designTokens.fonts.length > 0) {
      enhancedPrompt += `TYPOGRAPHY:\n`;
      enhancedPrompt += `- Font families: ${designTokens.fonts.join(', ')}\n`;
      enhancedPrompt += `- Use these fonts for consistency\n\n`;
    }

    // Add spacing system
    if (designTokens.spacing.length > 0) {
      enhancedPrompt += `SPACING SYSTEM:\n`;
      enhancedPrompt += `- Use spacing values: ${designTokens.spacing.join(', ')}\n\n`;
    }

    // Add component information
    if (components.length > 0) {
      enhancedPrompt += `COMPONENTS TO INCLUDE:\n`;
      components.slice(0, 8).forEach(comp => {
        enhancedPrompt += `- ${comp.name} (${comp.type})`;
        if (comp.description) {
          enhancedPrompt += `: ${comp.description}`;
        }
        enhancedPrompt += `\n`;
      });
      enhancedPrompt += `\n`;
    }

    enhancedPrompt += `IMPORTANT: Generate code that matches this design system exactly. Use the specified colors, fonts, and spacing consistently throughout the application.`;

    return enhancedPrompt;
  }
}
