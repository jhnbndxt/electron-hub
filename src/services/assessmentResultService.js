/**
 * Assessment Results Service
 * 
 * Handles all assessment result operations via Supabase
 * - Save assessment results
 * - Get assessment history
 * - Track scores and domains
 */

import { supabase } from './supabaseClient';

/**
 * Save a new assessment result
 */
export async function saveAssessmentResult(userEmail, assessmentData) {
  try {
    const { track, electives, scores, topDomains, topInterests } = assessmentData;

    const { data, error } = await supabase
      .from('assessment_results')
      .insert({
        user_email: userEmail,
        track,
        electives: electives || [],
        scores: scores || {},
        top_domains: topDomains || [],
        top_interests: topInterests || [],
        overall_score: calculateOverallScore(scores),
        completed_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;

    console.log('✅ Assessment result saved:', userEmail);
    return data[0];
  } catch (error) {
    console.error('Error saving assessment result:', error);
    throw error;
  }
}

/**
 * Get assessment history for a user
 */
export async function getAssessmentHistory(userEmail) {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('user_email', userEmail)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return {
      results: data || [],
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching assessment history:', error);
    return { results: [], count: 0 };
  }
}

/**
 * Get the most recent assessment result
 */
export async function getLatestAssessmentResult(userEmail) {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('user_email', userEmail)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  } catch (error) {
    console.error('Error fetching latest assessment result:', error);
    return null;
  }
}

/**
 * Get all assessment results for a specific user (admin view)
 */
export async function getAllUserAssessmentResults(userEmail) {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('user_email', userEmail)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user assessment results:', error);
    return [];
  }
}

/**
 * Get assessment results for specific domain/track
 */
export async function getResultsByTrack(track) {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('track', track)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching results by track:', error);
    return [];
  }
}

/**
 * Calculate overall score from individual scores
 */
function calculateOverallScore(scores) {
  if (!scores || Object.keys(scores).length === 0) return 0;
  
  const values = Object.values(scores);
  const sum = values.reduce((acc, val) => acc + (val || 0), 0);
  return Math.round(sum / values.length);
}

/**
 * Update assessment result notes (admin)
 */
export async function updateAssessmentNotes(resultId, notes) {
  try {
    const { error } = await supabase
      .from('assessment_results')
      .update({ admin_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', resultId);

    if (error) throw error;
    console.log('✅ Assessment notes updated:', resultId);
  } catch (error) {
    console.error('Error updating assessment notes:', error);
    throw error;
  }
}

/**
 * Delete an assessment result (admin only)
 */
export async function deleteAssessmentResult(resultId) {
  try {
    const { error } = await supabase
      .from('assessment_results')
      .delete()
      .eq('id', resultId);

    if (error) throw error;
    console.log('🗑️ Assessment result deleted:', resultId);
  } catch (error) {
    console.error('Error deleting assessment result:', error);
    throw error;
  }
}

/**
 * Get statistics for all assessments
 */
export async function getAssessmentStatistics() {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byTrack: {},
      averageScore: 0,
      topDomains: {},
    };

    if (data && data.length > 0) {
      // Group by track
      data.forEach((result) => {
        if (!stats.byTrack[result.track]) {
          stats.byTrack[result.track] = 0;
        }
        stats.byTrack[result.track]++;

        // Aggregate top domains
        if (result.top_domains) {
          result.top_domains.forEach((domain) => {
            stats.topDomains[domain] = (stats.topDomains[domain] || 0) + 1;
          });
        }
      });

      // Calculate average score
      const totalScore = data.reduce((sum, result) => sum + (result.overall_score || 0), 0);
      stats.averageScore = Math.round(totalScore / data.length);
    }

    return stats;
  } catch (error) {
    console.error('Error fetching assessment statistics:', error);
    return { total: 0, byTrack: {}, averageScore: 0, topDomains: {} };
  }
}

/**
 * Export assessment results to CSV format
 */
export async function exportAssessmentResults(userEmail = null) {
  try {
    let query = supabase.from('assessment_results').select('*');

    if (userEmail) {
      query = query.eq('user_email', userEmail);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Convert to CSV format
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          if (typeof value === 'object') {
            return JSON.stringify(value).replace(/"/g, '""');
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ].join('\n');

    return csv;
  } catch (error) {
    console.error('Error exporting assessment results:', error);
    return '';
  }
}

/**
 * Get trending tracks/domains based on recent assessments
 */
export async function getTrendingTracks(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('track')
      .order('completed_at', { ascending: false })
      .limit(limit * 2);

    if (error) throw error;

    const trackCount = {};
    data?.forEach((result) => {
      trackCount[result.track] = (trackCount[result.track] || 0) + 1;
    });

    const trending = Object.entries(trackCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([track, count]) => ({ track, count }));

    return trending;
  } catch (error) {
    console.error('Error fetching trending tracks:', error);
    return [];
  }
}
