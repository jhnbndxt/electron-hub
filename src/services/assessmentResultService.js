/**
 * Assessment Results Service
 * 
 * Handles all assessment result operations via Supabase
 * - Save assessment results
 * - Get assessment history
 * - Track scores and domains
 */

import { supabase } from '../supabase';

function normalizeScores(assessmentData = {}) {
  const scoreSource = assessmentData.scores || {};

  return {
    verbal_ability_score:
      scoreSource.verbal_ability_score ??
      scoreSource.VA ??
      assessmentData.verbal_ability_score ??
      assessmentData.VA ??
      0,
    mathematical_ability_score:
      scoreSource.mathematical_ability_score ??
      scoreSource.MA ??
      assessmentData.mathematical_ability_score ??
      assessmentData.MA ??
      0,
    spatial_ability_score:
      scoreSource.spatial_ability_score ??
      scoreSource.SA ??
      assessmentData.spatial_ability_score ??
      assessmentData.SA ??
      0,
    logical_reasoning_score:
      scoreSource.logical_reasoning_score ??
      scoreSource.LRA ??
      assessmentData.logical_reasoning_score ??
      assessmentData.LRA ??
      0,
    overall_score:
      scoreSource.overall_score ??
      assessmentData.overall_score ??
      Math.round(
        ((scoreSource.verbal_ability_score ?? scoreSource.VA ?? assessmentData.verbal_ability_score ?? assessmentData.VA ?? 0) +
          (scoreSource.mathematical_ability_score ?? scoreSource.MA ?? assessmentData.mathematical_ability_score ?? assessmentData.MA ?? 0) +
          (scoreSource.spatial_ability_score ?? scoreSource.SA ?? assessmentData.spatial_ability_score ?? assessmentData.SA ?? 0) +
          (scoreSource.logical_reasoning_score ?? scoreSource.LRA ?? assessmentData.logical_reasoning_score ?? assessmentData.LRA ?? 0)) / 4
      ),
  };
}

function normalizeArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim() && item !== 'undefined');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) return [];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed)
          ? parsed.filter((item) => typeof item === 'string' && item.trim() && item !== 'undefined')
          : [];
      } catch {
        return [];
      }
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item && item !== 'undefined');
    }

    return [trimmed].filter((item) => item !== 'undefined');
  }

  return [];
}

function mapAssessmentResult(result) {
  if (!result) return null;

  const scores = {
    VA: result.verbal_ability_score ?? 0,
    MA: result.mathematical_ability_score ?? 0,
    SA: result.spatial_ability_score ?? 0,
    LRA: result.logical_reasoning_score ?? 0,
  };

  const electives = [result.elective_1, result.elective_2].filter(Boolean);
  const overallScore =
    result.overall_score ??
    Math.round((scores.VA + scores.MA + scores.SA + scores.LRA) / 4);

  return {
    id: result.id,
    date: result.assessment_date || result.created_at || new Date().toISOString(),
    track: result.recommended_track || result.track || 'General',
    electives,
    scores,
    topDomains: normalizeArray(result.top_domains ?? result.topDomains),
    topInterests: normalizeArray(result.top_interests ?? result.topInterests),
    overallScore,
    recommended_track: result.recommended_track || result.track || 'General',
    elective_1: electives[0] || null,
    elective_2: electives[1] || null,
  };
}

/**
 * Get student user ID by email
 */
async function getStudentIdByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data?.id;
  } catch (error) {
    console.error('Error getting student ID:', error);
    throw error;
  }
}

/**
 * Save a new assessment result
 */
export async function saveAssessmentResult(userEmail, assessmentData) {
  try {
    const scores = normalizeScores(assessmentData);
    const track = assessmentData.recommended_track || assessmentData.track || 'General';
    const electives = Array.isArray(assessmentData.electives)
      ? assessmentData.electives.filter(Boolean)
      : [assessmentData.elective_1, assessmentData.elective_2].filter(Boolean);
    const topDomains = normalizeArray(assessmentData.topDomains ?? assessmentData.top_domains);
    const topInterests = normalizeArray(assessmentData.topInterests ?? assessmentData.top_interests);

    // Get student ID from email
    const student_id = await getStudentIdByEmail(userEmail);
    if (!student_id) {
      throw new Error('Student not found');
    }

    const { data: existingResults, error: existingError } = await supabase
      .from('assessment_results')
      .select('id')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    if (existingResults && existingResults.length > 0) {
      console.log('Assessment result already exists, skipping duplicate save:', userEmail);
      return existingResults[0];
    }

    const { data, error } = await supabase
      .from('assessment_results')
      .insert({
        student_id,
        assessment_date: new Date().toISOString().split('T')[0],
        recommended_track: track,
        elective_1: electives[0] || null,
        elective_2: electives[1] || null,
        verbal_ability_score: scores.verbal_ability_score,
        mathematical_ability_score: scores.mathematical_ability_score,
        spatial_ability_score: scores.spatial_ability_score,
        logical_reasoning_score: scores.logical_reasoning_score,
        overall_score: scores.overall_score,
        top_domains: topDomains,
        top_interests: topInterests,
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
    const student_id = await getStudentIdByEmail(userEmail);
    if (!student_id) {
      return { results: [], count: 0 };
    }

    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      results: (data || []).map(mapAssessmentResult).filter(Boolean),
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
    const student_id = await getStudentIdByEmail(userEmail);
    if (!student_id) return null;

    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return mapAssessmentResult(data);
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
    const student_id = await getStudentIdByEmail(userEmail);
    if (!student_id) return [];

    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAssessmentResult).filter(Boolean);
  } catch (error) {
    console.error('Error fetching user assessment results:', error);
    return [];
  }
}

/**
 * Get assessment results for specific track
 */
export async function getResultsByTrack(track) {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('recommended_track', track)
      .order('assessment_date', { ascending: false });

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
        const track = result.recommended_track || result.track || 'General';

        if (!stats.byTrack[track]) {
          stats.byTrack[track] = 0;
        }
        stats.byTrack[track]++;

        // Aggregate top domains
        normalizeArray(result.top_domains).forEach((domain) => {
            stats.topDomains[domain] = (stats.topDomains[domain] || 0) + 1;
        });
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
