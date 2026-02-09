import { bridge, ReportSummary } from '../services/bridge';

export type ReportRange = 'day' | 'week' | 'month';

/**
 * Fetches aggregated report data from the Rust backend.
 * @param range The time range for the report.
 * @returns A promise resolving to the report summary.
 */
export async function fetchReport(range: ReportRange): Promise<ReportSummary> {
    try {
        console.log(`[API] Fetching report for range: ${range}`);
        const data = await bridge.getReportData(range);
        return data;
    } catch (error) {
        console.error(`[API] Failed to fetch report:`, error);
        // Return fallback/empty data structure to prevent UI crash
        return {
            total_focus_hours: 0,
            avg_score: 0,
            best_streak: 0,
            current_streak: 0,
            graph_data: []
        };
    }
}
