import * as yaml from 'js-yaml';

interface YamlData {
  [key: string]: any;
}

function colorToHexOrRgba(color: RGBA): string {
  const { r, g, b, a } = color;
  if (a === 1) {
    return `#${[r, g, b].map(n => Math.round(n * 255).toString(16).padStart(2, '0')).join('')}`;
  } else {
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(2)})`;
  }
}

figma.showUI(__html__, { width: 400, height: 500 });

figma.ui.onmessage = async (msg: { type: string; collections?: string[]; text?: string }) => {
  if (msg.type === 'get-collections') {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    figma.ui.postMessage({ 
      type: 'collections-list', 
      data: collections.map(c => ({ id: c.id, name: c.name }))
    });
  } else if (msg.type === 'export-variables') {
    const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const selectedCollections = allCollections.filter(c => msg.collections?.includes(c.id));
    const yamlData: YamlData = {};

    for (const collection of selectedCollections) {
      const variables = await Promise.all(collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id)));
      yamlData[collection.name] = {};

      const modes = collection.modes;
      const defaultModeId = collection.defaultModeId;

      for (const variable of variables) {
        if (variable) {
          let processedValue: any;
          
          if (Object.keys(variable.valuesByMode).length === 1 && Object.keys(variable.valuesByMode)[0] === defaultModeId) {
            // If there's only one mode and it's the default mode, don't include the mode name
            const value = variable.valuesByMode[defaultModeId];
            processedValue = (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value && 'a' in value) 
              ? colorToHexOrRgba(value as RGBA) 
              : value;
          } else {
            // If there are multiple modes or it's not the default mode, include mode names
            processedValue = {};
            for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
              const modeName = modes.find(m => m.modeId === modeId)?.name || modeId;
              processedValue[modeName] = (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value && 'a' in value) 
                ? colorToHexOrRgba(value as RGBA) 
                : value;
            }
          }
          
          yamlData[collection.name][variable.name] = processedValue;
        }
      }
    }

    const yamlString = yaml.dump(yamlData, { 
      lineWidth: -1,  // Prevent line wrapping
      noRefs: true,   // Prevent YAML aliases
    });
    figma.ui.postMessage({ type: 'yaml-data', data: yamlString });
  } else if (msg.type === 'copy-to-clipboard') {
    // When the UI requests to copy text to clipboard
    if (msg.text) {
      figma.ui.postMessage({ type: 'copy', text: msg.text });
    }
  } else if (msg.type === 'copyComplete') {
    // Notify the user that the copy was successful
    figma.notify('Copied to clipboard!');
  }
};
