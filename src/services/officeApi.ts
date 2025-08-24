export interface ApiOfficeResponse {
  Id: number;
  Name: string;
  Description: string;
  TelephoneNumber: string;
  Email: string;
  OfficeCode: string;
  IsActive: boolean;
  IsDeleted: boolean;
}

export interface ApiWingResponse {
  Id: number;
  Name: string;
  ShortName: string;
  FocalPerson: string;
  ContactNo: string;
  Creator: string | null;
  CreateDate: string;
  Modifier: string | null;
  ModifyDate: string | null;
  OfficeID: number;
  IS_ACT: boolean;
  HODID: string | null;
  HODName: string | null;
  WingCode: number;
}

export interface ApiDecResponse {
  Id: number;
  Name: string;
  ShortName: string;
  OfficeID: number;
  WingID: number;
  FocalPerson: string;
  ContactNo: string;
  Creator: string | null;
  CreateDate: string;
  Modifier: string | null;
  ModifyDate: string | null;
  IS_ACT: boolean;
  HODID: string | null;
  HODName: string | null;
  DecCode: number;
}

const mockOffices: ApiOfficeResponse[] = [
  {
    Id: 1,
    Name: "Headquarters",
    Description: "Main headquarters office",
    TelephoneNumber: "+92-21-12345678",
    Email: "hq@company.com",
    OfficeCode: "HQ001",
    IsActive: true,
    IsDeleted: false,
  },
];

const mockWings: ApiWingResponse[] = [
  {
    Id: 1,
    Name: "Administration Wing",
    ShortName: "ADMIN",
    FocalPerson: "John Doe",
    ContactNo: "+92-21-11111111",
    Creator: "System",
    CreateDate: "2024-01-01T00:00:00Z",
    Modifier: null,
    ModifyDate: null,
    OfficeID: 1,
    IS_ACT: true,
    HODID: null,
    HODName: null,
    WingCode: 101,
  },
];

const mockDecs: ApiDecResponse[] = [
  {
    Id: 1,
    Name: "Human Resources",
    ShortName: "HR",
    OfficeID: 1,
    WingID: 1,
    FocalPerson: "Alice Johnson",
    ContactNo: "+92-21-33333333",
    Creator: "System",
    CreateDate: "2024-01-01T00:00:00Z",
    Modifier: null,
    ModifyDate: null,
    IS_ACT: true,
    HODID: null,
    HODName: null,
    DecCode: 1001,
  },
];

// Updated to use local SQL Server API instead of Supabase

export const officeApi = {
  async getOffices(): Promise<ApiOfficeResponse[]> {
    try {
      const response = await fetch('http://localhost:3001/api/offices');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Map the SQL Server data structure to our interface
      return data.map((office: any) => ({
        Id: office.intOfficeID,
        Name: office.strOfficeName,
        Description: office.strOfficeDescription || '',
        TelephoneNumber: office.strTelephoneNumber || '',
        Email: office.strEmail || '',
        OfficeCode: office.OfficeCode?.toString() || '',
        IsActive: office.IS_ACT,
        IsDeleted: office.IS_DELETED
      }));
    } catch (error) {
      console.error('Error fetching offices from local API:', error);
      // Return mock data as fallback
      return mockOffices;
    }
  },

  async getWings(): Promise<ApiWingResponse[]> {
    try {
      const response = await fetch('http://localhost:3001/api/wings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Map the SQL Server data structure to our interface
      return data.map((wing: any) => ({
        Id: wing.Id,
        Name: wing.Name,
        ShortName: wing.ShortName,
        FocalPerson: wing.FocalPerson || '',
        ContactNo: wing.ContactNo || '',
        Creator: wing.Creator,
        CreateDate: wing.CreateDate,
        Modifier: wing.Modifier,
        ModifyDate: wing.ModifyDate,
        OfficeID: wing.OfficeID,
        IS_ACT: wing.IS_ACT,
        HODID: wing.HODID,
        HODName: wing.HODName,
        WingCode: wing.WingCode
      }));
    } catch (error) {
      console.error('Error fetching wings from local API:', error);
      // Return mock data as fallback
      return mockWings;
    }
  },

  async getDecs(): Promise<ApiDecResponse[]> {
    try {
      const response = await fetch('http://localhost:3001/api/decs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Map the SQL Server data structure to our interface
      return data.map((dec: any) => ({
        Id: dec.intAutoID,
        Name: dec.DECName,
        ShortName: dec.DECAcronym || dec.DECName,
        OfficeID: dec.OfficeID || 0, // Note: DECs might not have direct OfficeID
        WingID: dec.WingID,
        FocalPerson: dec.FocalPerson || '',
        ContactNo: dec.ContactNo || '',
        Creator: dec.Creator || '',
        CreateDate: dec.DateAdded,
        Modifier: dec.Modifier || '',
        ModifyDate: dec.ModifyDate || '',
        IS_ACT: dec.IS_ACT,
        HODID: dec.HODID || '',
        HODName: dec.HODName || '',
        DecCode: dec.DECCode
      }));
    } catch (error) {
      console.error('Error fetching DECs from local API:', error);
      // Return mock data as fallback
      return mockDecs;
    }
  },

  async getWingsByOfficeId(officeId: number): Promise<ApiWingResponse[]> {
    try {
      const allWings = await this.getWings();
      return allWings.filter(wing => wing.OfficeID === officeId);
    } catch (error) {
      console.error('Error fetching wings by office ID:', error);
      // Return mock data as fallback
      return mockWings.filter(wing => wing.OfficeID === officeId);
    }
  },

  async getDecsByWingId(wingId: number): Promise<ApiDecResponse[]> {
    try {
      const allDecs = await this.getDecs();
      return allDecs.filter(dec => dec.WingID === wingId);
    } catch (error) {
      console.error('Error fetching DECs by wing ID:', error);
      // Return mock data as fallback
      return mockDecs.filter(dec => dec.WingID === wingId);
    }
  },
};
