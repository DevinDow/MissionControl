import { NextResponse } from 'next/server';
import openclawConfig from '../../../../../openclaw.json' assert { type: 'json' };

export async function GET() {
  const startTime = Date.now();
  try {
    // Extract models data from the configuration
    const modelsData = openclawConfig.agents.defaults.models;
    
    // Format the data for the UI
    const formattedData = Object.entries(modelsData).map(([modelId, config]: [string, any]) => ({
      id: modelId,
      alias: config.alias || '',
      contextWindow: config.params?.contextWindow || 0,
      // Format contextWindow with 'k' suffix
      contextWindowFormatted: config.params?.contextWindow 
        ? `${Math.round(config.params.contextWindow / 1000)}k` 
        : '0k'
    }));
    
    // we will build a hierarchical tree structure to support nested models.
    // Model IDs are typically structured as "provider/model" or "host/provider/model".
    // Educational Context: We extract the primary and fallback configurations 
    // to identify how each model is prioritized in the agent's workflow.
    const primaryModelId = openclawConfig.agents?.defaults?.model?.primary;
    const fallbackList = openclawConfig.agents?.defaults?.model?.fallbacks || [];
    const tree: any[] = [];

    const buildStart = Date.now();
    formattedData.forEach(modelEntry => {
      const parts = modelEntry.id.split('/');
      let currentLevel = tree;
      
      parts.forEach((part, index) => {
        const isLeafNode = index === parts.length - 1;
        
        // Define roles for educational clarity
        let role = "folder"; 
        if (parts.length === 3) {
          if (index === 0) role = "host";
          else if (index === 1) role = "provider";
          else role = "model";
        } else if (parts.length === 2) {
          if (index === 0) role = "provider";
          else role = "model";
        }

        let node = currentLevel.find(n => n.name === part && n.type === (isLeafNode ? 'model' : 'directory'));
        
        if (!node) {
          if (isLeafNode) {
            // Check if this specific model is the configured primary or a fallback.
            const isPrimary = modelEntry.id === primaryModelId;
            const fbIndex = fallbackList.indexOf(modelEntry.id);
            const fallbackRank = fbIndex !== -1 ? fbIndex + 1 : null;

            node = {
              ...modelEntry,
              name: part, 
              type: 'model',
              role: role,
              isPrimary: isPrimary,
              fallbackRank: fallbackRank
            };
            currentLevel.push(node);
          } else {
            node = {
              name: part,
              type: 'directory',
              role: role,
              children: []
            };
            currentLevel.push(node);
          }
        }
        
        if (!isLeafNode) {
          currentLevel = node.children;
        }
      });
    });
    
    const buildEnd = Date.now();
    console.log(`[Models API] Tree built in ${buildEnd - buildStart}ms, Total time: ${buildEnd - startTime}ms, Models: ${formattedData.length}`);
    
    return NextResponse.json({
      models: formattedData,
      tree: tree, // The new hierarchical structure
      platform: process.platform
    });
  } catch (error) {
    console.error('Failed to fetch models data:', error);
    return NextResponse.json(
      { error: 'Failed to load models data' },
      { status: 500 }
    );
  }
}