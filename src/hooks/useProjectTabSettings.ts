// Simplified version without backend dependencies
export const useProjectTabSettings = (projectId: string) => {
  // Return all tabs as enabled by default
  const isTabEnabled = (tabName: string, parentTab?: string) => {
    return true;
  };

  const getEnabledMainTabs = () => {
    return ['overview', 'schedule', 'documents', 'financial', 'messages', 'design', 'punchlist'];
  };

  const getEnabledDesignSubTabs = () => {
    return ['exterior', 'garage', 'entry', 'interior', 'kitchen', 'bathrooms', 'mudroom'];
  };

  return {
    tabSettings: [],
    loading: false,
    isTabEnabled,
    getEnabledMainTabs,
    getEnabledDesignSubTabs,
    refreshSettings: () => Promise.resolve()
  };
};
