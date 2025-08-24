import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types for the hierarchical selection
export interface Office {
  intOfficeID: number;
  strOfficeName: string;
  OfficeCode: string;
  description?: string;
}

export interface Wing {
  intOfficeID: number;
  strOfficeName: string;
  short_strOfficeName: string;
  office_intOfficeID: number;
  WingCode: number;
}

export interface Branch {
  int_auto_intOfficeID: number;
  dec_strOfficeName: string;
  DECAcronym: string;
  wing_intOfficeID: number;
  DECCode: number;
}

export interface HierarchyUser {
  intOfficeID: string;
  full_strOfficeName: string;
  user_strOfficeName: string;
  strEmail: string;
  role: string;
  office_intOfficeID: number;
  wing_intOfficeID: number;
  branch_intOfficeID: number;
  designation_intOfficeID: number;
}

export interface HierarchicalSelectionState {
  selectedOfficeId: number | null;
  selectedWingId: number | null;
  selectedBranchId: number | null;
  selectedUserId: string | null;
}

export interface UseHierarchicalUserSelectionReturn {
  // Data
  offices: Office[];
  wings: Wing[];
  branches: Branch[];
  users: HierarchyUser[];
  
  // Loading states
  isLoadingOffices: boolean;
  isLoadingWings: boolean;
  isLoadingBranches: boolean;
  isLoadingUsers: boolean;
  
  // Selection state
  selection: HierarchicalSelectionState;
  
  // Selection handlers
  handleOfficeChange: (officeId: number | null) => void;
  handleWingChange: (wingId: number | null) => void;
  handleBranchChange: (branchId: number | null) => void;
  handleUserChange: (userId: string | null) => void;
  
  // Filtered data based on selections
  filteredWings: Wing[];
  filteredBranches: Branch[];
  filteredUsers: HierarchyUser[];
  
  // Utility functions
  resetSelection: () => void;
  getSelectedUserDetails: () => HierarchyUser | null;
  getSelectionPath: () => string;
}

