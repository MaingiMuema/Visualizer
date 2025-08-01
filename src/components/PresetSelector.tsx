'use client';

import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Search, 
  Star, 
  Download, 
  Upload, 
  Save, 
  Trash2,
  X,
  Plus
} from 'lucide-react';
import { VisualizationPreset, PresetManager } from '../utils/presets';
import { VisualizerConfig } from './Visualizer';

interface PresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: VisualizerConfig;
  currentEffects: { [effectId: string]: { enabled: boolean; intensity: number } };
  onPresetSelect: (preset: VisualizationPreset) => void;
  onSavePreset: (name: string, description: string, tags: string[]) => void;
}

export default function PresetSelector({
  isOpen,
  onClose,
  currentConfig,
  currentEffects,
  onPresetSelect,
  onSavePreset,
}: PresetSelectorProps) {
  const [presets, setPresets] = useState<VisualizationPreset[]>([]);
  const [filteredPresets, setFilteredPresets] = useState<VisualizationPreset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    tags: '',
  });

  const presetManager = PresetManager.getInstance();

  useEffect(() => {
    if (isOpen) {
      const allPresets = presetManager.getAllPresets();
      setPresets(allPresets);
      setFilteredPresets(allPresets);
    }
  }, [isOpen]);

  useEffect(() => {
    let filtered = presets;

    // Filter by search query
    if (searchQuery) {
      filtered = presetManager.searchPresets(searchQuery);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(preset => preset.tags.includes(selectedTag));
    }

    setFilteredPresets(filtered);
  }, [searchQuery, selectedTag, presets]);

  const getAllTags = (): string[] => {
    const tagSet = new Set<string>();
    presets.forEach(preset => {
      preset.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  const handlePresetSelect = (preset: VisualizationPreset) => {
    onPresetSelect(preset);
    onClose();
  };

  const handleSavePreset = () => {
    if (!saveForm.name.trim()) return;

    const tags = saveForm.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSavePreset(saveForm.name, saveForm.description, tags);
    
    // Reset form and close dialog
    setSaveForm({ name: '', description: '', tags: '' });
    setShowSaveDialog(false);
    
    // Refresh presets
    const allPresets = presetManager.getAllPresets();
    setPresets(allPresets);
    setFilteredPresets(allPresets);
  };

  const handleDeletePreset = (presetId: string) => {
    if (presetManager.deleteCustomPreset(presetId)) {
      const allPresets = presetManager.getAllPresets();
      setPresets(allPresets);
      setFilteredPresets(allPresets);
    }
  };

  const handleExportPreset = (presetId: string) => {
    const exported = presetManager.exportPreset(presetId);
    if (exported) {
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preset-${presetId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportPreset = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const importedId = presetManager.importPreset(content);
      
      if (importedId) {
        const allPresets = presetManager.getAllPresets();
        setPresets(allPresets);
        setFilteredPresets(allPresets);
      } else {
        alert('Failed to import preset. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Palette className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Visualization Presets
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search presets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Tags</option>
              {getAllTags().map(tag => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Current</span>
              </button>

              <label className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportPreset}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                onClick={() => handlePresetSelect(preset)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {preset.name}
                  </h3>
                  <div className="flex space-x-1">
                    {preset.tags.includes('custom') && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPreset(preset.id);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Export preset"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete preset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {preset.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {preset.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {preset.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                      +{preset.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {preset.config.mode} • {preset.config.colorScheme}
                </div>
              </div>
            ))}
          </div>

          {filteredPresets.length === 0 && (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No presets found matching your criteria
              </p>
            </div>
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Save Current Settings as Preset
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={saveForm.name}
                    onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="My Custom Preset"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={saveForm.description}
                    onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={3}
                    placeholder="Describe your preset..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={saveForm.tags}
                    onChange={(e) => setSaveForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="energetic, colorful, custom"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreset}
                  disabled={!saveForm.name.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Save Preset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
