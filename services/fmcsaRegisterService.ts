import {
  saveFMCSARegisterEntriesToBackend,
  fetchFMCSARegisterByDateFromBackend,
  getFMCSAExtractedDatesFromBackend,
} from './backendApiService';
export interface FMCSARegisterEntry {
  id?: string;
  number: string;
  title: string;
  decided: string;
  category: string;
  date_fetched: string;
  extracted_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const saveFMCSARegisterEntries = async (
  entries: FMCSARegisterEntry[],
  fetchDate: string,
  extractedDate?: string
): Promise<{ success: boolean; error?: string; count?: number }> => {
  try {
    if (!entries || entries.length === 0) {
      console.log('No entries to save');
      return { success: true, count: 0 };
    }
    const dateToUse = extractedDate || fetchDate;
    console.log(`Saving ${entries.length} entries for date: ${dateToUse}`);
    return saveFMCSARegisterEntriesToBackend(entries, dateToUse);
  } catch (err: any) {
    console.error('Exception saving FMCSA entries:', err);
    return { success: false, error: `Exception: ${err.message}` };
  }
};

export const fetchFMCSARegisterByExtractedDate = async (
  extractedDate: string,
  filters?: {
    category?: string;
    searchTerm?: string;
  }
): Promise<FMCSARegisterEntry[]> => {
  try {
    const data = await fetchFMCSARegisterByDateFromBackend(
      extractedDate,
      filters?.category,
      filters?.searchTerm
    );
    console.log(`Retrieved ${data.length} records for ${extractedDate}`);
    return data as FMCSARegisterEntry[];
  } catch (err) {
    console.error('Exception fetching from Backend:', err);
    return [];
  }
};

export const getExtractedDates = async (): Promise<string[]> => {
  try {
    const dates = await getFMCSAExtractedDatesFromBackend();
    return dates.sort().reverse();
  } catch (err) {
    console.error('Exception fetching dates:', err);
    return [];
  }
};