export const useHierarchicalUserSelection = (): UseHierarchicalUserSelectionReturn => {
  // Data states
  const [offices, setOffices] = useState<Office[]>([]);
  const [wings, setWings] = useState<Wing[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<HierarchyUser[]>([]);
  
  // Loading states
  const [isLoadingOffices, setIsLoadingOffices] = useState(false);
  const [isLoadingWings, setIsLoadingWings] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Selection state
  const [selection, setSelection] = useState<HierarchicalSelectionState>({
    selectedOfficeId: null,
    selectedWingId: null,
    selectedBranchId: null,
    selectedUserId: null,
  });

  // Load tblOffices on component mount
  useEffect(() => {
    loadOffices();
  }, []);

  // Load WingsInformation when office is selected
  useEffect(() => {
    if (selection.selectedOfficeId) {
      loadWings(selection.selectedOfficeId);
    } else {
      setWings([]);
    }
  }, [selection.selectedOfficeId]);

  // Load branches when wing is selected
  useEffect(() => {
    if (selection.selectedWingId) {
      loadBranches(selection.selectedWingId);
    } else {
      setBranches([]);
    }
  }, [selection.selectedWingId]);

  // Load users when branch is selected
  useEffect(() => {
    if (selection.selectedOfficeId && selection.selectedWingId && selection.selectedBranchId) {
      loadUsers(selection.selectedOfficeId, selection.selectedWingId, selection.selectedBranchId);
    } else {
      setUsers([]);
    }
  }, [selection.selectedOfficeId, selection.selectedWingId, selection.selectedBranchId]);

  // Data loading functions
  const loadOffices = async () => {
    setIsLoadingOffices(true);
    try {
      const { data, error } = await supabase
        .from('tblOffices')
        .select('id, name, office_code, description')
        .eq('IS_ACT', true)
        .eq('IS_DELETED', false)
        .order('strOfficeName');

      if (error) {return;
      }

      setOffices(data || []);
    } catch (error) {} finally {
      setIsLoadingOffices(false);
    }
  };

  const loadWings = async (officeId: number) => {
    setIsLoadingWings(true);
    try {
      const { data, error } = await supabase
        .from('WingsInformation')
        .select('id, name, short_name, office_id, wing_code')
        .eq('OfficeID', officeId)
        .eq('IS_ACT', true)
        .order('strOfficeName');

      if (error) {return;
      }

      setWings(data || []);
    } catch (error) {} finally {
      setIsLoadingWings(false);
    }
  };

  const loadBranches = async (wingId: number) => {
    setIsLoadingBranches(true);
    try {
      const { data, error } = await supabase
        .from('DEC_MST')
        .select('int_auto_id, dec_name, dec_acronym, wing_id, dec_code')
        .eq('WingID', wingId)
        .eq('IS_ACT', true)
        .order('DECName');

      if (error) {return;
      }

      setBranches(data || []);
    } catch (error) {} finally {
      setIsLoadingBranches(false);
    }
  };

  const loadUsers = async (officeId: number, wingId: number, branchId: number) => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, user_name, email, role, office_id, wing_id, branch_id, designation_id')
        .eq('OfficeID', officeId)
        .eq('WingID', wingId)
        .eq('branch_id', branchId)
        .eq('IS_ACT', 1)
        .order('full_name');

      if (error) {return;
      }

      setUsers(data || []);
    } catch (error) {} finally {
      setIsLoadingUsers(false);
    }
  };

  // Selection handlers
  const handleOfficeChange = (officeId: number | null) => {
    setSelection({
      selectedOfficeId: officeId,
      selectedWingId: null,
      selectedBranchId: null,
      selectedUserId: null,
    });
  };

  const handleWingChange = (wingId: number | null) => {
    setSelection(prev => ({
      ...prev,
      selectedWingId: wingId,
      selectedBranchId: null,
      selectedUserId: null,
    }));
  };

  const handleBranchChange = (branchId: number | null) => {
    setSelection(prev => ({
      ...prev,
      selectedBranchId: branchId,
      selectedUserId: null,
    }));
  };

  const handleUserChange = (userId: string | null) => {
    setSelection(prev => ({
      ...prev,
      selectedUserId: userId,
    }));
  };

  const resetSelection = () => {
    setSelection({
      selectedOfficeId: null,
      selectedWingId: null,
      selectedBranchId: null,
      selectedUserId: null,
    });
  };

  // Computed values
  const filteredWings = wings.filter(wing => 
    !selection.selectedOfficeId || wing.OfficeID === selection.selectedOfficeId
  );

  const filteredBranches = branches.filter(branch => 
    !selection.selectedWingId || branch.WingID === selection.selectedWingId
  );

  const filteredUsers = users.filter(user => 
    (!selection.selectedOfficeId || user.OfficeID === selection.selectedOfficeId) &&
    (!selection.selectedWingId || user.WingID === selection.selectedWingId) &&
    (!selection.selectedBranchId || user.branch_id === selection.selectedBranchId)
  );

  // Utility functions
  const getSelectedUserDetails = (): HierarchyUser | null => {
    if (!selection.selectedUserId) return null;
    return users.find(user => user.intOfficeID === selection.selectedUserId) || null;
  };

  const getSelectionPath = (): string => {
    const parts: string[] = [];
    
    if (selection.selectedOfficeId) {
      const office = offices.find(o => o.intOfficeID === selection.selectedOfficeId);
      if (office) parts.push(office.strOfficeName);
    }
    
    if (selection.selectedWingId) {
      const wing = wings.find(w => w.intOfficeID === selection.selectedWingId);
      if (wing) parts.push(wing.ShortName);
    }
    
    if (selection.selectedBranchId) {
      const branch = branches.find(b => b.intAutoID === selection.selectedBranchId);
      if (branch) parts.push(branch.DECAcronym);
    }
    
    if (selection.selectedUserId) {
      const user = getSelectedUserDetails();
      if (user) parts.push(user.full_name);
    }
    
    return parts.join(' → ');
  };

  return {
    // Data
    offices,
    wings,
    branches,
    users,
    
    // Loading states
    isLoadingOffices,
    isLoadingWings,
    isLoadingBranches,
    isLoadingUsers,
    
    // Selection state
    selection,
    
    // Selection handlers
    handleOfficeChange,
    handleWingChange,
    handleBranchChange,
    handleUserChange,
    
    // Filtered data
    filteredWings,
    filteredBranches,
    filteredUsers,
    
    // Utility functions
    resetSelection,
    getSelectedUserDetails,
    getSelectionPath,
  };
};
